import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2024-10-01",
  useCdn: false,
});

const rows = await client.fetch(
  `*[_type == "project"]| order(title asc){ _id, title, pipelineStage, projectStatus, archivedAt }`,
);
for (const r of rows) {
  console.log(
    `${(r.projectStatus || "-").padEnd(10)} ${(r.pipelineStage || "-").padEnd(20)} ${r.archivedAt ? "[archived]" : "           "} ${r._id.padEnd(32)} ${r.title}`,
  );
}
