export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";
import { redis } from "../../lib/redis";
import { getClientByEmail, getContractorByEmail } from "../../sanity/queries";
import { render } from "@react-email/render";
import { createElement } from "react";
import { BuildingAccess } from "../../emails/buildingAccess/BuildingAccess";
import { getTenantBrand } from "../../lib/email/tenantBrand";
import { MAGIC_LINK_ACCESS_TTL_SECONDS } from "../../lib/portal/tokenTtl";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch project with building manager info
    const project = await sanityWriteClient.fetch(
      `*[_type == "project" && _id == $projectId && isCommercial == true][0] {
        _id,
        title,
        buildingManager {
          name,
          email
        }
      }`,
      { projectId },
    );

    if (!project || !project.buildingManager?.email) {
      return new Response(
        JSON.stringify({ error: "Project not found, not commercial, or missing building manager email" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const email = project.buildingManager.email.toLowerCase();

    // Generate magic link token
    const token = generatePortalToken(32);

    // Check for dual/triple role (building manager email also registered as client or contractor)
    const clientMatch = await getClientByEmail(email);
    const contractorMatch = await getContractorByEmail(email);

    if (clientMatch || contractorMatch) {
      const tokenData: any = { dualRole: true };
      if (clientMatch) tokenData.clientId = clientMatch._id;
      if (contractorMatch) tokenData.contractorId = contractorMatch._id;
      tokenData.buildingManagerEmail = email;
      await redis.set(`magic:${token}`, JSON.stringify(tokenData), { ex: MAGIC_LINK_ACCESS_TTL_SECONDS });
    } else {
      await redis.set(`magic:${token}`, JSON.stringify({
        entityId: email,
        role: 'building_manager',
      }), { ex: MAGIC_LINK_ACCESS_TTL_SECONDS });
    }

    // Build magic link URL
    const baseUrl = import.meta.env.SITE || "https://lasprezz.com";
    const magicLink = `${baseUrl}/building/verify?token=${token}`;

    // Send branded email via Resend
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (apiKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      // D-15: explicit tenant resolution at call site.
      const tenant = await getTenantBrand(sanityWriteClient);

      const element = createElement(BuildingAccess, {
        buildingManager: project.buildingManager,
        project: { _id: project._id, title: project.title },
        magicLink,
        expiresInSeconds: MAGIC_LINK_ACCESS_TTL_SECONDS,
        preheader: `Your building portal access — link expires in 15 minutes`,
        tenant,
      });
      const html = await render(element);
      const text = await render(element, { plainText: true });

      await resend.emails.send({
        from: "La Sprezzatura <noreply@send.lasprezz.com>",
        to: [email],
        subject: "Your La Sprezzatura Building Portal Access",   // D-13: unchanged
        html,
        text,
      });
    } else {
      console.log(
        "[SendBuildingAccess] No RESEND_API_KEY set. Magic link token:", token,
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[SendBuildingAccess] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
