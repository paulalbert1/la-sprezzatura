export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { getTenantClient } from "../../../lib/tenantClient";

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!session.tenantId) {
    return jsonResponse({ error: "No tenant context" }, 403);
  }
  const client = getTenantClient(session.tenantId);

  // Check if request is FormData (for image uploads) or JSON
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const action = formData.get("action") as string;

    if (action !== "upload-image") {
      return jsonResponse({ error: "Invalid form action" }, 400);
    }

    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: "No file provided" }, 400);
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await client.assets.upload("image", buffer, {
        filename: file.name,
        contentType: file.type,
      });

      return jsonResponse({ success: true, assetId: asset._id });
    } catch (err) {
      console.error("Failed to upload portfolio image:", err);
      return jsonResponse({ error: "Failed to upload image" }, 500);
    }
  }

  // JSON body actions
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { action } = body as { action: string };

  try {
    if (action === "toggle") {
      const { projectId, showInPortfolio } = body as {
        projectId: string;
        showInPortfolio: boolean;
      };

      if (!projectId || typeof projectId !== "string") {
        return jsonResponse({ error: "Missing projectId" }, 400);
      }
      if (typeof showInPortfolio !== "boolean") {
        return jsonResponse({ error: "showInPortfolio must be a boolean" }, 400);
      }

      await client.patch(projectId).set({ showInPortfolio }).commit();
      return jsonResponse({ success: true });
    }

    if (action === "update") {
      const { projectId, portfolioTitle, portfolioDescription, portfolioRoomTags, imageAssetId } =
        body as {
          projectId: string;
          portfolioTitle?: string;
          portfolioDescription?: string;
          portfolioRoomTags?: string[];
          imageAssetId?: string;
        };

      if (!projectId || typeof projectId !== "string") {
        return jsonResponse({ error: "Missing projectId" }, 400);
      }

      const updates: Record<string, unknown> = {};
      if (portfolioTitle !== undefined) updates.portfolioTitle = portfolioTitle;
      if (portfolioDescription !== undefined) updates.portfolioDescription = portfolioDescription;
      if (portfolioRoomTags !== undefined) updates.portfolioRoomTags = portfolioRoomTags;
      if (imageAssetId) {
        updates.portfolioImage = {
          _type: "image",
          asset: { _type: "reference", _ref: imageAssetId },
        };
      }

      await client.patch(projectId).set(updates).commit();
      return jsonResponse({ success: true });
    }

    if (action === "reorder") {
      const { items } = body as {
        items: Array<{ _id: string; portfolioOrder: number }>;
      };

      if (!Array.isArray(items) || items.length === 0) {
        return jsonResponse({ error: "Items array is required and must not be empty" }, 400);
      }

      // Validate each item has _id (string) and portfolioOrder (number)
      for (const item of items) {
        if (!item._id || typeof item._id !== "string") {
          return jsonResponse({ error: "Each item must have a valid _id" }, 400);
        }
        if (typeof item.portfolioOrder !== "number") {
          return jsonResponse({ error: "Each item must have a numeric portfolioOrder" }, 400);
        }
      }

      const tx = client.transaction();
      items.forEach((item) =>
        tx.patch(item._id, { set: { portfolioOrder: item.portfolioOrder } }),
      );
      await tx.commit();

      return jsonResponse({ success: true });
    }

    if (action === "remove") {
      const { projectId } = body as { projectId: string };

      if (!projectId || typeof projectId !== "string") {
        return jsonResponse({ error: "Missing projectId" }, 400);
      }

      // Per D-20: set showInPortfolio to false but preserve all other portfolio fields
      await client.patch(projectId).set({ showInPortfolio: false }).commit();
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("Failed to process portfolio operation:", err);
    return jsonResponse({ error: "Failed to process portfolio operation" }, 500);
  }
};
