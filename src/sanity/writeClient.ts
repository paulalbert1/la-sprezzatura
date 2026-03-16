import { createClient } from "@sanity/client";

export const sanityWriteClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-12-15",
  useCdn: false,
  token: import.meta.env.SANITY_WRITE_TOKEN,
});
