export const prerender = false;

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";
import { generatePortalToken } from "../../../lib/generateToken";

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

  const { projectId, action, itemKey, fields } = body as {
    projectId: string;
    action: string;
    itemKey?: string;
    fields?: Record<string, unknown>;
  };

  if (!projectId || !action) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (action === "add") {
      if (!fields?.name) {
        return new Response(JSON.stringify({ error: "Name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (
        fields.retailPrice !== undefined &&
        fields.retailPrice !== null &&
        !Number.isInteger(fields.retailPrice)
      ) {
        return new Response(
          JSON.stringify({ error: "retailPrice must be an integer (cents)" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (
        fields.clientCost !== undefined &&
        fields.clientCost !== null &&
        !Number.isInteger(fields.clientCost)
      ) {
        return new Response(
          JSON.stringify({ error: "clientCost must be an integer (cents)" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const item = {
        _key: generatePortalToken(8),
        name: fields.name,
        manufacturer: (fields.manufacturer as string) || "",
        status: (fields.status as string) || "not-yet-ordered",
        quantity: (fields.quantity as number) || null,
        retailPrice: (fields.retailPrice as number) || null,
        clientCost: (fields.clientCost as number) || null,
        orderDate: (fields.orderDate as string) || null,
        expectedDeliveryDate: (fields.expectedDeliveryDate as string) || null,
        installDate: (fields.installDate as string) || null,
        trackingNumber: (fields.trackingNumber as string) || "",
        trackingUrl: (fields.trackingUrl as string) || "",
        files: [],
        notes: (fields.notes as string) || "",
      };

      await sanityWriteClient
        .patch(projectId)
        .setIfMissing({ procurementItems: [] })
        .append("procurementItems", [item])
        .commit();

      return new Response(JSON.stringify({ success: true, item }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "edit") {
      if (!itemKey) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (
        fields?.retailPrice !== undefined &&
        fields.retailPrice !== null &&
        !Number.isInteger(fields.retailPrice)
      ) {
        return new Response(
          JSON.stringify({ error: "retailPrice must be an integer (cents)" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (
        fields?.clientCost !== undefined &&
        fields.clientCost !== null &&
        !Number.isInteger(fields.clientCost)
      ) {
        return new Response(
          JSON.stringify({ error: "clientCost must be an integer (cents)" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const setObj: Record<string, unknown> = {};
      if (fields) {
        for (const [fieldName, value] of Object.entries(fields)) {
          setObj[`procurementItems[_key=="${itemKey}"].${fieldName}`] = value;
        }
      }

      await sanityWriteClient.patch(projectId).set(setObj).commit();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "remove") {
      if (!itemKey) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      await sanityWriteClient
        .patch(projectId)
        .unset([`procurementItems[_key=="${itemKey}"]`])
        .commit();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to update procurement item:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update item" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
