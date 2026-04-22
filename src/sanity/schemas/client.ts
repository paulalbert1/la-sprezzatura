import { defineType, defineField } from "sanity";

export const client = defineType({
  name: "client",
  title: "Client",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Full Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "email",
      title: "Email Address",
      type: "string",
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Home / Billing Address",
      type: "object",
      fields: [
        defineField({ name: "street", title: "Street", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "state", title: "State", type: "string" }),
        defineField({ name: "zip", title: "ZIP Code", type: "string" }),
      ],
    }),
    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Private notes about this client -- not visible to clients",
      validation: (r) => r.max(2000),
    }),
    // Phase 34 Plan 05 — D-18: per-client portal token for PURL flows.
    // Lazy-generated on first Send Update (via setIfMissing in
    // src/pages/api/send-update.ts) or via the regenerate-portal-token
    // action in src/pages/api/admin/clients.ts. No initialValue — the
    // absence of a token is a first-class state that triggers lazy-gen.
    defineField({
      name: "portalToken",
      title: "Portal Token",
      type: "string",
      readOnly: true,
      description:
        "Auto-generated on first Send Update or manual regeneration. Identifies the client across all their projects.",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "email" },
  },
});
