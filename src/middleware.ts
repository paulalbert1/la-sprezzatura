import { defineMiddleware } from "astro:middleware";
import { getSession } from "./lib/session";

const PUBLIC_PORTAL_PATHS = ["/portal/login", "/portal/verify"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Only apply to /portal/* routes
  if (!context.url.pathname.startsWith("/portal")) {
    return next();
  }

  // Allow public portal paths (login, verify) without session
  if (
    PUBLIC_PORTAL_PATHS.some((p) => context.url.pathname.startsWith(p))
  ) {
    return next();
  }

  // Validate session for all other /portal/* routes
  const clientId = await getSession(context.cookies);

  if (!clientId) {
    return context.redirect("/portal/login");
  }

  // Inject client identity into locals (AUTH-04: attribution)
  context.locals.clientId = clientId;
  return next();
});
