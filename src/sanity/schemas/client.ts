import { defineType, defineField } from "sanity";

export const client = defineType({
  name: "client",
  title: "Client",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Full Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "email",
      title: "Email Address",
      type: "string",
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
    }),
    defineField({
      name: "preferredContact",
      title: "Preferred Contact Method",
      type: "string",
      description:
        "How Liz prefers to reach this client \u2014 internal note only",
      options: {
        list: [
          { title: "Phone", value: "phone" },
          { title: "Email", value: "email" },
          { title: "Text", value: "text" },
        ],
      },
    }),
    defineField({
      name: "address",
      title: "Home / Billing Address",
      type: "object",
      fields: [
        defineField({ name: "street", title: "Street", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "state", title: "State", type: "string" }),
        defineField({ name: "zip", title: "ZIP Code", type: "string" }),
      ],
    }),
    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Private notes about this client -- not visible to clients",
      validation: (r) => r.max(2000),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "email" },
  },
});
