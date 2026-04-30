// @vitest-environment jsdom
// Phase 39 Plan 02 Task 2 — DocumentsPanel tests.
//
// Covers DOCS-01 (panel renders), DOCS-03 (list + filter + preview + delete).
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-02-PLAN.md § Task 2
//   .planning/phases/39-work-order-documents-panels/39-UI-SPEC.md § Surface 6

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import DocumentsPanel, { type ProjectDocument } from "./DocumentsPanel";

afterEach(cleanup);
beforeEach(() => {
  vi.restoreAllMocks();
});

function makeDoc(over: Partial<ProjectDocument> = {}): ProjectDocument {
  return {
    _key: "k1",
    label: "DesignAgreement.pdf",
    category: "Contracts",
    uploadedAt: "2026-03-18T12:00:00.000Z",
    uploadedByName: "Elizabeth",
    url: "https://cdn.sanity.io/files/p/d/k1.pdf",
    size: 340 * 1024,
    originalFilename: "DesignAgreement.pdf",
    mimeType: "application/pdf",
    ...over,
  };
}

describe("DocumentsPanel — header + upload CTA (DOCS-01)", () => {
  it("renders the 'Documents' header and '+ Upload' CTA", () => {
    const { container } = render(
      <DocumentsPanel projectId="P1" initialDocuments={[]} />,
    );
    expect(container.textContent).toContain("Documents");
    const uploadBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => /upload/i.test(b.textContent || ""),
    );
    expect(uploadBtn, "+ Upload button must exist").not.toBeUndefined();
  });
});

describe("DocumentsPanel — filter tabs", () => {
  it("renders 5 filter tabs (All + 4 categories); All is active by default", () => {
    const { container } = render(
      <DocumentsPanel projectId="P1" initialDocuments={[]} />,
    );
    const tabs = Array.from(
      container.querySelectorAll('[data-tab]'),
    ) as HTMLElement[];
    expect(tabs.length).toBe(5);
    const labels = tabs.map((t) => t.textContent?.trim());
    // Singular labels per operator preference (display map; schema enum
    // remains plural for back-compat).
    expect(labels).toEqual([
      "All",
      "Contract",
      "Drawing",
      "Selection",
      "Presentation",
    ]);
    const active = tabs.find((t) => t.getAttribute("data-active") === "true");
    expect(active?.getAttribute("data-tab")).toBe("all");
  });

  it("filters rows to the active category when a tab is clicked", () => {
    const docs: ProjectDocument[] = [
      makeDoc({ _key: "a", label: "Contract-A.pdf", category: "Contracts" }),
      makeDoc({
        _key: "b",
        label: "Drawing-B.pdf",
        category: "Drawings",
        originalFilename: "Drawing-B.pdf",
      }),
      makeDoc({
        _key: "c",
        label: "Drawing-C.jpg",
        category: "Drawings",
        originalFilename: "Drawing-C.jpg",
        mimeType: "image/jpeg",
      }),
    ];
    const { container } = render(
      <DocumentsPanel projectId="P1" initialDocuments={docs} />,
    );
    // Initially 3 rows visible.
    expect(container.querySelectorAll('[data-doc-row]').length).toBe(3);

    const drawingsTab = Array.from(
      container.querySelectorAll('[data-tab]'),
    ).find((t) => t.getAttribute("data-tab") === "Drawings") as HTMLElement;
    fireEvent.click(drawingsTab);
    expect(container.querySelectorAll('[data-doc-row]').length).toBe(2);
  });
});

describe("DocumentsPanel — row rendering (DOCS-03)", () => {
  it("renders PDF / JPG / PNG badges based on mimeType + originalFilename", () => {
    const docs: ProjectDocument[] = [
      makeDoc({ _key: "a", mimeType: "application/pdf", originalFilename: "x.pdf" }),
      makeDoc({
        _key: "b",
        mimeType: "image/jpeg",
        originalFilename: "y.jpg",
        category: "Drawings",
      }),
      makeDoc({
        _key: "c",
        mimeType: "image/png",
        originalFilename: "z.png",
        category: "Drawings",
      }),
    ];
    const { container } = render(
      <DocumentsPanel projectId="P1" initialDocuments={docs} />,
    );
    const badges = Array.from(container.querySelectorAll('[data-file-badge]'));
    const texts = badges.map((b) => b.textContent?.trim());
    expect(texts).toContain("PDF");
    expect(texts).toContain("JPG");
    expect(texts).toContain("PNG");
  });

  it("wraps filename in an <a target=\"_blank\" rel=\"noopener noreferrer\"> pointing at doc.url", () => {
    const docs = [makeDoc({ _key: "a" })];
    const { container } = render(
      <DocumentsPanel projectId="P1" initialDocuments={docs} />,
    );
    const a = container.querySelector("a[data-doc-link]") as HTMLAnchorElement | null;
    expect(a).not.toBeNull();
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(a?.getAttribute("href")).toBe("https://cdn.sanity.io/files/p/d/k1.pdf");
  });
});

describe("DocumentsPanel — upload host", () => {
  it("clicking '+ Upload' opens the UploadDocumentModal", () => {
    const { container } = render(
      <DocumentsPanel projectId="P1" initialDocuments={[]} />,
    );
    // Closed by default — no dialog rendered.
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    const uploadBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => /upload/i.test(b.textContent || ""),
    ) as HTMLButtonElement;
    fireEvent.click(uploadBtn);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe("DocumentsPanel — delete flow (DOCS-03)", () => {
  it("clicking trash opens DeleteConfirmDialog bound to the row label", () => {
    const docs = [makeDoc({ _key: "a", label: "Gramercy-Contract.pdf" })];
    const { container } = render(
      <DocumentsPanel projectId="P1" initialDocuments={docs} />,
    );
    const trashBtn = container.querySelector(
      'button[data-delete-row="a"]',
    ) as HTMLButtonElement | null;
    expect(trashBtn).not.toBeNull();
    fireEvent.click(trashBtn as HTMLButtonElement);
    expect(container.textContent).toContain("Gramercy-Contract.pdf");
    expect(container.textContent).toContain("Delete Document");
  });

  it("confirming delete DELETEs the endpoint and removes the row optimistically", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = fetchMock as typeof fetch;
    const docs = [
      makeDoc({ _key: "a", label: "Contract-A.pdf" }),
      makeDoc({ _key: "b", label: "Contract-B.pdf" }),
    ];
    const { container } = render(
      <DocumentsPanel projectId="P1" initialDocuments={docs} />,
    );
    expect(container.querySelectorAll('[data-doc-row]').length).toBe(2);

    const trash = container.querySelector(
      'button[data-delete-row="a"]',
    ) as HTMLButtonElement;
    fireEvent.click(trash);
    // Confirm button in DeleteConfirmDialog — match by text.
    const confirmBtn = Array.from(
      container.querySelectorAll("button"),
    ).find((b) => /^delete$/i.test((b.textContent || "").trim())) as HTMLButtonElement;
    expect(confirmBtn).toBeTruthy();
    fireEvent.click(confirmBtn);
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/projects/P1/documents/a");
    expect(init.method).toBe("DELETE");
    expect(container.querySelectorAll('[data-doc-row]').length).toBe(1);
  });
});

describe("DocumentsPanel — empty state", () => {
  it("renders 'No documents yet' when there are no initialDocuments", () => {
    const { container } = render(
      <DocumentsPanel projectId="P1" initialDocuments={[]} />,
    );
    expect(container.textContent).toContain("No documents yet");
  });
});
