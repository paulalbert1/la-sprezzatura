export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { projectId, title, pipelineStage, engagementType, projectStatus, clientId } = body as {
    projectId: string;
    title: string;
    pipelineStage: string;
    engagementType: string;
    projectStatus: string;
    clientId: string | null;
  };

  if (!projectId || !title) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Update core fields
    await sanityWriteClient
      .patch(projectId)
      .set({
        title,
        pipelineStage,
        engagementType,
        projectStatus,
      })
      .commit();

    // Update client assignment if clientId is provided
    // Replace the primary client entry in the clients[] array
    if (clientId) {
      await sanityWriteClient
        .patch(projectId)
        .set({
          clients: [
            {
              _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
              client: { _type: "reference", _ref: clientId },
              isPrimary: true,
            },
          ],
        })
        .commit();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to update project:", err);
    return new Response(JSON.stringify({ error: "Failed to update project" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
