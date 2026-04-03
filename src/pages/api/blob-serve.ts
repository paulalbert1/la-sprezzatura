import type { APIRoute } from "astro";
import { getSession } from "../../lib/session";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  // Auth check: require a valid portal session OR studio token
  const session = await getSession(context.cookies);
  const studioToken = context.request.headers.get("x-studio-token")
    || context.url.searchParams.get("token");
  const isStudioAuth = studioToken && studioToken === import.meta.env.STUDIO_API_SECRET;

  if (!session && !isStudioAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const pathname = context.url.searchParams.get("path");
  if (!pathname) {
    return new Response("Missing path parameter", { status: 400 });
  }

  try {
    // Fetch private blob using server-side token (BLOB_READ_WRITE_TOKEN env var)
    const { get } = await import("@vercel/blob");
    const result = await get(pathname, { access: "private" });

    if (!result) {
      return new Response("Not found", { status: 404 });
    }

    // Use the stream directly from the get() result
    const contentType = result.blob.contentType || "application/octet-stream";

    return new Response(result.stream, {
      headers: {
        "Content-Type": contentType,
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
