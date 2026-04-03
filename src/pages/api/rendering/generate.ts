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
  generateRendering,
  fetchAndEncodeImage,
} from "../../../lib/geminiClient";
import {
  buildLuxuryPrompt,
  buildImageRoleLabel,
} from "../../../lib/promptBuilder";
import type { ImageInput } from "../../../lib/promptBuilder";
import { generatePortalToken } from "../../../lib/generateToken";

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
    const {
      sessionId: existingSessionId,
      sessionTitle,
      projectId,
      aspectRatio,
      stylePreset,
      description,
      images,
      sanityUserId,
    } = body;

    // Validate required fields
    if (!description) {
      return new Response(
        JSON.stringify({
          error: "Please describe your design vision before generating.",
          code: "MISSING_DESCRIPTION",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!existingSessionId && !sessionTitle) {
      return new Response(
        JSON.stringify({
          error: "Please give your session a descriptive name.",
          code: "MISSING_TITLE",
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

    // Step 4: Create or update session
    let sessionId: string;

    if (existingSessionId) {
      // Verify session exists
      const existing = await sanityWriteClient.fetch(
        `*[_type == "renderingSession" && _id == $sessionId][0]{ _id }`,
        { sessionId: existingSessionId },
      );
      if (!existing) {
        return new Response(
          JSON.stringify({
            error:
              "Rendering session not found. It may have been deleted.",
            code: "SESSION_NOT_FOUND",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
      await sanityWriteClient
        .patch(existingSessionId)
        .set({ status: "generating" })
        .commit();
      sessionId = existingSessionId;
    } else {
      // Create new session
      const session = await sanityWriteClient.create({
        _type: "renderingSession",
        sessionTitle,
        project: projectId
          ? { _type: "reference", _ref: projectId }
          : undefined,
        aspectRatio: aspectRatio || "16:9",
        stylePreset: stylePreset || undefined,
        description,
        images: (images || []).map((img: ImageInput) => ({
          _key: generatePortalToken(8),
          ...img,
        })),
        renderings: [],
        conversation: [],
        status: "generating",
        createdBy: sanityUserId,
        createdAt: new Date().toISOString(),
      });
      sessionId = session._id;
    }

    // Step 5: Return 202 immediately, process in background
    waitUntil(
      processGeneration(
        sessionId,
        description,
        images || [],
        aspectRatio || "16:9",
        stylePreset,
        sanityUserId!,
      ),
    );

    return new Response(
      JSON.stringify({
        status: "generating",
        sessionId,
        message:
          "Generating your rendering... This may take 15-30 seconds.",
      }),
      { status: 202, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[Rendering:Generate] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

async function processGeneration(
  sessionId: string,
  description: string,
  images: ImageInput[],
  aspectRatio: string,
  stylePreset: string | undefined,
  sanityUserId: string,
): Promise<void> {
  const startTime = Date.now();
  try {
    // 1. Validate input images exist in Blob
    const encodedImages: {
      base64: string;
      mimeType: string;
      roleLabel: string;
    }[] = [];
    for (const img of images) {
      try {
        const encoded = await fetchAndEncodeImage(img.blobPathname);
        const roleLabel = buildImageRoleLabel(img.imageType, img);
        encodedImages.push({ ...encoded, roleLabel });
      } catch (err: any) {
        // Image not found -- fail fast
        await sanityWriteClient
          .patch(sessionId)
          .set({
            status: "error",
            lastError:
              "One or more input images could not be found. Please re-upload and try again.",
          })
          .commit();
        return;
      }
    }

    // 2. Build luxury prompt
    const prompt = buildLuxuryPrompt(description, images, stylePreset);

    // 3. Call Gemini
    const result = await generateRendering({
      prompt,
      imageInputs: encodedImages,
      aspectRatio,
    });

    // 4. Upload generated image to Vercel Blob
    const imageBuffer = Buffer.from(result.imageBase64, "base64");
    const blob = await put(
      `rendering/${sessionId}/${Date.now()}.png`,
      imageBuffer,
      { access: "public", contentType: "image/png" },
    );

    const latencyMs = Date.now() - startTime;
    const bytesStored = imageBuffer.byteLength;
    const costEstimate = 7; // ~$0.07 per generation in integer cents

    // 5. Append rendering output and conversation entries to session
    const renderingKey = generatePortalToken(8);
    const userConvKey = generatePortalToken(8);
    const modelConvKey = generatePortalToken(8);

    console.log("[Rendering:Generate] Blob put OK:", blob.pathname, bytesStored, "bytes");

    const renderingObj = {
      _key: renderingKey,
      _type: "renderingOutput",
      blobPathname: blob.pathname,
      prompt,
      textResponse: result.textResponse || "",
      isPromoted: false,
      generatedAt: new Date().toISOString(),
      status: "complete" as const,
      errorMessage: "",
      modelId: result.modelId,
      latencyMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costEstimate,
      bytesStored,
    };

    console.log("[Rendering:Generate] Patching session:", sessionId, "renderingKey:", renderingKey);

    const patchResult = await sanityWriteClient
      .patch(sessionId)
      .setIfMissing({ renderings: [], conversation: [] })
      .set({ status: "complete", lastError: "" })
      .append("renderings", [renderingObj])
      .append("conversation", [
        {
          _key: userConvKey,
          _type: "conversationEntry",
          role: "user",
          text: description,
          timestamp: new Date().toISOString(),
        },
        {
          _key: modelConvKey,
          _type: "conversationEntry",
          role: "model",
          text: result.textResponse || "",
          image: blob.pathname,
          timestamp: new Date().toISOString(),
        },
      ])
      .commit();

    console.log("[Rendering:Generate] Patch OK. Renderings:", patchResult.renderings?.length, "Conv:", patchResult.conversation?.length);

    // 6. Increment usage ONLY after successful generation + upload
    // Do NOT increment usage on failure
    await incrementUsage(sanityUserId, bytesStored);
  } catch (error: any) {
    console.error("[Rendering:Generate] Error:", error);

    // Determine user-friendly error message — include raw error for debugging
    const rawError = error.message || String(error);
    console.error("[Rendering:Generate] Raw error:", rawError);
    let errorMessage =
      `Generation failed: ${rawError.substring(0, 200)}`;
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

    // Append error rendering + update session status
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
          "[Rendering:Generate] Failed to update error status:",
          e,
        ),
      );
    // Do NOT increment usage on failure
  }
}
