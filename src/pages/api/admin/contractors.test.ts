// src/pages/api/admin/contractors.test.ts
// Phase 40 Plan 01 — VEND-04 (address) + VEND-05 (docType) for /api/admin/contractors

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

const {
  mockGetSession,
  mockCreate,
  mockCommit,
  mockAppend,
  mockSet,
  mockSetIfMissing,
  mockPatch,
  mockAssetsUpload,
} = vi.hoisted(() => {
  const builder: Record<string, any> = {};
  const commit = vi.fn().mockResolvedValue({});
  const append = vi.fn().mockImplementation(() => builder);
  const set = vi.fn().mockImplementation(() => builder);
  const setIfMissing = vi.fn().mockImplementation(() => builder);
  builder.commit = commit;
  builder.append = append;
  builder.set = set;
  builder.setIfMissing = setIfMissing;
  const patch = vi.fn().mockReturnValue(builder);
  const create = vi.fn().mockResolvedValue({ _id: "contractor-123" });
  const assetsUpload = vi.fn().mockResolvedValue({
    url: "https://cdn.sanity.io/files/test/file.pdf",
  });
  return {
    mockGetSession: vi.fn(),
    mockCreate: create,
    mockCommit: commit,
    mockAppend: append,
    mockSet: set,
    mockSetIfMissing: setIfMissing,
    mockPatch: patch,
    mockAssetsUpload: assetsUpload,
  };
});

vi.mock("../../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../../lib/tenantClient", () => ({
  getTenantClient: vi.fn().mockReturnValue({
    patch: mockPatch,
    create: mockCreate,
    assets: { upload: mockAssetsUpload },
    fetch: vi.fn().mockResolvedValue(0),
    delete: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock("../../../lib/generateToken", () => ({
  generatePortalToken: vi.fn().mockReturnValue("testkey12"),
}));

import { POST } from "./contractors";

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/contractors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type RouteCtx = { request: Request; cookies: AstroCookies };
const callPost = (ctx: RouteCtx): Promise<Response> =>
  (POST as unknown as (c: RouteCtx) => Promise<Response>)(ctx);

function adminSession() {
  mockGetSession.mockResolvedValue({
    entityId: "paul@lasprezz.com",
    role: "admin",
    tenantId: "la-sprezzatura",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  const builder: Record<string, any> = {
    commit: mockCommit,
    append: mockAppend,
    set: mockSet,
    setIfMissing: mockSetIfMissing,
  };
  mockSetIfMissing.mockImplementation(() => builder);
  mockAppend.mockImplementation(() => builder);
  mockSet.mockImplementation(() => builder);
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue(builder);
  mockCreate.mockResolvedValue({ _id: "contractor-123" });
  mockAssetsUpload.mockResolvedValue({
    url: "https://cdn.sanity.io/files/test/file.pdf",
  });
});

// Phase 40 Plan 01 — VEND-04: address field in create + update
describe("POST /api/admin/contractors — address field (Phase 40 Plan 01 VEND-04)", () => {
  it("create action includes address in client.create() when provided", async () => {
    adminSession();
    const res = await callPost({
      request: makeJsonRequest({
        action: "create",
        name: "Bob Builder",
        email: "bob@example.com",
        trades: ["general-contractor"],
        address: {
          street: "123 Main St",
          city: "Anytown",
          state: "NY",
          zip: "11701",
        },
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledOnce();
    const createArg = mockCreate.mock.calls[0][0];
    expect(createArg.address).toBeDefined();
    expect(createArg.address.street).toBe("123 Main St");
    expect(createArg.address.city).toBe("Anytown");
    expect(createArg.address.state).toBe("NY");
    expect(createArg.address.zip).toBe("11701");
  });

  it("create action omits address from client.create() when not provided", async () => {
    adminSession();
    const res = await callPost({
      request: makeJsonRequest({
        action: "create",
        name: "Bob Builder",
        email: "bob@example.com",
        trades: ["general-contractor"],
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const createArg = mockCreate.mock.calls[0][0];
    expect(createArg.address).toBeUndefined();
  });

  it("update action includes address in .set() when provided", async () => {
    adminSession();
    const res = await callPost({
      request: makeJsonRequest({
        action: "update",
        contractorId: "contractor-abc",
        name: "Bob Builder",
        email: "bob@example.com",
        trades: ["general-contractor"],
        address: {
          street: "456 Oak Ave",
          city: "Springfield",
          state: "NY",
          zip: "11702",
        },
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const setCall = mockSet.mock.calls.find(
      (call) => call[0] && "name" in call[0],
    );
    expect(setCall).toBeTruthy();
    expect(setCall![0].address).toBeDefined();
    expect(setCall![0].address.street).toBe("456 Oak Ave");
    expect(setCall![0].address.city).toBe("Springfield");
  });

  it("update action sets address to undefined when not provided", async () => {
    adminSession();
    const res = await callPost({
      request: makeJsonRequest({
        action: "update",
        contractorId: "contractor-abc",
        name: "Bob Builder",
        email: "bob@example.com",
        trades: ["general-contractor"],
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const setCall = mockSet.mock.calls.find(
      (call) => call[0] && "name" in call[0],
    );
    expect(setCall).toBeTruthy();
    expect(setCall![0].address).toBeUndefined();
  });

  it("update action trims whitespace from address fields", async () => {
    adminSession();
    await callPost({
      request: makeJsonRequest({
        action: "update",
        contractorId: "contractor-abc",
        name: "Bob Builder",
        email: "bob@example.com",
        trades: ["general-contractor"],
        address: {
          street: "  123 Main St  ",
          city: "  Anytown  ",
          state: "  NY  ",
          zip: "  11701  ",
        },
      }),
      cookies: makeCookies(),
    });
    const setCall = mockSet.mock.calls.find(
      (call) => call[0] && "name" in call[0],
    );
    expect(setCall![0].address.street).toBe("123 Main St");
    expect(setCall![0].address.city).toBe("Anytown");
    expect(setCall![0].address.state).toBe("NY");
    expect(setCall![0].address.zip).toBe("11701");
  });
});

// Phase 40 Plan 01 — VEND-05: docType in upload-doc
describe("POST /api/admin/contractors — upload-doc docType (Phase 40 Plan 01 VEND-05)", () => {
  function makeUploadRequest(fields: Record<string, string | File>): Request {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    return new Request("http://localhost/api/admin/contractors", {
      method: "POST",
      body: formData,
    });
  }

  it("upload-doc includes docType in docEntry when provided", async () => {
    adminSession();
    const file = new File(["pdf content"], "1099-2024.pdf", {
      type: "application/pdf",
    });
    const res = await callPost({
      request: makeUploadRequest({
        action: "upload-doc",
        contractorId: "contractor-abc",
        file,
        docType: "1099",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const appendCall = mockAppend.mock.calls.find(
      (call) => call[0] === "documents",
    );
    expect(appendCall).toBeTruthy();
    const [, docs] = appendCall!;
    expect(docs[0].docType).toBe("1099");
  });

  it("upload-doc omits docType from docEntry when not provided", async () => {
    adminSession();
    const file = new File(["pdf content"], "cert.pdf", {
      type: "application/pdf",
    });
    const res = await callPost({
      request: makeUploadRequest({
        action: "upload-doc",
        contractorId: "contractor-abc",
        file,
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const appendCall = mockAppend.mock.calls.find(
      (call) => call[0] === "documents",
    );
    expect(appendCall).toBeTruthy();
    const [, docs] = appendCall!;
    expect(docs[0].docType).toBeUndefined();
  });

  it("upload-doc returns document object in response", async () => {
    adminSession();
    const file = new File(["pdf content"], "contract.pdf", {
      type: "application/pdf",
    });
    const res = await callPost({
      request: makeUploadRequest({
        action: "upload-doc",
        contractorId: "contractor-abc",
        file,
        docType: "contract",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.document).toBeDefined();
    expect(body.document.docType).toBe("contract");
    expect(body.document.fileName).toBe("contract.pdf");
    expect(body.documentKey).toBeDefined();
    expect(body.url).toBeDefined();
  });

  it("upload-doc accepts _id as fallback for contractorId", async () => {
    adminSession();
    const file = new File(["pdf content"], "insurance.pdf", {
      type: "application/pdf",
    });
    const res = await callPost({
      request: makeUploadRequest({
        action: "upload-doc",
        _id: "contractor-abc",
        file,
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith("contractor-abc");
  });
});

// Phase 42 Plan 01 — TRAD-02
describe("POST /api/admin/contractors — relationship field (Phase 42 TRAD-02)", () => {
  it("persists `relationship: 'vendor'` on create when body includes it", async () => {
    adminSession();
    const res = await callPost({
      request: makeJsonRequest({
        action: "create",
        name: "Acme Supplies",
        email: "sales@acme.example",
        trades: ["general-contractor"],
        relationship: "vendor",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledOnce();
    const createArg = mockCreate.mock.calls[0][0];
    expect(createArg.relationship).toBe("vendor");
  });

  it("does NOT include `relationship` in create payload when omitted from body", async () => {
    adminSession();
    const res = await callPost({
      request: makeJsonRequest({
        action: "create",
        name: "Bob Builder",
        email: "bob@example.com",
        trades: ["general-contractor"],
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const createArg = mockCreate.mock.calls[0][0];
    expect("relationship" in createArg).toBe(false);
  });

  it("updates `relationship` on PATCH (action=update) when provided", async () => {
    adminSession();
    const res = await callPost({
      request: makeJsonRequest({
        action: "update",
        contractorId: "contractor-abc",
        name: "Bob Builder",
        email: "bob@example.com",
        trades: ["general-contractor"],
        relationship: "contractor",
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const setCall = mockSet.mock.calls.find(
      (call) => call[0] && "name" in call[0],
    );
    expect(setCall).toBeTruthy();
    expect(setCall![0].relationship).toBe("contractor");
  });

  it("clears `relationship` to null on update when body passes relationship: null", async () => {
    adminSession();
    const res = await callPost({
      request: makeJsonRequest({
        action: "update",
        contractorId: "contractor-abc",
        name: "Bob Builder",
        email: "bob@example.com",
        trades: ["general-contractor"],
        relationship: null,
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const setCall = mockSet.mock.calls.find(
      (call) => call[0] && "name" in call[0],
    );
    expect(setCall).toBeTruthy();
    expect("relationship" in setCall![0]).toBe(true);
    expect(setCall![0].relationship).toBeNull();
  });

  it("leaves `relationship` untouched on update when body omits the key", async () => {
    adminSession();
    const res = await callPost({
      request: makeJsonRequest({
        action: "update",
        contractorId: "contractor-abc",
        name: "Bob Builder",
        email: "bob@example.com",
        trades: ["general-contractor"],
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);
    const setCall = mockSet.mock.calls.find(
      (call) => call[0] && "name" in call[0],
    );
    expect(setCall).toBeTruthy();
    expect("relationship" in setCall![0]).toBe(false);
  });
});
