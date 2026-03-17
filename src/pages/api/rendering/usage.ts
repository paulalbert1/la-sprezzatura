import type { APIRoute } from "astro";
import { checkUsageQuota } from "../../../lib/renderingAuth";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { RENDERING_USAGE_QUERY } from "../../../sanity/queries";

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // 1. Validate studio auth
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

    // 2. Get sanityUserId from query params
    const sanityUserId = url.searchParams.get("sanityUserId");
    if (!sanityUserId) {
      return new Response(
        JSON.stringify({
          error: "sanityUserId query parameter is required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Check usage quota (creates usage doc if not exists)
    const usage = await checkUsageQuota(sanityUserId);

    // 4. Fetch full usage doc for bytesStored
    const month = new Date().toISOString().slice(0, 7);
    const docId = `usage-${sanityUserId}-${month}`;
    const usageDoc = await sanityWriteClient.fetch(RENDERING_USAGE_QUERY, {
      docId,
    });
    const bytesStored = usageDoc?.bytesStored || 0;

    // 5. Return usage data
    return new Response(
      JSON.stringify({
        sanityUserId,
        month,
        count: usage.count,
        limit: usage.limit,
        remaining: usage.remaining,
        bytesStored,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[Rendering:Usage] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
