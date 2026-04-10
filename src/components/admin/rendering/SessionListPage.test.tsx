import { describe, it } from "vitest";
// RNDR-01: Session list with all-tenant sessions + project filter
describe("SessionListPage (admin)", () => {
  it.todo("renders a list of sessions passed as props (not filtered by createdBy)");
  it.todo("project filter dropdown changes the visible sessions");
  it.todo("Mine filter chip filters to sessions where createdBy === sanityUserId prop");
  it.todo("each row shows thumbnail, title, project name, 'by X' ownership stamp, count, created-at");
  it.todo("empty state shows heading 'No rendering sessions yet' when sessions array is empty");
  it.todo("empty-after-mine state shows 'No sessions by you' with Show all text button");
});
