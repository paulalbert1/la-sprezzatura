export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";
import { generatePortalToken } from "../../../lib/generateToken";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!session.tenantId) {
    return new Response(JSON.stringify({ error: "No tenant context" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const client = getTenantClient(session.tenantId);

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      // FormData actions: "upload" or "upload-signed"
      const formData = await request.formData();
      const action = formData.get("action") as string;
      const file = formData.get("file");
      const projectId = formData.get("projectId") as string;
      const artifactKey = formData.get("artifactKey") as string;

      if (!projectId || !artifactKey) {
        return new Response(
          JSON.stringify({ error: "Missing projectId or artifactKey" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: "No valid file provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: "File too large (25MB max)" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Upload file to Sanity asset pipeline
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await client.assets.upload("file", buffer, {
        filename: file.name,
        contentType: file.type,
      });

      if (action === "upload-signed") {
        // Upload signed file for contract artifacts
        await client
          .patch(projectId)
          .set({
            [`artifacts[_key=="${artifactKey}"].signedFile`]: {
              _type: "file",
              asset: { _type: "reference", _ref: asset._id },
            },
          })
          .commit();

        return new Response(
          JSON.stringify({ success: true, assetUrl: asset.url }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // Default: action === "upload" -- add new version
      const note = (formData.get("note") as string) || "";
      const versionKey = generatePortalToken(8);

      const version = {
        _key: versionKey,
        _type: "artifactVersion",
        file: {
          _type: "file",
          asset: { _type: "reference", _ref: asset._id },
        },
        uploadedAt: new Date().toISOString(),
        note,
      };

      const logEntry = {
        _key: generatePortalToken(8),
        _type: "decisionEntry",
        action: "version-uploaded",
        timestamp: new Date().toISOString(),
      };

      await client
        .patch(projectId)
        .append(`artifacts[_key=="${artifactKey}"].versions`, [version])
        .append(`artifacts[_key=="${artifactKey}"].decisionLog`, [logEntry])
        .set({
          [`artifacts[_key=="${artifactKey}"].currentVersionKey`]: versionKey,
        })
        .commit();

      return new Response(
        JSON.stringify({ success: true, versionKey, assetUrl: asset.url }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // JSON body action: "set-current"
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { action, projectId, artifactKey, versionKey } = body as {
      action: string;
      projectId: string;
      artifactKey: string;
      versionKey: string;
    };

    if (action !== "set-current") {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!projectId || !artifactKey || !versionKey) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    await client
      .patch(projectId)
      .set({
        [`artifacts[_key=="${artifactKey}"].currentVersionKey`]: versionKey,
      })
      .commit();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to process artifact version:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process artifact version" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
