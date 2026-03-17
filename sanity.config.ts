import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemas";
import { NotifyClientAction } from "./src/sanity/actions/notifyClient";
import { CompleteProjectAction } from "./src/sanity/actions/completeProject";
import { ReopenProjectAction } from "./src/sanity/actions/reopenProject";
import { SendWorkOrderAccessAction } from "./src/sanity/actions/sendWorkOrderAccess";
import { SendBuildingAccessAction } from "./src/sanity/actions/sendBuildingAccess";
import { SendUpdateAction } from "./src/sanity/actions/sendUpdate";

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
            // Clients
            S.documentTypeListItem("client").title("Clients"),
            // Contractors
            S.documentTypeListItem("contractor").title("Contractors"),
            // Services
            S.documentTypeListItem("service").title("Services"),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (prev, context) => {
      if (context.schemaType === "project") {
        return [
          ...prev,
          NotifyClientAction,
          CompleteProjectAction,
          ReopenProjectAction,
          SendBuildingAccessAction,
          SendUpdateAction,
        ];
      }
      if (context.schemaType === "contractor") {
        return [...prev, SendWorkOrderAccessAction];
      }
      return prev;
    },
  },
});
