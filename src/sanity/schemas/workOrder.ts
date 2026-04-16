import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * Phase 39 Plan 01 — Work Order document type.
 *
 * A Work Order binds one project × one contractor + a snapshot of
 * selected procurement-item _keys + special instructions + ad-hoc
 * custom fields. It is persisted (not generated-on-send) so it owns
 * a permalink and the contractor always sees the latest version.
 *
 * See .planning/phases/39-work-order-documents-panels/39-CONTEXT.md
 * (D-01..D-11) and 39-RESEARCH.md § Pattern 4 for decisions.
 */
export const workOrder = defineType({
  name: "workOrder",
  title: "Work Order",
  type: "document",
  fields: [
    defineField({
      name: "project",
      title: "Project",
      type: "reference",
      to: [{ type: "project" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "contractor",
      title: "Contractor",
      type: "reference",
      to: [{ type: "contractor" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "selectedItemKeys",
      title: "Selected Procurement Item Keys",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      description:
        "Keys of selected procurementItems on the project (snapshot of selection, not a live join).",
    }),
    defineField({
      name: "specialInstructions",
      title: "Special Instructions",
      type: "text",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "customFields",
      title: "Custom Fields",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "workOrderCustomField",
          fields: [
            defineField({
              name: "key",
              title: "Key",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({ name: "value", title: "Value", type: "string" }),
            defineField({
              name: "preset",
              title: "Preset",
              type: "boolean",
              initialValue: false,
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "lastSentAt",
      title: "Last Sent At",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "sendLog",
      title: "Send Log",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          name: "workOrderSendEntry",
          fields: [
            defineField({ name: "sentAt", title: "Sent At", type: "datetime" }),
            defineField({ name: "toEmail", title: "To", type: "string" }),
            defineField({ name: "ccEmails", title: "CC", type: "string" }),
            defineField({ name: "resendId", title: "Resend ID", type: "string" }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      projectTitle: "project.title",
      contractorName: "contractor.name",
      lastSentAt: "lastSentAt",
    },
    prepare: ({ projectTitle, contractorName, lastSentAt }) => ({
      title: projectTitle || "Untitled project",
      subtitle: contractorName
        ? lastSentAt
          ? `${contractorName} • sent ${new Date(lastSentAt).toLocaleDateString()}`
          : `${contractorName} • not yet sent`
        : "No contractor",
    }),
  },
});
