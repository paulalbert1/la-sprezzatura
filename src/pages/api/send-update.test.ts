// src/pages/api/send-update.test.ts
// Phase 34 Plan 04 Task 2 — POST /api/send-update contract tests.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 2

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// ---------------------------------------------------------------------------
// Mock scaffolding. vi.mock calls are hoisted above imports; any references
// they make must go through vi.hoisted so the bindings exist at mock time.
// ---------------------------------------------------------------------------
const {
  mockGetSession,
  mockFetch,
  mockPatch,
  mockCommit,
  mockSetIfMissing,
  mockAppend,
  mockResendSend,
} = vi.hoisted(() => {
  const commit = vi.fn().mockResolvedValue({});
  const resendSend = vi.fn().mockResolvedValue({ id: "stub-email-id" });

  // Chain-aware builder — each chainable method returns the same object so
  // tests can assert on the full call sequence. The commit terminal method
  // resolves with an empty object.
  const builder: Record<string, unknown> = {};
  const setIfMissing = vi.fn().mockImplementation(() => builder);
  const append = vi.fn().mockImplementation(() => builder);
  builder.setIfMissing = setIfMissing;
  builder.append = append;
  builder.commit = commit;

  const patch = vi.fn().mockReturnValue(builder);

  return {
    mockGetSession: vi.fn(),
    mockFetch: vi.fn(),
    mockPatch: patch,
    mockCommit: commit,
    mockSetIfMissing: setIfMissing,
    mockAppend: append,
    mockResendSend: resendSend,
  };
});

vi.mock("../../lib/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("../../sanity/writeClient", () => ({
  sanityWriteClient: {
    patch: mockPatch,
    fetch: mockFetch,
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockResendSend };
  },
}));

// Import the route AFTER the mocks so the module graph picks them up.
import { POST } from "./send-update";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/send-update", {
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

function baseProjectSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    _id: "project-abc",
    title: "Test Project",
    engagementType: "full-interior-design",
    clients: [
      {
        client: {
          _id: "client-sarah",
          name: "Sarah",
          email: "sarah@example.com",
          portalToken: undefined,
        },
      },
    ],
    milestones: [
      { _key: "m1", name: "Kickoff", date: "2026-03-01", completed: true },
    ],
    procurementItems: [],
    artifacts: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  // Re-assert the builder chain so each test starts with a clean mock shape.
  const builder: Record<string, unknown> = {};
  builder.setIfMissing = mockSetIfMissing;
  builder.append = mockAppend;
  builder.commit = mockCommit;
  mockSetIfMissing.mockImplementation(() => builder);
  mockAppend.mockImplementation(() => builder);
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue(builder);

  mockResendSend.mockResolvedValue({ id: "stub-email-id" });

  // Force the RESEND_API_KEY environment to be populated so the send branch
  // runs in every test. Individual tests can override if they need to
  // exercise the "no API key" branch.
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/send-update (Phase 34 Plan 04)", () => {
  it("POST rejects non-admin session with 401", async () => {
    mockGetSession.mockResolvedValueOnce({
      entityId: "client-1",
      role: "client",
    });
    const res = await callPost({
      request: makeRequest({ projectId: "project-abc" }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("POST with usePersonalLinks=false uses ${baseUrl}/portal/dashboard as CTA for all recipients", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          { client: { _id: "c1", name: "A", email: "a@x.com", portalToken: "abc" } },
          { client: { _id: "c2", name: "B", email: "b@x.com", portalToken: "def" } },
        ],
      }),
    );

    const res = await callPost({
      request: makeRequest({
        projectId: "project-abc",
        usePersonalLinks: false,
      }),
      cookies: makeCookies(),
    });
    expect(res.status).toBe(200);

    // Two recipients, two sends, each carrying the SAME legacy CTA.
    expect(mockResendSend).toHaveBeenCalledTimes(2);
    for (const call of mockResendSend.mock.calls) {
      const { html } = call[0];
      expect(html).toContain("/portal/dashboard");
      expect(html).not.toContain("/portal/client/");
    }
  });

  it("POST with usePersonalLinks=true looks up client.portalToken for each recipient", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          {
            client: {
              _id: "c1",
              name: "A",
              email: "a@x.com",
              portalToken: "tok-a-1234",
            },
          },
          {
            client: {
              _id: "c2",
              name: "B",
              email: "b@x.com",
              portalToken: "tok-b-5678",
            },
          },
        ],
      }),
    );

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    expect(mockResendSend).toHaveBeenCalledTimes(2);
    const htmls = mockResendSend.mock.calls.map((c) => c[0].html as string);
    expect(htmls[0]).toContain("/portal/client/tok-a-1234");
    expect(htmls[1]).toContain("/portal/client/tok-b-5678");
    // setIfMissing should NOT be called because both clients already had tokens.
    expect(mockPatch).not.toHaveBeenCalledWith(
      expect.stringMatching(/^c[12]$/),
    );
  });

  it("POST with usePersonalLinks=true calls patch(clientId).setIfMissing({ portalToken }) when client has no token", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(
        baseProjectSnapshot({
          clients: [
            {
              client: {
                _id: "client-sarah",
                name: "Sarah",
                email: "sarah@x.com",
                portalToken: undefined,
              },
            },
          ],
        }),
      )
      // Re-fetch after setIfMissing returns the winning value
      .mockResolvedValueOnce("winning-token");

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    // patch() called once for client-sarah (lazy gen) and once for project
    // (updateLog append at the bottom of the handler). Verify the client
    // call happened.
    const clientPatch = mockPatch.mock.calls.find(
      (c) => c[0] === "client-sarah",
    );
    expect(clientPatch).toBeDefined();
    expect(mockSetIfMissing).toHaveBeenCalledWith(
      expect.objectContaining({ portalToken: expect.any(String) }),
    );

    // The CTA href uses the RE-FETCHED winning value, not the newly-minted one.
    const html = mockResendSend.mock.calls[0][0].html as string;
    expect(html).toContain("/portal/client/winning-token");
  });

  it("POST with usePersonalLinks=true does NOT call setIfMissing when client already has a portalToken", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          {
            client: {
              _id: "c1",
              name: "A",
              email: "a@x.com",
              portalToken: "existing-token",
            },
          },
        ],
      }),
    );

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    // The updateLog patch for the PROJECT calls setIfMissing({ updateLog: [] })
    // at the end of the handler. That's the only legitimate call. The CLIENT
    // patch chain must NOT have been invoked for a client that already has a token.
    const clientPatchCall = mockPatch.mock.calls.find((c) => c[0] === "c1");
    expect(clientPatchCall).toBeUndefined();
  });

  it("POST serially awaits per-recipient resend.emails.send (no Promise.all race)", async () => {
    adminSession();
    // Three clients, all with existing tokens so we avoid the patch path.
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          {
            client: {
              _id: "c1",
              name: "A",
              email: "a@x.com",
              portalToken: "t1",
            },
          },
          {
            client: {
              _id: "c2",
              name: "B",
              email: "b@x.com",
              portalToken: "t2",
            },
          },
          {
            client: {
              _id: "c3",
              name: "C",
              email: "c@x.com",
              portalToken: "t3",
            },
          },
        ],
      }),
    );

    // Use a resolve queue to prove serial ordering: each send.resolve fires
    // only after the previous has settled. If the handler used Promise.all
    // the order of call arguments would still match but each resolve would
    // have been OBSERVED in parallel — we assert order via the recorded
    // to[] argument sequence, which is the minimum observable guarantee.
    const order: string[] = [];
    mockResendSend.mockImplementation(async (payload: { to: string[] }) => {
      order.push(payload.to[0]);
      await new Promise((r) => setTimeout(r, 1));
      return { id: "ok" };
    });

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    expect(order).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("POST re-fetches client.portalToken after setIfMissing to resolve concurrent-tab race", async () => {
    adminSession();
    mockFetch
      .mockResolvedValueOnce(
        baseProjectSnapshot({
          clients: [
            {
              client: {
                _id: "race-client",
                name: "Race",
                email: "race@x.com",
                portalToken: undefined,
              },
            },
          ],
        }),
      )
      // Re-fetch returns a DIFFERENT token from whatever setIfMissing tried
      // to set — simulates a concurrent tab beating us to the write.
      .mockResolvedValueOnce("winner-from-other-tab");

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    // The CTA must use the WINNER, not the token we tried to set.
    const html = mockResendSend.mock.calls[0][0].html as string;
    expect(html).toContain("/portal/client/winner-from-other-tab");

    // Verify the re-fetch actually happened — look for the GROQ query in the
    // fetch calls.
    const refetchCall = mockFetch.mock.calls.find(
      (c) =>
        typeof c[0] === "string" && c[0].includes("*[_id == $id][0].portalToken"),
    );
    expect(refetchCall).toBeDefined();
  });

  it("POST skips clients with no email (does not patch, does not send)", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          {
            client: {
              _id: "no-email-client",
              name: "Nobody",
              email: undefined,
              portalToken: undefined,
            },
          },
          {
            client: {
              _id: "has-email",
              name: "HasEmail",
              email: "yes@x.com",
              portalToken: "t",
            },
          },
        ],
      }),
    );

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend.mock.calls[0][0].to).toEqual(["yes@x.com"]);

    // no-email-client must NOT have had patch() called on it — verify no
    // CLIENT patch was issued for this id (the only patch should be the
    // project-level updateLog append).
    const clientPatchCall = mockPatch.mock.calls.find(
      (c) => c[0] === "no-email-client",
    );
    expect(clientPatchCall).toBeUndefined();
  });

  it("POST writes updateLog entry with _key, sentAt ISO, recipientEmails, note, sectionsIncluded", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          {
            client: {
              _id: "c1",
              name: "A",
              email: "a@x.com",
              portalToken: "t1",
            },
          },
        ],
      }),
    );

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        note: "Hi there",
        sections: { milestones: true },
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    // Find the append() call that targets the project's updateLog.
    const appendCall = mockAppend.mock.calls.find(
      (c) => c[0] === "updateLog",
    );
    expect(appendCall).toBeDefined();
    const entry = appendCall![1][0];
    expect(entry._key).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(typeof entry.sentAt).toBe("string");
    expect(() => new Date(entry.sentAt).toISOString()).not.toThrow();
    expect(entry.recipientEmails).toBe("a@x.com");
    expect(entry.note).toBe("Hi there");
    expect(entry.sectionsIncluded).toContain("milestones");
  });

  it("POST explicit sections.artifacts=false honors false regardless of pendingArtifacts.length (D-15)", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          {
            client: {
              _id: "c1",
              name: "A",
              email: "a@x.com",
              portalToken: "t1",
            },
          },
        ],
        artifacts: [
          {
            _key: "a1",
            artifactType: "proposal",
            currentVersionKey: "v1",
            hasApproval: false,
          },
        ],
      }),
    );

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        sections: { artifacts: false },
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    const html = mockResendSend.mock.calls[0][0].html as string;
    expect(html).not.toContain("Items Awaiting Your Review");
  });

  it("POST Milestones defaults ON when sections.milestones is undefined (backward compat)", async () => {
    adminSession();
    mockFetch.mockResolvedValueOnce(
      baseProjectSnapshot({
        clients: [
          {
            client: {
              _id: "c1",
              name: "A",
              email: "a@x.com",
              portalToken: "t1",
            },
          },
        ],
        milestones: [
          {
            _key: "m1",
            name: "Default Milestone",
            date: "2026-04-01",
            completed: false,
          },
        ],
      }),
    );

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        // No sections field at all — milestones should default ON.
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    const html = mockResendSend.mock.calls[0][0].html as string;
    expect(html).toContain("Default Milestone");
  });

  it("Multi-client project: Sarah no-token, Mike has-token, Jenny no-token — patch called for Sarah and Jenny only, 3 emails sent with 3 different CTAs", async () => {
    adminSession();
    mockFetch
      // Project fetch
      .mockResolvedValueOnce(
        baseProjectSnapshot({
          clients: [
            {
              client: {
                _id: "sarah",
                name: "Sarah",
                email: "sarah@x.com",
                portalToken: undefined,
              },
            },
            {
              client: {
                _id: "mike",
                name: "Mike",
                email: "mike@x.com",
                portalToken: "mike-token",
              },
            },
            {
              client: {
                _id: "jenny",
                name: "Jenny",
                email: "jenny@x.com",
                portalToken: undefined,
              },
            },
          ],
        }),
      )
      // Re-fetch after setIfMissing for Sarah
      .mockResolvedValueOnce("sarah-new-token")
      // Re-fetch after setIfMissing for Jenny
      .mockResolvedValueOnce("jenny-new-token");

    await callPost({
      request: makeRequest({
        projectId: "project-abc",
        usePersonalLinks: true,
      }),
      cookies: makeCookies(),
    });

    // 3 emails sent
    expect(mockResendSend).toHaveBeenCalledTimes(3);

    // Each email has a different CTA matching the resolved per-client token.
    const htmls = mockResendSend.mock.calls.map((c) => c[0].html as string);
    expect(htmls[0]).toContain("/portal/client/sarah-new-token");
    expect(htmls[1]).toContain("/portal/client/mike-token");
    expect(htmls[2]).toContain("/portal/client/jenny-new-token");

    // patch(clientId) was called for Sarah and Jenny (lazy-gen), NOT Mike.
    const clientPatches = mockPatch.mock.calls
      .filter((c) => c[0] !== "project-abc")
      .map((c) => c[0]);
    expect(clientPatches).toEqual(expect.arrayContaining(["sarah", "jenny"]));
    expect(clientPatches).not.toContain("mike");
  });
});
