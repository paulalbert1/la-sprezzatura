export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../../sanity/writeClient";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // 1. Validate studio auth via header
    const token = request.headers.get("x-studio-token");
    if (!token || token !== import.meta.env.STUDIO_API_SECRET) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid studio token. Please reload Sanity Studio and try again.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. Get sessionId from query params
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      return new Response(
        JSON.stringify({
          error: "sessionId query parameter is required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Fetch session using write client (bypasses CDN cache for fresh reads)
    const session = await sanityWriteClient.fetch(
      `*[_type == "renderingSession" && _id == $sessionId][0] {
        _id,
        status,
        lastError,
        "renderingCount": count(renderings),
        "latestRendering": renderings | order(generatedAt desc) [0] {
          blobPathname,
          textResponse,
          status,
          errorMessage,
          generatedAt
        }
      }`,
      { sessionId },
    );

    if (!session) {
      return new Response(
        JSON.stringify({
          error:
            "Rendering session not found. It may have been deleted.",
          code: "SESSION_NOT_FOUND",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4. Return status
    return new Response(
      JSON.stringify({
        status: session.status,
        sessionId: session._id,
        latestRendering: session.latestRendering || null,
        renderingCount: session.renderingCount || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[Rendering:Status] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
