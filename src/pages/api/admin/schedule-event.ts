export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { generatePortalToken } from "../../../lib/generateToken";

/**
 * API route for custom event CRUD on the project schedule.
 * Supports create, update, and delete actions on the customEvents[] array.
 */

const VALID_CATEGORIES = [
  "walkthrough",
  "inspection",
  "punch-list",
  "move",
  "permit",
  "delivery-window",
  "presentation",
  "deadline",
  "access",
  "other",
] as const;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type ScheduleEventBody =
  | {
      action: "create";
      projectId: string;
      fields: {
        name: string;
        category?: string;
        date: string;
        endDate?: string | null;
        notes?: string;
      };
    }
  | {
      action: "update";
      projectId: string;
      eventKey: string;
      fields?: Record<string, unknown>;
    }
  | {
      action: "delete";
      projectId: string;
      eventKey: string;
    };

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: ScheduleEventBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { action, projectId } = body;

  if (!projectId) {
    return new Response(
      JSON.stringify({ error: "Missing projectId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // --- CREATE ---
    if (action === "create") {
      const { fields } = body;

      if (!fields?.name || typeof fields.name !== "string" || !fields.name.trim()) {
        return new Response(
          JSON.stringify({ error: "Event name is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!fields.date || !DATE_REGEX.test(fields.date)) {
        return new Response(
          JSON.stringify({ error: "Invalid date format" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (fields.endDate && !DATE_REGEX.test(fields.endDate)) {
        return new Response(
          JSON.stringify({ error: "Invalid endDate format" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (
        fields.category &&
        !VALID_CATEGORIES.includes(fields.category as (typeof VALID_CATEGORIES)[number])
      ) {
        return new Response(
          JSON.stringify({ error: "Invalid event category" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const eventKey = generatePortalToken(8);

      const event = {
        _key: eventKey,
        _type: "scheduleEvent",
        name: fields.name.trim(),
        category: fields.category || "other",
        date: fields.date,
        endDate: fields.endDate || null,
        notes: fields.notes || "",
      };

      await sanityWriteClient
        .patch(projectId)
        .setIfMissing({ customEvents: [] })
        .append("customEvents", [event])
        .commit();

      return new Response(
        JSON.stringify({ success: true, eventKey }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // --- UPDATE ---
    if (action === "update") {
      const { eventKey, fields } = body;

      if (!eventKey || typeof eventKey !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing eventKey" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const setObj: Record<string, unknown> = {};
      if (fields) {
        for (const [fieldName, value] of Object.entries(fields)) {
          // Validate category if being updated
          if (fieldName === "category" && value) {
            if (
              !VALID_CATEGORIES.includes(value as (typeof VALID_CATEGORIES)[number])
            ) {
              return new Response(
                JSON.stringify({ error: "Invalid event category" }),
                { status: 400, headers: { "Content-Type": "application/json" } },
              );
            }
          }
          // Validate date fields if being updated
          if ((fieldName === "date" || fieldName === "endDate") && value) {
            if (!DATE_REGEX.test(value as string)) {
              return new Response(
                JSON.stringify({ error: `Invalid ${fieldName} format` }),
                { status: 400, headers: { "Content-Type": "application/json" } },
              );
            }
          }
          setObj[`customEvents[_key=="${eventKey}"].${fieldName}`] = value;
        }
      }

      if (Object.keys(setObj).length > 0) {
        await sanityWriteClient.patch(projectId).set(setObj).commit();
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- DELETE ---
    if (action === "delete") {
      const { eventKey } = body;

      if (!eventKey || typeof eventKey !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing eventKey" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      await sanityWriteClient
        .patch(projectId)
        .unset([`customEvents[_key=="${eventKey}"]`])
        .commit();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- ADD CONTRACTOR ---
    if (action === "add-contractor") {
      const { contractorId, startDate, endDate } = body as any;
      if (!contractorId) {
        return new Response(
          JSON.stringify({ error: "Missing fields" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      const entryKey = generatePortalToken(8);
      await sanityWriteClient
        .patch(projectId)
        .setIfMissing({ contractors: [] })
        .append("contractors", [
          {
            _key: entryKey,
            _type: "contractorAssignment",
            contractor: { _type: "reference", _ref: contractorId },
            startDate: startDate || null,
            endDate: endDate || null,
          },
        ])
        .commit();
      return new Response(
        JSON.stringify({ success: true, entryKey }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Invalid action
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to process schedule event:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process schedule event" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
