export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";

/**
 * API route for updating schedule item dates (drag-and-drop + click-to-edit).
 * Supports contractors, milestones, and custom events.
 * Procurement dates are read-only (managed via procurement editor).
 */

type ScheduleDateBody = {
  projectId: string;
  taskId: string; // format "category:_key" e.g. "contractor:c1", "milestone:m1", "event:e1"
  startDate: string; // "YYYY-MM-DD"
  endDate?: string | null; // "YYYY-MM-DD" or null for point events
  isComplete?: boolean; // For milestones only
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const fieldMap: Record<
  string,
  { array: string; startField: string; endField: string }
> = {
  contractor: {
    array: "contractors",
    startField: "startDate",
    endField: "endDate",
  },
  milestone: { array: "milestones", startField: "date", endField: "date" },
  event: { array: "customEvents", startField: "date", endField: "endDate" },
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: ScheduleDateBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { projectId, taskId, startDate, endDate, isComplete } = body;

  // Validate required fields
  if (!projectId || !taskId || !startDate) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Parse taskId into category and _key
  const [category, _key] = taskId.split(":");

  // Reject procurement -- procurement dates are read-only (D-08)
  if (category === "procurement") {
    return new Response(
      JSON.stringify({ error: "Procurement dates are read-only" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Validate category
  const mapping = fieldMap[category];
  if (!mapping) {
    return new Response(
      JSON.stringify({ error: "Invalid category" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Validate _key
  if (!_key) {
    return new Response(
      JSON.stringify({ error: "Missing item key in taskId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Validate date format
  if (!DATE_REGEX.test(startDate)) {
    return new Response(
      JSON.stringify({ error: "Invalid startDate format (expected YYYY-MM-DD)" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (endDate && !DATE_REGEX.test(endDate)) {
    return new Response(
      JSON.stringify({ error: "Invalid endDate format (expected YYYY-MM-DD)" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Build Sanity patch
  const setObj: Record<string, unknown> = {};
  setObj[`${mapping.array}[_key=="${_key}"].${mapping.startField}`] = startDate;

  // For items with distinct end field, set endDate
  if (mapping.endField !== mapping.startField && endDate) {
    setObj[`${mapping.array}[_key=="${_key}"].${mapping.endField}`] = endDate;
  }

  // For milestones, also update isComplete if provided
  if (category === "milestone" && typeof isComplete === "boolean") {
    setObj[`milestones[_key=="${_key}"].isComplete`] = isComplete;
  }

  try {
    await sanityWriteClient.patch(projectId).set(setObj).commit();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to update schedule date:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update schedule date" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
