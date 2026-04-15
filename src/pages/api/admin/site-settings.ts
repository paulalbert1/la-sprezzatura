import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { generatePortalToken } from "../../../lib/generateToken";

// Phase 34 Plan 03 — Site Settings admin API
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-03-PLAN.md § Task 1
//   - .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-05..D-12
//   - Threat T-34-01 (non-admin writes siteSettings) — mitigated by the
//     session.role === "admin" gate at the top of the handler.
//
// POST action router. One singleton doc at _id = "siteSettings" is the
// target for every action. The first successful save creates the doc via
// `setIfMissing({ _type: "siteSettings", heroSlideshow: [] })`.
//
// Actions:
//   - update                — replaces general + social + rendering fields
//   - appendHeroSlide       — pushes a new hero slide (Sanity asset ref only)
//   - updateHeroSlide       — edits alt text for a slide by _key
//   - reorderHeroSlideshow  — rewrites the array in a client-provided order
//   - removeHeroSlide       — unsets a single slide by _key
//
// Every successful mutation appends an entry to the singleton's `updateLog`
// array so Paul / Liz can audit who touched what and when (SETT-06).

export const prerender = false;

const SETTINGS_DOC_ID = "siteSettings";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTPS_REGEX = /^https:\/\//;
const MAX_SITE_TITLE = 60;
const MAX_TAGLINE = 120;

type ActionName =
  | "update"
  | "appendHeroSlide"
  | "updateHeroSlide"
  | "reorderHeroSlideshow"
  | "removeHeroSlide";

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(error: string, status = 400): Response {
  return jsonResponse({ error }, status);
}

interface GeneralFields {
  siteTitle?: unknown;
  tagline?: unknown;
  contactEmail?: unknown;
  contactPhone?: unknown;
  studioLocation?: unknown;
  defaultFromEmail?: unknown;
  defaultCcEmail?: unknown;
}

interface SocialLinksFields {
  instagram?: unknown;
  pinterest?: unknown;
  houzz?: unknown;
}

function validateUpdateBody(body: Record<string, unknown>): string | null {
  const general = (body.general ?? {}) as GeneralFields;
  const social = (body.socialLinks ?? {}) as SocialLinksFields;

  // siteTitle — optional string, max length 60
  if (general.siteTitle !== undefined) {
    if (typeof general.siteTitle !== "string") {
      return "siteTitle must be a string";
    }
    if (general.siteTitle.length > MAX_SITE_TITLE) {
      return `siteTitle must be ${MAX_SITE_TITLE} characters or less`;
    }
  }

  // tagline — optional string, max length 120
  if (general.tagline !== undefined) {
    if (typeof general.tagline !== "string") {
      return "tagline must be a string";
    }
    if (general.tagline.length > MAX_TAGLINE) {
      return `tagline must be ${MAX_TAGLINE} characters or less`;
    }
  }

  // contactEmail — optional, must match email regex or be empty
  if (general.contactEmail !== undefined) {
    if (typeof general.contactEmail !== "string") {
      return "contactEmail must be a string";
    }
    const trimmed = general.contactEmail.trim();
    if (trimmed.length > 0 && !EMAIL_REGEX.test(trimmed)) {
      return "contactEmail must be a valid email address";
    }
  }

  // defaultFromEmail — optional Send Update "from" override.
  // D-09: accept either a bare email OR display-name form `"Name" <addr@domain>`.
  // T-38-01: reject any value containing CR/LF to prevent SMTP header injection
  // when Plan 02's send pipeline replays this value into Resend headers.
  if (general.defaultFromEmail !== undefined) {
    if (typeof general.defaultFromEmail !== "string") {
      return "defaultFromEmail must be a string";
    }
    const raw = general.defaultFromEmail;
    if (raw.length > 0) {
      if (/[\r\n]/.test(raw)) {
        return "defaultFromEmail must not contain newlines";
      }
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        const bracketMatch = trimmed.match(/^".*"\s*<([^>]+)>\s*$/);
        const testValue = bracketMatch ? bracketMatch[1].trim() : trimmed;
        if (!EMAIL_REGEX.test(testValue)) {
          return "defaultFromEmail must be a valid email address";
        }
      }
    }
  }

  // defaultCcEmail — optional, comma-separated list. Each entry regex-checked.
  // D-05: empty entries (from trailing comma) are ignored, not errors.
  // D-06: stored raw (no normalization on write); send-time normalization lives in Plan 02.
  // T-38-01: reject CR/LF to prevent SMTP header injection.
  if (general.defaultCcEmail !== undefined) {
    if (typeof general.defaultCcEmail !== "string") {
      return "defaultCcEmail must be a string";
    }
    const raw = general.defaultCcEmail;
    if (raw.length > 0) {
      if (/[\r\n]/.test(raw)) {
        return "defaultCcEmail must not contain newlines";
      }
      const entries = raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const entry of entries) {
        if (!EMAIL_REGEX.test(entry)) {
          return "defaultCcEmail contains an invalid email address";
        }
      }
    }
  }

  // Social links — optional, each must be https:// or empty
  for (const key of ["instagram", "pinterest", "houzz"] as const) {
    const val = social[key];
    if (val === undefined) continue;
    if (typeof val !== "string") {
      return `socialLinks.${key} must be a string`;
    }
    if (val.length > 0 && !HTTPS_REGEX.test(val)) {
      return `socialLinks.${key} must start with https://`;
    }
  }

  // renderingAllocation — optional, integer >= 1
  if (body.renderingAllocation !== undefined) {
    const alloc = body.renderingAllocation;
    if (
      typeof alloc !== "number" ||
      !Number.isInteger(alloc) ||
      alloc < 1
    ) {
      return "renderingAllocation must be an integer >= 1";
    }
  }

  // renderingImageTypes — optional array of non-empty strings
  if (body.renderingImageTypes !== undefined) {
    if (!Array.isArray(body.renderingImageTypes)) {
      return "renderingImageTypes must be an array";
    }
    for (const t of body.renderingImageTypes) {
      if (typeof t !== "string" || t.trim().length === 0) {
        return "renderingImageTypes entries must be non-empty strings";
      }
    }
  }

  // renderingExcludedUsers — optional array of strings (email shape)
  if (body.renderingExcludedUsers !== undefined) {
    if (!Array.isArray(body.renderingExcludedUsers)) {
      return "renderingExcludedUsers must be an array";
    }
    for (const u of body.renderingExcludedUsers) {
      if (typeof u !== "string" || u.trim().length === 0) {
        return "renderingExcludedUsers entries must be non-empty strings";
      }
    }
  }

  return null;
}

function buildUpdatePayload(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const general = (body.general ?? {}) as GeneralFields;
  const social = (body.socialLinks ?? {}) as SocialLinksFields;

  const out: Record<string, unknown> = {};

  if (general.siteTitle !== undefined) out.siteTitle = general.siteTitle;
  if (general.tagline !== undefined) out.tagline = general.tagline;
  if (general.contactEmail !== undefined) {
    out.contactEmail = (general.contactEmail as string).trim();
  }
  if (general.contactPhone !== undefined) {
    out.contactPhone = general.contactPhone;
  }
  if (general.studioLocation !== undefined) {
    out.studioLocation = general.studioLocation;
  }
  if (general.defaultFromEmail !== undefined) {
    out.defaultFromEmail = (general.defaultFromEmail as string).trim();
  }
  if (general.defaultCcEmail !== undefined) {
    // D-06: store raw string; normalization happens at send time (Plan 02).
    out.defaultCcEmail = general.defaultCcEmail as string;
  }

  if (
    social.instagram !== undefined ||
    social.pinterest !== undefined ||
    social.houzz !== undefined
  ) {
    out.socialLinks = {
      instagram: (social.instagram as string) ?? "",
      pinterest: (social.pinterest as string) ?? "",
      houzz: (social.houzz as string) ?? "",
    };
  }

  if (body.renderingAllocation !== undefined) {
    out.renderingAllocation = body.renderingAllocation;
  }

  if (body.renderingImageTypes !== undefined) {
    out.renderingImageTypes = body.renderingImageTypes;
  }

  // Normalize + dedupe excluded users (case-normalized, trimmed)
  if (body.renderingExcludedUsers !== undefined) {
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const u of body.renderingExcludedUsers as string[]) {
      const key = u.toLowerCase().trim();
      if (key.length === 0) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      normalized.push(key);
    }
    out.renderingExcludedUsers = normalized;
  }

  return out;
}

function buildUpdateLogEntry(action: ActionName, actor: string) {
  return {
    _key: generatePortalToken(8),
    _type: "object",
    savedAt: new Date().toISOString(),
    actor,
    action,
  };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // T-34-01: admin-only. Gate BEFORE body parsing so non-admin callers are
  // rejected cheap-fast without allocating request memory.
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return errorResponse("Unauthorized", 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const action = body.action as ActionName | undefined;
  if (!action) {
    return errorResponse("Missing action", 400);
  }

  try {
    if (action === "update") {
      const validationError = validateUpdateBody(body);
      if (validationError) {
        return errorResponse(validationError, 400);
      }

      const payload = buildUpdatePayload(body);
      const logEntry = buildUpdateLogEntry(action, session.entityId);

      await sanityWriteClient
        .patch(SETTINGS_DOC_ID)
        .setIfMissing({
          _type: "siteSettings",
          heroSlideshow: [],
          updateLog: [],
        })
        .set(payload)
        .append("updateLog", [logEntry])
        .commit();

      return jsonResponse({ success: true });
    }

    if (action === "appendHeroSlide") {
      const { assetId, alt } = body as {
        assetId?: unknown;
        alt?: unknown;
      };

      if (typeof alt !== "string" || alt.trim().length === 0) {
        return errorResponse("Alt text is required for every hero slide", 400);
      }
      if (typeof assetId !== "string" || !assetId.startsWith("image-")) {
        return errorResponse(
          "assetId must be a Sanity image asset reference (image-...)",
          400,
        );
      }

      const slide = {
        _key: generatePortalToken(8),
        _type: "object",
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
        },
        alt,
      };
      const logEntry = buildUpdateLogEntry(action, session.entityId);

      await sanityWriteClient
        .patch(SETTINGS_DOC_ID)
        .setIfMissing({
          _type: "siteSettings",
          heroSlideshow: [],
          updateLog: [],
        })
        .append("heroSlideshow", [slide])
        .append("updateLog", [logEntry])
        .commit();

      return jsonResponse({ success: true, slide });
    }

    if (action === "updateHeroSlide") {
      const { _key, alt } = body as { _key?: unknown; alt?: unknown };

      if (typeof _key !== "string" || _key.length === 0) {
        return errorResponse("Missing slide _key", 400);
      }
      if (typeof alt !== "string" || alt.trim().length === 0) {
        return errorResponse("Alt text cannot be empty", 400);
      }

      const logEntry = buildUpdateLogEntry(action, session.entityId);

      await sanityWriteClient
        .patch(SETTINGS_DOC_ID)
        .setIfMissing({ updateLog: [] })
        .set({ [`heroSlideshow[_key=="${_key}"].alt`]: alt })
        .append("updateLog", [logEntry])
        .commit();

      return jsonResponse({ success: true });
    }

    if (action === "reorderHeroSlideshow") {
      const { order } = body as { order?: unknown };
      if (
        !Array.isArray(order) ||
        order.some((k) => typeof k !== "string")
      ) {
        return errorResponse("order must be an array of _key strings", 400);
      }

      // Fetch the current heroSlideshow so we can rebuild it in the new order.
      const current = (await sanityWriteClient.fetch(
        `*[_id == $id][0]{ heroSlideshow }`,
        { id: SETTINGS_DOC_ID },
      )) as { heroSlideshow?: Array<{ _key: string }> } | null;

      const existing = current?.heroSlideshow ?? [];
      const byKey = new Map(existing.map((s) => [s._key, s]));
      const reordered = (order as string[])
        .map((k) => byKey.get(k))
        .filter((s): s is (typeof existing)[number] => s !== undefined);

      // Preserve any slides not mentioned in `order` at the end so nothing is
      // silently dropped if the client sent a stale order.
      for (const slide of existing) {
        if (!(order as string[]).includes(slide._key)) {
          reordered.push(slide);
        }
      }

      const logEntry = buildUpdateLogEntry(action, session.entityId);

      await sanityWriteClient
        .patch(SETTINGS_DOC_ID)
        .setIfMissing({ updateLog: [] })
        .set({ heroSlideshow: reordered })
        .append("updateLog", [logEntry])
        .commit();

      return jsonResponse({ success: true });
    }

    if (action === "removeHeroSlide") {
      const { _key } = body as { _key?: unknown };
      if (typeof _key !== "string" || _key.length === 0) {
        return errorResponse("Missing slide _key", 400);
      }

      const logEntry = buildUpdateLogEntry(action, session.entityId);

      await sanityWriteClient
        .patch(SETTINGS_DOC_ID)
        .setIfMissing({ updateLog: [] })
        .unset([`heroSlideshow[_key=="${_key}"]`])
        .append("updateLog", [logEntry])
        .commit();

      return jsonResponse({ success: true });
    }

    return errorResponse(`Unknown action: ${action}`, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save";
    // eslint-disable-next-line no-console
    console.error("[api/admin/site-settings] save failed", err);
    return jsonResponse({ error: message }, 500);
  }
};
