export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId, artifactKey } = await request.json();

    if (!projectId || !artifactKey) {
      return new Response(
        JSON.stringify({ error: "projectId and artifactKey are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch project with clients and artifact info
    const project = await sanityWriteClient.fetch(
      `*[_type == "project" && _id == $projectId][0] {
        title,
        clients[] { client-> { _id, name, email } },
        artifacts[_key == $artifactKey][0] {
          _key,
          artifactType,
          customTypeName
        }
      }`,
      { projectId, artifactKey },
    );

    if (!project || !project.artifacts) {
      return new Response(
        JSON.stringify({ error: "Project or artifact not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const artifact = project.artifacts;
    const artifactLabel =
      artifact.customTypeName ||
      (artifact.artifactType
        ? artifact.artifactType.charAt(0).toUpperCase() +
          artifact.artifactType.slice(1).replace(/-/g, " ")
        : "document");

    // Send notification to all clients on the project
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (apiKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const baseUrl = import.meta.env.SITE || "https://lasprezz.com";

      for (const clientEntry of project.clients || []) {
        const client = clientEntry.client;
        if (!client?.email) continue;

        const html = `<!DOCTYPE html>
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
          New ${artifactLabel} Available
        </h1>
        <p style="margin:0 0 24px;font-size:16px;color:#2C2926;line-height:1.7;text-align:center;">
          Liz has uploaded a new ${artifactLabel.toLowerCase()} for your review on ${project.title}.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${baseUrl}/portal/dashboard"
             style="display:inline-block;background-color:#C4836A;color:#FFFFFF;text-decoration:none;padding:16px 32px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">
            View in Your Portal
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#B8B0A4;line-height:1.6;">
          This is an automated message from La Sprezzatura.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

        await resend.emails.send({
          from: "La Sprezzatura <noreply@send.lasprezz.com>",
          to: [client.email],
          subject: `New ${artifactLabel} for ${project.title}`,
          html,
        });
      }
    } else {
      console.log(
        "[NotifyArtifact] No RESEND_API_KEY set. Would send notification for artifact:",
        artifactKey,
      );
    }

    // Log the notification on the artifact
    const recipientEmails = (project.clients || [])
      .map((c: any) => c.client?.email)
      .filter(Boolean)
      .join(", ");

    await sanityWriteClient
      .patch(projectId)
      .insert(
        "after",
        `artifacts[_key == "${artifactKey}"].notificationLog[-1]`,
        [
          {
            _key: generatePortalToken(8),
            sentAt: new Date().toISOString(),
            recipientEmail: recipientEmails,
          },
        ],
      )
      .commit({ autoGenerateArrayKeys: true });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[NotifyArtifact] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
