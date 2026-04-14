import { defineType, defineField, defineArrayMember } from "sanity";

export const contractor = defineType({
  name: "contractor",
  title: "Contractor",
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
      name: "company",
      title: "Company",
      type: "string",
    }),
    defineField({
      name: "trades",
      title: "Trades",
      type: "array",
      description:
        "Freeform — type any trade name. Added via the /admin/contractors edit form.",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "documents",
      title: "Documents",
      type: "array",
      description: "1099s, insurance certificates, and other contractor documents",
      of: [
        defineArrayMember({
          type: "object",
          name: "contractorDocument",
          fields: [
            defineField({ name: "fileName", title: "File Name", type: "string", validation: (r) => r.required() }),
            defineField({ name: "fileType", title: "File Type", type: "string" }),
            defineField({ name: "url", title: "URL", type: "url", validation: (r) => r.required() }),
            defineField({ name: "uploadedAt", title: "Uploaded At", type: "datetime" }),
          ],
          preview: {
            select: { title: "fileName", subtitle: "fileType" },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "company" },
  },
});
