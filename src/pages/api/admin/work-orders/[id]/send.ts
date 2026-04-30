export const prerender = false;

import type { APIRoute } from "astro";
import { sanityWriteClient } from "../../../../../sanity/writeClient";
import { generatePortalToken } from "../../../../../lib/generateToken";
import { getSession } from "../../../../../lib/session";
import { redis } from "../../../../../lib/redis";
import { render } from "@react-email/render";
import { createElement } from "react";
import { WorkOrder } from "../../../../../emails/workOrder/WorkOrder";
import { getTenantBrand } from "../../../../../lib/email/tenantBrand";

// Phase 39 Plan 04 Task 2 — POST /api/admin/work-orders/[id]/send
// Phase 46 Plan 03 — rewired to react-email render (D-14 cutover);
// plain-text via render(..., { plainText: true }) (D-8). NO unsubscribe
// header (D-12: Work Order is not a bulk message).
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-04-PLAN.md § Task 2
//   .planning/phases/39-work-order-documents-panels/39-PATTERNS.md § api/admin/work-orders/[id]/send.ts
// Pattern reference: src/pages/api/send-update.ts L103-260 (Settings-first
// resolver + CRLF guard + Resend dynamic import + sendLog-analog append).

export const POST: APIRoute = async ({ request, cookies, params, locals }) => {
  try {
    // Admin gate (verbatim from artifact-version.ts L10-26).
    const session = await getSession(cookies);
    if (!session || session.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!session.tenantId) {
      return new Response(JSON.stringify({ error: "No tenant context" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Phase 49 D-14 (IMPER-03) — belt-and-braces 403 gate. The middleware
    // 401 (Plan 07) is the primary block; this layer is depth-of-defense
    // and ensures resend.emails.send is unreachable from an impersonated
    // session. 403 specifically (not 401) so future telemetry can
    // distinguish "impersonation tried to email" from generic mutation
    // blocks. Placed AFTER the tenant gate so a missing-tenantId session
    // still receives "No tenant context" first.
    if (locals.impersonating) {
      return new Response(
        JSON.stringify({ error: "Cannot send email during impersonation" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const workOrderId = params.id;
    if (!workOrderId) {
      return new Response(JSON.stringify({ error: "Missing work order id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch workOrder + joined project + contractor.
    const wo = (await sanityWriteClient.fetch(
      `*[_type == "workOrder" && _id == $id][0]{
        _id,
        "project": project->{_id, title},
        "contractor": contractor->{_id, name, email}
      }`,
      { id: workOrderId },
    )) as {
      _id: string;
      project: { _id: string; title: string };
      contractor: { _id: string; name: string; email: string };
    } | null;

    if (!wo) {
      return new Response(
        JSON.stringify({ error: "Work order not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Phase 38 Plan 02 — Settings-first sender resolver (verbatim from
    // send-update.ts L103-131; log prefix swapped to [WorkOrder]).
    const senderSettings =
      (await sanityWriteClient.fetch<{
        defaultFromEmail?: string;
        defaultCcEmail?: string;
      } | null>(
        `*[_type == "siteSettings"][0]{ defaultFromEmail, defaultCcEmail }`,
      )) ?? null;

    const resolvedFrom =
      senderSettings?.defaultFromEmail?.trim() ||
      (import.meta.env.RESEND_FROM as string | undefined) ||
      "office@lasprezz.com";

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const resolvedCcList: string[] = (() => {
      const raw = senderSettings?.defaultCcEmail?.trim() ?? "";
      if (raw.length === 0) return ["liz@lasprezz.com"];
      if (/[\r\n]/.test(raw)) {
        console.warn(
          "[WorkOrder] CRLF in defaultCcEmail dropped; falling back to empty cc",
        );
        return [];
      }
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && EMAIL_REGEX.test(s));
    })();

    // Defense-in-depth on to: contractor.email (T-39-04-02).
    if (!EMAIL_REGEX.test(wo.contractor.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid contractor email address" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Phase 38 D-09 bracketed display-name tolerance.
    const fromDisplayName = (() => {
      const match = resolvedFrom.match(/^(.+)\s*<.+>$/);
      return match ? match[1].trim() : resolvedFrom;
    })();

    // baseUrl resolver (send-update.ts L34-41).
    const requestOrigin = new URL(request.url).origin;
    const baseUrl =
      requestOrigin && !requestOrigin.includes("0.0.0.0")
        ? requestOrigin
        : (import.meta.env.SITE as string) || "https://lasprezz.com";

    // Generate magic-link token so the email CTA auto-authenticates the contractor.
    const magicToken = generatePortalToken(32);
    const portalPath = `/workorder/project/${wo.project._id}/orders/${wo._id}`;
    const verifyUrl = `${baseUrl}/workorder/verify?token=${magicToken}&redirect=${encodeURIComponent(portalPath)}`;
    await redis.set(`magic:${magicToken}`, JSON.stringify({ entityId: wo.contractor._id, role: "contractor", reusable: true }), { ex: 604800 });

    // Resend send (skip if no API key — sandbox-friendly per Pitfall 4).
    const apiKey = import.meta.env.RESEND_API_KEY;
    let resendId = "";
    if (apiKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const workOrderProps = {
        project: wo.project,
        contractor: wo.contractor,
        workOrderId: wo._id,
        baseUrl,
        fromDisplayName,
        verifyUrl,
        // D-13: preheader computed at call site, passed via prop.
        preheader: `Work order ready for ${wo.project.title} — view your latest version`,
        // Tenant brand (signoff name + location + wordmark) -- resolved from
        // siteSettings so the operator can edit it via /admin/settings.
        tenant: await getTenantBrand(sanityWriteClient),
      };
      const workOrderElement = createElement(WorkOrder, workOrderProps);
      const htmlBody = await render(workOrderElement);
      const textBody = await render(workOrderElement, { plainText: true });
      const result = await resend.emails.send({
        from: resolvedFrom,
        to: [wo.contractor.email],
        ...(resolvedCcList.length > 0 && { cc: resolvedCcList }),
        subject: `Work order — ${wo.project.title}`,
        html: htmlBody,
        text: textBody,
      });
      if (result.error) {
        console.error(
          "[WorkOrder] Resend error:",
          result.error,
          "to:",
          wo.contractor.email,
        );
        return new Response(
          JSON.stringify({ error: "Email send failed" }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }
      resendId = result.data?.id ?? "";
      console.log(
        "[WorkOrder] Sent id=",
        resendId,
        "to:",
        wo.contractor.email,
      );
    } else {
      console.log(
        "[WorkOrder] No RESEND_API_KEY set. Would send for:",
        workOrderId,
      );
    }

    // Append sendLog entry + update lastSentAt atomically.
    const sentAt = new Date().toISOString();
    await sanityWriteClient
      .patch(workOrderId)
      .setIfMissing({ sendLog: [] })
      .append("sendLog", [
        {
          _key: generatePortalToken(8),
          sentAt,
          toEmail: wo.contractor.email,
          ccEmails: resolvedCcList.join(", "),
          resendId,
        },
      ])
      .set({ lastSentAt: sentAt })
      .commit({ autoGenerateArrayKeys: false });

    return new Response(
      JSON.stringify({ success: true, sentAt, resendId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[WorkOrder] Failed to send:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send work order" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
