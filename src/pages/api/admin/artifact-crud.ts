export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { generatePortalToken } from "../../../lib/generateToken";
import { ARTIFACT_TYPES } from "../../../lib/artifactUtils";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      // FormData action: "add" -- create new artifact with first file
      const formData = await request.formData();
      const action = formData.get("action") as string;

      if (action !== "add") {
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const projectId = formData.get("projectId") as string;
      const type = formData.get("type") as string;
      const file = formData.get("file");
      const note = (formData.get("note") as string) || "";

      if (!projectId || !type) {
        return new Response(
          JSON.stringify({ error: "Missing projectId or type" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!ARTIFACT_TYPES.includes(type as any)) {
        return new Response(
          JSON.stringify({ error: "Invalid artifact type" }),
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
      const asset = await sanityWriteClient.assets.upload("file", buffer, {
        filename: file.name,
        contentType: file.type,
      });

      const artifactKey = generatePortalToken(8);
      const versionKey = generatePortalToken(8);

      // Build full artifact object with first version included (Pitfall 6)
      const artifact = {
        _key: artifactKey,
        _type: "artifact",
        artifactType: type,
        currentVersionKey: versionKey,
        versions: [
          {
            _key: versionKey,
            _type: "artifactVersion",
            file: {
              _type: "file",
              asset: { _type: "reference", _ref: asset._id },
            },
            uploadedAt: new Date().toISOString(),
            note,
          },
        ],
        decisionLog: [
          {
            _key: generatePortalToken(8),
            _type: "decisionEntry",
            action: "version-uploaded",
            timestamp: new Date().toISOString(),
          },
        ],
        notes: [],
      };

      await sanityWriteClient
        .patch(projectId)
        .setIfMissing({ artifacts: [] })
        .append("artifacts", [artifact])
        .commit();

      return new Response(
        JSON.stringify({ success: true, artifactKey, versionKey }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // JSON body action: "remove"
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { action, projectId, artifactKey } = body as {
      action: string;
      projectId: string;
      artifactKey: string;
    };

    if (action !== "remove") {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!projectId || !artifactKey) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    await sanityWriteClient
      .patch(projectId)
      .unset([`artifacts[_key=="${artifactKey}"]`])
      .commit();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to process artifact CRUD:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process artifact operation" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
