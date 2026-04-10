// Vercel Cron -- must be GET (not POST). Vercel sends GET with Authorization: Bearer <CRON_SECRET>.
export const prerender = false;

import type { APIRoute } from "astro";
import { getAdminProcurementCronData } from "../../../sanity/queries";
import {
  getTrackingResults,
  extractTrackingData,
  isShip24Configured,
} from "../../../lib/ship24";
import { getTenantClient } from "../../../lib/tenantClient";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export const GET: APIRoute = async ({ request }) => {
  // Auth check (T-32-01: CRON_SECRET Bearer token)
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Early exit if Ship24 not configured
  if (!isShip24Configured()) {
    return new Response(
      JSON.stringify({
        status: "skipped",
        reason: "SHIP24_API_KEY not configured",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // TODO: Multi-tenant cron -- iterate all tenants when platform scales
    const client = getTenantClient("lasprezzatura");

    // Query all active projects with trackable items
    const projects = await getAdminProcurementCronData(client);

    // Flatten all trackable items across projects with projectId attached
    const allItems = projects.flatMap((project) =>
      project.trackableItems.map((item) => ({
        ...item,
        projectId: project._id,
      })),
    );

    // Filter out items synced within last 12 hours (Pitfall 4: avoid redundant calls)
    const now = Date.now();
    const itemsToSync = allItems.filter((item) => {
      if (
        item.lastSyncAt &&
        now - new Date(item.lastSyncAt).getTime() < TWELVE_HOURS_MS
      ) {
        return false;
      }
      return true;
    });

    const skipped = allItems.length - itemsToSync.length;

    // Process all remaining items in parallel (Pitfall 4: avoid timeout)
    const results = await Promise.allSettled(
      itemsToSync.map(async (item) => {
        const result = await getTrackingResults(item.trackingNumber);

        // D-08: skip failed, continue others
        if (!result) {
          console.warn(
            `[tracking-sync] Failed to get tracking for ${item.trackingNumber} (item ${item._key})`,
          );
          return { synced: false };
        }

        const extractedData = extractTrackingData(result);
        const syncTimestamp = new Date().toISOString();

        // Build set object with path notation
        const setObject: Record<string, unknown> = {
          [`procurementItems[_key=="${item._key}"].carrierETA`]:
            extractedData.carrierETA,
          [`procurementItems[_key=="${item._key}"].carrierName`]:
            extractedData.carrierName,
          [`procurementItems[_key=="${item._key}"].trackingUrl`]:
            extractedData.trackingUrl,
          [`procurementItems[_key=="${item._key}"].lastSyncAt`]: syncTimestamp,
          [`procurementItems[_key=="${item._key}"].syncSource`]: "cron",
        };

        // Only update status if extracted status is non-null
        if (extractedData.status !== null) {
          setObject[`procurementItems[_key=="${item._key}"].status`] =
            extractedData.status;
        }

        await client.patch(item.projectId).set(setObject).commit();
        return { synced: true };
      }),
    );

    // Count synced vs failed
    let synced = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.synced) {
        synced++;
      } else {
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        status: "complete",
        synced,
        skipped,
        failed,
        total: allItems.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[tracking-sync] Cron job failed:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
