import { defineType, defineField, defineArrayMember } from "sanity";
import {
  MasterDetailIcon,
  UsersIcon,
  CalendarIcon,
  PackageIcon,
  WrenchIcon,
  DocumentsIcon,
  BellIcon,
  ClockIcon,
  ClipboardIcon,
  ImageIcon,
} from "@sanity/icons";
import { generatePortalToken } from "../../lib/generateToken";

export const project = defineType({
  name: "project",
  title: "Portfolio Project",
  type: "document",
  groups: [
    { name: "content", title: "Content", icon: MasterDetailIcon, default: true },
    { name: "portal", title: "Client Portal", icon: UsersIcon },
    { name: "milestones", title: "Milestones", icon: CalendarIcon },
    { name: "procurement", title: "Procurement", icon: PackageIcon },
    { name: "contractors", title: "Contractors", icon: WrenchIcon },
    { name: "artifacts", title: "Artifacts", icon: DocumentsIcon },
    { name: "updates", title: "Updates", icon: BellIcon },
    { name: "schedule", title: "Schedule", icon: ClockIcon },
    { name: "tasks", title: "Tasks", icon: ClipboardIcon },
    { name: "portfolio", title: "Portfolio", icon: ImageIcon },
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
    // Phase 7: Commercial toggle
    defineField({
      name: "isCommercial",
      title: "Commercial Project",
      type: "boolean",
      group: "content",
      initialValue: false,
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
      name: "pipelineStageChangedAt",
      title: "Stage Changed At",
      type: "datetime",
      group: "portal",
      description: "Automatically set when pipeline stage changes. Used for days-in-stage computation.",
    }),
    defineField({
      name: "portalToken",
      title: "Portal Token",
      type: "string",
      group: "portal",
      readOnly: true,
      initialValue: () => generatePortalToken(),
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
    defineField({
      name: "projectStatus",
      title: "Project Status",
      type: "string",
      group: "portal",
      initialValue: "active",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "Completed", value: "completed" },
          { title: "Reopened", value: "reopened" },
        ],
      },
    }),
    defineField({
      name: "clientPortalVisibility",
      title: "Client Portal Visibility",
      type: "string",
      group: "portal",
      initialValue: "auto",
      description:
        "Controls whether this project appears on the client's portal. Auto: shown while active and for 30 days after completion (default). Always shown: extends visibility past 30 days (use for warranty access). Always hidden: hides regardless of project state.",
      options: {
        list: [
          { title: "Auto (default 30-day rule)", value: "auto" },
          { title: "Always shown", value: "shown" },
          { title: "Always hidden", value: "hidden" },
        ],
      },
    }),
    defineField({
      name: "completedAt",
      title: "Completed At",
      type: "datetime",
      group: "portal",
      readOnly: true,
      description: "Set automatically when project is completed",
    }),
    defineField({
      name: "archivedAt",
      title: "Archived At",
      type: "datetime",
      group: "portal",
      readOnly: true,
      description:
        "Set when project is archived (manually from /admin/projects/[id] or auto by /api/cron/auto-archive 90 days after completedAt). Clear to restore.",
    }),
    // Phase 6: Milestones inline array
    defineField({
      name: "milestones",
      title: "Milestones",
      type: "array",
      group: "milestones",
      of: [
        defineArrayMember({
          type: "object",
          name: "milestone",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({ name: "date", title: "Date", type: "date" }),
            defineField({
              name: "completed",
              title: "Completed",
              type: "boolean",
              initialValue: false,
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 2,
            }),
            defineField({
              name: "notes",
              title: "Client Notes",
              type: "array",
              readOnly: true,
              of: [
                defineArrayMember({
                  type: "object",
                  name: "clientNote",
                  fields: [
                    defineField({
                      name: "text",
                      title: "Note",
                      type: "string",
                    }),
                    defineField({
                      name: "clientId",
                      title: "Client ID",
                      type: "string",
                    }),
                    defineField({
                      name: "clientName",
                      title: "Client Name",
                      type: "string",
                    }),
                    defineField({
                      name: "timestamp",
                      title: "Timestamp",
                      type: "datetime",
                    }),
                  ],
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: "name",
              subtitle: "date",
              completed: "completed",
            },
            prepare: ({ title, subtitle, completed }) => ({
              title: title || "Untitled milestone",
              subtitle: `${subtitle || "No date"} ${completed ? "(Complete)" : ""}`,
            }),
          },
        }),
      ],
    }),
    // Phase 6: Procurement inline array
    defineField({
      name: "procurementItems",
      title: "Procurement Items",
      type: "array",
      group: "procurement",
      hidden: ({ document }) =>
        document?.engagementType !== "full-interior-design",
      of: [
        defineArrayMember({
          type: "object",
          name: "procurementItem",
          groups: [{ name: "email", title: "Email-facing fields" }],
          fields: [
            defineField({
              name: "name",
              title: "Item Name",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "status",
              title: "Status",
              type: "string",
              options: {
                list: [
                  { title: "Scheduled", value: "scheduled" },
                  { title: "Warehouse", value: "warehouse" },
                  { title: "In Transit", value: "in-transit" },
                  { title: "Ordered", value: "ordered" },
                  { title: "Pending order", value: "pending" },
                  { title: "Delivered", value: "delivered" },
                  { title: "Installed", value: "installed" },
                ],
              },
              initialValue: "pending",
            }),
            defineField({
              name: "orderDate",
              title: "Order Date",
              type: "date",
            }),
            defineField({
              name: "expectedDeliveryDate",
              title: "Expected Delivery Date",
              type: "date",
            }),
            defineField({
              name: "installDate",
              title: "Install Date",
              type: "date",
            }),
            defineField({
              name: "trackingNumber",
              title: "Tracking Number",
              type: "string",
            }),
            // Phase 32: Procurement editor fields
            // Phase 46-04 (D-15): vendor description augmented + email group;
            // spec added adjacent. Both surface under the item name in client
            // project update emails.
            defineField({
              name: "vendor",
              title: "Vendor",
              type: "string",
              group: "email",
              description: "Vendor or maker name (e.g., Restoration Hardware). Shown to clients under the item name in project update emails.",
            }),
            defineField({
              name: "spec",
              title: "Spec",
              type: "string",
              group: "email",
              validation: (Rule) => Rule.max(50),
              description: "Short specification line (e.g., '96″ three-seat, walnut'). Shown to clients under the vendor name in project update emails. Keep under 50 characters.",
            }),
            defineField({
              name: "notes",
              title: "Notes",
              type: "text",
              description: "Internal notes -- never shown to clients",
            }),
            defineField({
              name: "itemUrl",
              title: "Item URL",
              type: "url",
              description:
                "Link to the vendor product page (internal reference).",
            }),
            defineField({
              name: "images",
              title: "Item images",
              type: "array",
              of: [
                {
                  type: "image",
                  options: { hotspot: true, metadata: ["lqip"] },
                  fields: [
                    defineField({
                      name: "isPrimary",
                      type: "boolean",
                      title: "Primary image",
                      initialValue: false,
                    }),
                    defineField({
                      name: "caption",
                      type: "string",
                      title: "Caption (internal)",
                    }),
                  ],
                },
              ],
            }),
            defineField({
              name: "carrierETA",
              title: "Carrier ETA",
              type: "date",
              description:
                "Estimated delivery date from Ship24 carrier data",
            }),
            defineField({
              name: "carrierName",
              title: "Carrier Name",
              type: "string",
              description:
                "Carrier name from Ship24 (e.g., DHL, OnTrac)",
            }),
            defineField({
              name: "trackingUrl",
              title: "Tracking URL",
              type: "url",
              description:
                "Direct tracking URL (from Ship24 or generated locally)",
            }),
            defineField({
              name: "lastSyncAt",
              title: "Last Sync At",
              type: "datetime",
              description:
                "Timestamp of last Ship24 sync (cron or manual)",
            }),
            defineField({
              name: "retrievedStatus",
              title: "Retrieved Status",
              type: "string",
              description:
                "Latest status string pulled from the shipper's tracking API (FedEx/UPS/USPS/Ship24). Read-only; overwritten on each sync.",
            }),
            defineField({
              name: "syncSource",
              title: "Sync Source",
              type: "string",
              options: {
                list: [
                  { title: "Cron", value: "cron" },
                  { title: "Manual", value: "manual" },
                ],
              },
              description:
                "How status was last set: cron (auto), manual (force-refresh), or null (admin-set)",
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "status" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Untitled item",
              subtitle: subtitle
                ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1)
                : "No status",
            }),
          },
        }),
      ],
    }),
    // Phase 7: Contractors inline array (Full Interior Design only)
    defineField({
      name: "contractors",
      title: "Contractors",
      type: "array",
      group: "contractors",
      hidden: ({ document }) =>
        document?.engagementType !== "full-interior-design",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "contractor",
              title: "Contractor",
              type: "reference",
              to: [{ type: "contractor" }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: "estimateFile",
              title: "Estimate File",
              type: "string",
              description: "Vercel Blob pathname",
            }),
            defineField({
              name: "estimateAmount",
              title: "Estimate Amount",
              type: "number",
              validation: (r) => r.integer().min(0),
              description: "Amount in cents (e.g., 150000 = $1,500.00)",
            }),
            defineField({
              name: "scopeOfWork",
              title: "Scope of Work",
              type: "array",
              of: [{ type: "block" }],
            }),
            defineField({
              name: "startDate",
              title: "Start Date",
              type: "date",
            }),
            defineField({
              name: "endDate",
              title: "End Date",
              type: "date",
            }),
            defineField({
              name: "internalNotes",
              title: "Internal Notes",
              type: "text",
              rows: 3,
              description: "For Liz only -- never visible to contractor",
            }),
            defineField({
              name: "contractorNotes",
              title: "Notes for Contractor",
              type: "text",
              rows: 3,
              description: 'Informal instructions visible to contractor (e.g., "gate code changed to 5678")',
            }),
            defineField({
              name: "appointments",
              title: "Appointments",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({
                      name: "dateTime",
                      title: "Date & Time",
                      type: "datetime",
                      validation: (r) => r.required(),
                    }),
                    defineField({
                      name: "label",
                      title: "Label",
                      type: "string",
                      description: 'e.g., "Measurement", "Install Day 1", "Touch-up"',
                      validation: (r) => r.required(),
                    }),
                    defineField({
                      name: "notes",
                      title: "Notes for Contractor",
                      type: "text",
                      rows: 2,
                      description: 'e.g., "Bring 2" molding samples". Visible to contractor only.',
                    }),
                  ],
                  preview: {
                    select: { title: "label", subtitle: "dateTime" },
                    prepare: ({ title, subtitle }) => ({
                      title: title || "Untitled appointment",
                      subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : "No date",
                    }),
                  },
                }),
              ],
            }),
            defineField({
              name: "submissionNotes",
              title: "Contractor Notes",
              type: "array",
              readOnly: true,
              description: "Notes submitted by the contractor via the portal",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "text", title: "Note", type: "text" }),
                    defineField({ name: "contractorName", title: "Contractor Name", type: "string" }),
                    defineField({ name: "timestamp", title: "Timestamp", type: "datetime" }),
                  ],
                }),
              ],
            }),
          ],
          preview: {
            select: { title: "contractor.name", subtitle: "contractor.company" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Select contractor",
              subtitle: subtitle || "",
            }),
          },
        }),
      ],
    }),
    // Phase 7: Floor Plans (Full Interior Design only)
    defineField({
      name: "floorPlans",
      title: "Floor Plans",
      type: "array",
      group: "contractors",
      hidden: ({ document }) =>
        document?.engagementType !== "full-interior-design",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "planName",
              title: "Plan Name",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "file",
              title: "File",
              type: "string",
              description: "Vercel Blob pathname",
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 2,
            }),
          ],
          preview: {
            select: { title: "planName" },
          },
        }),
      ],
    }),
    // Phase 7: Building Manager (Commercial only)
    defineField({
      name: "buildingManager",
      title: "Building Manager",
      type: "object",
      group: "portal",
      hidden: ({ document }) => !document?.isCommercial,
      fields: [
        defineField({ name: "name", title: "Name", type: "string" }),
        defineField({ name: "email", title: "Email", type: "string" }),
        defineField({ name: "phone", title: "Phone", type: "string" }),
      ],
    }),
    // Phase 7: Certificates of Insurance (Commercial only)
    defineField({
      name: "cois",
      title: "Certificates of Insurance",
      type: "array",
      group: "portal",
      hidden: ({ document }) => !document?.isCommercial,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "issuerName",
              title: "Issuer Name",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "file",
              title: "File",
              type: "string",
              description: "Vercel Blob pathname",
            }),
            defineField({
              name: "expirationDate",
              title: "Expiration Date",
              type: "date",
            }),
            defineField({
              name: "coverageType",
              title: "Coverage Type",
              type: "string",
              options: {
                list: [
                  { title: "General Liability", value: "general-liability" },
                  { title: "Workers Comp", value: "workers-comp" },
                  { title: "Professional Liability", value: "professional-liability" },
                  { title: "Other", value: "other" },
                ],
              },
            }),
            defineField({
              name: "policyNumber",
              title: "Policy Number",
              type: "string",
            }),
          ],
          preview: {
            select: { title: "issuerName", subtitle: "coverageType" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Untitled COI",
              subtitle: subtitle
                ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1).replace(/-/g, " ")
                : "",
            }),
          },
        }),
      ],
    }),
    // Phase 7: Legal Documents (Commercial only)
    defineField({
      name: "legalDocs",
      title: "Legal Documents",
      type: "array",
      group: "portal",
      hidden: ({ document }) => !document?.isCommercial,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "documentName",
              title: "Document Name",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "file",
              title: "File",
              type: "string",
              description: "Vercel Blob pathname",
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 2,
            }),
          ],
          preview: {
            select: { title: "documentName" },
          },
        }),
      ],
    }),
    // Phase 6: Artifacts inline array
    defineField({
      name: "artifacts",
      title: "Artifacts",
      type: "array",
      group: "artifacts",
      of: [
        defineArrayMember({
          type: "object",
          name: "artifact",
          fields: [
            defineField({
              name: "artifactType",
              title: "Type",
              type: "string",
              validation: (r) => r.required(),
              options: {
                list: [
                  { title: "Proposal", value: "proposal" },
                  { title: "Floor Plan", value: "floor-plan" },
                  { title: "Design Board", value: "design-board" },
                  { title: "Contract", value: "contract" },
                  { title: "Warranty", value: "warranty" },
                  { title: "Close Document", value: "close-document" },
                  { title: "Custom", value: "custom" },
                ],
              },
            }),
            defineField({
              name: "shareableWithClient",
              title: "Shareable with client",
              type: "boolean",
              description:
                "When enabled, this artifact appears on the client portal project page. When disabled (default), the artifact is admin-only. Toggle this to expose proposals, drawings, contracts, etc. to the client.",
              initialValue: false,
            }),
            defineField({
              name: "customTypeName",
              title: "Custom Type Name",
              type: "string",
              hidden: ({ parent }) => parent?.artifactType !== "custom",
            }),
            defineField({
              name: "currentVersionKey",
              title: "Current Version Key",
              type: "string",
              readOnly: true,
              description:
                "Set automatically when client approves a version",
            }),
            defineField({
              name: "signedFile",
              title: "Signed Version (Contracts Only)",
              type: "file",
              hidden: ({ parent }) => parent?.artifactType !== "contract",
              options: { accept: ".pdf" },
            }),
            defineField({
              name: "versions",
              title: "Versions",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "artifactVersion",
                  fields: [
                    defineField({
                      name: "file",
                      title: "File",
                      type: "file",
                      validation: (r) => r.required(),
                    }),
                    defineField({
                      name: "uploadedAt",
                      title: "Uploaded At",
                      type: "datetime",
                      initialValue: () => new Date().toISOString(),
                    }),
                    defineField({
                      name: "note",
                      title: "Upload Note",
                      type: "text",
                      rows: 2,
                    }),
                  ],
                  preview: {
                    select: { subtitle: "uploadedAt" },
                    prepare: ({ subtitle }) => ({
                      title: subtitle
                        ? `Version uploaded ${new Date(subtitle).toLocaleDateString()}`
                        : "New version",
                    }),
                  },
                }),
              ],
            }),
            defineField({
              name: "decisionLog",
              title: "Decision Log",
              type: "array",
              readOnly: true,
              of: [
                defineArrayMember({
                  type: "object",
                  name: "decisionEntry",
                  fields: [
                    defineField({
                      name: "action",
                      title: "Action",
                      type: "string",
                    }),
                    defineField({
                      name: "versionKey",
                      title: "Version Key",
                      type: "string",
                    }),
                    defineField({
                      name: "clientId",
                      title: "Client ID",
                      type: "string",
                    }),
                    defineField({
                      name: "clientName",
                      title: "Client Name",
                      type: "string",
                    }),
                    defineField({
                      name: "feedback",
                      title: "Feedback",
                      type: "text",
                    }),
                    defineField({
                      name: "timestamp",
                      title: "Timestamp",
                      type: "datetime",
                    }),
                  ],
                }),
              ],
            }),
            defineField({
              name: "notes",
              title: "Client Notes",
              type: "array",
              readOnly: true,
              of: [
                defineArrayMember({
                  type: "object",
                  name: "artifactNote",
                  fields: [
                    defineField({
                      name: "text",
                      title: "Note",
                      type: "string",
                    }),
                    defineField({
                      name: "clientId",
                      title: "Client ID",
                      type: "string",
                    }),
                    defineField({
                      name: "clientName",
                      title: "Client Name",
                      type: "string",
                    }),
                    defineField({
                      name: "timestamp",
                      title: "Timestamp",
                      type: "datetime",
                    }),
                  ],
                }),
              ],
            }),
            defineField({
              name: "notificationLog",
              title: "Notification Log",
              type: "array",
              readOnly: true,
              of: [
                defineArrayMember({
                  type: "object",
                  name: "notificationEntry",
                  fields: [
                    defineField({
                      name: "sentAt",
                      title: "Sent At",
                      type: "datetime",
                    }),
                    defineField({
                      name: "recipientEmail",
                      title: "Recipient",
                      type: "string",
                    }),
                  ],
                }),
              ],
            }),
            // Phase 9: Investment Summary (proposal artifacts only)
            defineField({
              name: "investmentSummary",
              title: "Investment Summary",
              type: "object",
              hidden: ({ parent }) => parent?.artifactType !== "proposal",
              fields: [
                defineField({
                  name: "tiers",
                  title: "Tiers",
                  type: "array",
                  of: [
                    defineArrayMember({
                      type: "object",
                      fields: [
                        defineField({ name: "name", title: "Tier Name", type: "string", validation: (r) => r.required() }),
                        defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
                        defineField({
                          name: "lineItems",
                          title: "Line Items",
                          type: "array",
                          of: [
                            defineArrayMember({
                              type: "object",
                              fields: [
                                defineField({ name: "name", title: "Item", type: "string", validation: (r) => r.required() }),
                                defineField({ name: "price", title: "Price (cents)", type: "number", validation: (r) => r.integer().min(0) }),
                              ],
                              preview: {
                                select: { title: "name", subtitle: "price" },
                                prepare: ({ title, subtitle }) => ({
                                  title: title || "Untitled item",
                                  subtitle: subtitle != null ? `$${(subtitle / 100).toFixed(2)}` : "$0.00",
                                }),
                              },
                            }),
                          ],
                        }),
                      ],
                      preview: {
                        select: { title: "name", items: "lineItems" },
                        prepare: ({ title, items }) => ({
                          title: title || "Untitled tier",
                          subtitle: `${items?.length || 0} items`,
                        }),
                      },
                    }),
                  ],
                }),
                defineField({
                  name: "selectedTierKey",
                  title: "Selected Tier",
                  type: "string",
                  readOnly: true,
                  description: "Set when client selects a tier. Clear to allow re-selection.",
                }),
                defineField({
                  name: "eagerness",
                  title: "Eagerness Rating",
                  type: "number",
                  readOnly: true,
                }),
                defineField({
                  name: "reservations",
                  title: "Reservations",
                  type: "text",
                  readOnly: true,
                }),
              ],
            }),
          ],
          preview: {
            select: { title: "artifactType", subtitle: "customTypeName" },
            prepare: ({ title, subtitle }) => ({
              title:
                subtitle ||
                (title
                  ? title.charAt(0).toUpperCase() +
                    title.slice(1).replace(/-/g, " ")
                  : "Untitled artifact"),
            }),
          },
        }),
      ],
    }),
    // Phase 39 Plan 01: Project Documents panel -- general-purpose uploads
    // (Contracts, Drawings, Selections, Presentations). Intentionally separate
    // from `artifacts[]` (which carries proposal/contract workflow state).
    defineField({
      name: "projectDocuments",
      title: "Project Documents",
      type: "array",
      group: "artifacts",
      of: [
        defineArrayMember({
          type: "object",
          name: "projectDocument",
          fields: [
            defineField({
              name: "file",
              title: "File",
              type: "file",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "label",
              title: "Label",
              type: "string",
            }),
            defineField({
              name: "category",
              title: "Category",
              type: "string",
              options: {
                list: ["Contracts", "Drawings", "Selections", "Presentations"],
              },
              validation: (r) => r.required(),
            }),
            defineField({
              name: "shareableWithClient",
              title: "Shareable with client",
              type: "boolean",
              description:
                "When enabled, this document appears on the client portal project page. When disabled (default), the document is admin-only.",
              initialValue: false,
            }),
            defineField({
              name: "uploadedAt",
              title: "Uploaded At",
              type: "datetime",
            }),
            defineField({
              name: "uploadedByName",
              title: "Uploaded By",
              type: "string",
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "category" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Untitled document",
              subtitle: subtitle || "",
            }),
          },
        }),
      ],
    }),
    // Phase 9: Update Log
    defineField({
      name: "updateLog",
      title: "Sent Updates",
      type: "array",
      group: "updates",
      readOnly: true,
      description: "Log of project updates sent to clients",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "sentAt", title: "Sent At", type: "datetime" }),
            defineField({ name: "recipientEmails", title: "Recipients", type: "string" }),
            defineField({ name: "note", title: "Personal Note", type: "text" }),
            defineField({
              name: "sectionsIncluded",
              title: "Sections Included",
              type: "array",
              of: [{ type: "string" }],
            }),
          ],
          preview: {
            select: { subtitle: "sentAt", recipientEmails: "recipientEmails" },
            prepare: ({ subtitle, recipientEmails }) => ({
              title: recipientEmails || "Update sent",
              subtitle: subtitle ? new Date(subtitle).toLocaleString() : "No date",
            }),
          },
        }),
      ],
    }),
    // Phase 15: Custom schedule events (Full Interior Design only)
    defineField({
      name: "customEvents",
      title: "Custom Events",
      type: "array",
      group: "schedule",
      hidden: ({ document }) =>
        document?.engagementType !== "full-interior-design",
      of: [
        defineArrayMember({
          type: "object",
          name: "scheduleEvent",
          fields: [
            defineField({
              name: "name",
              title: "Event Name",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "date",
              title: "Date",
              type: "date",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "endDate",
              title: "End Date",
              type: "date",
              description: "Leave empty for single-day events",
            }),
            defineField({
              name: "category",
              title: "Category",
              type: "string",
              options: {
                list: [
                  { title: "Walkthrough", value: "walkthrough" },
                  { title: "Inspection", value: "inspection" },
                  { title: "Punch List", value: "punch-list" },
                  { title: "Move", value: "move" },
                  { title: "Permit / Approval", value: "permit" },
                  { title: "Delivery Window", value: "delivery-window" },
                  { title: "Client Presentation", value: "presentation" },
                  { title: "Deadline", value: "deadline" },
                  { title: "Site Access", value: "access" },
                  { title: "Other", value: "other" },
                ],
              },
            }),
            defineField({
              name: "notes",
              title: "Notes",
              type: "text",
              rows: 2,
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "date" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Untitled event",
              subtitle: subtitle || "No date",
            }),
          },
        }),
      ],
    }),
    // Phase 15+: Schedule dependencies (arrows between items on the Gantt chart)
    defineField({
      name: "scheduleDependencies",
      title: "Dependencies",
      type: "array",
      group: "schedule",
      description:
        "Define which schedule items must finish before others can start. Shows as arrow lines on the Schedule tab.",
      hidden: ({ document }) =>
        document?.engagementType !== "full-interior-design",
      of: [
        defineArrayMember({
          type: "object",
          name: "scheduleDependency",
          fields: [
            defineField({
              name: "source",
              title: "Predecessor (must finish first)",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "target",
              title: "Successor (starts after)",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "linkType",
              title: "Dependency type",
              type: "string",
              initialValue: "e2s",
              options: {
                list: [
                  { title: "End-to-Start (finish A → start B)", value: "e2s" },
                  { title: "Start-to-Start", value: "s2s" },
                  { title: "End-to-End", value: "e2e" },
                  { title: "Start-to-End", value: "s2e" },
                ],
                layout: "dropdown",
              },
            }),
          ],
          preview: {
            select: {
              title: "source",
              subtitle: "target",
              description: "linkType",
            },
          },
        }),
      ],
    }),
    // Phase 30: Tasks inline array
    defineField({
      name: "tasks",
      title: "Tasks",
      type: "array",
      group: "tasks",
      of: [
        defineArrayMember({
          type: "object",
          name: "task",
          fields: [
            defineField({
              name: "description",
              title: "Description",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({ name: "dueDate", title: "Due Date", type: "date" }),
            defineField({
              name: "completed",
              title: "Completed",
              type: "boolean",
              initialValue: false,
            }),
            defineField({ name: "completedAt", title: "Completed At", type: "datetime" }),
            defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
          ],
          preview: {
            select: { title: "description", subtitle: "dueDate", completed: "completed" },
            prepare: ({ title, subtitle, completed }) => ({
              title: title || "Untitled task",
              subtitle: `${subtitle || "No date"} ${completed ? "(Complete)" : ""}`,
            }),
          },
        }),
      ],
    }),
    // Client Action Items: tasks the client is expected to do
    // (e.g. sign off on mood board, final payment). Appears in the send-update
    // email third section and on the admin project detail page.
    defineField({
      name: "clientActionItems",
      title: "Client Action Items",
      type: "array",
      group: "tasks",
      description: "Items the client must act on — surfaced in weekly update emails.",
      of: [
        defineArrayMember({
          type: "object",
          name: "clientActionItem",
          fields: [
            defineField({
              name: "description",
              title: "Description",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({ name: "dueDate", title: "Due Date", type: "date" }),
            defineField({
              name: "completed",
              title: "Completed",
              type: "boolean",
              initialValue: false,
            }),
            defineField({ name: "completedAt", title: "Completed At", type: "datetime" }),
            defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
          ],
          preview: {
            select: { title: "description", subtitle: "dueDate", completed: "completed" },
            prepare: ({ title, subtitle, completed }) => ({
              title: title || "Untitled action item",
              subtitle: `${subtitle || "No date"} ${completed ? "(Done)" : ""}`,
            }),
          },
        }),
      ],
    }),
    // Phase 30: Activity log inline array
    defineField({
      name: "activityLog",
      title: "Activity Log",
      type: "array",
      group: "updates",
      readOnly: true,
      description: "Automated log of project mutations (task changes, milestone updates, etc.)",
      of: [
        defineArrayMember({
          type: "object",
          name: "activityEntry",
          fields: [
            defineField({
              name: "action",
              title: "Action",
              type: "string",
              options: {
                list: [
                  { title: "Task Created", value: "task-created" },
                  { title: "Task Completed", value: "task-completed" },
                  { title: "Task Reopened", value: "task-reopened" },
                  { title: "Milestone Completed", value: "milestone-completed" },
                  { title: "Procurement Status Changed", value: "procurement-status-changed" },
                  { title: "Procurement Item Updated", value: "procurement-item-updated" },
                  { title: "Document Uploaded", value: "document-uploaded" },
                ],
              },
            }),
            defineField({ name: "description", title: "Description", type: "string" }),
            defineField({ name: "actor", title: "Actor", type: "string" }),
            defineField({ name: "timestamp", title: "Timestamp", type: "datetime" }),
          ],
          preview: {
            select: { title: "description", subtitle: "timestamp" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Activity",
              subtitle: subtitle ? new Date(subtitle).toLocaleString() : "",
            }),
          },
        }),
      ],
    }),
    // Phase 31: Portfolio fields
    defineField({
      name: "showInPortfolio",
      title: "Show in Portfolio",
      type: "boolean",
      group: "portfolio",
      initialValue: false,
    }),
    defineField({
      name: "portfolioTitle",
      title: "Portfolio Display Title",
      type: "string",
      group: "portfolio",
      description: "Overrides the internal project name on the public portfolio page",
    }),
    defineField({
      name: "portfolioDescription",
      title: "Portfolio Description",
      type: "text",
      group: "portfolio",
      description: "Portfolio-specific blurb shown on the public site",
      validation: (r) => r.max(500),
    }),
    defineField({
      name: "portfolioImage",
      title: "Portfolio Featured Image",
      type: "image",
      group: "portfolio",
      options: { hotspot: true, metadata: ["lqip", "palette"] },
      description: "Overrides the main photo on the portfolio page",
    }),
    defineField({
      name: "portfolioOrder",
      title: "Portfolio Display Order",
      type: "number",
      group: "portfolio",
    }),
    defineField({
      name: "portfolioRoomTags",
      title: "Room Tags",
      type: "array",
      group: "portfolio",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
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
