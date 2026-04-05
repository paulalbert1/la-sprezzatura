import type { DefaultDocumentNodeResolver } from "sanity/structure";
import { GanttScheduleView } from "./components/gantt/GanttScheduleView";

export const getDefaultDocumentNode: DefaultDocumentNodeResolver = (
  S,
  { schemaType },
) => {
  if (schemaType === "project") {
    return S.document().views([
      S.view.form(),
      S.view.component(GanttScheduleView).title("Timeline"),
    ]);
  }
  return S.document().views([S.view.form()]);
};
