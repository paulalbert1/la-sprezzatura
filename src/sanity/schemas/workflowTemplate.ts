import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * Phase 44 Plan 01 — Workflow Template document type.
 *
 * A WorkflowTemplate defines the phase/milestone/gate structure that the
 * workflow engine clones (snapshots) when instantiating a ProjectWorkflow.
 * Templates can be edited after instantiation; existing ProjectWorkflow
 * documents carry their own snapshot and are not affected by template edits.
 *
 * See .planning/phases/44-workflow-engine/44-CONTEXT.md (D-02, D-06, D-07)
 * and 44-RESEARCH.md § Code Examples → Sanity Document Schema.
 */
export const workflowTemplate = defineType({
  name: "workflowTemplate",
  title: "Workflow Template",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "version", type: "number", initialValue: 1, validation: (r) => r.required().min(1) }),
    defineField({
      name: "defaults",
      type: "object",
      fields: [
        defineField({ name: "clientApprovalDays", type: "number", initialValue: 10 }),
        defineField({ name: "dormancyDays", type: "number", initialValue: 60 }),
        defineField({ name: "revisionRounds", type: "number", initialValue: 1 }),
      ],
    }),
    defineField({
      name: "phases",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "phaseTemplate",
          fields: [
            defineField({ name: "id", type: "string", validation: (r) => r.required() }),
            defineField({ name: "name", type: "string", validation: (r) => r.required() }),
            defineField({ name: "order", type: "number" }),
            defineField({
              name: "execution",
              type: "string",
              options: { list: ["sequential", "parallel"] },
              initialValue: "sequential",
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
                  name: "milestoneTemplate",
                  fields: [
                    defineField({ name: "id", type: "string", validation: (r) => r.required() }),
                    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
                    defineField({
                      name: "assignee",
                      type: "string",
                      options: { list: ["designer", "client", "vendor", "trade"] },
                      initialValue: "designer",
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
                      name: "defaultInstances",
                      type: "array",
                      of: [
                        defineArrayMember({
                          type: "object",
                          name: "defaultInstance",
                          fields: [
                            defineField({
                              name: "name",
                              type: "string",
                              validation: (r) => r.required(),
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
      ],
    }),
    defineField({ name: "createdAt", type: "datetime", readOnly: true }),
    defineField({ name: "updatedAt", type: "datetime" }),
  ],
  preview: {
    select: { name: "name", version: "version", phases: "phases" },
    prepare: ({ name, version, phases }: { name?: string; version?: number; phases?: unknown[] }) => ({
      title: name || "Untitled template",
      subtitle: `v${version ?? 1} · ${Array.isArray(phases) ? phases.length : 0} phases`,
    }),
  },
});
