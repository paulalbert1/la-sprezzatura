export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";
import { redis } from "../../lib/redis";
import { getClientByEmail, getContractorByEmail } from "../../sanity/queries";

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
      await redis.set(`magic:${token}`, JSON.stringify(tokenData), { ex: 900 });
    } else {
      await redis.set(`magic:${token}`, JSON.stringify({
        entityId: email,
        role: 'building_manager',
      }), { ex: 900 });
    }

    // Build magic link URL
    const baseUrl = import.meta.env.SITE || "https://lasprezz.com";
    const magicLink = `${baseUrl}/building/verify?token=${token}`;

    // Send branded email via Resend
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (apiKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      const projectLine = project.title
        ? `<p style="margin:0 0 24px;font-size:14px;color:#8A8478;line-height:1.6;text-align:center;font-style:italic;">Project: ${project.title}</p>`
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
        to: [email],
        subject: "Your La Sprezzatura Building Portal Access",
        html: emailHtml,
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
