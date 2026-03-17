import { defineType, defineField, defineArrayMember } from "sanity";

export const renderingSession = defineType({
  name: "renderingSession",
  title: "Rendering Session",
  type: "document",
  groups: [
    { name: "setup", title: "Setup", default: true },
    { name: "inputs", title: "Inputs" },
    { name: "renderings", title: "Renderings" },
    { name: "metadata", title: "Metadata" },
  ],
  fields: [
    // -- Setup group --
    defineField({
      name: "sessionTitle",
      title: "Session Title",
      type: "string",
      group: "setup",
      description: "Give this session a descriptive name.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "project",
      title: "Project",
      type: "reference",
      to: [{ type: "project" }],
      group: "setup",
      description:
        "Link to a client project, or leave empty for scratchpad",
    }),
    defineField({
      name: "aspectRatio",
      title: "Aspect Ratio",
      type: "string",
      group: "setup",
      options: {
        list: ["16:9", "1:1", "4:3"],
      },
      initialValue: "16:9",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "stylePreset",
      title: "Design Style",
      type: "string",
      group: "setup",
      description:
        "Enter a design style or leave empty for the AI to interpret from your description.",
    }),
    defineField({
      name: "description",
      title: "Design Vision",
      type: "text",
      group: "setup",
      description:
        "Write naturally -- the system structures your description for the AI.",
      rows: 4,
      validation: (r) => r.required(),
    }),

    // -- Inputs group --
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      group: "inputs",
      of: [
        defineArrayMember({
          type: "object",
          name: "renderingImage",
          fields: [
            defineField({
              name: "blobPathname",
              title: "Image Path",
              type: "string",
              readOnly: true,
              validation: (r) => r.required(),
            }),
            defineField({
              name: "imageType",
              title: "Image Type",
              type: "string",
              options: {
                list: [
                  "Floor Plan",
                  "Existing Space Photo",
                  "Inspiration",
                  "Material/Finish Sample",
                  "Furniture Reference",
                  "Fixture Reference",
                  "Custom",
                ],
              },
              validation: (r) => r.required(),
            }),
            defineField({
              name: "location",
              title: "Placement",
              type: "string",
              description: "Describe the relative position in the room.",
            }),
            defineField({
              name: "notes",
              title: "Notes",
              type: "string",
            }),
            defineField({
              name: "copyExact",
              title: "Replicate Exactly",
              type: "boolean",
              initialValue: false,
            }),
          ],
        }),
      ],
    }),

    // -- Renderings group --
    defineField({
      name: "renderings",
      title: "Renderings",
      type: "array",
      group: "renderings",
      of: [
        defineArrayMember({
          type: "object",
          name: "renderingOutput",
          fields: [
            defineField({
              name: "blobPathname",
              title: "Image Path",
              type: "string",
            }),
            defineField({
              name: "prompt",
              title: "Composed Prompt",
              type: "text",
              hidden: true,
            }),
            defineField({
              name: "textResponse",
              title: "AI Response",
              type: "text",
            }),
            defineField({
              name: "isPromoted",
              title: "Promoted",
              type: "boolean",
              initialValue: false,
            }),
            defineField({
              name: "generatedAt",
              title: "Generated At",
              type: "datetime",
            }),
            defineField({
              name: "status",
              title: "Status",
              type: "string",
              options: {
                list: ["generating", "complete", "error"],
              },
            }),
            defineField({
              name: "errorMessage",
              title: "Error",
              type: "string",
            }),
            defineField({
              name: "modelId",
              title: "Model",
              type: "string",
            }),
            defineField({
              name: "latencyMs",
              title: "Latency (ms)",
              type: "number",
            }),
            defineField({
              name: "inputTokens",
              title: "Input Tokens",
              type: "number",
            }),
            defineField({
              name: "outputTokens",
              title: "Output Tokens",
              type: "number",
            }),
            defineField({
              name: "costEstimate",
              title: "Cost (cents)",
              type: "number",
              validation: (r) => r.integer().min(0),
            }),
            defineField({
              name: "bytesStored",
              title: "Image Size (bytes)",
              type: "number",
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "conversation",
      title: "Conversation",
      type: "array",
      group: "renderings",
      of: [
        defineArrayMember({
          type: "object",
          name: "conversationEntry",
          fields: [
            defineField({
              name: "role",
              title: "Role",
              type: "string",
              options: {
                list: ["user", "model"],
              },
            }),
            defineField({
              name: "text",
              title: "Message",
              type: "text",
            }),
            defineField({
              name: "image",
              title: "Image",
              type: "string",
            }),
            defineField({
              name: "timestamp",
              title: "Time",
              type: "datetime",
            }),
          ],
        }),
      ],
    }),

    // -- Metadata group --
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "metadata",
      options: {
        list: ["idle", "generating", "complete", "error"],
      },
      initialValue: "idle",
      readOnly: true,
    }),
    defineField({
      name: "lastError",
      title: "Last Error",
      type: "string",
      group: "metadata",
      readOnly: true,
      hidden: ({ value }) => !value,
    }),
    defineField({
      name: "createdBy",
      title: "Created By",
      type: "string",
      group: "metadata",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      group: "metadata",
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "sessionTitle",
      projectTitle: "project.title",
    },
    prepare: ({ title, projectTitle }) => ({
      title: title || "Untitled Session",
      subtitle: projectTitle || "Scratchpad",
    }),
  },
});
