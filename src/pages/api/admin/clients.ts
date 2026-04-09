export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!session.tenantId) {
    return jsonResponse({ error: "No tenant context" }, 403);
  }
  const client = getTenantClient(session.tenantId);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { action } = body as { action: string };

  try {
    if (action === "create") {
      const { name, email, phone, preferredContact, address, notes } = body as {
        name: string;
        email: string;
        phone?: string;
        preferredContact?: string;
        address?: Record<string, string>;
        notes?: string;
      };

      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return jsonResponse({ error: "Name must be at least 2 characters" }, 400);
      }
      if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return jsonResponse({ error: "Valid email address is required" }, 400);
      }
      if (notes && typeof notes === "string" && notes.length > 2000) {
        return jsonResponse({ error: "Notes must be 2000 characters or less" }, 400);
      }

      const result = await client.create({
        _type: "client",
        name: name.trim(),
        email: email.trim().toLowerCase(),
        ...(phone && { phone: phone.trim() }),
        ...(preferredContact && { preferredContact }),
        ...(address && { address }),
        ...(notes && { notes: notes.trim() }),
      });

      return jsonResponse({ success: true, clientId: result._id });
    }

    if (action === "update") {
      const { clientId, name, email, phone, preferredContact, address, notes } = body as {
        clientId: string;
        name: string;
        email: string;
        phone?: string;
        preferredContact?: string;
        address?: Record<string, string>;
        notes?: string;
      };

      if (!clientId || typeof clientId !== "string") {
        return jsonResponse({ error: "Missing clientId" }, 400);
      }
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return jsonResponse({ error: "Name must be at least 2 characters" }, 400);
      }
      if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return jsonResponse({ error: "Valid email address is required" }, 400);
      }
      if (notes && typeof notes === "string" && notes.length > 2000) {
        return jsonResponse({ error: "Notes must be 2000 characters or less" }, 400);
      }

      await client
        .patch(clientId)
        .set({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || "",
          preferredContact: preferredContact || "",
          address: address || {},
          notes: notes?.trim() || "",
        })
        .commit();

      return jsonResponse({ success: true });
    }

    if (action === "delete") {
      const { clientId } = body as { clientId: string };

      if (!clientId || typeof clientId !== "string") {
        return jsonResponse({ error: "Missing clientId" }, 400);
      }

      const refCount = await client.fetch(
        'count(*[_type == "project" && references($id)])',
        { id: clientId },
      );

      if (refCount > 0) {
        return jsonResponse(
          { error: "Cannot delete: client is linked to projects", refCount },
          409,
        );
      }

      await client.delete(clientId);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("Failed to process client operation:", err);
    return jsonResponse({ error: "Failed to process client operation" }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!session.tenantId) {
    return jsonResponse({ error: "No tenant context" }, 403);
  }
  const client = getTenantClient(session.tenantId);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { clientId } = body as { clientId: string };

  if (!clientId || typeof clientId !== "string") {
    return jsonResponse({ error: "Missing clientId" }, 400);
  }

  try {
    const refCount = await client.fetch(
      'count(*[_type == "project" && references($id)])',
      { id: clientId },
    );

    if (refCount > 0) {
      return jsonResponse(
        { error: "Cannot delete: client is linked to projects", refCount },
        409,
      );
    }

    await client.delete(clientId);
    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Failed to delete client:", err);
    return jsonResponse({ error: "Failed to delete client" }, 500);
  }
};
