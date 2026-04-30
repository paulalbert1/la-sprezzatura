import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { contactRatelimit } from "../lib/rateLimit";
import { redis } from "../lib/redis";
import { magicLinkRatelimit } from "../lib/rateLimit";
import { getClientByEmail, getClientById, getContractorByEmail, getContractorById, getProjectsByContractorId } from "../sanity/queries";
import { generatePortalToken } from "../lib/generateToken";
import { sanityWriteClient } from "../sanity/writeClient";
import { getTenantClient } from "../lib/tenantClient";
import {
  approveArtifactSchema,
  requestChangesSchema,
  milestoneNoteSchema,
  artifactNoteSchema,
  warrantyClaimSchema,
  contractorNoteSchema,
  selectTierSchema,
  archiveProjectSchema,
  setClientPortalVisibilitySchema,
} from "./portalSchemas";

export { warrantyClaimSchema };

export const server = {
  submitContact: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email required"),
      phone: z.string().min(1, "Phone number is required"),
      projectType: z.string().min(1, "Please select a project type"),
      location: z.string().optional(),
      timeline: z.string().optional(),
      description: z.string().min(10, "Please describe your project briefly"),
    }),
    handler: async (input, context) => {
      // Rate limiting by IP
      const ip =
        context.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        context.request.headers.get("x-real-ip") ||
        "unknown";
      const { success } = await contactRatelimit.limit(ip);
      if (!success) {
        throw new ActionError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many submissions. Please wait a moment before trying again.",
        });
      }

      const apiKey = import.meta.env.RESEND_API_KEY;
      const notifyEmail =
        import.meta.env.CONTACT_NOTIFY_EMAIL || "office@lasprezz.com";

      // If no API key, log to console and return success (dev mode)
      if (!apiKey) {
        console.log("[ContactForm] No RESEND_API_KEY set. Form submission received:", {
          name: input.name,
          email: input.email,
          phone: input.phone || "(not provided)",
          projectType: input.projectType,
          location: input.location || "(not provided)",
          timeline: input.timeline || "(not provided)",
          description: input.description,
        });
        return { success: true };
      }

      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      const bookingLink = "https://fantastical.app/design-b1eD/meet-with-elizabeth-olivier";

      // Notification email to Elizabeth
      const notificationHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background-color:#FAF8F5;font-family:'DM Sans',system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
            <tr>
              <td style="background-color:#C4836A;padding:24px 32px;">
                <h1 style="margin:0;font-family:Georgia,serif;font-weight:300;font-size:24px;color:#FFFFFF;letter-spacing:0.05em;">
                  La Sprezzatura
                </h1>
                <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.12em;">
                  New Inquiry
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F5F0EB;padding:32px;">
                <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-weight:400;font-size:28px;color:#2C2926;">
                  New Inquiry from ${input.name}
                </h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8E3DD;">
                      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8A8478;">Name</span><br>
                      <span style="font-size:16px;color:#2C2926;">${input.name}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8E3DD;">
                      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8A8478;">Email</span><br>
                      <span style="font-size:16px;color:#2C2926;"><a href="mailto:${input.email}" style="color:#C4836A;">${input.email}</a></span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8E3DD;">
                      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8A8478;">Phone</span><br>
                      <span style="font-size:16px;color:#2C2926;">${input.phone}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8E3DD;">
                      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8A8478;">Project Type</span><br>
                      <span style="font-size:16px;color:#2C2926;">${input.projectType}</span>
                    </td>
                  </tr>
                  ${input.location ? `
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8E3DD;">
                      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8A8478;">Location</span><br>
                      <span style="font-size:16px;color:#2C2926;">${input.location}</span>
                    </td>
                  </tr>` : ""}
                  ${input.timeline ? `
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8E3DD;">
                      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8A8478;">Timeline</span><br>
                      <span style="font-size:16px;color:#2C2926;">${input.timeline}</span>
                    </td>
                  </tr>` : ""}
                  <tr>
                    <td style="padding:10px 0;">
                      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8A8478;">Project Description</span><br>
                      <span style="font-size:16px;color:#2C2926;line-height:1.6;">${input.description.replace(/\n/g, "<br>")}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#FAF8F5;">
                <p style="margin:0;font-size:12px;color:#8A8478;">
                  Reply directly to this email to respond to ${input.name}.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Auto-response email to submitter
      const autoResponseHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background-color:#FAF8F5;font-family:'DM Sans',system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
            <tr>
              <td style="background-color:#C4836A;padding:24px 32px;">
                <h1 style="margin:0;font-family:Georgia,serif;font-weight:300;font-size:24px;color:#FFFFFF;letter-spacing:0.05em;">
                  La Sprezzatura
                </h1>
                <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.12em;">
                  Luxury Interior Design
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F5F0EB;padding:40px 32px;">
                <h2 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:32px;color:#2C2926;font-style:italic;">
                  Thank you, ${input.name}.
                </h2>
                <p style="margin:0 0 20px;font-size:16px;color:#4A4540;line-height:1.7;">
                  We've received your inquiry and will be in touch within 24 business hours. We look forward to learning more about your project.
                </p>
                <p style="margin:0 0 20px;font-size:16px;color:#4A4540;line-height:1.7;">
                  In the meantime, if you'd like to schedule a complimentary consultation right away, you can book a time directly on our calendar:
                </p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="${bookingLink}"
                     style="display:inline-block;background-color:#C4836A;color:#FAF8F5;text-decoration:none;padding:14px 32px;font-size:14px;font-family:'DM Sans',system-ui,sans-serif;text-transform:uppercase;letter-spacing:0.12em;">
                    Book a Consultation
                  </a>
                </div>
                <p style="margin:0;font-size:15px;color:#4A4540;line-height:1.7;">
                  Warmly,<br>
                  <span style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#2C2926;">Elizabeth</span><br>
                  <span style="font-size:13px;color:#8A8478;">La Sprezzatura Interior Design</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#FAF8F5;border-top:1px solid #E8E3DD;">
                <p style="margin:0;font-size:12px;color:#8A8478;text-align:center;">
                  La Sprezzatura &bull; Long Island &amp; New York City
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      try {
        // Send notification to Elizabeth
        await resend.emails.send({
          from: "La Sprezzatura <onboarding@resend.dev>",
          to: [notifyEmail],
          subject: `New Inquiry from ${input.name}`,
          html: notificationHtml,
          replyTo: input.email,
        });

        // Send auto-response to submitter
        await resend.emails.send({
          from: "La Sprezzatura <onboarding@resend.dev>",
          to: [input.email],
          subject: "Thank you for reaching out to La Sprezzatura",
          html: autoResponseHtml,
        });
      } catch (err) {
        console.error("[ContactForm] Resend error:", err);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email. Please try again or email us directly.",
        });
      }

      return { success: true };
    },
  }),

  requestMagicLink: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().email("Please enter a valid email address"),
    }),
    handler: async (input) => {
      // Rate limit by email address (not IP -- per RESEARCH.md anti-pattern guidance)
      const identifier = `magic-link:${input.email.toLowerCase()}`;
      const { success: withinLimit } = await magicLinkRatelimit.limit(identifier);
      if (!withinLimit) {
        throw new ActionError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please wait a few minutes and try again.",
        });
      }

      // Look up client in Sanity -- NEVER reveal whether email exists
      const client = await getClientByEmail(input.email.toLowerCase());

      if (client) {
        // Generate magic link token and store in Redis with 15-min TTL
        const token = generatePortalToken(32);

        // Check if email also exists as a contractor (dual-role detection)
        const contractorMatch = await getContractorByEmail(input.email.toLowerCase());
        if (contractorMatch) {
          // Dual role: store both IDs so verify page can redirect to role selection
          await redis.set(`magic:${token}`, JSON.stringify({
            clientId: client._id,
            contractorId: contractorMatch._id,
            dualRole: true,
          }), { ex: 900 });
        } else {
          // Single role: store as JSON with entityId and role
          await redis.set(`magic:${token}`, JSON.stringify({
            entityId: client._id,
            role: 'client',
          }), { ex: 900 });
        }

        // Build magic link URL
        const baseUrl = import.meta.env.SITE || "https://lasprezz.com";
        const magicLink = `${baseUrl}/portal/verify?token=${token}`;

        // Send branded magic link email via Resend
        const apiKey = import.meta.env.RESEND_API_KEY;
        if (apiKey) {
          const { Resend } = await import("resend");
          const resend = new Resend(apiKey);

          const magicLinkHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="margin:0;padding:0;background-color:#FAF8F5;font-family:system-ui,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
                <tr>
                  <td style="padding:32px 32px 24px;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#8A8478;text-transform:uppercase;letter-spacing:0.2em;">La Sprezzatura</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#FFFFFF;padding:40px 32px;">
                    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:300;font-size:24px;color:#2C2926;text-align:center;">
                      Your Portal Access Link
                    </h1>
                    <p style="margin:0 0 24px;font-size:16px;color:#2C2926;line-height:1.7;text-align:center;">
                      Click the button below to access your project portal. This link expires in 15 minutes and can only be used once.
                    </p>
                    <div style="text-align:center;margin:32px 0;">
                      <a href="${magicLink}"
                         style="display:inline-block;background-color:#C4836A;color:#FFFFFF;text-decoration:none;padding:16px 32px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">
                        Access Your Portal
                      </a>
                    </div>
                    <p style="margin:24px 0 0;font-size:14px;color:#8A8478;text-align:center;line-height:1.6;">
                      If the button doesn't work, copy and paste this link:<br>
                      <span style="color:#8A8478;word-break:break-all;">${magicLink}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#B8B0A4;line-height:1.6;">
                      This is an automated message from La Sprezzatura. If you didn't request this link, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `;

          await resend.emails.send({
            from: "La Sprezzatura <noreply@send.lasprezz.com>",
            to: [client.email],
            subject: "Your La Sprezzatura Portal Access",
            html: magicLinkHtml,
          });
        } else {
          console.log("[MagicLink] No RESEND_API_KEY set. Magic link token:", token);
        }
      }

      // Always return success -- never reveal whether email exists (user enumeration prevention)
      return { success: true };
    },
  }),

  approveArtifact: defineAction({
    accept: "form",
    input: approveArtifactSchema,
    handler: async (input, context) => {
      const clientId = context.locals.clientId;
      if (!clientId) throw new ActionError({ code: "UNAUTHORIZED", message: "Not authenticated" });

      const client = await getClientById(clientId);

      await sanityWriteClient
        .patch(input.projectId)
        .set({ [`artifacts[_key == "${input.artifactKey}"].currentVersionKey`]: input.versionKey })
        .insert("after", `artifacts[_key == "${input.artifactKey}"].decisionLog[-1]`, [{
          _key: generatePortalToken(8),
          action: "approved",
          versionKey: input.versionKey,
          clientId,
          clientName: client?.name || "Client",
          feedback: null,
          timestamp: new Date().toISOString(),
        }])
        .commit({ autoGenerateArrayKeys: true });

      return { success: true };
    },
  }),

  requestArtifactChanges: defineAction({
    accept: "form",
    input: requestChangesSchema,
    handler: async (input, context) => {
      const clientId = context.locals.clientId;
      if (!clientId) throw new ActionError({ code: "UNAUTHORIZED", message: "Not authenticated" });

      const client = await getClientById(clientId);

      await sanityWriteClient
        .patch(input.projectId)
        .insert("after", `artifacts[_key == "${input.artifactKey}"].decisionLog[-1]`, [{
          _key: generatePortalToken(8),
          action: "changes-requested",
          versionKey: input.versionKey,
          clientId,
          clientName: client?.name || "Client",
          feedback: input.feedback,
          timestamp: new Date().toISOString(),
        }])
        .commit({ autoGenerateArrayKeys: true });

      return { success: true };
    },
  }),

  submitMilestoneNote: defineAction({
    accept: "form",
    input: milestoneNoteSchema,
    handler: async (input, context) => {
      const clientId = context.locals.clientId;
      if (!clientId) throw new ActionError({ code: "UNAUTHORIZED", message: "Not authenticated" });

      const client = await getClientById(clientId);

      await sanityWriteClient
        .patch(input.projectId)
        .insert("after", `milestones[_key == "${input.milestoneKey}"].notes[-1]`, [{
          _key: generatePortalToken(8),
          text: input.text,
          clientId,
          clientName: client?.name || "Client",
          timestamp: new Date().toISOString(),
        }])
        .commit({ autoGenerateArrayKeys: true });

      return { success: true };
    },
  }),

  submitArtifactNote: defineAction({
    accept: "form",
    input: artifactNoteSchema,
    handler: async (input, context) => {
      const clientId = context.locals.clientId;
      if (!clientId) throw new ActionError({ code: "UNAUTHORIZED", message: "Not authenticated" });

      const client = await getClientById(clientId);

      await sanityWriteClient
        .patch(input.projectId)
        .insert("after", `artifacts[_key == "${input.artifactKey}"].notes[-1]`, [{
          _key: generatePortalToken(8),
          text: input.text,
          clientId,
          clientName: client?.name || "Client",
          timestamp: new Date().toISOString(),
        }])
        .commit({ autoGenerateArrayKeys: true });

      return { success: true };
    },
  }),

  submitWarrantyClaim: defineAction({
    accept: "form",
    input: warrantyClaimSchema,
    handler: async (input, context) => {
      const clientId = context.locals.clientId;
      if (!clientId) throw new ActionError({ code: "UNAUTHORIZED", message: "Not authenticated" });

      const client = await getClientById(clientId);

      // Upload photo to Sanity CDN if provided
      let photoAssetRef: string | null = null;
      if (input.photo && input.photo.size > 0) {
        const photoBuffer = Buffer.from(await input.photo.arrayBuffer());
        const asset = await sanityWriteClient.assets.upload("image", photoBuffer, {
          filename: input.photo.name,
          contentType: input.photo.type,
        });
        photoAssetRef = asset._id;
      }

      // Add warranty claim as an artifact on the project
      const artifactData: any = {
        _key: generatePortalToken(8),
        _type: "artifact",
        artifactType: "warranty",
        customTypeName: null,
        currentVersionKey: null,
        versions: [],
        decisionLog: [{
          _key: generatePortalToken(8),
          action: "warranty-claim",
          clientId,
          clientName: client?.name || "Client",
          feedback: input.description,
          timestamp: new Date().toISOString(),
          ...(photoAssetRef ? { photoAssetId: photoAssetRef } : {}),
        }],
        notes: [],
      };

      // If photo was uploaded, attach as a version on the warranty artifact
      if (photoAssetRef) {
        const versionKey = generatePortalToken(8);
        artifactData.currentVersionKey = versionKey;
        artifactData.versions = [{
          _key: versionKey,
          _type: "artifactVersion",
          label: "Warranty Photo",
          file: {
            _type: "image",
            asset: { _type: "reference", _ref: photoAssetRef },
          },
          uploadedAt: new Date().toISOString(),
        }];
      }

      await sanityWriteClient
        .patch(input.projectId)
        .insert("after", "artifacts[-1]", [artifactData])
        .commit({ autoGenerateArrayKeys: true });

      return { success: true };
    },
  }),

  selectTier: defineAction({
    accept: "form",
    input: selectTierSchema,
    handler: async (input, context) => {
      const clientId = context.locals.clientId;
      if (!clientId) throw new ActionError({ code: "UNAUTHORIZED", message: "Not authenticated" });

      const client = await getClientById(clientId);

      // Fetch the tier name for the decision log
      const resolvedTierName = await sanityWriteClient.fetch(
        `*[_type == "project" && _id == $projectId][0].artifacts[_key == $artifactKey][0].investmentSummary.tiers[_key == $tierKey][0].name`,
        { projectId: input.projectId, artifactKey: input.artifactKey, tierKey: input.tierKey },
      ) || "Selected tier";

      // Set selectedTierKey, eagerness, reservations on the artifact's investmentSummary
      await sanityWriteClient
        .patch(input.projectId)
        .set({
          [`artifacts[_key == "${input.artifactKey}"].investmentSummary.selectedTierKey`]: input.tierKey,
          [`artifacts[_key == "${input.artifactKey}"].investmentSummary.eagerness`]: input.eagerness,
          [`artifacts[_key == "${input.artifactKey}"].investmentSummary.reservations`]: input.reservations || "",
        })
        .insert("after", `artifacts[_key == "${input.artifactKey}"].decisionLog[-1]`, [{
          _key: generatePortalToken(8),
          action: "tier-selected",
          clientId,
          clientName: client?.name || "Client",
          feedback: `Selected tier: ${resolvedTierName}. Eagerness: ${input.eagerness}/5.${input.reservations ? ` Reservations: ${input.reservations}` : ""}`,
          timestamp: new Date().toISOString(),
        }])
        .commit({ autoGenerateArrayKeys: true });

      return { success: true };
    },
  }),

  // Phase 36: Admin-only archive lifecycle for projects.
  // Auth gate: middleware (src/middleware.ts) populates context.locals.tenantId +
  // context.locals.sanityUserId for admin sessions. We gate on both (tenantId is
  // the per-tenant scope; sanityUserId proves the admin entry was resolved from
  // the tenant registry). context.locals.adminEmail is NOT populated in this
  // codebase (plan referenced it as a fallback concept); we use sanityUserId
  // instead to match every other admin write path (e.g., src/pages/admin/*).
  archiveProject: defineAction({
    accept: "json",
    input: archiveProjectSchema,
    handler: async (input, context) => {
      const tenantId = context.locals.tenantId;
      const sanityUserId = context.locals.sanityUserId;
      if (!tenantId || !sanityUserId) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "Admin session required." });
      }

      const tenantClient = getTenantClient(tenantId);

      // Per CONTEXT D-02, eligibility = terminal pipeline stage && archivedAt == null.
      // CONTEXT used "completed"; the schema enum's terminal value is "closeout".
      // Re-check server-side rather than trust the client.
      const current = (await tenantClient.fetch(
        `*[_type == "project" && _id == $projectId][0]{ pipelineStage, archivedAt, completedAt }`,
        { projectId: input.projectId },
      )) as { pipelineStage?: string; archivedAt?: string | null; completedAt?: string | null } | null;

      if (!current) {
        throw new ActionError({ code: "NOT_FOUND", message: "Project not found." });
      }
      if (current.archivedAt) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Project is already archived." });
      }
      if (current.pipelineStage !== "closeout") {
        throw new ActionError({ code: "BAD_REQUEST", message: "Only projects in closeout can be archived." });
      }

      const now = new Date().toISOString();
      // Discretion safe-guard from CONTEXT: stamp completedAt if missing so
      // the 90-day auto-archive window has something to anchor on.
      const setObj: Record<string, string> = current.completedAt
        ? { archivedAt: now }
        : { archivedAt: now, completedAt: now };

      await tenantClient.patch(input.projectId).set(setObj).commit();
      return { success: true, archivedAt: now };
    },
  }),

  unarchiveProject: defineAction({
    accept: "json",
    input: archiveProjectSchema,
    handler: async (input, context) => {
      const tenantId = context.locals.tenantId;
      const sanityUserId = context.locals.sanityUserId;
      if (!tenantId || !sanityUserId) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "Admin session required." });
      }

      const tenantClient = getTenantClient(tenantId);
      // Idempotent: clearing archivedAt on a non-archived project is a no-op patch.
      await tenantClient.patch(input.projectId).set({ archivedAt: null }).commit();
      return { success: true };
    },
  }),

  // Admin-only override of the per-project client portal visibility flag.
  // Same auth gate as archiveProject (tenantId + sanityUserId from middleware).
  // The schema defines the three valid values; isProjectVisible / getProjectAccessState
  // in src/lib/projectVisibility.ts consume this field at render time.
  setClientPortalVisibility: defineAction({
    accept: "json",
    input: setClientPortalVisibilitySchema,
    handler: async (input, context) => {
      const tenantId = context.locals.tenantId;
      const sanityUserId = context.locals.sanityUserId;
      if (!tenantId || !sanityUserId) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "Admin session required." });
      }

      const tenantClient = getTenantClient(tenantId);
      await tenantClient
        .patch(input.projectId)
        .set({ clientPortalVisibility: input.value })
        .commit();
      return { success: true, value: input.value };
    },
  }),

  requestContractorMagicLink: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().email("Please enter a valid email address"),
    }),
    handler: async (input) => {
      // Rate limit by email address (not IP -- per RESEARCH.md anti-pattern guidance)
      const identifier = `magic-link:${input.email.toLowerCase()}`;
      const { success: withinLimit } = await magicLinkRatelimit.limit(identifier);
      if (!withinLimit) {
        throw new ActionError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please wait a few minutes and try again.",
        });
      }

      // Look up contractor in Sanity -- NEVER reveal whether email exists
      const contractor = await getContractorByEmail(input.email.toLowerCase());

      if (contractor) {
        // Check if email also exists as a client (dual-role detection)
        const clientMatch = await getClientByEmail(input.email.toLowerCase());

        const token = generatePortalToken(32);

        if (clientMatch) {
          // Dual role: store both IDs
          await redis.set(`magic:${token}`, JSON.stringify({
            clientId: clientMatch._id,
            contractorId: contractor._id,
            dualRole: true,
          }), { ex: 900 });
        } else {
          // Single role: store contractor ID and role
          await redis.set(`magic:${token}`, JSON.stringify({
            entityId: contractor._id,
            role: 'contractor',
          }), { ex: 900 });
        }

        // Build magic link URL
        const baseUrl = import.meta.env.SITE || "https://lasprezz.com";
        const magicLink = `${baseUrl}/workorder/verify?token=${token}`;

        // Get project names for email
        const projects = await getProjectsByContractorId(contractor._id);
        const projectNames = projects?.map((p: any) => p.title).join(', ') || '';

        // Send branded magic link email via Resend
        const apiKey = import.meta.env.RESEND_API_KEY;
        if (apiKey) {
          const { Resend } = await import("resend");
          const resend = new Resend(apiKey);

          const projectLine = projectNames
            ? `<p style="margin:0 0 24px;font-size:14px;color:#8A8478;line-height:1.6;text-align:center;font-style:italic;">You have work orders for: ${projectNames}</p>`
            : '';

          const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="padding:32px 32px 24px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#8A8478;text-transform:uppercase;letter-spacing:0.2em;">La Sprezzatura</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#FFFFFF;padding:40px 32px;">
        <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:300;font-size:24px;color:#2C2926;text-align:center;">
          Your Work Order Access
        </h1>
        <p style="margin:0 0 24px;font-size:16px;color:#2C2926;line-height:1.7;text-align:center;">
          Click the button below to access your work orders. This link expires in 15 minutes and can only be used once.
        </p>
        ${projectLine}
        <div style="text-align:center;margin:32px 0;">
          <a href="${magicLink}"
             style="display:inline-block;background-color:#C4836A;color:#FFFFFF;text-decoration:none;padding:16px 32px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">
            Access Your Work Orders
          </a>
        </div>
        <p style="margin:24px 0 0;font-size:14px;color:#8A8478;text-align:center;line-height:1.6;">
          If the button doesn't work, copy and paste this link:<br>
          <span style="color:#8A8478;word-break:break-all;">${magicLink}</span>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#B8B0A4;line-height:1.6;">
          This is an automated message from La Sprezzatura. If you didn't request this link, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

          await resend.emails.send({
            from: "La Sprezzatura <noreply@send.lasprezz.com>",
            to: [contractor.email],
            subject: "Your La Sprezzatura Work Order Access",
            html: emailHtml,
          });
        } else {
          console.log("[ContractorMagicLink] No RESEND_API_KEY set. Magic link token:", token);
        }
      }

      // Always return success -- never reveal whether email exists (user enumeration prevention)
      return { success: true };
    },
  }),

  submitContractorNote: defineAction({
    accept: "form",
    input: contractorNoteSchema,
    handler: async (input, context) => {
      const contractorId = context.locals.contractorId;
      if (!contractorId) throw new ActionError({ code: "UNAUTHORIZED", message: "Not authenticated" });

      const contractor = await getContractorById(contractorId);

      await sanityWriteClient
        .patch(input.projectId)
        .insert("after", `contractors[_key == "${input.assignmentKey}"].submissionNotes[-1]`, [{
          _key: generatePortalToken(8),
          text: input.text,
          contractorName: contractor?.name || "Contractor",
          timestamp: new Date().toISOString(),
        }])
        .commit({ autoGenerateArrayKeys: true });

      return { success: true };
    },
  }),

  requestBuildingManagerMagicLink: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().email("Please enter a valid email address"),
    }),
    handler: async (input) => {
      const identifier = `magic-link:${input.email.toLowerCase()}`;
      const { success: withinLimit } = await magicLinkRatelimit.limit(identifier);
      if (!withinLimit) {
        throw new ActionError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please wait a few minutes and try again.",
        });
      }

      // Look up building manager email across commercial projects
      const projects = await sanityWriteClient.fetch(
        `*[_type == "project" && buildingManager.email == $email && isCommercial == true && portalEnabled == true][0]{ _id }`,
        { email: input.email.toLowerCase() },
      );

      if (projects) {
        const token = generatePortalToken(32);

        // Check for dual/triple role
        const clientMatch = await getClientByEmail(input.email.toLowerCase());
        const contractorMatch = await getContractorByEmail(input.email.toLowerCase());

        if (clientMatch || contractorMatch) {
          // Multi-role: store all matching IDs for role selection
          const tokenData: any = { dualRole: true };
          if (clientMatch) tokenData.clientId = clientMatch._id;
          if (contractorMatch) tokenData.contractorId = contractorMatch._id;
          tokenData.buildingManagerEmail = input.email.toLowerCase();
          await redis.set(`magic:${token}`, JSON.stringify(tokenData), { ex: 900 });
        } else {
          // Single role: building manager only
          await redis.set(`magic:${token}`, JSON.stringify({
            entityId: input.email.toLowerCase(),
            role: 'building_manager',
          }), { ex: 900 });
        }

        const baseUrl = import.meta.env.SITE || "https://lasprezz.com";
        const magicLink = `${baseUrl}/building/verify?token=${token}`;

        const apiKey = import.meta.env.RESEND_API_KEY;
        if (apiKey) {
          const { Resend } = await import("resend");
          const resend = new Resend(apiKey);

          // Get project name for email
          const projectData = await sanityWriteClient.fetch(
            `*[_type == "project" && buildingManager.email == $email && isCommercial == true && portalEnabled == true][0]{ title }`,
            { email: input.email.toLowerCase() },
          );

          const projectLine = projectData?.title
            ? `<p style="margin:0 0 24px;font-size:14px;color:#8A8478;line-height:1.6;text-align:center;font-style:italic;">Project: ${projectData.title}</p>`
            : '';

          const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="padding:32px 32px 24px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#8A8478;text-transform:uppercase;letter-spacing:0.2em;">La Sprezzatura</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#FFFFFF;padding:40px 32px;">
        <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:300;font-size:24px;color:#2C2926;text-align:center;">
          Your Building Portal Access
        </h1>
        <p style="margin:0 0 24px;font-size:16px;color:#2C2926;line-height:1.7;text-align:center;">
          Click the button below to access project documents. This link expires in 15 minutes and can only be used once.
        </p>
        ${projectLine}
        <div style="text-align:center;margin:32px 0;">
          <a href="${magicLink}"
             style="display:inline-block;background-color:#C4836A;color:#FFFFFF;text-decoration:none;padding:16px 32px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">
            Access Building Portal
          </a>
        </div>
        <p style="margin:24px 0 0;font-size:14px;color:#8A8478;text-align:center;line-height:1.6;">
          If the button doesn't work, copy and paste this link:<br>
          <span style="color:#8A8478;word-break:break-all;">${magicLink}</span>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#B8B0A4;line-height:1.6;">
          This is an automated message from La Sprezzatura. If you didn't request this link, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

          await resend.emails.send({
            from: "La Sprezzatura <noreply@send.lasprezz.com>",
            to: [input.email.toLowerCase()],
            subject: "Your La Sprezzatura Building Portal Access",
            html: emailHtml,
          });
        } else {
          console.log("[BuildingManagerMagicLink] No RESEND_API_KEY set. Token:", token);
        }
      }

      // Always return success (user enumeration prevention)
      return { success: true };
    },
  }),
};
