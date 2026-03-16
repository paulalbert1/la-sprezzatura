import { defineType, defineField, defineArrayMember } from "sanity";
import { generatePortalToken } from "../../lib/generateToken";
import { PortalUrlDisplay } from "../components/PortalUrlDisplay";

export const project = defineType({
  name: "project",
  title: "Portfolio Project",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "portal", title: "Client Portal" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Project Title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroImage",
      title: "Main Photo",
      type: "image",
      group: "content",
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
      group: "content",
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
      group: "content",
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
      group: "content",
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
      group: "content",
      description: "e.g., North Shore, Long Island",
    }),
    defineField({
      name: "description",
      title: "Project Overview",
      type: "text",
      group: "content",
      rows: 3,
    }),
    defineField({
      name: "challenge",
      title: "Design Challenge",
      type: "array",
      group: "content",
      of: [{ type: "block" }],
      description: "What was the design challenge for this project?",
    }),
    defineField({
      name: "approach",
      title: "Our Approach",
      type: "array",
      group: "content",
      of: [{ type: "block" }],
      description: "How did we approach the design?",
    }),
    defineField({
      name: "outcome",
      title: "The Result",
      type: "array",
      group: "content",
      of: [{ type: "block" }],
      description: "What was the final outcome?",
    }),
    defineField({
      name: "testimonial",
      title: "Client Testimonial",
      type: "object",
      group: "content",
      fields: [
        defineField({ name: "quote", title: "Quote", type: "text" }),
        defineField({ name: "author", title: "Client Name", type: "string" }),
      ],
    }),
    defineField({
      name: "completionDate",
      title: "Completion Date",
      type: "date",
      group: "content",
    }),
    defineField({
      name: "featured",
      title: "Feature on Home Page",
      type: "boolean",
      group: "content",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      group: "content",
      description: "Lower numbers appear first",
    }),
    // Phase 3: Pipeline stage and client portal fields
    defineField({
      name: "pipelineStage",
      title: "Pipeline Stage",
      type: "string",
      group: "portal",
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
    }),
    defineField({
      name: "portalToken",
      title: "Portal Token",
      type: "string",
      group: "portal",
      readOnly: true,
      initialValue: () => generatePortalToken(),
      components: {
        input: PortalUrlDisplay,
      },
    }),
    defineField({
      name: "portalEnabled",
      title: "Portal Enabled",
      type: "boolean",
      group: "portal",
      initialValue: false,
      description: "Toggle to activate this project's client portal link",
    }),
    defineField({
      name: "clients",
      title: "Clients",
      type: "array",
      group: "portal",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "client",
              title: "Client",
              type: "reference",
              to: [{ type: "client" }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: "isPrimary",
              title: "Primary Contact",
              type: "boolean",
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: "client.name", subtitle: "isPrimary" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Select client",
              subtitle: subtitle ? "Primary Contact" : "Additional Client",
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "engagementType",
      title: "Engagement Type",
      type: "string",
      group: "portal",
      options: {
        list: [
          { title: "Full Interior Design", value: "full-interior-design" },
          { title: "Styling & Refreshing", value: "styling-refreshing" },
          { title: "Carpet Curating", value: "carpet-curating" },
        ],
      },
    }),
    defineField({
      name: "projectAddress",
      title: "Project Location",
      type: "object",
      group: "portal",
      fields: [
        defineField({ name: "street", title: "Street", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "state", title: "State", type: "string" }),
        defineField({ name: "zip", title: "ZIP Code", type: "string" }),
        defineField({
          name: "adminNotes",
          title: "Access Notes (Internal)",
          type: "text",
          rows: 2,
          description:
            "e.g., Gate code, entry instructions \u2014 never shown to clients",
        }),
      ],
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
