import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { contactRatelimit } from "../lib/rateLimit";
import { redis } from "../lib/redis";
import { magicLinkRatelimit } from "../lib/rateLimit";
import { getClientByEmail } from "../sanity/queries";
import { generatePortalToken } from "../lib/generateToken";

export const server = {
  submitContact: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email required"),
      phone: z.string().optional(),
      projectType: z.string().min(1, "Please select a project type"),
      location: z.string().optional(),
      budgetRange: z.string().optional(),
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
        import.meta.env.CONTACT_NOTIFY_EMAIL || "liz@lasprezz.com";

      // If no API key, log to console and return success (dev mode)
      if (!apiKey) {
        console.log("[ContactForm] No RESEND_API_KEY set. Form submission received:", {
          name: input.name,
          email: input.email,
          phone: input.phone || "(not provided)",
          projectType: input.projectType,
          location: input.location || "(not provided)",
          budgetRange: input.budgetRange || "(not provided)",
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
                  ${input.phone ? `
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8E3DD;">
                      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8A8478;">Phone</span><br>
                      <span style="font-size:16px;color:#2C2926;">${input.phone}</span>
                    </td>
                  </tr>` : ""}
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
                  ${input.budgetRange ? `
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8E3DD;">
                      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8A8478;">Budget Range</span><br>
                      <span style="font-size:16px;color:#2C2926;">${input.budgetRange}</span>
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
        await redis.set(`magic:${token}`, client._id, { ex: 900 });

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
};
