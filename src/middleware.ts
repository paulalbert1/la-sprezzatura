import { defineMiddleware } from "astro:middleware";
import { sanityClient } from "sanity:client";
import { getSession, clearSession } from "./lib/session";
import { getTenantByAdminEmail } from "./lib/tenants";
import {
  hashPortalToken,
  timingSafeEqualHash,
} from "./lib/portal/portalTokenHash";

const PUBLIC_PATHS = [
  "/portal/login",
  "/portal/verify",
  // Phase 49 Plan 07 IMPER-02: the redeem route mints a brand-new
  // impersonated session from a one-shot ticket; it must be reachable
  // WITHOUT an existing role-matched session (RESEARCH Open Q2). The
  // route handler itself validates the ticket and mints the session.
  "/portal/_enter-impersonation",
  // Phase 34 Plan 06 KR-7: the /portal/client/[token] route MUST be public
  // so the route handler itself can mint the PURL session cookie. Trailing
  // slash so a bare /portal/client visit (without token) still falls through
  // to the guarded branch.
  "/portal/client/",
  "/workorder/login",
  "/workorder/verify",
  "/building/login",
  "/building/verify",
];

// Phase 34 Plan 06 T-34-08: PURL-derived sessions are READ-ONLY. Any
// non-safe HTTP method targeting /api/* must 401 if the session carries
// source === "purl". Safe methods (GET, HEAD, OPTIONS) pass through — the
// downstream /api/admin branch still enforces role === "admin" so the
// PURL session fails that gate anyway. Kept as belt-and-braces so future
// non-admin mutation surfaces (e.g. portal-read-only APIs) inherit the
// same protection without an opt-in.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Read-only gate for PURL sessions on API mutations (T-34-08)
  if (
    pathname.startsWith("/api/") &&
    !SAFE_METHODS.has(context.request.method)
  ) {
    const purlGateSession = await getSession(context.cookies);
    if (purlGateSession?.source === "purl") {
      return new Response(
        JSON.stringify({ error: "PURL sessions are read-only" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    // Phase 49 Plan 07 D-13 / IMPER-02: sibling read-only gate for
    // impersonation sessions (NOT a generalization of the PURL branch — D-03).
    // Reuses the same purlGateSession to avoid a second Redis round-trip
    // (RESEARCH § Pattern 1).
    if (purlGateSession?.impersonating) {
      return new Response(
        JSON.stringify({ error: "Impersonation sessions are read-only" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    // Fall through — per-branch session checks below still run.
  }

  // Client portal routes
  if (pathname.startsWith("/portal")) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();

    const session = await getSession(context.cookies);
    if (!session) {
      return context.redirect("/portal/login");
    }
    // Phase 49 Plan 07 D-04: when session.impersonating is set, the role
    // gate checks the VIEWER role (impersonating.role), not session.role
    // (which stays 'admin' per D-01). Without impersonating, fall back to
    // session.role for backward compat.
    const viewerEntity = session.impersonating?.entityId ?? session.entityId;
    const viewerRole = session.impersonating?.role ?? session.role;
    if (viewerRole !== "client") {
      return context.redirect("/portal/login");
    }

    // Phase 34 Plan 06 T-34-07: PURL session hash re-validation.
    // On every /portal/* request (not just at login) we re-fetch the
    // client's current portalToken, hash it, and compare to the
    // session-stored hash using a constant-time comparison. A mismatch
    // means Liz regenerated the token (via the D-22 regenerate action),
    // which invalidates every active PURL session for that client across
    // every project they're on. Matches "regenerate = kill all active
    // access" mental model.
    if (session.source === "purl" && session.portalTokenHash) {
      const currentToken = await sanityClient.fetch<string | null>(
        `*[_id == $id][0].portalToken`,
        { id: session.entityId },
      );
      if (
        !currentToken ||
        !timingSafeEqualHash(
          hashPortalToken(currentToken),
          session.portalTokenHash,
        )
      ) {
        clearSession(context.cookies);
        return context.redirect("/portal/login");
      }
    }

    // Phase 49 Plan 07 D-04: locals reflect viewer identity. tenantId stays
    // from session (admin's tenantId is the impersonation's tenantId per
    // D-01 + the Plan 04 mint enforces payload.tenantId === session.tenantId).
    context.locals.clientId = (viewerRole === "client") ? viewerEntity : undefined;
    context.locals.role = viewerRole;
    context.locals.tenantId = session.tenantId;
    if (session.impersonating) {
      context.locals.impersonating = {
        adminEmail: session.impersonating.adminEmail,
        adminEntityId: session.entityId, // STAYS admin (D-01)
        mintedAt: session.impersonating.mintedAt,
      };
    }
    return next();
  }

  // Contractor work order routes
  if (pathname.startsWith("/workorder")) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();

    const session = await getSession(context.cookies);
    if (!session) {
      return context.redirect("/workorder/login");
    }
    const viewerEntity = session.impersonating?.entityId ?? session.entityId;
    const viewerRole = session.impersonating?.role ?? session.role;
    if (viewerRole !== "contractor") {
      return context.redirect("/workorder/login");
    }

    context.locals.contractorId = (viewerRole === "contractor") ? viewerEntity : undefined;
    context.locals.role = viewerRole;
    context.locals.tenantId = session.tenantId;
    if (session.impersonating) {
      context.locals.impersonating = {
        adminEmail: session.impersonating.adminEmail,
        adminEntityId: session.entityId, // STAYS admin (D-01)
        mintedAt: session.impersonating.mintedAt,
      };
    }
    return next();
  }

  // Building manager portal routes
  if (pathname.startsWith("/building")) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();

    const session = await getSession(context.cookies);
    if (!session) {
      return context.redirect("/building/login");
    }
    const viewerEntity = session.impersonating?.entityId ?? session.entityId;
    const viewerRole = session.impersonating?.role ?? session.role;
    if (viewerRole !== "building_manager") {
      return context.redirect("/building/login");
    }

    context.locals.buildingManagerEmail = (viewerRole === "building_manager") ? viewerEntity : undefined;
    context.locals.role = viewerRole;
    context.locals.tenantId = session.tenantId;
    if (session.impersonating) {
      context.locals.impersonating = {
        adminEmail: session.impersonating.adminEmail,
        adminEntityId: session.entityId, // STAYS admin (D-01)
        mintedAt: session.impersonating.mintedAt,
      };
    }
    return next();
  }

  // Admin routes (pages and API)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login" || pathname === "/api/admin/login") return next();

    const session = await getSession(context.cookies);
    if (!session || session.role !== "admin" || !session.tenantId) {
      return context.redirect("/admin/login");
    }

    context.locals.tenantId = session.tenantId;
    context.locals.role = session.role;

    // Resolve sanityUserId from tenant admin config (Phase 33 Risk 1 resolution)
    const adminEntry = getTenantByAdminEmail(session.entityId)?.admins.find(
      (a) => a.email.toLowerCase() === session.entityId.toLowerCase(),
    );
    context.locals.sanityUserId = adminEntry?.sanityUserId;

    return next();
  }

  // Astro action POSTs hit /_actions/<name>/ regardless of which page invoked
  // them, so the path-prefixed branches above never run. Hydrate locals from
  // the session so each action's own auth gate sees what the calling page saw.
  // No redirect — actions are POST-only; let the action enforce its own role gate.
  //
  // Phase 49 Plan 07 D-04 + RESEARCH Pitfall F: this branch MUST also honor
  // session.impersonating. Without it, an Astro Action invoked during
  // impersonation would record createdBy: <admin@email> instead of being
  // routed through the viewer identity. The /api/* sibling read-only gate
  // 401s mutating Astro Actions before this branch runs, but safe-method
  // actions and downstream handlers still rely on locals reflecting the viewer.
  if (pathname.startsWith("/_actions/")) {
    const session = await getSession(context.cookies);
    if (session) {
      const viewerEntity = session.impersonating?.entityId ?? session.entityId;
      const viewerRole = session.impersonating?.role ?? session.role;
      context.locals.role = viewerRole;
      if (viewerRole === "admin" && session.tenantId) {
        context.locals.tenantId = session.tenantId;
        const adminEntry = getTenantByAdminEmail(session.entityId)?.admins.find(
          (a) => a.email.toLowerCase() === session.entityId.toLowerCase(),
        );
        context.locals.sanityUserId = adminEntry?.sanityUserId;
      } else if (viewerRole === "client") {
        context.locals.clientId = viewerEntity;
      } else if (viewerRole === "contractor") {
        context.locals.contractorId = viewerEntity;
      } else if (viewerRole === "building_manager") {
        context.locals.buildingManagerEmail = viewerEntity;
      }
      // tenantId carries from session for ALL impersonation cases (D-01).
      if (session.impersonating) {
        context.locals.tenantId = session.tenantId;
        context.locals.impersonating = {
          adminEmail: session.impersonating.adminEmail,
          adminEntityId: session.entityId, // STAYS admin (D-01)
          mintedAt: session.impersonating.mintedAt,
        };
      }
    }
    return next();
  }

  return next();
});
