// src/lib/portal/clientDashboard.test.ts
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 06 (client-dashboard). Each pending
// stub becomes an active test when the resolver is extracted.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-19 revised; threat T-34-06

import { describe, it } from "vitest";

describe("clientDashboard resolver (Phase 34 Plan 06)", () => {
  it.todo("resolveClientByToken returns client doc when token matches");
  it.todo("resolveClientByToken returns null when token does not match");
  it.todo("resolveClientByToken returns null when token is empty string");
  it.todo("getClientDashboardData returns { client, projects: [] } for client with zero projects");
  it.todo("getClientDashboardData filters projects via isProjectVisible");
  it.todo("getClientDashboardData returns projects ordered by pipelineStage");
  it.todo("getClientDashboardData returns null when client cannot be resolved");
  it.todo("portalTokenHash is derivable from client.portalToken via hashPortalToken helper");
});
