/**
 * Gemini API client wrapper for AI image generation and multi-turn refinement.
 *
 * Wraps the @google/genai SDK to handle:
 * - Initial rendering generation with structured luxury prompts
 * - Multi-turn conversational refinement
 * - Response parsing and image extraction
 * - Test mode with fixture data for preview deploys
 */

import { GoogleGenAI } from "@google/genai";
import { get } from "@vercel/blob";
import { LUXURY_PERSONA_PROMPT, buildRefinementPrompt } from "./promptBuilder";

export interface GeminiResult {
  imageBase64: string;
  textResponse?: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
}

export interface ConversationEntry {
  role: "user" | "model";
  text?: string;
  image?: string; // Blob pathname
}

/** 1x1 red PNG pixel for test mode */
const TEST_MODE_IMAGE =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

function getTestModeResult(): GeminiResult {
  return {
    imageBase64: TEST_MODE_IMAGE,
    textResponse: "TEST MODE: This is a placeholder rendering.",
    modelId: "test-mode",
    inputTokens: 0,
    outputTokens: 0,
  };
}

/**
 * Extract image and text from Gemini response parts.
 * Skips parts with `thought` property (thinking model artifacts).
 */
function extractFromResponse(response: {
  candidates?: Array<{
    content: {
      parts: Array<Record<string, unknown>>;
    };
  }> | null;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}): { imageBase64: string; textResponse?: string; inputTokens: number; outputTokens: number } {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error(
      "The AI did not return a response. This may be a content policy issue. Try different reference images.",
    );
  }

  const parts = response.candidates[0]?.content?.parts || [];

  let imageBase64: string | undefined;
  let textResponse: string | undefined;

  for (const part of parts) {
    if (part.thought) continue;

    if (part.inlineData && !imageBase64) {
      const data = part.inlineData as { data: string; mimeType: string };
      imageBase64 = data.data;
    }

    if (typeof part.text === "string" && !textResponse) {
      textResponse = part.text as string;
    }
  }

  if (!imageBase64) {
    throw new Error(
      "The AI returned text but no image. This can happen with certain prompts. Try rephrasing your description.",
    );
  }

  return {
    imageBase64,
    textResponse,
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
  };
}

/**
 * Fetch a Blob by pathname and encode it as base64.
 */
export async function fetchAndEncodeImage(
  blobPathname: string,
): Promise<{ base64: string; mimeType: string }> {
  console.log("[fetchAndEncodeImage] Fetching:", blobPathname);
  const result = await get(blobPathname, { access: "private" });
  if (!result) {
    throw new Error(`Image not found: ${blobPathname}`);
  }

  if (!result.stream) {
    throw new Error(`Image stream empty: ${blobPathname} (status: ${result.statusCode})`);
  }
  const chunks: Uint8Array[] = [];
  const reader = result.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const buffer = Buffer.concat(chunks);
  const base64 = buffer.toString("base64");
  console.log("[fetchAndEncodeImage] OK:", blobPathname, buffer.length, "bytes");

  return {
    base64,
    mimeType: result.blob.contentType || "image/png",
  };
}

/**
 * Generate a rendering using Gemini with the structured luxury prompt.
 *
 * Builds a single-turn prompt with:
 * 1. LUXURY_PERSONA_PROMPT system instruction
 * 2. Image parts with role labels
 * 3. Assembled structured prompt text
 */
export async function generateRendering(params: {
  prompt: string;
  imageInputs: { base64: string; mimeType: string; roleLabel: string }[];
  aspectRatio: string;
  modelId?: string;
}): Promise<GeminiResult> {
  // Test mode: return fixture data without calling Gemini
  if (import.meta.env.RENDERING_TEST_MODE === "true") {
    return getTestModeResult();
  }

  const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });

  // Build parts array: persona first, then images with labels, then prompt
  const parts: Record<string, unknown>[] = [
    { text: LUXURY_PERSONA_PROMPT },
  ];

  for (const imageInput of params.imageInputs) {
    parts.push({
      inlineData: { mimeType: imageInput.mimeType, data: imageInput.base64 },
    });
    parts.push({ text: imageInput.roleLabel });
  }

  parts.push({ text: params.prompt });

  const modelId =
    params.modelId ||
    import.meta.env.GEMINI_IMAGE_MODEL ||
    "gemini-3.1-flash-image-preview";

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { imageSize: "1K", aspectRatio: params.aspectRatio },
    },
  });

  const extracted = extractFromResponse(response);

  return {
    ...extracted,
    modelId,
  };
}

/**
 * Refine a rendering by reconstructing the conversation history
 * and adding a new refinement turn.
 *
 * Multi-turn format:
 * 1. Original user turn (prompt + images)
 * 2. Model response turn (previous output image + text)
 * 3. New user turn (refinement prompt + optional new images)
 */
export async function refineRendering(params: {
  conversationHistory: ConversationEntry[];
  previousOutputBase64: string;
  previousOutputMimeType: string;
  refinementPrompt: string;
  newImageInputs?: { base64: string; mimeType: string; roleLabel: string }[];
  aspectRatio: string;
  modelId?: string;
}): Promise<GeminiResult> {
  // Test mode: return fixture data without calling Gemini
  if (import.meta.env.RENDERING_TEST_MODE === "true") {
    return getTestModeResult();
  }

  const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });

  const modelId =
    params.modelId ||
    import.meta.env.GEMINI_IMAGE_MODEL ||
    "gemini-3.1-flash-image-preview";

  // Reconstruct conversation as contents array
  const contents: Array<{
    role: string;
    parts: Record<string, unknown>[];
  }> = [];

  // Original user turn(s) from history
  for (const entry of params.conversationHistory) {
    if (entry.role === "user") {
      const parts: Record<string, unknown>[] = [];
      if (entry.text) parts.push({ text: entry.text });
      contents.push({ role: "user", parts });
    }
  }

  // Model response turn with previous output image
  const modelParts: Record<string, unknown>[] = [
    {
      inlineData: {
        mimeType: params.previousOutputMimeType,
        data: params.previousOutputBase64,
      },
    },
  ];
  // Include any model text from history
  const modelEntry = params.conversationHistory.find(
    (e) => e.role === "model",
  );
  if (modelEntry?.text) {
    modelParts.push({ text: modelEntry.text });
  }
  contents.push({ role: "model", parts: modelParts });

  // New refinement user turn
  const refineParts: Record<string, unknown>[] = [];
  if (params.newImageInputs) {
    for (const img of params.newImageInputs) {
      refineParts.push({
        inlineData: { mimeType: img.mimeType, data: img.base64 },
      });
      refineParts.push({ text: img.roleLabel });
    }
  }
  refineParts.push({ text: buildRefinementPrompt(params.refinementPrompt) });
  contents.push({ role: "user", parts: refineParts });

  const response = await ai.models.generateContent({
    model: modelId,
    contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { imageSize: "1K", aspectRatio: params.aspectRatio },
    },
  });

  const extracted = extractFromResponse(response);

  return {
    ...extracted,
    modelId,
  };
}
