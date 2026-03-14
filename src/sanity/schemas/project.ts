import { defineType, defineField } from "sanity";

export const project = defineType({
  name: "project",
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroImage",
      title: "Main Photo",
      type: "image",
      options: {
        hotspot: true,
        metadata: ["lqip", "palette"],
      },
      validation: (rule) => rule.required().assetRequired(),
    }),
    defineField({
      name: "images",
      title: "Project Gallery",
      type: "array",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
            metadata: ["lqip"],
          },
          fields: [
            defineField({
              name: "alt",
              title: "Image Description",
              type: "string",
            }),
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
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
      name: "style",
      title: "Design Style",
      type: "string",
      options: {
        list: [
          { title: "Contemporary", value: "contemporary" },
          { title: "Traditional", value: "traditional" },
          { title: "Transitional", value: "transitional" },
          { title: "Coastal", value: "coastal" },
          { title: "Modern", value: "modern" },
        ],
      },
    }),
    defineField({
      name: "location",
      title: "Project Location",
      type: "string",
      description: "e.g., North Shore, Long Island",
    }),
    defineField({
      name: "description",
      title: "Project Overview",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "challenge",
      title: "Design Challenge",
      type: "array",
      of: [{ type: "block" }],
      description: "What was the design challenge for this project?",
    }),
    defineField({
      name: "approach",
      title: "Our Approach",
      type: "array",
      of: [{ type: "block" }],
      description: "How did we approach the design?",
    }),
    defineField({
      name: "outcome",
      title: "The Result",
      type: "array",
      of: [{ type: "block" }],
      description: "What was the final outcome?",
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
      title: "Feature on Home Page",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower numbers appear first",
    }),
    // Phase 3 forward-compatibility: pipeline stage for client portal
    defineField({
      name: "pipelineStage",
      title: "Pipeline Stage",
      type: "string",
      options: {
        list: [
          { title: "Discovery", value: "discovery" },
          { title: "Concept", value: "concept" },
          { title: "Design Development", value: "design-development" },
          { title: "Procurement", value: "procurement" },
          { title: "Installation", value: "installation" },
          { title: "Closeout", value: "closeout" },
        ],
      },
      hidden: true, // Hidden in Phase 2 -- exposed in Phase 3
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "location",
      media: "heroImage",
    },
  },
});
