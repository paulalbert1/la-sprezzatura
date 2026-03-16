import type { APIRoute } from "astro";
import { clearSession } from "../../lib/session";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  clearSession(context.cookies);
  return context.redirect("/portal/login");
};
