export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";
import { generatePortalToken } from "../../../lib/generateToken";

const MAX_DESCRIPTION_LENGTH = 500;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Auth check -- exact pattern from artifact-crud.ts
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
    if (action === "create") {
      const { description, dueDate } = body as {
        description: string;
        dueDate?: string;
      };

      if (!description || typeof description !== "string" || !description.trim()) {
        return new Response(
          JSON.stringify({ error: "Task description is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Validate dueDate format if provided (YYYY-MM-DD)
      if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return new Response(
          JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const now = new Date().toISOString();
      const taskKey = generatePortalToken(8);

      const taskObject = {
        _key: taskKey,
        _type: "task", // Must match defineArrayMember name (Pitfall 2)
        description: description.trim(),
        ...(dueDate && { dueDate }),
        completed: false,
        createdAt: now,
      };

      const activityEntry = {
        _key: generatePortalToken(8),
        _type: "activityEntry",
        action: "task-created",
        description: `Task "${description.trim().slice(0, 60)}" added`,
        actor: session.entityId,
        timestamp: now,
      };

      // setIfMissing before append (Pitfall 3)
      await client
        .patch(projectId)
        .setIfMissing({ tasks: [], activityLog: [] })
        .append("tasks", [taskObject])
        .append("activityLog", [activityEntry])
        .commit();

      return new Response(
        JSON.stringify({ success: true, taskKey }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (action === "toggle") {
      const { taskKey, completed } = body as {
        taskKey: string;
        completed: boolean;
      };

      if (!taskKey || typeof taskKey !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing taskKey" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (typeof completed !== "boolean") {
        return new Response(
          JSON.stringify({ error: "completed must be a boolean" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const now = new Date().toISOString();

      const activityEntry = {
        _key: generatePortalToken(8),
        _type: "activityEntry",
        action: completed ? "task-completed" : "task-reopened",
        description: completed ? "Task marked complete" : "Task reopened",
        actor: session.entityId,
        timestamp: now,
      };

      // Update task completed state and completedAt
      const patch = client.patch(projectId);

      if (completed) {
        patch.set({
          [`tasks[_key=="${taskKey}"].completed`]: true,
          [`tasks[_key=="${taskKey}"].completedAt`]: now,
        });
      } else {
        patch.set({
          [`tasks[_key=="${taskKey}"].completed`]: false,
          [`tasks[_key=="${taskKey}"].completedAt`]: null,
        });
      }

      // Also append activity log entry
      patch.setIfMissing({ activityLog: [] });
      patch.append("activityLog", [activityEntry]);

      await patch.commit();

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to process task operation:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process task operation" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
