export const prerender = false;

import type { APIRoute } from "astro";
import { Redis } from "@upstash/redis";

export const GET: APIRoute = async ({ request }) => {
  // One-time use: require seed-key query param
  const seedKey = new URL(request.url).searchParams.get("key");
  if (seedKey !== "sprezzatura-demo-2026") {
    return new Response("Unauthorized", { status: 401 });
  }

  const links = [
    { token: "demo-client-thornton", data: { entityId: "seed-client-thornton", role: "client" }, portal: "portal", label: "Client — Victoria Thornton (2 projects)" },
    { token: "demo-client-chen", data: { entityId: "seed-client-chen", role: "client" }, portal: "portal", label: "Client — Catherine Chen (Darien)" },
    { token: "demo-client-mitchell", data: { entityId: "seed-client-mitchell-robert", role: "client" }, portal: "portal", label: "Client — Robert Mitchell (North Shore)" },
    { token: "demo-client-walsh", data: { entityId: "seed-client-walsh", role: "client" }, portal: "portal", label: "Client — Margaret Walsh (completed)" },
    { token: "demo-contractor-deluca", data: { entityId: "seed-contractor-deluca", role: "contractor" }, portal: "workorder", label: "Contractor — Marco DeLuca" },
    { token: "demo-contractor-costa", data: { entityId: "seed-contractor-costa", role: "contractor" }, portal: "workorder", label: "Contractor — Ana Costa" },
    { token: "demo-bm-brennan", data: { entityId: "tbrennan@example.com", role: "building_manager" }, portal: "building", label: "Building Manager — Thomas Brennan" },
  ];

  const BASE = new URL(request.url).origin;
  const TTL = 86400 * 365; // 1 year
  const results: string[] = [];

  // Debug: test Sanity data availability
  if (new URL(request.url).searchParams.has("debug")) {
    const { sanityClient } = await import("sanity:client");
    const client = await sanityClient.fetch('*[_id == "seed-client-thornton"][0]{_id, name}');
    const projects = await sanityClient.fetch('*[_type == "project" && portalEnabled == true && references("seed-client-thornton")]{_id, title}');
    return new Response(JSON.stringify({ client, projects, sanityConfig: sanityClient.config() }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (!kvUrl || !kvToken) {
      return new Response(`KV not configured.\nURL: ${kvUrl ? "set" : "missing"}\nToken: ${kvToken ? "set" : "missing"}`, { status: 500 });
    }

    const redis = new Redis({ url: kvUrl, token: kvToken });

    for (const link of links) {
      await redis.set(`magic:${link.token}`, JSON.stringify(link.data), { ex: TTL });
      results.push(`${link.label}\n  ${BASE}/${link.portal}/verify?token=${link.token}\n`);
    }

    return new Response(results.join("\n") + "\nAll tokens expire in 24 hours.\n", {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: any) {
    return new Response(`Error: ${err.message}\n${err.stack}`, { status: 500 });
  }
};
