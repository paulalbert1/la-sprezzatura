export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../sanity/writeClient";
import { generatePortalToken } from "../../lib/generateToken";
import { getSession } from "../../lib/session";
import { render } from "@react-email/render";
import { createElement } from "react";
import { SendUpdate, formatLongDate, type SendUpdateEmailInput, type PendingArtifact } from "../../emails/sendUpdate/SendUpdate";
import { getTenantBrand } from "../../lib/email/tenantBrand";
import type { ProcurementStatus } from "../../lib/procurement/statusPills";

// Phase 34 Plan 04 — Send Update API route
// Phase 46 Plan 03 — rewired to react-email render (D-14 cutover); RFC 8058
// List-Unsubscribe header on every send (D-10, EMAIL-06); preheader at call
// site (D-13); plain-text via render(..., { plainText: true }) (D-8).
//
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 1 + Task 2
//   - .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-13..D-18
//   - .planning/phases/46-send-update-work-order-migration/46-03-PLAN.md
//   - Threats: T-34-03 (admin gate), T-34-05 (lazy-gen race),
//              T-46-03-01 (List-Unsubscribe header static), T-46-03-06 (token preserved)
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

// GROQ-projection shape for the project fetch. Distinct from the new
// SendUpdate `SendUpdateProject` shape (which uses label/state and
// vendor/spec/eta) -- this type matches what the GROQ query actually returns.
// `adaptProjectForEmail()` below maps from this shape into the SendUpdate
// input shape.
interface FetchedProject {
  _id: string;
  title: string;
  engagementType: string;
  clients?: Array<{
    client?: {
      _id: string;
      name?: string;
      email?: string;
      portalToken?: string;
    };
  }>;
  milestones?: Array<{
    _key?: string;
    name?: string;
    date?: string;
    completed?: boolean;
  }>;
  procurementItems?: Array<{
    _key?: string;
    name?: string;
    status?: string;
    installDate?: string;
    expectedDeliveryDate?: string;
  }>;
  artifacts?: Array<{
    _key?: string;
    artifactType?: string;
    customTypeName?: string;
    currentVersionKey?: string;
    hasApproval?: boolean;
  }>;
}

function resolveBaseUrl(request: Request): string {
  // Prefer the incoming request's origin so dev (localhost) and preview deploys
  // produce working portal links. Fall back to the configured SITE (prod) and
  // finally to the hardcoded canonical domain.
  const origin = new URL(request.url).origin;
  if (origin && !origin.includes("0.0.0.0")) return origin;
  return (import.meta.env.SITE as string) || "https://lasprezz.com";
}

// D-10 RFC 8058 mailto-only List-Unsubscribe header value. Static literal -- no
// user-controlled string is interpolated (T-46-03-01). Angle brackets are part
// of the RFC 8058 syntax, not decorative.
const SEND_UPDATE_LIST_UNSUBSCRIBE =
  "<mailto:liz@lasprezz.com?subject=Unsubscribe%20Send%20Update&body=Please%20remove%20me%20from%20Send%20Update%20emails.>";

// Map the GROQ-projected project shape onto the new SendUpdate
// `SendUpdateProject` shape: milestones[].name -> label, completed -> state,
// procurementItems[].installDate||expectedDeliveryDate -> eta, status preserved
// (cast to ProcurementStatus -- legacy DB values match the closed enum).
function adaptProjectForEmail(
  project: FetchedProject,
): SendUpdateEmailInput["project"] {
  return {
    _id: project._id,
    title: project.title,
    milestones: (project.milestones ?? []).map((m) => ({
      label: m.name ?? "",
      date: m.date ?? "",
      state: m.completed ? "completed" : "upcoming",
    })),
    procurementItems: (project.procurementItems ?? []).map((p) => ({
      name: p.name ?? "",
      status: (p.status as ProcurementStatus | undefined) ?? "ordered",
      eta: p.installDate ?? p.expectedDeliveryDate ?? "",
    })),
  };
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
      ccDefault = true,
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
            _key, name, status, installDate, expectedDeliveryDate
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
    )) as FetchedProject | null;

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Phase 38 Plan 02 — resolve sender config from siteSettings at send time.
    // Settings wins; RESEND_FROM env is the ops escape hatch; literal is last resort.
    const senderSettings = (await sanityWriteClient.fetch<{
      defaultFromEmail?: string;
      defaultCcEmail?: string;
    } | null>(
      `*[_type == "siteSettings"][0]{ defaultFromEmail, defaultCcEmail }`,
    )) ?? null;

    const resolvedFrom =
      senderSettings?.defaultFromEmail?.trim() ||
      (import.meta.env.RESEND_FROM as string | undefined) ||
      "office@lasprezz.com";

    // D-10/D-12: normalize CC at send time. Empty → default singleton.
    // CRLF → drop entirely (header-injection guard, T-38-01 defense-in-depth).
    const SEND_UPDATE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const resolvedCcList: string[] = (() => {
      const raw = senderSettings?.defaultCcEmail?.trim() ?? "";
      if (raw.length === 0) return ["liz@lasprezz.com"];
      if (/[\r\n]/.test(raw)) {
        console.warn("[SendUpdate] CRLF in defaultCcEmail dropped; falling back to empty cc");
        return [];
      }
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && SEND_UPDATE_EMAIL_REGEX.test(s));
    })();

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

    // Adapt the GROQ shape to the SendUpdate component shape once -- the
    // adapted project is identical across all recipients in a single send.
    const adaptedProject = adaptProjectForEmail(project);
    // D-13: preheader computed at call site, passed via prop. Identical for
    // every recipient in this send (no per-recipient personalization).
    const preheader = `Project Update for ${project.title} — ${formatLongDate(new Date().toISOString())}`;

    // Resolve the tenant brand once (signoff name + location + wordmark).
    // Single Sanity fetch shared across all recipients in this send.
    const tenant = await getTenantBrand(sanityWriteClient);

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
          const perRecipientProps: SendUpdateEmailInput = {
            project: adaptedProject,
            personalNote,
            // 46-04 D-1 / scope boundary: v1 API call sites pass [] for
            // designer-typed action items; the compose UI for this field is
            // a separable plan.
            personalActionItems: [],
            pendingArtifacts,
            showMilestones,
            showProcurement,
            // showArtifacts collapses into showReviewItems on the new template
            // (D-3 merged designer prose + auto-derived artifacts into one
            // section). Designer rows are empty in v1, so showReviewItems
            // tracks showArtifacts directly.
            showReviewItems: showArtifacts,
            baseUrl,
            ctaHref: perRecipientCtaHref,
            clientFirstName: client.name?.split(" ")[0],
            tenant,
            preheader,
          };
          const perRecipientElement = createElement(SendUpdate, perRecipientProps);
          const perRecipientHtml = await render(perRecipientElement);
          const perRecipientText = await render(perRecipientElement, { plainText: true });

          recipientEmails.push(client.email);
          const cc: string[] = [];
          if (ccDefault) cc.push(...resolvedCcList);
          const resendResult = await resend.emails.send({
            from: resolvedFrom,
            to: [client.email],
            ...(cc.length > 0 && { cc }),
            subject: `Project update — ${project.title || client.name || "your project"}`,
            html: perRecipientHtml,
            text: perRecipientText,
            // D-10 / EMAIL-06: RFC 8058 mailto-only List-Unsubscribe header on
            // every Send Update send. Static literal -- T-46-03-01.
            headers: {
              "List-Unsubscribe": SEND_UPDATE_LIST_UNSUBSCRIBE,
            },
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
          const props: SendUpdateEmailInput = {
            project: adaptedProject,
            personalNote,
            personalActionItems: [],
            pendingArtifacts,
            showMilestones,
            showProcurement,
            showReviewItems: showArtifacts,
            baseUrl,
            ctaHref: `${baseUrl}/portal/dashboard`,
            clientFirstName: client.name?.split(" ")[0],
            tenant,
            preheader,
          };
          const element = createElement(SendUpdate, props);
          const html = await render(element);
          const text = await render(element, { plainText: true });
          const cc: string[] = [];
          if (ccDefault) cc.push(...resolvedCcList);
          const resendResult = await resend.emails.send({
            from: resolvedFrom,
            to: [client.email],
            ...(cc.length > 0 && { cc }),
            subject: `Project update — ${project.title || client.name || "your project"}`,
            html,
            text,
            // D-10 / EMAIL-06: RFC 8058 mailto-only List-Unsubscribe header on
            // every Send Update send. Static literal -- T-46-03-01.
            headers: {
              "List-Unsubscribe": SEND_UPDATE_LIST_UNSUBSCRIBE,
            },
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
