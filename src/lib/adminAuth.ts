/**
 * Admin password verification module.
 *
 * Verifies admin credentials against bcrypt password hashes stored
 * in the tenant configuration. Returns the matching tenant and admin
 * record on success, null on failure.
 *
 * Security: Uses bcrypt with cost factor 10 for password hashing.
 * Error responses are intentionally generic to prevent user enumeration.
 */
import bcrypt from "bcryptjs";
import {
  getTenantByAdminEmail,
  type TenantConfig,
  type TenantAdmin,
} from "./tenants";

export async function verifyAdminPassword(
  email: string,
  password: string,
): Promise<{ tenant: TenantConfig; admin: TenantAdmin } | null> {
  const tenant = getTenantByAdminEmail(email);
  if (!tenant) return null;

  const admin = tenant.admins.find(
    (a) => a.email.toLowerCase() === email.toLowerCase(),
  );
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  return { tenant, admin };
}
