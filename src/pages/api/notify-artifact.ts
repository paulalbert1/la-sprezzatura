export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";
import { render } from "@react-email/render";
import { createElement } from "react";
import { ArtifactReady } from "../../emails/artifactReady/ArtifactReady";
import { getTenantBrand } from "../../lib/email/tenantBrand";

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
        _id,
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

      // Pitfall 7: resolve tenant ONCE before the loop. N client sends issue
      // exactly 1 tenant fetch, not N.
      const tenant = await getTenantBrand(sanityWriteClient);
      const portalHref = `${baseUrl}/portal/dashboard`;

      for (const clientEntry of project.clients || []) {
        const client = clientEntry.client;
        if (!client?.email) continue;

        const element = createElement(ArtifactReady, {
          client: { name: client.name, email: client.email },
          project: { _id: project._id, title: project.title },
          artifactLabel,
          portalHref,
          preheader: `New ${artifactLabel} for ${project.title}`,
          tenant,
        });
        const html = await render(element);
        const text = await render(element, { plainText: true });

        await resend.emails.send({
          from: "La Sprezzatura <noreply@send.lasprezz.com>",
          to: [client.email],
          subject: `New ${artifactLabel} for ${project.title}`,   // D-13: unchanged
          html,
          text,
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
