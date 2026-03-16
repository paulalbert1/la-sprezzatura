# Deferred Items - Phase 06

## Pre-existing Issues (out of scope)

1. **Redis URL double-quoting in local .env** - `npm run build` fails at prerender for `/portfolio/darien-living-room` because the local `KV_REST_API_URL` env var has extra quotes around the URL value (e.g., `"https://..."` instead of `https://...`). This is a local env configuration issue, not a code issue. Does not affect Vercel deployment or tests.
