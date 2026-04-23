// @vitest-environment jsdom
// Phase 43 Plan 01 Task 3 — TradeChecklist RED test scaffold.
//
// Covers TRAD-06 (checklist UI on Trades detail page).
// Source of truth:
//   .planning/phases/43-document-checklists-settings-config-and-completeness/43-01-PLAN.md § Task 3
//   .planning/phases/43-document-checklists-settings-config-and-completeness/43-UI-SPEC.md § Copywriting Contract
//
// These tests intentionally FAIL (RED) — the TradeChecklist component does not
// exist yet. Plan 02 drives them to GREEN.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
// Plan 02 Task 1 — component now exists; directive removed.
import TradeChecklist from "./TradeChecklist";

interface DocEntry {
  _key: string;
  fileName: string;
  fileType: string;
  url: string;
  uploadedAt: string;
  docType?: string;
}

function makeDoc(over: Partial<DocEntry> = {}): DocEntry {
  return {
    _key: "k1",
    fileName: "file.pdf",
    fileType: "application/pdf",
    url: "https://example.com/file.pdf",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    docType: undefined,
    ...over,
  };
}

afterEach(cleanup);
beforeEach(() => {
  vi.restoreAllMocks();
});

describe("TradeChecklist — partition + row rendering (TRAD-06)", () => {
  it("renders one row per checklist item with an Upload button when missing", () => {
    const items = [
      "W-9",
      "Certificate of insurance",
      "Trade license",
      "1099",
    ];
    const { container } = render(
      <TradeChecklist
        contractorId="c1"
        checklistItems={items}
        initialDocuments={[]}
      />,
    );
    for (const label of items) {
      expect(container.textContent).toContain(label);
    }
    const uploadButtons = Array.from(container.querySelectorAll("button")).filter(
      (b) => /upload/i.test(b.textContent || ""),
    );
    expect(uploadButtons.length).toBeGreaterThanOrEqual(items.length);
  });

  it("renders uploaded row with filename + View link + delete button when docType matches a checklist item", () => {
    const doc = makeDoc({
      _key: "k1",
      fileName: "w9.pdf",
      url: "https://cdn/w9.pdf",
      docType: "W-9",
    });
    const { container } = render(
      <TradeChecklist
        contractorId="c1"
        checklistItems={["W-9"]}
        initialDocuments={[doc]}
      />,
    );
    expect(container.textContent).toContain("w9.pdf");
    const viewLinks = Array.from(container.querySelectorAll("a")).filter(
      (a) => /view/i.test(a.textContent || ""),
    );
    expect(viewLinks.length).toBeGreaterThanOrEqual(1);
    // Delete button exists (Lucide Trash2 icon inside a button)
    const deleteButtons = Array.from(
      container.querySelectorAll("button"),
    ).filter((b) => b.querySelector("svg"));
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders non-matching documents in an 'Other documents' section", () => {
    const legacy = makeDoc({
      _key: "kx",
      fileName: "old-insurance.pdf",
      url: "https://cdn/old.pdf",
      docType: "insurance", // legacy slug — no match
    });
    const { container } = render(
      <TradeChecklist
        contractorId="c1"
        checklistItems={["W-9"]}
        initialDocuments={[legacy]}
      />,
    );
    expect(container.textContent?.toLowerCase()).toContain("other documents");
    expect(container.textContent).toContain("old-insurance.pdf");
  });

  it("upload sends upload-doc action with docType set to the checklist item label (D-06)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        document: {
          _key: "new",
          fileName: "license.pdf",
          fileType: "application/pdf",
          url: "https://cdn/license.pdf",
          uploadedAt: "2026-01-02",
          docType: "Trade license",
        },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { container } = render(
      <TradeChecklist
        contractorId="c1"
        checklistItems={["Trade license"]}
        initialDocuments={[]}
      />,
    );

    // Find the Upload button for Trade license row and click it
    const uploadBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => /upload/i.test(b.textContent || ""),
    );
    expect(uploadBtn).toBeTruthy();
    fireEvent.click(uploadBtn!);

    // Attach a file
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(fileInput).toBeTruthy();

    const file = new File(["pdf-bytes"], "license.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(fileInput!, "files", {
      value: [file],
      configurable: true,
    });
    fireEvent.change(fileInput!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [, init] = fetchMock.mock.calls[0];
    const body = (init as RequestInit).body as FormData;
    expect(body.get("action")).toBe("upload-doc");
    expect(body.get("docType")).toBe("Trade license");
  });

  it("when multiple documents match the same item, first wins and extras go to Other documents (D-03)", () => {
    const first = makeDoc({
      _key: "k1",
      fileName: "w9-current.pdf",
      docType: "W-9",
    });
    const second = makeDoc({
      _key: "k2",
      fileName: "w9-old.pdf",
      docType: "W-9",
    });
    const { container } = render(
      <TradeChecklist
        contractorId="c1"
        checklistItems={["W-9"]}
        initialDocuments={[first, second]}
      />,
    );
    expect(container.textContent).toContain("w9-current.pdf");
    expect(container.textContent).toContain("w9-old.pdf");
    expect(container.textContent?.toLowerCase()).toContain("other documents");
  });
});
