import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";

// Mock session module
const mockGetSession = vi.fn();
vi.mock("../../../lib/session", () => ({
  getSession: mockGetSession,
}));

// Mock tenant client module
const mockCommit = vi.fn().mockResolvedValue({});
const mockAppend = vi.fn().mockReturnThis();
const mockSetIfMissing = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockPatch = vi.fn().mockReturnValue({
  set: mockSet,
  setIfMissing: mockSetIfMissing,
  append: mockAppend,
  commit: mockCommit,
});
vi.mock("../../../lib/tenantClient", () => ({
  getTenantClient: vi.fn().mockReturnValue({
    patch: mockPatch,
  }),
}));

// Mock generateToken module
vi.mock("../../../lib/generateToken", () => ({
  generatePortalToken: vi.fn().mockReturnValue("test1234"),
}));

// Helper to create mock cookies
function makeCookies(): AstroCookies {
  return {} as AstroCookies;
}

// Helper to create a Request with JSON body
function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/admin/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset chainable mocks
  mockSet.mockReturnThis();
  mockSetIfMissing.mockReturnThis();
  mockAppend.mockReturnThis();
  mockCommit.mockResolvedValue({});
  mockPatch.mockReturnValue({
    set: mockSet,
    setIfMissing: mockSetIfMissing,
    append: mockAppend,
    commit: mockCommit,
  });
});

describe("POST /api/admin/tasks", () => {
  describe("Authentication", () => {
    it("returns 401 when no session exists", async () => {
      mockGetSession.mockResolvedValue(null);
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({ action: "create", projectId: "proj-1", description: "Test" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 401 when session role is not admin", async () => {
      mockGetSession.mockResolvedValue({ entityId: "user-1", role: "client" });
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({ action: "create", projectId: "proj-1", description: "Test" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 403 when session has no tenantId", async () => {
      mockGetSession.mockResolvedValue({ entityId: "user-1", role: "admin" });
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({ action: "create", projectId: "proj-1", description: "Test" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("No tenant context");
    });
  });

  describe("Create action", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        entityId: "admin-1",
        role: "admin",
        tenantId: "tenant-1",
      });
    });

    it("returns 400 when description is empty", async () => {
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({ action: "create", projectId: "proj-1", description: "" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("description");
    });

    it("returns 400 when description exceeds 500 chars", async () => {
      const { POST } = await import("./tasks");
      const longDescription = "a".repeat(501);

      const response = await POST({
        request: makeRequest({ action: "create", projectId: "proj-1", description: longDescription }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("500");
    });

    it("returns 400 when projectId is missing", async () => {
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({ action: "create", description: "Test task" }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("projectId");
    });

    it("returns 200 and calls client.patch().append() when creating a valid task", async () => {
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({
          action: "create",
          projectId: "proj-1",
          description: "Buy fabric samples",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.taskKey).toBe("test1234");

      // Verify Sanity mutation pattern
      expect(mockPatch).toHaveBeenCalledWith("proj-1");
      expect(mockSetIfMissing).toHaveBeenCalledWith(
        expect.objectContaining({ tasks: [], activityLog: [] }),
      );
      expect(mockAppend).toHaveBeenCalledWith(
        "tasks",
        expect.arrayContaining([
          expect.objectContaining({
            _key: "test1234",
            _type: "task",
            description: "Buy fabric samples",
            completed: false,
          }),
        ]),
      );
    });

    it("appends an activity log entry when creating a task", async () => {
      const { POST } = await import("./tasks");

      await POST({
        request: makeRequest({
          action: "create",
          projectId: "proj-1",
          description: "Order wallpaper",
        }),
        cookies: makeCookies(),
      } as any);

      // Verify activity log append was called
      expect(mockAppend).toHaveBeenCalledWith(
        "activityLog",
        expect.arrayContaining([
          expect.objectContaining({
            _type: "activityEntry",
            action: "task-created",
            actor: "admin-1",
          }),
        ]),
      );
    });

    it("returns 400 when dueDate has invalid format", async () => {
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({
          action: "create",
          projectId: "proj-1",
          description: "Test task",
          dueDate: "04-08-2026",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("date format");
    });
  });

  describe("Toggle action", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        entityId: "admin-1",
        role: "admin",
        tenantId: "tenant-1",
      });
    });

    it("returns 400 when taskKey is missing", async () => {
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({
          action: "toggle",
          projectId: "proj-1",
          completed: true,
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("taskKey");
    });

    it("sets completed=true and completedAt when toggling to complete", async () => {
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({
          action: "toggle",
          projectId: "proj-1",
          taskKey: "task-abc",
          completed: true,
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      expect(mockPatch).toHaveBeenCalledWith("proj-1");
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`tasks[_key=="task-abc"].completed`]: true,
        }),
      );
      // completedAt should be set (an ISO string)
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`tasks[_key=="task-abc"].completedAt`]: expect.any(String),
        }),
      );
    });

    it("sets completed=false and completedAt=null when toggling to incomplete", async () => {
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({
          action: "toggle",
          projectId: "proj-1",
          taskKey: "task-abc",
          completed: false,
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(200);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [`tasks[_key=="task-abc"].completed`]: false,
          [`tasks[_key=="task-abc"].completedAt`]: null,
        }),
      );
    });

    it("appends an activity log entry when toggling a task", async () => {
      const { POST } = await import("./tasks");

      await POST({
        request: makeRequest({
          action: "toggle",
          projectId: "proj-1",
          taskKey: "task-abc",
          completed: true,
        }),
        cookies: makeCookies(),
      } as any);

      expect(mockAppend).toHaveBeenCalledWith(
        "activityLog",
        expect.arrayContaining([
          expect.objectContaining({
            _type: "activityEntry",
            action: "task-completed",
            actor: "admin-1",
          }),
        ]),
      );
    });

    it("returns 400 when completed is not a boolean", async () => {
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({
          action: "toggle",
          projectId: "proj-1",
          taskKey: "task-abc",
          completed: "yes",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("boolean");
    });
  });

  describe("Invalid action", () => {
    it("returns 400 for unknown action", async () => {
      mockGetSession.mockResolvedValue({
        entityId: "admin-1",
        role: "admin",
        tenantId: "tenant-1",
      });
      const { POST } = await import("./tasks");

      const response = await POST({
        request: makeRequest({
          action: "delete",
          projectId: "proj-1",
        }),
        cookies: makeCookies(),
      } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid action");
    });
  });
});
