import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { RENDERING_SESSION_BY_ID_QUERY } from "../../../sanity/queries";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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

    const body = await request.json();
    const {
      sessionId,
      renderingIndex,
      projectId,
      caption,
      sanityUserId,
      unpromote,
    } = body;

    // 2. Validate required fields
    if (!sessionId || renderingIndex === undefined || renderingIndex === null) {
      return new Response(
        JSON.stringify({
          error: "sessionId and renderingIndex are required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Fetch session
    const session = await sanityWriteClient.fetch(
      RENDERING_SESSION_BY_ID_QUERY,
      { sessionId },
    );
    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Rendering session not found.",
          code: "SESSION_NOT_FOUND",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4. Verify renderingIndex is valid
    const rendering = session.renderings?.[renderingIndex];
    if (!rendering) {
      return new Response(
        JSON.stringify({
          error: "Rendering at the specified index not found.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5. Handle UNPROMOTE
    if (unpromote) {
      // Find and delete the designOption document linked to this rendering
      const existingOption = await sanityWriteClient.fetch(
        `*[_type == "designOption" && sourceSession._ref == $sessionId && sourceRenderingIndex == $renderingIndex][0]._id`,
        { sessionId, renderingIndex },
      );

      if (existingOption) {
        await sanityWriteClient.delete(existingOption);
      }

      // Clear isPromoted on the rendering using _key based selector
      const renderingKey = rendering._key;
      await sanityWriteClient
        .patch(sessionId)
        .set({ [`renderings[_key=="${renderingKey}"].isPromoted`]: false })
        .commit();

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Design option removed. The client will no longer see it.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 6. Handle PROMOTE
    // Determine project ref -- session.project or explicit projectId
    const effectiveProjectId = session.project?._id || projectId;
    if (!effectiveProjectId) {
      return new Response(
        JSON.stringify({
          error:
            "Select a project to promote this rendering. Scratchpad sessions require a project.",
          code: "MISSING_PROJECT",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Auto-assign sortOrder: count existing design options for this project + 1
    const existingCount = await sanityWriteClient.fetch(
      `count(*[_type == "designOption" && project._ref == $projectId])`,
      { projectId: effectiveProjectId },
    );

    // Create designOption document
    const designOption = await sanityWriteClient.create({
      _type: "designOption",
      project: { _type: "reference", _ref: effectiveProjectId },
      blobPathname: rendering.blobPathname,
      caption: caption || "",
      sourceSession: { _type: "reference", _ref: sessionId },
      sourceRenderingIndex: renderingIndex,
      sortOrder: (existingCount || 0) + 1,
      promotedAt: new Date().toISOString(),
      promotedBy: sanityUserId || "",
      reactions: [],
    });

    // Mark rendering as promoted on session using _key based selector
    const renderingKey = rendering._key;
    await sanityWriteClient
      .patch(sessionId)
      .set({ [`renderings[_key=="${renderingKey}"].isPromoted`]: true })
      .commit();

    // If scratchpad session and projectId was provided, link session to project
    if (!session.project && projectId) {
      await sanityWriteClient
        .patch(sessionId)
        .set({ project: { _type: "reference", _ref: projectId } })
        .commit();
    }

    return new Response(
      JSON.stringify({
        success: true,
        designOptionId: designOption._id,
        message: "Rendering promoted to Design Options.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[Rendering:Promote] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
