export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";
import { generatePortalToken } from "../../../lib/generateToken";

// Admin-only CRUD for the clientActionItems array on a project.
// Mirrors the /api/admin/tasks pattern (create, toggle, delete).

const MAX_DESCRIPTION_LENGTH = 500;
const FIELD = "clientActionItems";
const TYPE_NAME = "clientActionItem";

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!session.tenantId) {
    return json({ error: "No tenant context" }, 403);
  }
  const client = getTenantClient(session.tenantId);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { action, projectId } = body as { action: string; projectId: string };
  if (!projectId || typeof projectId !== "string") {
    return json({ error: "Missing projectId" }, 400);
  }

  try {
    if (action === "create") {
      const { description, dueDate } = body as {
        description: string;
        dueDate?: string;
      };
      if (!description?.trim()) {
        return json({ error: "Description is required" }, 400);
      }
      if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
        return json(
          { error: `Description must be ${MAX_DESCRIPTION_LENGTH} chars or less` },
          400,
        );
      }
      if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return json({ error: "Invalid date format. Use YYYY-MM-DD." }, 400);
      }

      const now = new Date().toISOString();
      const itemKey = generatePortalToken(8);

      const item = {
        _key: itemKey,
        _type: TYPE_NAME,
        description: description.trim(),
        ...(dueDate && { dueDate }),
        completed: false,
        createdAt: now,
      };

      await client
        .patch(projectId)
        .setIfMissing({ [FIELD]: [] })
        .append(FIELD, [item])
        .commit();

      return json({ success: true, itemKey });
    }

    if (action === "toggle") {
      const { itemKey, completed } = body as {
        itemKey: string;
        completed: boolean;
      };
      if (!itemKey) return json({ error: "Missing itemKey" }, 400);
      if (typeof completed !== "boolean") {
        return json({ error: "completed must be a boolean" }, 400);
      }

      const now = new Date().toISOString();
      const patch = client.patch(projectId);
      if (completed) {
        patch.set({
          [`${FIELD}[_key=="${itemKey}"].completed`]: true,
          [`${FIELD}[_key=="${itemKey}"].completedAt`]: now,
        });
      } else {
        patch.set({
          [`${FIELD}[_key=="${itemKey}"].completed`]: false,
          [`${FIELD}[_key=="${itemKey}"].completedAt`]: null,
        });
      }
      await patch.commit();
      return json({ success: true });
    }

    if (action === "delete") {
      const { itemKey } = body as { itemKey: string };
      if (!itemKey) return json({ error: "Missing itemKey" }, 400);
      await client
        .patch(projectId)
        .unset([`${FIELD}[_key=="${itemKey}"]`])
        .commit();
      return json({ success: true });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("[client-action-items] error:", err);
    return json({ error: "Operation failed" }, 500);
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
