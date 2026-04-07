export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { put, del } from "@vercel/blob";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { generatePortalToken } from "../../../lib/generateToken";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = formData.get("projectId") as string;
    const itemKey = formData.get("itemKey") as string;

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: "No valid file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "File type not allowed" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Generate a unique key for the file reference
    const fileKey = generatePortalToken(8);

    // Append file reference to the Sanity procurement item's files array
    await sanityWriteClient
      .patch(projectId)
      .setIfMissing({
        [`procurementItems[_key=="${itemKey}"].files`]: [],
      })
      .append(`procurementItems[_key=="${itemKey}"].files`, [
        {
          _key: fileKey,
          label: "",
          file: blob.url,
        },
      ])
      .commit();

    return new Response(
      JSON.stringify({ url: blob.url, pathname: blob.pathname, fileKey }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Failed to upload procurement file:", err);
    return new Response(
      JSON.stringify({ error: "Failed to upload file" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { projectId, itemKey, fileKey, blobUrl } = (await request.json()) as {
      projectId: string;
      itemKey: string;
      fileKey: string;
      blobUrl: string;
    };

    // Delete blob first (recoverable if Sanity update fails)
    await del(blobUrl);

    // Remove file reference from Sanity document
    await sanityWriteClient
      .patch(projectId)
      .unset([
        `procurementItems[_key=="${itemKey}"].files[_key=="${fileKey}"]`,
      ])
      .commit();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to delete procurement file:", err);
    return new Response(
      JSON.stringify({ error: "Failed to delete file" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
