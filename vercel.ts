// Phase 36: Vercel canonical config migrated from vercel.json per Phase 36
// CONTEXT D-05 (vercel.ts is the recommended config in 2026-02 Vercel docs).
//
// Crons:
//   - tracking-sync: existing daily Ship24 sweep (was in vercel.json).
//   - auto-archive:  Phase 36 PROJ-04 -- 03:00 UTC daily, archive completed
//                    projects with completedAt <= now - 90d.
//
// Both cron paths live under src/pages/api/cron/ and authenticate via the
// CRON_SECRET env var (see .env.example).
import { type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  rewrites: [
    { source: "/admin/:path*", destination: "/admin" },
  ],
  crons: [
    { path: "/api/cron/tracking-sync", schedule: "0 11 * * *" },
    { path: "/api/cron/auto-archive", schedule: "0 3 * * *" },
  ],
};

export default config;
