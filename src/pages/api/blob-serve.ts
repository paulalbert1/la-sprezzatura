import type { APIRoute } from "astro";
import { getSession } from "../../lib/session";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  // Auth check: require a valid session (any role)
  const session = await getSession(context.cookies);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pathname = context.url.searchParams.get("path");
  if (!pathname) {
    return new Response("Missing path parameter", { status: 400 });
  }

  try {
    // Fetch private blob using server-side token (BLOB_READ_WRITE_TOKEN env var)
    const { get } = await import("@vercel/blob");
    const blob = await get(pathname);

    if (!blob) {
      return new Response("Not found", { status: 404 });
    }

    // Stream the blob content to the client
    const blobResponse = await fetch(blob.downloadUrl);
    if (!blobResponse.ok) {
      return new Response("Failed to fetch blob", { status: 502 });
    }

    return new Response(blobResponse.body, {
      headers: {
        "Content-Type": blob.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${pathname.split("/").pop()}"`,
        "Cache-Control": "private, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("[BlobServe] Error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};
