import { defineType, defineField } from "sanity";

/**
 * Phase 49 Plan 02 — Impersonation audit log document type.
 *
 * Per CONTEXT D-17, audit rows are document-per-event (NOT a single doc
 * with entries[]). Required fields below validate the IMPER-06 invariants.
 *
 * D-18 trade-off (NOT strictly append-only): at mint we write BOTH a
 * 'start' doc AND a draft 'timeout' doc with exitedAt = mintedAt + 30min.
 * On manual exit OR admin-logout, the timeout doc is deleted by sessionId
 * and a fresh 'exit' doc is created. If the admin never exits, the
 * timeout doc remains as the IMPER-06 row. This compromises strict
 * append-only and is documented here intentionally — the trade-off avoids
 * new infra (no cron / QStash) for v5.3 single-tenant volume.
 *
 * sessionId is a SHA-256 hash of the impersonation token, NEVER the raw
 * token (D-17): the audit log is long-lived and a raw token there would
 * turn it into a credential cache.
 *
 * Tenant scoping is enforced by `getTenantClient` dataset routing
 * (49-RESEARCH); the `tenantId` field below exists for filtering and
 * cross-tenant audit aggregation, NOT as a security boundary.
 *
 * See .planning/phases/49-impersonation-architecture/49-CONTEXT.md D-17, D-18.
 */
export const impersonationAudit = defineType({
  name: "impersonationAudit",
  title: "Impersonation Audit",
  type: "document",
  fields: [
    defineField({
      name: "tenantId",
      title: "Tenant ID",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sessionId",
      title: "Session ID (SHA-256 hash of impersonation token)",
      type: "string",
      description:
        "SHA-256 hash of the impersonation token, NEVER the raw token (D-17).",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "eventType",
      title: "Event Type",
      type: "string",
      options: { list: ["start", "exit", "timeout"] },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "adminEmail",
      title: "Admin Email",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "adminEntityId",
      title: "Admin Entity ID",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "targetRole",
      title: "Target Role",
      type: "string",
      options: { list: ["client", "contractor", "building_manager"] },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "targetEntityId",
      title: "Target Entity ID",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "targetEntityName",
      title: "Target Entity Name (denormalized)",
      type: "string",
      description: "Denormalized for log readability when viewed via Vision.",
    }),
    defineField({
      name: "projectId",
      title: "Project ID",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "projectName",
      title: "Project Name (denormalized)",
      type: "string",
      description: "Denormalized for log readability when viewed via Vision.",
    }),
    defineField({
      name: "mintedAt",
      title: "Minted At",
      type: "string",
      description: "ISO8601 timestamp at which the impersonation session was minted.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "exitedAt",
      title: "Exited At",
      type: "string",
      description:
        "ISO8601 timestamp at which the impersonation session ended. Null on 'start' docs.",
    }),
    defineField({
      name: "exitReason",
      title: "Exit Reason",
      type: "string",
      options: { list: ["manual", "ttl", "admin-logout"] },
      description: "Null on 'start' docs; closed enum otherwise.",
    }),
  ],
  preview: {
    select: {
      title: "adminEmail",
      subtitle: "eventType",
      description: "targetEntityName",
    },
  },
});
