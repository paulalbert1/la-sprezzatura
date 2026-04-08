export const prerender = false;

import type { APIRoute } from "astro";
import { verifyAdminPassword } from "../../../lib/adminAuth";
import { createSession } from "../../../lib/session";
import { adminLoginRatelimit } from "../../../lib/rateLimit";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { success } = await adminLoginRatelimit.limit(ip);
  if (!success) {
    return new Response(
      JSON.stringify({ error: "Too many login attempts" }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, password } = body;
  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Email and password required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const result = await verifyAdminPassword(email.trim().toLowerCase(), password);
  if (!result) {
    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  await createSession(cookies, result.admin.email, "admin", result.tenant.id);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
