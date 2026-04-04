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
  const TTL = 86400; // 24 hours
  const results: string[] = [];

  // Debug: check if query param "debug" is present — return env info only
  if (new URL(request.url).searchParams.has("debug")) {
    const kvUrl = import.meta.env.KV_REST_API_URL || "UNSET_META";
    const kvToken = import.meta.env.KV_REST_API_TOKEN ? "SET" : "UNSET_META";
    const pUrl = process.env.KV_REST_API_URL || "UNSET_PROC";
    const pToken = process.env.KV_REST_API_TOKEN ? "SET" : "UNSET_PROC";
    return new Response(`import.meta.env.KV_REST_API_URL: ${kvUrl}\nimport.meta.env token: ${kvToken}\nprocess.env.KV_REST_API_URL: ${pUrl}\nprocess.env token: ${pToken}\n`, {
      headers: { "Content-Type": "text/plain" },
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

    return new Response(debugInfo + results.join("\n") + "\nAll tokens expire in 24 hours.\n", {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: any) {
    return new Response(`Error: ${err.message}\n${err.stack}`, { status: 500 });
  }
};
