export const prerender = false;

import type { APIRoute } from "astro";
import { waitUntil } from "@vercel/functions";
import { put } from "@vercel/blob";
import { sanityWriteClient } from "../../../sanity/writeClient";
import {
  validateRenderingAuth,
  checkUsageQuota,
  incrementUsage,
} from "../../../lib/renderingAuth";
import {
  refineRendering,
  fetchAndEncodeImage,
} from "../../../lib/geminiClient";
import type { ConversationEntry } from "../../../lib/geminiClient";
import {
  buildRefinementPrompt,
  buildImageRoleLabel,
} from "../../../lib/promptBuilder";
import type { ImageInput } from "../../../lib/promptBuilder";
import { generatePortalToken } from "../../../lib/generateToken";
import { RENDERING_SESSION_BY_ID_QUERY } from "../../../sanity/queries";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Step 1: Auth validation
    const auth = await validateRenderingAuth(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.statusCode || 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Parse request body
    const body = await request.json();
    const { sessionId, refinementText, newImages, sanityUserId } = body;

    // Validate required fields
    if (!sessionId) {
      return new Response(
        JSON.stringify({
          error: "Session ID is required.",
          code: "MISSING_SESSION",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!refinementText) {
      return new Response(
        JSON.stringify({
          error: "Refinement text is required.",
          code: "MISSING_REFINEMENT",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 3: Check usage quota
    const usage = await checkUsageQuota(sanityUserId!);
    if (!usage.allowed) {
      return new Response(
        JSON.stringify({
          error: `Monthly rendering limit reached (${usage.count}/${usage.limit}). Contact Paul to adjust your allocation.`,
          code: "QUOTA_EXCEEDED",
          usage: { count: usage.count, limit: usage.limit, remaining: 0 },
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 4: Fetch existing session
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

    // Step 5: Set status to generating and return 202
    await sanityWriteClient
      .patch(sessionId)
      .set({ status: "generating" })
      .commit();

    waitUntil(
      processRefinement(
        sessionId,
        session,
        refinementText,
        newImages || [],
        sanityUserId!,
      ),
    );

    return new Response(
      JSON.stringify({
        status: "generating",
        sessionId,
        message: "Refining your rendering...",
      }),
      { status: 202, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[Rendering:Refine] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

async function processRefinement(
  sessionId: string,
  session: any,
  refinementText: string,
  newImages: ImageInput[],
  sanityUserId: string,
): Promise<void> {
  const startTime = Date.now();
  try {
    // 1. Build conversation history from session.conversation
    const conversationHistory: ConversationEntry[] = (
      session.conversation || []
    ).map((entry: any) => ({
      role: entry.role,
      text: entry.text,
      image: entry.image,
    }));

    // 2. Get the last successful rendering's image for context
    const lastRendering = [...(session.renderings || [])]
      .reverse()
      .find((r: any) => r.status === "complete");
    if (!lastRendering?.blobPathname) {
      await sanityWriteClient
        .patch(sessionId)
        .set({
          status: "error",
          lastError: "No previous rendering found to refine.",
        })
        .commit();
      return;
    }

    // 3. Fetch and encode previous output image
    const previousOutput = await fetchAndEncodeImage(
      lastRendering.blobPathname,
    );

    // 4. Encode any new reference images
    const newEncodedImages: {
      base64: string;
      mimeType: string;
      roleLabel: string;
    }[] = [];
    for (const img of newImages) {
      try {
        const encoded = await fetchAndEncodeImage(img.blobPathname);
        const roleLabel = buildImageRoleLabel(img.imageType, img);
        newEncodedImages.push({ ...encoded, roleLabel });
      } catch {
        await sanityWriteClient
          .patch(sessionId)
          .set({
            status: "error",
            lastError:
              "One or more new input images could not be found.",
          })
          .commit();
        return;
      }
    }

    // 5. Build refinement prompt
    const refinementPrompt = buildRefinementPrompt(refinementText);

    // 6. Call Gemini with full conversation context
    const result = await refineRendering({
      conversationHistory,
      previousOutputBase64: previousOutput.base64,
      previousOutputMimeType: previousOutput.mimeType,
      refinementPrompt,
      newImageInputs:
        newEncodedImages.length > 0 ? newEncodedImages : undefined,
      aspectRatio: session.aspectRatio || "16:9",
    });

    // 7. Upload generated image to Vercel Blob
    const imageBuffer = Buffer.from(result.imageBase64, "base64");
    const blob = await put(
      `rendering/${sessionId}/${Date.now()}.png`,
      imageBuffer,
      { access: "public", contentType: "image/png" },
    );

    const latencyMs = Date.now() - startTime;
    const bytesStored = imageBuffer.byteLength;
    const costEstimate = 7;

    // 8. Append rendering + conversation entries
    const renderingKey = generatePortalToken(8);
    const userConvKey = generatePortalToken(8);
    const modelConvKey = generatePortalToken(8);

    // Also append new images to session.images if mid-session swap
    const patchOp = sanityWriteClient
      .patch(sessionId)
      .set({ status: "complete", lastError: "" })
      .append("renderings", [
        {
          _key: renderingKey,
          blobPathname: blob.pathname,
          prompt: refinementPrompt,
          textResponse: result.textResponse || "",
          isPromoted: false,
          generatedAt: new Date().toISOString(),
          status: "complete",
          errorMessage: "",
          modelId: result.modelId,
          latencyMs,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          costEstimate,
          bytesStored,
        },
      ])
      .append("conversation", [
        {
          _key: userConvKey,
          role: "user",
          text: refinementText,
          timestamp: new Date().toISOString(),
        },
        {
          _key: modelConvKey,
          role: "model",
          text: result.textResponse || "",
          image: blob.pathname,
          timestamp: new Date().toISOString(),
        },
      ]);

    // Append new images if mid-session swap
    if (newImages.length > 0) {
      patchOp.append(
        "images",
        newImages.map((img: ImageInput) => ({
          _key: generatePortalToken(8),
          ...img,
        })),
      );
    }

    await patchOp.commit();

    // 9. Increment usage ONLY after success
    await incrementUsage(sanityUserId, bytesStored);
  } catch (error: any) {
    console.error("[Rendering:Refine] Error:", error);

    let errorMessage =
      "Generation failed due to a server error. Tap to retry -- you will not be charged for the failed attempt.";
    if (
      error.message?.includes("content policy") ||
      error.message?.includes("SAFETY")
    ) {
      errorMessage =
        "The AI flagged a potential issue with your content or imagery. Try rephrasing your description or using different reference images.";
    } else if (error.message?.includes("no image")) {
      errorMessage =
        "The AI returned text but no image. This can happen with certain prompts. Try rephrasing your description.";
    }

    const errorKey = generatePortalToken(8);
    await sanityWriteClient
      .patch(sessionId)
      .set({ status: "error", lastError: errorMessage })
      .append("renderings", [
        {
          _key: errorKey,
          blobPathname: "",
          prompt: "",
          textResponse: "",
          isPromoted: false,
          generatedAt: new Date().toISOString(),
          status: "error",
          errorMessage,
          modelId: "",
          latencyMs: Date.now() - startTime,
          inputTokens: 0,
          outputTokens: 0,
          costEstimate: 0,
          bytesStored: 0,
        },
      ])
      .commit()
      .catch((e: any) =>
        console.error(
          "[Rendering:Refine] Failed to update error status:",
          e,
        ),
      );
    // Do NOT increment usage on failure
  }
}
