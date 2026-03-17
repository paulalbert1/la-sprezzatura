import { defineType, defineField, defineArrayMember } from "sanity";

export const designOption = defineType({
  name: "designOption",
  title: "Design Option",
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
      name: "blobPathname",
      title: "Image Path",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "Add a caption to help clients understand this option.",
    }),
    defineField({
      name: "sourceSession",
      title: "Source Session",
      type: "reference",
      to: [{ type: "renderingSession" }],
      readOnly: true,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sourceRenderingIndex",
      title: "Source Index",
      type: "number",
      readOnly: true,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      readOnly: true,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "promotedAt",
      title: "Promoted At",
      type: "datetime",
      readOnly: true,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "promotedBy",
      title: "Promoted By",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "reactions",
      title: "Client Reactions",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          name: "reaction",
          fields: [
            defineField({
              name: "clientId",
              title: "Client ID",
              type: "string",
            }),
            defineField({
              name: "type",
              title: "Type",
              type: "string",
              options: {
                list: ["favorite", "comment"],
              },
            }),
            defineField({
              name: "text",
              title: "Comment",
              type: "text",
            }),
            defineField({
              name: "createdAt",
              title: "Time",
              type: "datetime",
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "caption",
    },
    prepare: ({ title }) => ({
      title: title || "Untitled Design Option",
    }),
  },
});
