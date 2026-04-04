import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.KV_REST_API_URL || import.meta.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN || import.meta.env.KV_REST_API_TOKEN,
});
