import type { APIRoute } from "astro";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { put } from "@vercel/blob";
import { getSession } from "../../lib/session";

export const prerender = false;

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const PUT: APIRoute = async ({ request, cookies }) => {
  // Phase 34 Plan 02 T-34-02 backfill: gate all blob mutations behind admin session.
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: "No valid file provided" }, 400);
    }

    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return jsonResponse({ error: "File type not allowed" }, 400);
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return jsonResponse({ url: blob.url, pathname: blob.pathname }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return jsonResponse({ error: message }, 400);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  // Phase 34 Plan 02 T-34-02 backfill: gate token issuance behind admin session.
  // Checked BEFORE onBeforeGenerateToken is invoked so non-admin callers can
  // never obtain an upload token.
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  try {
    const uploadResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        // Admin session verified above; echo the allowlist so tokens only
        // accept the MIME types we permit.
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[BlobUpload] Upload completed:", blob.pathname);
      },
    });

    return jsonResponse(uploadResponse, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return jsonResponse({ error: message }, 400);
  }
};
