import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Magic link requests: 3 per 10 minutes per email address
export const magicLinkRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "ratelimit:magic",
});

// Contact form submissions: 3 per 1 minute per IP
export const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  prefix: "ratelimit:contact",
});
