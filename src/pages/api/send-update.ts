export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";
import { getSession } from "../../lib/session";
import {
  buildSendUpdateEmail,
  type SendUpdateProject,
  type PendingArtifact,
} from "../../lib/sendUpdate/emailTemplate";

// Phase 34 Plan 04 — Send Update API route
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 1 + Task 2
//   - .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-13..D-18
//   - Threats: T-34-03 (admin gate), T-34-05 (lazy-gen race)
//
// POST body shape (Task 2 additions):
//   {
//     projectId: string,
//     note?: string,
//     sections?: { milestones?: boolean; procurement?: boolean; artifacts?: boolean },
//     usePersonalLinks?: boolean   // default false — legacy callers keep working
//   }
//
// When usePersonalLinks=true, the handler loops over project.clients SERIALLY
// and (a) lazily generates client.portalToken via setIfMissing if missing,
// (b) re-fetches to resolve the multi-tab concurrent-send race, (c) sends one
// email per recipient with a per-client CTA href `${baseUrl}/portal/client/${token}`.
// The loop MUST await each recipient in sequence — do not parallelize — so the
// re-fetch step observes the linearized Sanity write order.

function resolveBaseUrl(request: Request): string {
  // Prefer the incoming request's origin so dev (localhost) and preview deploys
  // produce working portal links. Fall back to the configured SITE (prod) and
  // finally to the hardcoded canonical domain.
  const origin = new URL(request.url).origin;
  if (origin && !origin.includes("0.0.0.0")) return origin;
  return (import.meta.env.SITE as string) || "https://lasprezz.com";
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // T-34-03: admin-only gate. Reject BEFORE body parsing.
    const session = await getSession(cookies);
    if (!session || session.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const {
      projectId,
      note,
      sections,
      usePersonalLinks = false,
      ccSelf = true,
      ccLiz = true,
    } = await request.json();
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch project snapshot. The client-ref projection now includes
    // portalToken so the usePersonalLinks=true branch can read (and lazily
    // generate) per-client tokens without a second round-trip.
    const project = (await sanityWriteClient.fetch(
      `
      *[_type == "project" && _id == $projectId][0] {
        _id, title, engagementType,
        clients[] { client-> { _id, name, email, portalToken } },
        milestones[] | order(date asc) { _key, name, date, completed },
        "clientActionItems": clientActionItems[] | order(completed asc, createdAt desc) {
          _key, description, dueDate, completed
        },
        ...select(engagementType == "full-interior-design" => {
          "procurementItems": procurementItems[] {
            _key, name, status, installDate, expectedDeliveryDate, retailPrice,
            "savings": retailPrice - clientCost
          }
        }),
        artifacts[] {
          _key, artifactType, customTypeName,
          currentVersionKey,
          "hasApproval": count(decisionLog[action == "approved"]) > 0
        }
      }
    `,
      { projectId },
    )) as SendUpdateProject | null;

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Build email context shared by both branches. Prefer the incoming
    // request's origin so dev (localhost) and preview deploys produce working
    // portal links. Fall back to the configured SITE.
    const requestOrigin = new URL(request.url).origin;
    const baseUrl = requestOrigin && !requestOrigin.includes("0.0.0.0")
      ? requestOrigin
      : ((import.meta.env.SITE as string) || "https://lasprezz.com");
    const personalNote = note || "";
    const showMilestones =
      sections?.milestones !== false &&
      (project.milestones?.length ?? 0) > 0;
    const showProcurement =
      sections?.procurement !== false &&
      project.engagementType === "full-interior-design" &&
      (project.procurementItems?.length ?? 0) > 0;
    const pendingArtifacts: PendingArtifact[] = (project.artifacts || [])
      .filter((a) => a.currentVersionKey && !a.hasApproval)
      .map((a) => ({
        _key: a._key,
        artifactType: a.artifactType,
        customTypeName: a.customTypeName,
      }));
    // D-15: pending reviews are OFF by default. Only honor them when the
    // caller EXPLICITLY sets sections.artifacts === true. If the caller
    // omits the flag or sets it to false, the section is suppressed.
    const showArtifacts =
      sections?.artifacts === true && pendingArtifacts.length > 0;

    const apiKey = import.meta.env.RESEND_API_KEY;
    const recipientEmails: string[] = [];

    if (apiKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      if (usePersonalLinks) {
        // T-34-05: serial loop + setIfMissing + re-fetch. Do NOT parallelize.
        for (const entry of project.clients || []) {
          const client = entry?.client;
          if (!client?.email) continue;

          let token = client.portalToken;
          if (!token) {
            const newToken = generatePortalToken(8);
            await sanityWriteClient
              .patch(client._id)
              .setIfMissing({ portalToken: newToken })
              .commit();
            // Re-fetch to resolve the multi-tab concurrent Send Update race.
            // Another tab may have beaten us to setIfMissing; the winning
            // value is whatever Sanity actually persisted.
            const refreshed = await sanityWriteClient.fetch<string | null>(
              `*[_id == $id][0].portalToken`,
              { id: client._id },
            );
            token = refreshed || newToken;
          }

          const perRecipientCtaHref = `${baseUrl}/portal/client/${token}`;
          const perRecipientHtml = buildSendUpdateEmail({
            project,
            personalNote,
            showMilestones,
            showProcurement,
            showArtifacts,
            pendingArtifacts,
            baseUrl,
            ctaHref: perRecipientCtaHref,
            clientFirstName: client.name?.split(" ")[0],
          });

          recipientEmails.push(client.email);
          const cc: string[] = [];
          if (ccLiz) cc.push("liz@lasprezz.com");
          const resendResult = await resend.emails.send({
            from: import.meta.env.RESEND_FROM || "La Sprezzatura <onboarding@resend.dev>",
            to: [client.email],
            ...(cc.length > 0 && { cc }),
            subject: `Project Weekly Update - ${client.name || project.title}`,
            html: perRecipientHtml,
          });
          if (resendResult.error) {
            console.error("[SendUpdate] Resend error:", resendResult.error, "to:", client.email);
          } else {
            console.log("[SendUpdate] Sent id=", resendResult.data?.id, "to:", client.email);
          }
        }
      } else {
        // Legacy path — single HTML body, one send per recipient. Preserves
        // the pre-Plan-04 behavior for backward compatibility.
        for (const entry of project.clients || []) {
          const client = entry?.client;
          if (!client?.email) continue;
          recipientEmails.push(client.email);
          const html = buildSendUpdateEmail({
            project,
            personalNote,
            showMilestones,
            showProcurement,
            showArtifacts,
            pendingArtifacts,
            baseUrl,
            ctaHref: `${baseUrl}/portal/dashboard`,
            clientFirstName: client.name?.split(" ")[0],
          });
          const cc: string[] = [];
          if (ccLiz) cc.push("liz@lasprezz.com");
          const resendResult = await resend.emails.send({
            from: import.meta.env.RESEND_FROM || "La Sprezzatura <onboarding@resend.dev>",
            to: [client.email],
            ...(cc.length > 0 && { cc }),
            subject: `Project Weekly Update - ${client.name || project.title}`,
            html,
          });
          if (resendResult.error) {
            console.error("[SendUpdate] Resend error:", resendResult.error, "to:", client.email);
          } else {
            console.log("[SendUpdate] Sent id=", resendResult.data?.id, "to:", client.email);
          }
        }
      }
    } else {
      console.log(
        "[SendUpdate] No RESEND_API_KEY set. Would send update for:",
        projectId,
      );
    }

    // Log the update on the project document (SETT-06). One entry per send
    // regardless of recipient count or usePersonalLinks mode.
    const sectionsIncluded: string[] = [];
    if (showMilestones) sectionsIncluded.push("milestones");
    if (showProcurement) sectionsIncluded.push("procurement");
    if (showArtifacts) sectionsIncluded.push("artifacts");

    await sanityWriteClient
      .patch(projectId)
      .setIfMissing({ updateLog: [] })
      .append("updateLog", [
        {
          _key: generatePortalToken(8),
          sentAt: new Date().toISOString(),
          recipientEmails: recipientEmails.join(", "),
          note: personalNote,
          sectionsIncluded,
        },
      ])
      .commit({ autoGenerateArrayKeys: true });

    return new Response(
      JSON.stringify({ success: true, recipientCount: recipientEmails.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown send-update error";
    console.error("[SendUpdate] Error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
