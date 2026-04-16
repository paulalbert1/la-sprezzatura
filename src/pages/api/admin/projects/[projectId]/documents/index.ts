export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../../../../lib/session";
import { getTenantClient } from "../../../../../../lib/tenantClient";
import { generatePortalToken } from "../../../../../../lib/generateToken";

/**
 * Phase 39 Plan 01 Task 3 — Documents upload (POST).
 *
 * Mirrors src/pages/api/admin/artifact-version.ts L29-118 for the
 * multipart -> client.assets.upload -> patch.append pattern.
 *
 * Defense-in-depth: MIME allowlist + 25MB size gate + category enum.
 * _key is app-generated (generatePortalToken(8)) with
 * autoGenerateArrayKeys: false to keep downstream [_key==...] patches
 * deterministic (Pitfall 2 in 39-RESEARCH.md).
 */

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — match artifact-version.ts
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_CATEGORIES = [
  "Contracts",
  "Drawings",
  "Selections",
  "Presentations",
];

export const POST: APIRoute = async ({ request, cookies }) => {
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

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = (formData.get("projectId") as string) || "";
    const category = (formData.get("category") as string) || "";
    const labelInput = (formData.get("label") as string) || "";

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Missing projectId" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: "No valid file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error:
            "Only PDF and image files can be uploaded (PDF, JPG, PNG).",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "File too large (25MB max)" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return new Response(
        JSON.stringify({ error: "Invalid category" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await client.assets.upload("file", buffer, {
      filename: file.name,
      contentType: file.type,
    });

    const docKey = generatePortalToken(8);
    const label = labelInput.trim() || file.name;
    const uploadedByName =
      (session as { displayName?: string }).displayName ??
      session.entityId ??
      "Admin";

    const entry = {
      _key: docKey,
      _type: "projectDocument",
      file: {
        _type: "file",
        asset: { _type: "reference", _ref: asset._id },
      },
      label,
      category,
      uploadedAt: new Date().toISOString(),
      uploadedByName,
    };

    await client
      .patch(projectId)
      .setIfMissing({ projectDocuments: [] })
      .append("projectDocuments", [entry])
      .commit({ autoGenerateArrayKeys: false });

    return new Response(
      JSON.stringify({ success: true, docKey, assetUrl: asset.url }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[Documents] Upload failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to upload document" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
