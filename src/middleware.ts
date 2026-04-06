import { defineMiddleware } from "astro:middleware";
import { getSession } from "./lib/session";

const PUBLIC_PATHS = [
  "/portal/login",
  "/portal/verify",
  "/workorder/login",
  "/workorder/verify",
  "/building/login",
  "/building/verify",
  "/admin/login",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();

    const session = await getSession(context.cookies);
    if (!session || session.role !== "admin") {
      return context.redirect("/admin/login");
    }

    context.locals.adminEmail = session.entityId;
    context.locals.role = session.role;
    return next();
  }

  // Client portal routes
  if (pathname.startsWith("/portal")) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();

    const session = await getSession(context.cookies);
    if (!session || session.role !== "client") {
      return context.redirect("/portal/login");
    }

    context.locals.clientId = session.entityId;
    context.locals.role = session.role;
    return next();
  }

  // Contractor work order routes
  if (pathname.startsWith("/workorder")) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();

    const session = await getSession(context.cookies);
    if (!session || session.role !== "contractor") {
      return context.redirect("/workorder/login");
    }

    context.locals.contractorId = session.entityId;
    context.locals.role = session.role;
    return next();
  }

  // Building manager portal routes
  if (pathname.startsWith("/building")) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next();

    const session = await getSession(context.cookies);
    if (!session || session.role !== "building_manager") {
      return context.redirect("/building/login");
    }

    context.locals.buildingManagerEmail = session.entityId;
    context.locals.role = session.role;
    return next();
  }

  return next();
});
