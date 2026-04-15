#!/usr/bin/env node
// scripts/migrations/37-migrate-item-image-to-images.mjs
//
// Phase 37 Plan 02 -- one-off Sanity migration.
//
// For every project with procurementItems[]:
//   - If an item has legacy `itemImage.asset._ref`, lift it into `images[0]`
//     with isPrimary=true and caption=null, then unset `itemImage`.
//   - D-16: unset any stored `clientCost` / `retailPrice` fields on every item
//     (the schema no longer declares them; this scrubs residual data).
//
// Idempotency:
//   - If `images[]` is already non-empty, skip the image migration for that
//     item (but still perform the destructive price-strip so re-running on
//     half-migrated data completes correctly).
//   - Items with neither legacy image nor price fields produce zero writes.
//
// Usage:
//   SANITY_WRITE_TOKEN=... PUBLIC_SANITY_PROJECT_ID=... \
//     node scripts/migrations/37-migrate-item-image-to-images.mjs [--dry-run]
//
// Exported API (for tests):
//   runMigration({ client, dryRun?: boolean, logger?: Console }) -> tally
//   migrate (alias of runMigration)

import { createClient } from "@sanity/client";
import { randomBytes } from "node:crypto";

const FETCH_QUERY =
  '*[_type == "project" && (count(procurementItems[defined(itemImage)]) > 0 || count(procurementItems[defined(clientCost) || defined(retailPrice)]) > 0)]{ _id, _rev, procurementItems[]{ _key, _type, itemImage, images, clientCost, retailPrice } }';

function newKey() {
  return randomBytes(6).toString("hex");
}

export async function runMigration({
  client,
  dryRun = false,
  logger = console,
} = {}) {
  if (!client) {
    throw new Error("runMigration: `client` is required");
  }

  const tally = {
    projectsScanned: 0,
    projectsPatched: 0,
    itemsPatched: 0,
    itemsSkipped: 0,
    priceFieldsUnset: 0,
    errors: [],
    // Aliases consumed by documented callers / tests.
    get itemsMigrated() {
      return this.itemsPatched;
    },
    get migrated() {
      return this.itemsPatched;
    },
  };

  let projects;
  try {
    projects = await client.fetch(FETCH_QUERY);
  } catch (err) {
    tally.errors.push({ phase: "fetch", error: String(err?.message || err) });
    return tally;
  }

  if (!Array.isArray(projects)) {
    projects = [];
  }

  tally.projectsScanned = projects.length;

  for (const project of projects) {
    const items = Array.isArray(project?.procurementItems)
      ? project.procurementItems
      : [];

    // Decide what this project needs.
    const imageTargets = []; // { idx, assetRef }
    const priceUnsetPaths = []; // string[]
    const itemsUnsetPaths = []; // string[] (itemImage)

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx] || {};

      const legacyRef = item?.itemImage?.asset?._ref;
      const alreadyHasImages = Array.isArray(item?.images) && item.images.length > 0;

      if (legacyRef) {
        if (alreadyHasImages) {
          // Idempotency: don't duplicate. Skip image migration for this item
          // but still unset the legacy itemImage field so it doesn't linger.
          tally.itemsSkipped += 1;
          itemsUnsetPaths.push(`procurementItems[${idx}].itemImage`);
        } else {
          imageTargets.push({ idx, assetRef: legacyRef });
          itemsUnsetPaths.push(`procurementItems[${idx}].itemImage`);
          tally.itemsPatched += 1;
        }
      }

      const hasClientCost = item?.clientCost !== undefined && item?.clientCost !== null;
      const hasRetailPrice = item?.retailPrice !== undefined && item?.retailPrice !== null;

      if (hasClientCost) {
        priceUnsetPaths.push(`procurementItems[${idx}].clientCost`);
      }
      if (hasRetailPrice) {
        priceUnsetPaths.push(`procurementItems[${idx}].retailPrice`);
      }
      if (hasClientCost || hasRetailPrice) {
        tally.priceFieldsUnset += 1;
      }
    }

    const nothingToDo =
      imageTargets.length === 0 &&
      priceUnsetPaths.length === 0 &&
      itemsUnsetPaths.length === 0;

    if (nothingToDo) {
      continue;
    }

    try {
      let patch = client.patch(project._id);

      // Lift legacy itemImage -> images[0] for each target item.
      for (const { idx, assetRef } of imageTargets) {
        const imagesPath = `procurementItems[${idx}].images`;
        patch = patch.setIfMissing({ [imagesPath]: [] });
        patch = patch.append(imagesPath, [
          {
            _key: newKey(),
            _type: "image",
            asset: { _type: "reference", _ref: assetRef },
            isPrimary: true,
            caption: null,
          },
        ]);
      }

      // Unset legacy itemImage + stored price fields in a single call.
      const allUnsets = [...itemsUnsetPaths, ...priceUnsetPaths];
      if (allUnsets.length > 0) {
        patch = patch.unset(allUnsets);
      }

      if (dryRun) {
        logger?.info?.(
          `[dry-run] would patch ${project._id}: +${imageTargets.length} image(s), unset ${allUnsets.length} field(s)`,
        );
      } else {
        await patch.commit();
        logger?.info?.(
          `patched ${project._id}: +${imageTargets.length} image(s), unset ${allUnsets.length} field(s)`,
        );
      }

      tally.projectsPatched += 1;
    } catch (err) {
      tally.errors.push({
        projectId: project._id,
        phase: "patch",
        error: String(err?.message || err),
      });
      logger?.error?.(`error patching ${project._id}:`, err);
    }
  }

  return tally;
}

// Alias for documented API.
export const migrate = runMigration;

// ---- Direct invocation -----------------------------------------------------

function isDirectRun() {
  try {
    const entry = process.argv[1];
    if (!entry) return false;
    return (
      import.meta.url === `file://${entry}` ||
      import.meta.url.endsWith(entry.split("/").pop())
    );
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  const dryRun = process.argv.includes("--dry-run");

  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_WRITE_TOKEN;

  if (!projectId) {
    console.error("missing PUBLIC_SANITY_PROJECT_ID env var");
    process.exit(1);
  }
  if (!token) {
    console.error("missing SANITY_WRITE_TOKEN env var");
    process.exit(1);
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2025-12-15",
    useCdn: false,
    token,
  });

  console.log(
    `running migration (dryRun=${dryRun}) projectId=${projectId} dataset=${dataset}`,
  );

  runMigration({ client, dryRun })
    .then((tally) => {
      console.log("tally:", JSON.stringify(tally, null, 2));
      if (tally.errors.length > 0) {
        process.exit(2);
      }
    })
    .catch((err) => {
      console.error("migration failed:", err);
      process.exit(1);
    });
}
