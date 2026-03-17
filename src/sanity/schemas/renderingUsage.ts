import { defineType, defineField } from "sanity";

export const renderingUsage = defineType({
  name: "renderingUsage",
  title: "Rendering Usage",
  type: "document",
  fields: [
    defineField({
      name: "sanityUserId",
      title: "Designer",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "month",
      title: "Month",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "count",
      title: "Generations",
      type: "number",
      initialValue: 0,
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: "limit",
      title: "Monthly Limit",
      type: "number",
      validation: (r) => r.integer().min(1),
    }),
    defineField({
      name: "bytesStored",
      title: "Storage (bytes)",
      type: "number",
      initialValue: 0,
      validation: (r) => r.integer().min(0),
    }),
  ],
  preview: {
    select: {
      month: "month",
      sanityUserId: "sanityUserId",
    },
    prepare: ({ month, sanityUserId }) => ({
      title: `${month || "Unknown"} - ${sanityUserId || "Unknown"}`,
    }),
  },
});
