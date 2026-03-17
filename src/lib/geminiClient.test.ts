import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @google/genai before any imports
const mockGenerateContent = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

// Mock @vercel/blob
const mockBlobGet = vi.fn();
vi.mock("@vercel/blob", () => ({
  get: mockBlobGet,
}));

// Store original env values
const originalEnv = { ...import.meta.env };

beforeEach(() => {
  vi.clearAllMocks();
  // Set required env vars for non-test-mode
  import.meta.env.GEMINI_API_KEY = "test-api-key";
  import.meta.env.RENDERING_TEST_MODE = undefined;
  import.meta.env.GEMINI_IMAGE_MODEL = undefined;
});

afterEach(() => {
  // Restore original env
  Object.assign(import.meta.env, originalEnv);
});

describe("generateRendering", () => {
  it("returns fixture data in RENDERING_TEST_MODE", async () => {
    import.meta.env.RENDERING_TEST_MODE = "true";

    const { generateRendering } = await import("./geminiClient");
    const result = await generateRendering({
      prompt: "Add a velvet sofa",
      imageInputs: [],
      aspectRatio: "16:9",
    });

    expect(result.imageBase64).toBeTruthy();
    expect(result.textResponse).toContain("TEST MODE");
    expect(result.modelId).toBe("test-mode");
    expect(result.inputTokens).toBe(0);
    expect(result.outputTokens).toBe(0);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("calls ai.models.generateContent with responseModalities ['TEXT', 'IMAGE'] and imageSize '1K'", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: "base64image", mimeType: "image/png" } },
              { text: "Here is your rendering" },
            ],
          },
        },
      ],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200 },
    });

    const { generateRendering } = await import("./geminiClient");
    await generateRendering({
      prompt: "Add a sofa",
      imageInputs: [],
      aspectRatio: "16:9",
    });

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: expect.objectContaining({
            imageSize: "1K",
          }),
        }),
      }),
    );
  });

  it("extracts base64 image from response.candidates[0].content.parts", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { text: "Generated rendering" },
              { inlineData: { data: "base64imagedata", mimeType: "image/png" } },
            ],
          },
        },
      ],
      usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 100 },
    });

    const { generateRendering } = await import("./geminiClient");
    const result = await generateRendering({
      prompt: "Add a sofa",
      imageInputs: [],
      aspectRatio: "16:9",
    });

    expect(result.imageBase64).toBe("base64imagedata");
    expect(result.textResponse).toBe("Generated rendering");
  });

  it("returns GeminiResult with correct fields", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: "img", mimeType: "image/png" } },
              { text: "Done" },
            ],
          },
        },
      ],
      usageMetadata: { promptTokenCount: 150, candidatesTokenCount: 250 },
    });

    const { generateRendering } = await import("./geminiClient");
    const result = await generateRendering({
      prompt: "Test",
      imageInputs: [],
      aspectRatio: "1:1",
    });

    expect(result).toEqual(
      expect.objectContaining({
        imageBase64: "img",
        textResponse: "Done",
        inputTokens: 150,
        outputTokens: 250,
      }),
    );
  });

  it("throws descriptive error when no image part in response", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [{ text: "I cannot generate that image" }],
          },
        },
      ],
      usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 10 },
    });

    const { generateRendering } = await import("./geminiClient");
    await expect(
      generateRendering({
        prompt: "Test",
        imageInputs: [],
        aspectRatio: "16:9",
      }),
    ).rejects.toThrow("text but no image");
  });

  it("throws descriptive error when response.candidates is empty", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [],
      usageMetadata: {},
    });

    const { generateRendering } = await import("./geminiClient");
    await expect(
      generateRendering({
        prompt: "Test",
        imageInputs: [],
        aspectRatio: "16:9",
      }),
    ).rejects.toThrow("did not return a response");
  });

  it("throws descriptive error when response.candidates is null", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: null,
      usageMetadata: {},
    });

    const { generateRendering } = await import("./geminiClient");
    await expect(
      generateRendering({
        prompt: "Test",
        imageInputs: [],
        aspectRatio: "16:9",
      }),
    ).rejects.toThrow("did not return a response");
  });

  it("builds contents array with LUXURY_PERSONA_PROMPT first, then image parts, then prompt", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: "img", mimeType: "image/png" } },
            ],
          },
        },
      ],
      usageMetadata: {},
    });

    const { generateRendering } = await import("./geminiClient");
    await generateRendering({
      prompt: "Add a sofa",
      imageInputs: [
        { base64: "imgdata", mimeType: "image/jpeg", roleLabel: "FURNITURE REFERENCE: Replicate exactly." },
      ],
      aspectRatio: "16:9",
    });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const parts = callArgs.contents[0].parts;

    // First part should be LUXURY_PERSONA_PROMPT
    expect(parts[0].text).toContain("luxury interior design");
    // Then image data
    expect(parts[1].inlineData).toBeDefined();
    // Then role label
    expect(parts[2].text).toContain("FURNITURE REFERENCE");
    // Last part should be the prompt
    expect(parts[parts.length - 1].text).toBe("Add a sofa");
  });

  it("skips parts with thought property when extracting text", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { thought: true, text: "thinking about this..." },
              { inlineData: { data: "img", mimeType: "image/png" } },
              { text: "Here is the result" },
            ],
          },
        },
      ],
      usageMetadata: {},
    });

    const { generateRendering } = await import("./geminiClient");
    const result = await generateRendering({
      prompt: "Test",
      imageInputs: [],
      aspectRatio: "16:9",
    });

    expect(result.textResponse).toBe("Here is the result");
    expect(result.textResponse).not.toContain("thinking about this");
  });
});

describe("refineRendering", () => {
  it("reconstructs conversation history as contents array", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: "refinedimg", mimeType: "image/png" } },
              { text: "Made it darker" },
            ],
          },
        },
      ],
      usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 300 },
    });

    const { refineRendering } = await import("./geminiClient");
    const result = await refineRendering({
      conversationHistory: [
        { role: "user", text: "Original prompt text" },
      ],
      previousOutputBase64: "previmg",
      previousOutputMimeType: "image/png",
      refinementPrompt: "make the sofa darker",
      aspectRatio: "16:9",
    });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const contents = callArgs.contents;

    // Should have 3 turns: original user, model response, new refinement
    expect(contents.length).toBe(3);
    expect(contents[0].role).toBe("user");
    expect(contents[1].role).toBe("model");
    expect(contents[2].role).toBe("user");
    expect(result.imageBase64).toBe("refinedimg");
  });

  it("includes previous output image as inlineData in model turn", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: "newimg", mimeType: "image/png" } },
            ],
          },
        },
      ],
      usageMetadata: {},
    });

    const { refineRendering } = await import("./geminiClient");
    await refineRendering({
      conversationHistory: [{ role: "user", text: "Original" }],
      previousOutputBase64: "previmgbase64",
      previousOutputMimeType: "image/png",
      refinementPrompt: "change color",
      aspectRatio: "16:9",
    });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const modelTurn = callArgs.contents[1];
    const hasInlineData = modelTurn.parts.some(
      (p: Record<string, unknown>) => p.inlineData,
    );
    expect(hasInlineData).toBe(true);
  });

  it("uses buildRefinementPrompt for refinement text wrapping", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: "img", mimeType: "image/png" } },
            ],
          },
        },
      ],
      usageMetadata: {},
    });

    const { refineRendering } = await import("./geminiClient");
    await refineRendering({
      conversationHistory: [{ role: "user", text: "Original" }],
      previousOutputBase64: "prev",
      previousOutputMimeType: "image/png",
      refinementPrompt: "make it warmer",
      aspectRatio: "16:9",
    });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const refineTurn = callArgs.contents[2];
    const refinementText = refineTurn.parts.find(
      (p: Record<string, unknown>) => typeof p.text === "string",
    );
    expect(refinementText.text).toContain("make it warmer");
    expect(refinementText.text).toContain("unchanged elements");
  });

  it("returns fixture data in RENDERING_TEST_MODE", async () => {
    import.meta.env.RENDERING_TEST_MODE = "true";

    const { refineRendering } = await import("./geminiClient");
    const result = await refineRendering({
      conversationHistory: [],
      previousOutputBase64: "prev",
      previousOutputMimeType: "image/png",
      refinementPrompt: "test",
      aspectRatio: "16:9",
    });

    expect(result.modelId).toBe("test-mode");
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});

describe("fetchAndEncodeImage", () => {
  it("fetches blob pathname and returns base64 + mimeType", async () => {
    const mockArrayBuffer = new Uint8Array([137, 80, 78, 71]).buffer;
    mockBlobGet.mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      contentType: "image/png",
    });

    const { fetchAndEncodeImage } = await import("./geminiClient");
    const result = await fetchAndEncodeImage("test/image.png");

    expect(result.base64).toBeTruthy();
    expect(result.mimeType).toBe("image/png");
    expect(mockBlobGet).toHaveBeenCalledWith("test/image.png");
  });

  it("throws when blob get returns null", async () => {
    mockBlobGet.mockResolvedValueOnce(null);

    const { fetchAndEncodeImage } = await import("./geminiClient");
    await expect(fetchAndEncodeImage("missing.png")).rejects.toThrow(
      "Image not found",
    );
  });
});
