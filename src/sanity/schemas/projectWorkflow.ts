import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * Phase 44 Plan 01 — Project Workflow document type.
 *
 * A ProjectWorkflow binds one project to a workflow instance cloned from
 * a WorkflowTemplate at instantiation time. The template snapshot (phases,
 * milestones, defaults) lives entirely in this document — so deleting or
 * editing a template does NOT change existing project workflows.
 *
 * templateId is a plain string (NOT a Sanity reference) per Pitfall 3:
 * templates can be deleted while project workflows still reference them.
 * The workflow carries its own phase snapshot so the string is just a
 * back-link for analytics/auditing.
 *
 * See .planning/phases/44-workflow-engine/44-CONTEXT.md (D-03) and
 * 44-RESEARCH.md § Pitfall 3.
 */
export const projectWorkflow = defineType({
  name: "projectWorkflow",
  title: "Project Workflow",
  type: "document",
  fields: [
    defineField({
      name: "project",
      title: "Project",
      type: "reference",
      to: [{ type: "project" }],
      validation: (r) => r.required(),
    }),
    // templateId is a plain string, NOT a reference, per Pitfall 3:
    // templates can be deleted while projects still reference them; the
    // workflow carries its own phase snapshot so the string is just a back-link.
    defineField({ name: "templateId", type: "string", validation: (r) => r.required() }),
    defineField({ name: "templateVersion", type: "number", validation: (r) => r.required() }),
    defineField({
      name: "status",
      type: "string",
      options: { list: ["active", "dormant", "complete", "terminated"] },
      initialValue: "active",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "defaults",
      type: "object",
      fields: [
        defineField({ name: "clientApprovalDays", type: "number" }),
        defineField({ name: "dormancyDays", type: "number" }),
        defineField({ name: "revisionRounds", type: "number" }),
      ],
    }),
    defineField({
      name: "phases",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "phaseInstance",
          fields: [
            defineField({ name: "id", type: "string", validation: (r) => r.required() }),
            defineField({ name: "name", type: "string", validation: (r) => r.required() }),
            defineField({ name: "order", type: "number" }),
            defineField({
              name: "execution",
              type: "string",
              options: { list: ["sequential", "parallel"] },
            }),
            defineField({
              name: "canOverlapWith",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
            }),
            defineField({
              name: "milestones",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "milestoneInstance",
                  fields: [
                    defineField({ name: "id", type: "string", validation: (r) => r.required() }),
                    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
                    defineField({
                      name: "assignee",
                      type: "string",
                      options: { list: ["designer", "client", "vendor", "trade"] },
                    }),
                    defineField({
                      name: "gate",
                      type: "string",
                      options: { list: ["payment", "approval", "signature", "delivery"] },
                    }),
                    defineField({ name: "optional", type: "boolean", initialValue: false }),
                    defineField({ name: "multiInstance", type: "boolean", initialValue: false }),
                    defineField({
                      name: "hardPrereqs",
                      type: "array",
                      of: [defineArrayMember({ type: "string" })],
                    }),
                    defineField({
                      name: "softPrereqs",
                      type: "array",
                      of: [defineArrayMember({ type: "string" })],
                    }),
                    defineField({
                      name: "status",
                      type: "string",
                      options: {
                        list: [
                          "not_started",
                          "in_progress",
                          "awaiting_client",
                          "awaiting_payment",
                          "complete",
                          "skipped",
                        ],
                      },
                      initialValue: "not_started",
                      validation: (r) => r.required(),
                    }),
                    defineField({ name: "startedAt", type: "datetime" }),
                    defineField({ name: "completedAt", type: "datetime" }),
                    defineField({ name: "linkedPaymentId", type: "string" }),
                    defineField({ name: "approvalReceivedAt", type: "datetime" }),
                    defineField({ name: "signedAt", type: "datetime" }),
                    defineField({ name: "deliveredAt", type: "datetime" }),
                    defineField({
                      name: "instances",
                      type: "array",
                      of: [
                        defineArrayMember({
                          type: "object",
                          name: "contractorInstance",
                          fields: [
                            defineField({
                              name: "name",
                              type: "string",
                              validation: (r) => r.required(),
                            }),
                            defineField({
                              name: "status",
                              type: "string",
                              options: {
                                list: [
                                  "not_started",
                                  "in_progress",
                                  "awaiting_client",
                                  "awaiting_payment",
                                  "complete",
                                  "skipped",
                                ],
                              },
                              initialValue: "not_started",
                            }),
                            defineField({ name: "fromTemplate", type: "boolean", initialValue: false }),
                            defineField({ name: "startedAt", type: "datetime" }),
                            defineField({ name: "completedAt", type: "datetime" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({ name: "createdAt", type: "datetime", readOnly: true }),
    defineField({ name: "lastActivityAt", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "terminatedAt", type: "datetime" }),
    defineField({ name: "completedAt", type: "datetime" }),
  ],
  preview: {
    select: { projectTitle: "project.title", status: "status" },
    prepare: ({ projectTitle, status }: { projectTitle?: string; status?: string }) => ({
      title: projectTitle || "Untitled project",
      subtitle: `Workflow · ${status ?? "active"}`,
    }),
  },
});
