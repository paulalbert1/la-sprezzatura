/**
 * Per-tenant Sanity client factory with caching.
 *
 * Creates a Sanity write client scoped to a specific tenant's dataset
 * and write token. Clients are cached by tenant ID to avoid creating
 * duplicate connections.
 */
import { createClient, type SanityClient } from "@sanity/client";
import { getTenantById } from "./tenants";

const clientCache = new Map<string, SanityClient>();

export function getTenantClient(tenantId: string): SanityClient {
  const cached = clientCache.get(tenantId);
  if (cached) return cached;

  const tenant = getTenantById(tenantId);
  if (!tenant) throw new Error(`Unknown tenant: ${tenantId}`);

  const token = process.env[tenant.sanity.writeTokenEnv];
  if (!token) throw new Error(`Missing env var: ${tenant.sanity.writeTokenEnv}`);

  const projectId =
    tenant.sanity.projectId === "from-env"
      ? (process.env.PUBLIC_SANITY_PROJECT_ID ?? import.meta.env.PUBLIC_SANITY_PROJECT_ID)
      : tenant.sanity.projectId;
  if (!projectId) throw new Error("Missing PUBLIC_SANITY_PROJECT_ID env var");

  const client = createClient({
    projectId,
    dataset: tenant.sanity.dataset,
    apiVersion: "2025-12-15",
    useCdn: false,
    token,
  });

  clientCache.set(tenantId, client);
  return client;
}
