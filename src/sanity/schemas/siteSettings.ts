import { defineType, defineField, defineArrayMember } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  groups: [
    { name: "rendering", title: "Rendering" },
  ],
  fields: [
    defineField({
      name: "siteTitle",
      title: "Site Title",
      type: "string",
      initialValue: "La Sprezzatura",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
    }),
    defineField({
      name: "contactEmail",
      title: "Contact Email",
      type: "string",
    }),
    defineField({
      name: "contactPhone",
      title: "Phone Number",
      type: "string",
    }),
    defineField({
      name: "studioLocation",
      title: "Studio Location",
      type: "string",
      description: "General area (e.g., Long Island, NY) -- not a home address",
    }),
    defineField({
      name: "socialLinks",
      title: "Social Media Links",
      type: "object",
      fields: [
        defineField({ name: "instagram", title: "Instagram URL", type: "url" }),
        defineField({ name: "pinterest", title: "Pinterest URL", type: "url" }),
        defineField({ name: "houzz", title: "Houzz URL", type: "url" }),
      ],
    }),
    defineField({
      name: "heroSlideshow",
      title: "Hero Slideshow",
      type: "array",
      description: "Images that rotate in the homepage hero. Drag to reorder.",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
              description: "Describe what is shown in the image for accessibility.",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: "alt", media: "image" },
          },
        }),
      ],
    }),
    // Phase 10: Rendering configuration
    defineField({
      name: "renderingAllocation",
      title: "Monthly Rendering Limit",
      type: "number",
      group: "rendering",
      description: "Maximum AI renderings per designer per month",
      initialValue: 50,
      validation: (r) => r.integer().min(1),
    }),
    defineField({
      name: "renderingImageTypes",
      title: "Image Types",
      type: "array",
      group: "rendering",
      description:
        "Configurable dropdown options for rendering input image classification",
      initialValue: [
        "Floor Plan",
        "Existing Space Photo",
        "Inspiration",
        "Material/Finish Sample",
        "Furniture Reference",
        "Fixture Reference",
        "Custom",
      ],
      of: [{ type: "string" }],
    }),
    defineField({
      name: "renderingExcludedUsers",
      title: "Excluded Users",
      type: "array",
      group: "rendering",
      description: "Sanity user IDs excluded from rendering access",
      of: [{ type: "string" }],
    }),
  ],
});
