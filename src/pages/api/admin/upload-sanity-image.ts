import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";

// Phase 34 Plan 02 — Sanity-native image upload route
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-09 (Path A)
//   - .planning/phases/34-settings-and-studio-retirement/34-RESEARCH.md § 3.3 KR-4
//
// Why this exists: hero slideshow images MUST be stored as real Sanity image
// assets so the public homepage's @sanity/image-url pipeline keeps working.
// The Vercel Blob upload route (blob-upload.ts) produces blob pathnames, not
// Sanity asset refs — so hero slideshow can't reuse it. This route uploads
// the file directly into Sanity via sanityWriteClient.assets.upload and
// returns the full asset document.
//
// Threat model: T-34-02 (unauthenticated upload). Mitigation: the handler
// gates on admin session BEFORE reading the body so anon callers never even
// trigger multipart parsing.

export const prerender = false;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB ceiling, matches StepUpload
const VERCEL_BODY_LIMIT = 4.5 * 1024 * 1024; // 4.5MB Vercel Function body cap

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: "Invalid multipart body" }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonResponse({ error: "No file field in request" }, 400);
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return jsonResponse(
      { error: `Unsupported MIME type: ${file.type}` },
      400,
    );
  }

  if (file.size > VERCEL_BODY_LIMIT) {
    return jsonResponse(
      {
        error:
          "File exceeds 4.5MB limit for server upload. Please use a smaller image.",
      },
      413,
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return jsonResponse({ error: "File exceeds 20MB ceiling" }, 413);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await sanityWriteClient.assets.upload("image", buffer, {
      filename: file.name,
      contentType: file.type,
    });
    return jsonResponse({ success: true, asset });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return jsonResponse({ error: message }, 500);
  }
};
