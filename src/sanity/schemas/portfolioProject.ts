import { defineType, defineField } from "sanity";

export const portfolioProject = defineType({
  name: "portfolioProject",
  title: "Portfolio Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Project Title",
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
      name: "location",
      title: "Location",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      options: { hotspot: true, metadata: ["lqip", "palette"] },
    }),
    defineField({
      name: "images",
      title: "Gallery",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true, metadata: ["lqip"] },
          fields: [
            defineField({ name: "alt", title: "Image Description", type: "string" }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
        },
      ],
    }),
    defineField({
      name: "roomType",
      title: "Room Type",
      type: "string",
      options: {
        list: [
          { title: "Living Room", value: "living-room" },
          { title: "Kitchen", value: "kitchen" },
          { title: "Bedroom", value: "bedroom" },
          { title: "Bathroom", value: "bathroom" },
          { title: "Dining Room", value: "dining-room" },
          { title: "Home Office", value: "home-office" },
          { title: "Outdoor", value: "outdoor" },
          { title: "Full Home", value: "full-home" },
        ],
      },
    }),
    defineField({
      name: "challenge",
      title: "Design Challenge",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "approach",
      title: "Our Approach",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "outcome",
      title: "The Result",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "testimonial",
      title: "Client Testimonial",
      type: "object",
      fields: [
        defineField({ name: "quote", title: "Quote", type: "text" }),
        defineField({ name: "author", title: "Client Name", type: "string" }),
      ],
    }),
    defineField({
      name: "completionDate",
      title: "Completion Date",
      type: "date",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
    }),
    defineField({
      name: "sourceAdminProjectId",
      title: "Source Admin Project",
      type: "string",
      readOnly: true,
      description: "ID of the admin project this was created from",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "location", media: "heroImage" },
  },
});
