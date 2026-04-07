export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { PROCUREMENT_STAGES } from "../../../lib/procurementStages";

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

  const { projectId, itemKey, status } = body as {
    projectId: string;
    itemKey: string;
    status: string;
  };

  if (!projectId || !itemKey || !status) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!PROCUREMENT_STAGES.some((s) => s.value === status)) {
    return new Response(JSON.stringify({ error: "Invalid status" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await sanityWriteClient
      .patch(projectId)
      .set({
        [`procurementItems[_key=="${itemKey}"].status`]: status,
      })
      .commit();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to update procurement status:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update status" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
