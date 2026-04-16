// @vitest-environment jsdom
// Phase 39 Plan 02 Task 1 — UploadDocumentModal tests.
//
// Covers DOCS-02 client-side MIME/size gate + upload flow contract.
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-02-PLAN.md § Task 1
//   .planning/phases/39-work-order-documents-panels/39-UI-SPEC.md § Surface 7

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import ToastContainer from "./ui/ToastContainer";
import UploadDocumentModal from "./UploadDocumentModal";

afterEach(cleanup);
beforeEach(() => {
  vi.restoreAllMocks();
});

function renderModal(overrides: Partial<React.ComponentProps<typeof UploadDocumentModal>> = {}) {
  const props: React.ComponentProps<typeof UploadDocumentModal> = {
    open: true,
    projectId: "P1",
    onClose: vi.fn(),
    onUploaded: vi.fn(),
    ...overrides,
  };
  return {
    ...render(
      <ToastContainer>
        <UploadDocumentModal {...props} />
      </ToastContainer>,
    ),
    props,
  };
}

function makeFile(name: string, type: string, size = 1024) {
  const f = new File(["x".repeat(Math.min(size, 8))], name, { type });
  // Override size so we can simulate >25MB without allocating the bytes
  Object.defineProperty(f, "size", { value: size });
  return f;
}

describe("UploadDocumentModal — render gate", () => {
  it("renders nothing when open={false}", () => {
    const { container } = renderModal({ open: false });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders dialog with category select + 4 options + placeholder when open", () => {
    const { container } = renderModal();
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    const select = container.querySelector("select") as HTMLSelectElement | null;
    expect(select, "category <select> must exist").not.toBeNull();
    const options = Array.from(select?.querySelectorAll("option") ?? []);
    expect(options.length, "5 options: placeholder + 4 categories").toBe(5);
    const values = options.map((o) => o.getAttribute("value"));
    expect(values).toContain("");
    expect(values).toContain("Contracts");
    expect(values).toContain("Drawings");
    expect(values).toContain("Selections");
    expect(values).toContain("Presentations");
  });
});

describe("UploadDocumentModal — MIME + size gate (DOCS-02)", () => {
  it("rejects .zip file with inline error and does not latch file", () => {
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const zip = makeFile("bad.zip", "application/zip", 1024);
    fireEvent.change(input, { target: { files: [zip] } });
    expect(container.textContent).toContain(
      "Only PDF and image files can be uploaded (PDF, JPG, PNG).",
    );
    // Upload button should remain disabled (no file latched) even if category selected
    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "Contracts" } });
    const uploadBtn = Array.from(
      container.querySelectorAll("button"),
    ).find((b) => /upload/i.test(b.textContent || "") && !/cancel/i.test(b.textContent || ""));
    expect(uploadBtn?.hasAttribute("disabled")).toBe(true);
  });

  it("rejects oversize file (>25MB) with size error", () => {
    const { container } = renderModal();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const big = makeFile("huge.pdf", "application/pdf", 30 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [big] } });
    expect(container.textContent).toContain("This file is too large. Maximum 25MB.");
  });
});

describe("UploadDocumentModal — Upload button enablement", () => {
  it("disabled when file missing; disabled when category missing; enabled when both present", () => {
    const { container } = renderModal();
    const getBtn = () =>
      Array.from(container.querySelectorAll("button")).find(
        (b) =>
          /upload/i.test(b.textContent || "") &&
          !/cancel/i.test(b.textContent || ""),
      );
    expect(getBtn()?.hasAttribute("disabled")).toBe(true);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const ok = makeFile("drawing.pdf", "application/pdf", 1024);
    fireEvent.change(input, { target: { files: [ok] } });
    expect(getBtn()?.hasAttribute("disabled"), "still disabled without category").toBe(true);

    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "Drawings" } });
    expect(getBtn()?.hasAttribute("disabled"), "enabled when both file + category set").toBe(
      false,
    );
  });
});

describe("UploadDocumentModal — POST happy path", () => {
  it("POSTs FormData to /api/admin/projects/:id/documents and fires onUploaded + onClose on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        docKey: "abcd1234",
        assetUrl: "https://cdn.sanity.io/files/p/d/abcd1234.pdf",
      }),
    });
    global.fetch = fetchMock as typeof fetch;
    const onUploaded = vi.fn();
    const onClose = vi.fn();
    const { container } = renderModal({ onUploaded, onClose });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const ok = makeFile("agreement.pdf", "application/pdf", 2048);
    fireEvent.change(input, { target: { files: [ok] } });
    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "Contracts" } });

    const uploadBtn = Array.from(container.querySelectorAll("button")).find(
      (b) =>
        /upload/i.test(b.textContent || "") &&
        !/cancel/i.test(b.textContent || ""),
    ) as HTMLButtonElement;
    fireEvent.click(uploadBtn);

    // Let the async handler resolve
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/projects/P1/documents");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("projectId")).toBe("P1");
    expect(form.get("category")).toBe("Contracts");
    expect(form.get("file")).toBeInstanceOf(File);

    expect(onUploaded).toHaveBeenCalledTimes(1);
    const entry = onUploaded.mock.calls[0][0];
    expect(entry._key).toBe("abcd1234");
    expect(entry.category).toBe("Contracts");
    expect(entry.url).toBe("https://cdn.sanity.io/files/p/d/abcd1234.pdf");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows server error inline when response !ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "File too large on server" }),
    });
    global.fetch = fetchMock as typeof fetch;
    const { container } = renderModal();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [makeFile("x.pdf", "application/pdf", 2048)] },
    });
    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "Selections" } });

    const uploadBtn = Array.from(container.querySelectorAll("button")).find(
      (b) =>
        /upload/i.test(b.textContent || "") &&
        !/cancel/i.test(b.textContent || ""),
    ) as HTMLButtonElement;
    fireEvent.click(uploadBtn);
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(container.textContent).toContain("File too large on server");
  });
});
