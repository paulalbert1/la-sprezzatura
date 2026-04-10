/**
 * Tenant configuration loader and lookup functions.
 *
 * Each tenant in tenants.json represents a designer studio on the platform.
 * La Sprezzatura is the first (and currently only) tenant.
 *
 * To generate password hashes for admins:
 *   node -e "const b=require('bcryptjs');console.log(b.hashSync('yourpassword',10))"
 *
 * The sanity.projectId field should be set to the actual Sanity project ID
 * (from PUBLIC_SANITY_PROJECT_ID env var) or kept as "from-env" if resolved
 * at runtime via the tenantClient factory.
 */
import tenantsJson from "../config/tenants.json";

export interface TenantAdmin {
  email: string;
  name: string;
  passwordHash: string;
  sanityUserId: string; // Stable per-admin identifier for renderingUsage + createdBy
}

export interface TenantConfig {
  id: string;
  designerName: string;
  businessName: string;
  domain: string;
  contactEmail: string;
  senderEmail: string;
  sanity: {
    projectId: string;
    dataset: string;
    writeTokenEnv: string;
  };
  featureFlags: Record<string, boolean>;
  renderingLimits: {
    monthlyAllocation: number;
  };
  admins: TenantAdmin[];
}

const tenants: TenantConfig[] = tenantsJson as TenantConfig[];

export function getTenantById(id: string): TenantConfig | undefined {
  return tenants.find((t) => t.id === id);
}

export function getTenantByAdminEmail(email: string): TenantConfig | undefined {
  return tenants.find((t) =>
    t.admins.some((a) => a.email.toLowerCase() === email.toLowerCase()),
  );
}

export function getAdminBySanityUserId(
  tenantId: string,
  sanityUserId: string,
): TenantAdmin | undefined {
  const tenant = getTenantById(tenantId);
  return tenant?.admins.find((a) => a.sanityUserId === sanityUserId);
}
