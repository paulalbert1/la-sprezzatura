import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { generatePortalToken } from "../../../lib/generateToken";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // 1. Validate portal session auth (cookie-based, not Studio token)
    const session = await getSession(context.cookies);
    if (!session || session.role !== "client") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json();
    const { designOptionId, type, text } = body;

    // 2. Validate required fields
    if (!designOptionId) {
      return new Response(
        JSON.stringify({ error: "designOptionId is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!type || !["favorite", "unfavorite", "comment"].includes(type)) {
      return new Response(
        JSON.stringify({
          error: "type must be 'favorite', 'unfavorite', or 'comment'.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (type === "comment" && (!text || !text.trim())) {
      return new Response(
        JSON.stringify({ error: "Comment text is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Fetch design option and verify client has access to the project
    const designOption = await sanityWriteClient.fetch(
      `*[_type == "designOption" && _id == $designOptionId][0] {
        _id,
        project-> {
          _id,
          "hasAccess": count(clients[client._ref == $clientId]) > 0
        },
        reactions
      }`,
      { designOptionId, clientId: session.entityId },
    );

    if (!designOption) {
      return new Response(
        JSON.stringify({ error: "Design option not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!designOption.project?.hasAccess) {
      return new Response(
        JSON.stringify({
          error: "You do not have access to this design option.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4. Handle reaction types
    const clientId = session.entityId;

    if (type === "favorite") {
      // Check if already favorited
      const existingFav = (designOption.reactions || []).find(
        (r: any) => r.clientId === clientId && r.type === "favorite",
      );

      if (!existingFav) {
        // Add favorite reaction
        await sanityWriteClient
          .patch(designOptionId)
          .setIfMissing({ reactions: [] })
          .append("reactions", [
            {
              _key: generatePortalToken(8),
              clientId,
              type: "favorite",
              text: "",
              createdAt: new Date().toISOString(),
            },
          ])
          .commit();
      }
      // If already favorited, no-op (idempotent)
    }

    if (type === "unfavorite") {
      // Remove the favorite reaction for this client
      const existingFav = (designOption.reactions || []).find(
        (r: any) => r.clientId === clientId && r.type === "favorite",
      );

      if (existingFav?._key) {
        // Need to re-fetch with _key to unset
        const fullReactions = await sanityWriteClient.fetch(
          `*[_type == "designOption" && _id == $designOptionId][0].reactions[] { _key, clientId, type }`,
          { designOptionId },
        );
        const favKey = fullReactions?.find(
          (r: any) => r.clientId === clientId && r.type === "favorite",
        )?._key;

        if (favKey) {
          await sanityWriteClient
            .patch(designOptionId)
            .unset([`reactions[_key=="${favKey}"]`])
            .commit();
        }
      }
    }

    if (type === "comment") {
      // Append comment reaction
      await sanityWriteClient
        .patch(designOptionId)
        .setIfMissing({ reactions: [] })
        .append("reactions", [
          {
            _key: generatePortalToken(8),
            clientId,
            type: "comment",
            text: text.trim(),
            createdAt: new Date().toISOString(),
          },
        ])
        .commit();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Rendering:React] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
