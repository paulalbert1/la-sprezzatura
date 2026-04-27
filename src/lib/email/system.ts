// src/lib/email/system.ts
//
// System / account email sender constants (D-4).
//
// Tenant emails (Send Update, Work Order, portal/building/workorder access invites)
// use the tenant's siteSettings.defaultFromName + defaultFromEmail.
//
// System emails (password reset, signup confirmation, billing notices) use these
// constants. Sender domain is decoupled from app brand per phase 45-03's app-rename
// decision: lasprezz.com is the sending domain for the foreseeable future.
//
// As of phase 45.5 there are no system emails in the codebase. These constants
// exist so that when system emails are introduced, the tenant-vs-platform sender
// split is already architecturally documented.

export const SYSTEM_FROM_NAME = "Sprezza Hub";
export const SYSTEM_FROM_EMAIL = "noreply@lasprezz.com";

/**
 * Format the system sender as the canonical "Display Name <addr>" string
 * accepted by Resend's `from` field.
 */
export function formatSystemSender(): string {
  return `${SYSTEM_FROM_NAME} <${SYSTEM_FROM_EMAIL}>`;
}
