// src/lib/portal/clientDashboard.ts
// Phase 34 Plan 06 — client dashboard resolver.
//
// Pure, unit-testable module extracted from /portal/client/[token].astro so
// the .astro route stays thin and the lookup logic has full Vitest coverage.
//
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md
// D-19 revised; threats T-34-06 (forwarded link), T-34-07 (regen kills session).

import { sanityClient } from "sanity:client";
import { getProjectsByClientId } from "../../sanity/queries";
import { isProjectVisible } from "../projectVisibility";
import { hashPortalToken } from "./portalTokenHash";

// Re-exported so /portal/client/[token].astro can hash the token once and
// pass it to createPurlSession without importing portalTokenHash directly.
export { hashPortalToken };

/**
 * Shape of a client document returned by the CLIENT_BY_PORTAL_TOKEN_QUERY.
 * Only the minimum set of fields the dashboard needs is projected — do not
 * widen this without updating the threat model (T-34-10 field exposure).
 */
export interface ResolvedClient {
  _id: string;
  name: string;
  email: string;
  portalToken: string;
}

/**
 * Shape of a project summary returned by the dashboard loader.
 * Matches PROJECTS_BY_CLIENT_QUERY projection; do NOT leak internal fields
 * (clientCost, procurement detail, etc.) to the portal.
 */
export interface DashboardProject {
  _id: string;
  title: string;
  pipelineStage: string;
  engagementType: string;
  completedAt?: string | null;
  projectStatus?: string;
  isPrimary?: boolean;
}

export interface ClientDashboardData {
  client: ResolvedClient;
  projects: DashboardProject[];
}

/**
 * GROQ query used to resolve a client by their portalToken.
 *
 * The token is compared via an equality filter — relies on the fact that
 * tokens are cryptographically random (generatePortalToken) so the attacker
 * cannot enumerate. No rate limiting at this layer; forwarded-link risk is
 * accepted via 7-day TTL + regen action per T-34-06.
 *
 * Kept local to this module (rather than imported from queries.ts) so the
 * Vitest mock only needs to stub `sanityClient.fetch` once.
 *
 * The GROQ param is named `$purl` rather than `$token` to sidestep a
 * @sanity/client TypeScript overload-inference quirk — passing `{ token }`
 * as the params object against a const-literal query string triggers TS2769
 * "Type 'string' is not assignable to type 'never'". Same quirk applies in
 * src/sanity/queries.ts; the pre-existing `getProjectByPortalToken` at ~line
 * 92 still hits it. Keeping the external function arg named `token` so the
 * caller contract (token from the URL) stays clear.
 */
const CLIENT_BY_PORTAL_TOKEN_QUERY = `
  *[_type == "client" && portalToken == $purl][0] {
    _id, name, email, portalToken
  }
`;

/**
 * Resolve a client document from a raw portalToken value.
 *
 * Returns null when:
 *   - token is empty / not a string
 *   - no client document matches
 *   - the matched document has no portalToken (defensive check; shouldn't
 *     happen because the filter requires portalToken == $token, but keeps
 *     the invariant explicit for callers)
 *
 * Never throws on a not-found — the caller (route handler) renders the
 * token-invalid fallback page on null.
 */
export async function resolveClientByToken(
  token: string | undefined,
): Promise<ResolvedClient | null> {
  if (!token || typeof token !== "string") return null;

  const client = (await sanityClient.fetch(
    CLIENT_BY_PORTAL_TOKEN_QUERY,
    { purl: token },
  )) as ResolvedClient | null;

  if (!client || !client._id || !client.portalToken) return null;
  return client;
}

/**
 * Build the full dashboard payload for a client arriving via /portal/client/{token}.
 *
 * Steps:
 *   1. Resolve the client by portalToken (null → route renders invalid fallback).
 *   2. Fetch all portal-enabled projects referencing the client._id.
 *   3. Filter by isProjectVisible to hide completed-and-older-than-30-days.
 *   4. Return { client, projects } or null if the client could not be resolved.
 *
 * Order: the underlying PROJECTS_BY_CLIENT_QUERY sorts by pipelineStage asc,
 * which is preserved through the filter (Array.prototype.filter is stable).
 */
export async function getClientDashboardData(
  token: string | undefined,
): Promise<ClientDashboardData | null> {
  const client = await resolveClientByToken(token);
  if (!client) return null;

  const projects = await getProjectsByClientId(client._id);
  const visible = ((projects as DashboardProject[] | null) || []).filter(
    isProjectVisible,
  );

  return { client, projects: visible };
}
