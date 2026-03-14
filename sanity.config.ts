import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemas";

export default defineConfig({
  name: "la-sprezzatura",
  title: "La Sprezzatura",
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            // Site Settings as singleton
            S.listItem()
              .title("Site Settings")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings"),
              ),
            S.divider(),
            // Portfolio Projects
            S.documentTypeListItem("project").title("Portfolio Projects"),
            // Services
            S.documentTypeListItem("service").title("Services"),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
