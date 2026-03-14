import { defineType, defineField } from "sanity";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Service Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      description: "A brief one-liner describing this service",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
      description: "Full description of what this service includes",
    }),
    defineField({
      name: "features",
      title: "What's Included",
      type: "array",
      of: [{ type: "string" }],
      description: "Bullet points of what's included in this service",
    }),
    defineField({
      name: "idealFor",
      title: "Ideal For",
      type: "string",
      description: "Who this service is best suited for",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower numbers appear first",
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description: "Emoji or icon name for this service",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "tagline",
    },
  },
});
