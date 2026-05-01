export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";
import { redis } from "../../lib/redis";
import { getClientByEmail } from "../../sanity/queries";
import { render } from "@react-email/render";
import { createElement } from "react";
import { WorkOrderAccess } from "../../emails/workOrderAccess/WorkOrderAccess";
import { getTenantBrand } from "../../lib/email/tenantBrand";
import { MAGIC_LINK_ACCESS_TTL_SECONDS } from "../../lib/portal/tokenTtl";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { contractorId } = await request.json();

    if (!contractorId) {
      return new Response(
        JSON.stringify({ error: "contractorId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch contractor details and assigned projects
    const contractor = await sanityWriteClient.fetch(
      `*[_type == "contractor" && _id == $contractorId][0] {
        _id,
        name,
        email
      }`,
      { contractorId },
    );

    if (!contractor || !contractor.email) {
      return new Response(
        JSON.stringify({ error: "Contractor not found or missing email" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch assigned projects for the contractor
    const projects = await sanityWriteClient.fetch(
      `*[_type == "project" && portalEnabled == true &&
        engagementType == "full-interior-design" &&
        count(contractors[contractor._ref == $contractorId]) > 0
      ] { title }`,
      { contractorId },
    );

    // Generate magic link token
    const token = generatePortalToken(32);

    // Check for dual-role (contractor email also registered as client)
    const clientMatch = await getClientByEmail(contractor.email.toLowerCase());
    if (clientMatch) {
      await redis.set(`magic:${token}`, JSON.stringify({
        clientId: clientMatch._id,
        contractorId: contractor._id,
        dualRole: true,
      }), { ex: MAGIC_LINK_ACCESS_TTL_SECONDS });
    } else {
      await redis.set(`magic:${token}`, JSON.stringify({
        entityId: contractor._id,
        role: 'contractor',
      }), { ex: MAGIC_LINK_ACCESS_TTL_SECONDS });
    }

    // Build magic link URL
    const baseUrl = import.meta.env.SITE || "https://lasprezz.com";
    const magicLink = `${baseUrl}/workorder/verify?token=${token}`;

    // Send branded email via Resend
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (apiKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      // D-15: explicit tenant resolution at call site (no implicit fallback in template).
      const tenant = await getTenantBrand(sanityWriteClient);

      // D-06: expiresInSeconds prop sourced from same constant as redis.set ex: above.
      // EMAIL-05 invariant: the human-readable copy in the email body is derived
      // from this value via formatExpiryCopy(); drift is structurally impossible.
      const element = createElement(WorkOrderAccess, {
        contractor: { name: contractor.name, email: contractor.email },
        projectNames: projects?.map((p: any) => p.title) ?? [],
        magicLink,
        expiresInSeconds: MAGIC_LINK_ACCESS_TTL_SECONDS,
        preheader: `Your work-order portal access — link expires in 15 minutes`,
        tenant,
      });
      const html = await render(element);
      const text = await render(element, { plainText: true });

      await resend.emails.send({
        from: "La Sprezzatura <noreply@send.lasprezz.com>",
        to: [contractor.email],
        subject: "Your La Sprezzatura Work Order Access",   // D-13: unchanged
        html,
        text,                                                // D-03: plain-text fallback
      });
    } else {
      console.log(
        "[SendWorkOrderAccess] No RESEND_API_KEY set. Magic link token:", token,
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[SendWorkOrderAccess] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
