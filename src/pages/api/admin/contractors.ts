export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";
import { generatePortalToken } from "../../../lib/generateToken";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

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

  // Check if request is FormData (for file uploads) or JSON
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // Handle file upload action
    const formData = await request.formData();
    const action = formData.get("action") as string;

    if (action !== "upload-doc") {
      return jsonResponse({ error: "Invalid form action" }, 400);
    }

    const contractorId = formData.get("contractorId") as string;
    const file = formData.get("file") as File | null;

    if (!contractorId || typeof contractorId !== "string") {
      return jsonResponse({ error: "Missing contractorId" }, 400);
    }
    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: "No file provided" }, 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: "File too large. Maximum size is 10MB." }, 400);
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return jsonResponse(
        { error: "Invalid file type. Allowed: PDF, JPEG, PNG." },
        400,
      );
    }

    try {
      // Upload to Sanity assets
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await client.assets.upload("file", buffer, {
        filename: file.name,
        contentType: file.type,
      });

      const docEntry = {
        _key: generatePortalToken(8),
        _type: "contractorDocument",
        fileName: file.name,
        fileType: file.type,
        url: asset.url,
        uploadedAt: new Date().toISOString(),
      };

      await client
        .patch(contractorId)
        .setIfMissing({ documents: [] })
        .append("documents", [docEntry])
        .commit();

      return jsonResponse({ success: true, documentKey: docEntry._key, url: asset.url });
    } catch (err) {
      console.error("Failed to upload contractor document:", err);
      return jsonResponse({ error: "Failed to upload document" }, 500);
    }
  }

  // JSON body actions
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { action } = body as { action: string };

  try {
    if (action === "create") {
      const { name, email, phone, company, trades } = body as {
        name: string;
        email: string;
        phone?: string;
        company?: string;
        trades: string[];
      };

      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return jsonResponse({ error: "Name must be at least 2 characters" }, 400);
      }
      if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return jsonResponse({ error: "Valid email address is required" }, 400);
      }
      if (!Array.isArray(trades) || trades.length < 1) {
        return jsonResponse({ error: "At least one trade is required" }, 400);
      }

      const result = await client.create({
        _type: "contractor",
        name: name.trim(),
        email: email.trim().toLowerCase(),
        ...(phone && { phone: phone.trim() }),
        ...(company && { company: company.trim() }),
        trades,
      });

      return jsonResponse({ success: true, contractorId: result._id });
    }

    if (action === "update") {
      const { contractorId, name, email, phone, company, trades } = body as {
        contractorId: string;
        name: string;
        email: string;
        phone?: string;
        company?: string;
        trades: string[];
      };

      if (!contractorId || typeof contractorId !== "string") {
        return jsonResponse({ error: "Missing contractorId" }, 400);
      }
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return jsonResponse({ error: "Name must be at least 2 characters" }, 400);
      }
      if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return jsonResponse({ error: "Valid email address is required" }, 400);
      }
      if (!Array.isArray(trades) || trades.length < 1) {
        return jsonResponse({ error: "At least one trade is required" }, 400);
      }

      await client
        .patch(contractorId)
        .setIfMissing({ documents: [] })
        .set({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || "",
          company: company?.trim() || "",
          trades,
        })
        .commit();

      return jsonResponse({ success: true });
    }

    if (action === "delete") {
      const { contractorId } = body as { contractorId: string };

      if (!contractorId || typeof contractorId !== "string") {
        return jsonResponse({ error: "Missing contractorId" }, 400);
      }

      const refCount = await client.fetch(
        'count(*[_type == "project" && references($id)])',
        { id: contractorId },
      );

      if (refCount > 0) {
        return jsonResponse(
          { error: "Cannot delete: contractor is linked to projects", refCount },
          409,
        );
      }

      await client.delete(contractorId);
      return jsonResponse({ success: true });
    }

    if (action === "assign-to-project") {
      const { projectId, contractorId, trade } = body as {
        projectId: string;
        contractorId: string;
        trade: string;
      };

      if (!projectId || typeof projectId !== "string") {
        return jsonResponse({ error: "Missing projectId" }, 400);
      }
      if (!contractorId || typeof contractorId !== "string") {
        return jsonResponse({ error: "Missing contractorId" }, 400);
      }
      if (!trade || typeof trade !== "string") {
        return jsonResponse({ error: "Missing trade" }, 400);
      }

      await client
        .patch(projectId)
        .setIfMissing({ contractors: [] })
        .append("contractors", [
          {
            _key: generatePortalToken(8),
            _type: "projectContractor",
            contractor: { _type: "reference", _ref: contractorId },
            trade,
          },
        ])
        .commit();

      return jsonResponse({ success: true });
    }

    if (action === "delete-doc") {
      const { contractorId, docKey } = body as {
        contractorId: string;
        docKey: string;
      };

      if (!contractorId || typeof contractorId !== "string") {
        return jsonResponse({ error: "Missing contractorId" }, 400);
      }
      if (!docKey || typeof docKey !== "string") {
        return jsonResponse({ error: "Missing docKey" }, 400);
      }

      await client
        .patch(contractorId)
        .unset([`documents[_key=="${docKey}"]`])
        .commit();

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("Failed to process contractor operation:", err);
    return jsonResponse({ error: "Failed to process contractor operation" }, 500);
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

  const { contractorId } = body as { contractorId: string };

  if (!contractorId || typeof contractorId !== "string") {
    return jsonResponse({ error: "Missing contractorId" }, 400);
  }

  try {
    const refCount = await client.fetch(
      'count(*[_type == "project" && references($id)])',
      { id: contractorId },
    );

    if (refCount > 0) {
      return jsonResponse(
        { error: "Cannot delete: contractor is linked to projects", refCount },
        409,
      );
    }

    await client.delete(contractorId);
    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Failed to delete contractor:", err);
    return jsonResponse({ error: "Failed to delete contractor" }, 500);
  }
};
