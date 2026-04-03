import type { APIRoute } from "astro";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { put } from "@vercel/blob";

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No valid file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: "File type not allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return new Response(JSON.stringify({ url: blob.url, pathname: blob.pathname }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        // Sanity Studio is authenticated via its own auth
        // Only Studio users can reach the upload component
        return {
          allowedContentTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
          ],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // No-op: blob URL is stored by the Studio component via onChange
        console.log("[BlobUpload] Upload completed:", blob.pathname);
      },
    });

    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
