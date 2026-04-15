export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";
import { generatePortalToken } from "../../../lib/generateToken";
import {
  getTrackingResults,
  extractTrackingData,
  isShip24Configured,
} from "../../../lib/ship24";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  ordered: "Ordered",
  warehouse: "Warehouse",
  "in-transit": "In Transit",
  delivered: "Delivered",
  installed: "Installed",
};
const VALID_STATUSES = Object.keys(STATUS_LABELS);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Phase 37: procurement privacy strip -- retailPrice / clientCost dropped from
// the schema. Any legacy caller that sends those fields will have them ignored
// (they are simply not in UPDATABLE_FIELDS).
/** Updatable fields for the "update" action (excludes status, sync fields) */
const UPDATABLE_FIELDS = [
  "name",
  "vendor",
  "orderDate",
  "expectedDeliveryDate",
  "installDate",
  "trackingNumber",
  "carrierName",
  "notes",
  "itemUrl",
  "images",
] as const;

const SANITY_IMAGE_REF_REGEX =
  /^image-[a-f0-9]+-\d+x\d+-(png|jpg|jpeg|gif|webp|svg)$/i;

const MAX_IMAGES_PER_ITEM = 20;
const MAX_CAPTION_LENGTH = 500;

function isValidDate(val: unknown): boolean {
  return typeof val === "string" && DATE_REGEX.test(val);
}

function validateDates(body: Record<string, unknown>): string | null {
  if (body.expectedDeliveryDate !== undefined && !isValidDate(body.expectedDeliveryDate)) {
    return "Invalid date format. Use YYYY-MM-DD.";
  }
  if (body.installDate !== undefined && !isValidDate(body.installDate)) {
    return "Invalid date format. Use YYYY-MM-DD.";
  }
  if (body.orderDate !== undefined && !isValidDate(body.orderDate)) {
    return "Invalid date format. Use YYYY-MM-DD.";
  }
  return null;
}

/** Strip control chars from a caption and cap length. Returns null if input is null/undefined. */
function sanitizeCaption(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val !== "string") return null;
  return val.replace(/[\x00-\x1F\x7F]/g, "").slice(0, MAX_CAPTION_LENGTH);
}

type ImageInput = {
  _key?: string;
  _type?: string;
  asset?: { _ref?: string; _type?: string };
  isPrimary?: boolean;
  caption?: string | null;
};

/**
 * Validate + sanitize an images[] payload.
 * Returns a normalized array on success, or a string error message on failure.
 */
function validateImages(raw: unknown): ImageInput[] | { error: string } {
  if (!Array.isArray(raw)) {
    return { error: "images must be an array" };
  }
  if (raw.length > MAX_IMAGES_PER_ITEM) {
    return { error: `Too many images (max ${MAX_IMAGES_PER_ITEM})` };
  }

  const normalized: ImageInput[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      return { error: "Invalid image entry" };
    }
    const img = entry as ImageInput;
    const ref = img.asset?._ref;
    if (!ref || typeof ref !== "string" || !SANITY_IMAGE_REF_REGEX.test(ref)) {
      return { error: "Invalid image asset reference" };
    }
    if (img.isPrimary !== undefined && typeof img.isPrimary !== "boolean") {
      return { error: "isPrimary must be a boolean" };
    }
    if (
      img.caption !== undefined &&
      img.caption !== null &&
      typeof img.caption !== "string"
    ) {
      return { error: "caption must be a string or null" };
    }
    normalized.push({
      _key: typeof img._key === "string" ? img._key : generatePortalToken(8),
      _type: "image",
      asset: { _type: "reference", _ref: ref },
      isPrimary: img.isPrimary === true,
      caption: sanitizeCaption(img.caption),
    });
  }
  return normalized;
}

/** Build the "procurement-item-updated" activity-log description from a whitelist of changed fields. */
function buildItemUpdatedDescription(
  itemName: string,
  changedFields: string[],
): string {
  const safeName = String(itemName || "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .slice(0, 40);
  const shown = changedFields.slice(0, 6).join(", ");
  const more = changedFields.length > 6
    ? ` +${changedFields.length - 6} more`
    : "";
  return `Item "${safeName}" updated -- ${shown}${more}`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // Auth check -- exact pattern from tasks.ts
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!session.tenantId) {
    return new Response(JSON.stringify({ error: "No tenant context" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const client = getTenantClient(session.tenantId);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { action, projectId } = body as { action: string; projectId: string };

  if (!projectId || typeof projectId !== "string") {
    return new Response(JSON.stringify({ error: "Missing projectId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // ---- ACTION: CREATE ----
    if (action === "create") {
      const name = body.name as string | undefined;

      if (!name || typeof name !== "string" || !name.trim()) {
        return new Response(
          JSON.stringify({ error: "Item name is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const validationError = validateDates(body);
      if (validationError) {
        return new Response(
          JSON.stringify({ error: validationError }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const _key = generatePortalToken(8);
      const now = new Date().toISOString();

      const itemObject: Record<string, unknown> = {
        _key,
        _type: "procurementItem",
        name: name.trim(),
        status: "pending",
        // Phase 37: new items start with an empty images[] so the modal can
        // append without a setIfMissing round-trip.
        images: [],
      };

      // Add optional fields if provided
      if (body.vendor) itemObject.vendor = body.vendor;
      if (body.expectedDeliveryDate) itemObject.expectedDeliveryDate = body.expectedDeliveryDate;
      if (body.installDate) itemObject.installDate = body.installDate;
      if (body.trackingNumber) itemObject.trackingNumber = body.trackingNumber;
      if (body.notes) itemObject.notes = body.notes;

      const activityEntry = {
        _key: generatePortalToken(8),
        _type: "activityEntry",
        action: "procurement-status-changed",
        description: `Item "${name.trim().slice(0, 40)}" added`,
        actor: session.entityId,
        timestamp: now,
      };

      // setIfMissing before append (Pitfall 3)
      await client
        .patch(projectId)
        .setIfMissing({ procurementItems: [], activityLog: [] })
        .append("procurementItems", [itemObject])
        .append("activityLog", [activityEntry])
        .commit();

      return new Response(
        JSON.stringify({ success: true, itemKey: _key }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- ACTION: UPDATE ----
    if (action === "update") {
      const itemKey = body.itemKey as string | undefined;

      if (!itemKey || typeof itemKey !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing itemKey" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const validationError = validateDates(body);
      if (validationError) {
        return new Response(
          JSON.stringify({ error: validationError }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Validate + sanitize images[] payload up front so a bad payload
      // short-circuits before any write.
      let normalizedImages: ImageInput[] | null = null;
      if (body.images !== undefined) {
        const imageResult = validateImages(body.images);
        if ("error" in imageResult) {
          return new Response(
            JSON.stringify({ error: imageResult.error }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        normalizedImages = imageResult;
      }

      // Build set object with path notation for each provided field
      const setObject: Record<string, unknown> = {};
      const changedFields: string[] = [];
      for (const field of UPDATABLE_FIELDS) {
        if (body[field] !== undefined) {
          let value: unknown;
          if (field === "name" && typeof body[field] === "string") {
            value = (body[field] as string).trim();
          } else if (field === "images") {
            value = normalizedImages;
          } else {
            value = body[field];
          }
          setObject[`procurementItems[_key=="${itemKey}"].${field}`] = value;
          changedFields.push(field);
        }
      }

      // Phase 37: modal-based edits (i.e. anything that touches UPDATABLE_FIELDS)
      // write a "procurement-item-updated" activity log entry; status cycling
      // continues to go through update-status.
      const now = new Date().toISOString();
      const itemName = typeof body.name === "string"
        ? body.name
        : typeof body.itemName === "string"
          ? body.itemName
          : "";
      const activityEntry = {
        _key: generatePortalToken(8),
        _type: "activityEntry",
        action: "procurement-item-updated",
        description: buildItemUpdatedDescription(itemName, changedFields),
        actor: session.entityId,
        timestamp: now,
      };

      let patch = client.patch(projectId).set(setObject);
      if (changedFields.length > 0) {
        patch = patch
          .setIfMissing({ activityLog: [] })
          .append("activityLog", [activityEntry]);
      }
      await patch.commit();

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- ACTION: DELETE ----
    if (action === "delete") {
      const itemKey = body.itemKey as string | undefined;
      const itemName = (body.itemName as string) || "Unknown";

      if (!itemKey || typeof itemKey !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing itemKey" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const now = new Date().toISOString();

      const activityEntry = {
        _key: generatePortalToken(8),
        _type: "activityEntry",
        action: "procurement-status-changed",
        description: `Item "${itemName}" removed`,
        actor: session.entityId,
        timestamp: now,
      };

      await client
        .patch(projectId)
        .unset([`procurementItems[_key=="${itemKey}"]`])
        .setIfMissing({ activityLog: [] })
        .append("activityLog", [activityEntry])
        .commit();

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- ACTION: UPDATE-STATUS ----
    if (action === "update-status") {
      const itemKey = body.itemKey as string | undefined;
      const status = body.status as string | undefined;

      if (!itemKey || typeof itemKey !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing itemKey" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!status || !VALID_STATUSES.includes(status)) {
        return new Response(
          JSON.stringify({ error: "Invalid status" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const now = new Date().toISOString();

      // CRITICAL: always clear syncSource on manual status change (D-12)
      const setObject: Record<string, unknown> = {
        [`procurementItems[_key=="${itemKey}"].status`]: status,
        [`procurementItems[_key=="${itemKey}"].syncSource`]: null,
      };

      const activityEntry = {
        _key: generatePortalToken(8),
        _type: "activityEntry",
        action: "procurement-status-changed",
        description: `Status changed to "${STATUS_LABELS[status]}"`,
        actor: session.entityId,
        timestamp: now,
      };

      await client
        .patch(projectId)
        .set(setObject)
        .setIfMissing({ activityLog: [] })
        .append("activityLog", [activityEntry])
        .commit();

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- ACTION: FORCE-REFRESH ----
    if (action === "force-refresh") {
      const itemKey = body.itemKey as string | undefined;
      const trackingNumber = body.trackingNumber as string | undefined;

      if (!itemKey || typeof itemKey !== "string" || !trackingNumber || typeof trackingNumber !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing itemKey or trackingNumber" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Check Ship24 configuration
      if (!isShip24Configured()) {
        return new Response(
          JSON.stringify({ success: false, error: "Tracking sync not configured. Add SHIP24_API_KEY." }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const result = await getTrackingResults(trackingNumber);
      if (!result) {
        return new Response(
          JSON.stringify({ success: false, error: "Could not retrieve tracking data" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const extractedData = extractTrackingData(result);
      const now = new Date().toISOString();

      // Build set object with ALL tracking fields
      const setObject: Record<string, unknown> = {
        [`procurementItems[_key=="${itemKey}"].carrierETA`]: extractedData.carrierETA,
        [`procurementItems[_key=="${itemKey}"].carrierName`]: extractedData.carrierName,
        [`procurementItems[_key=="${itemKey}"].trackingUrl`]: extractedData.trackingUrl,
        [`procurementItems[_key=="${itemKey}"].lastSyncAt`]: now,
        [`procurementItems[_key=="${itemKey}"].syncSource`]: "manual",
      };

      // Only include status if extracted status is non-null
      if (extractedData.status !== null) {
        setObject[`procurementItems[_key=="${itemKey}"].status`] = extractedData.status;
      }

      await client.patch(projectId).set(setObject).commit();

      return new Response(
        JSON.stringify({ success: true, data: extractedData }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Unknown action
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to process procurement operation:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process procurement operation" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
