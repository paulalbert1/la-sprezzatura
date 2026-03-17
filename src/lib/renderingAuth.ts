/**
 * Studio API authentication and rendering usage quota management.
 *
 * Validates STUDIO_API_SECRET shared secret header, checks the
 * siteSettings exclude list, and manages per-designer per-month
 * usage quotas with atomic increment.
 */

import { sanityWriteClient } from "../sanity/writeClient";

export interface AuthResult {
  authorized: boolean;
  sanityUserId?: string;
  error?: string;
  statusCode?: number;
}

export interface UsageResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
}

const RENDERING_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  renderingExcludedUsers,
  renderingAllocation
}`;

/**
 * Validate a rendering API request:
 * 1. Check x-studio-token header matches STUDIO_API_SECRET
 * 2. Extract sanityUserId from request body
 * 3. Check user is not in renderingExcludedUsers list
 * 4. Verify GEMINI_API_KEY is configured (unless test mode)
 */
export async function validateRenderingAuth(
  request: Request,
): Promise<AuthResult> {
  // Step 1: Validate studio token
  const studioToken = request.headers.get("x-studio-token");
  const expectedSecret = import.meta.env.STUDIO_API_SECRET;

  if (!studioToken || studioToken !== expectedSecret) {
    return {
      authorized: false,
      error:
        "Invalid studio token. Please reload Sanity Studio and try again.",
      statusCode: 401,
    };
  }

  // Step 2: Extract sanityUserId from body
  let body: Record<string, unknown>;
  try {
    const cloned = request.clone();
    body = (await cloned.json()) as Record<string, unknown>;
  } catch {
    return {
      authorized: false,
      error: "Invalid request body.",
      statusCode: 400,
    };
  }

  const sanityUserId = body.sanityUserId as string | undefined;
  if (!sanityUserId) {
    return {
      authorized: false,
      error: "Missing sanityUserId in request body.",
      statusCode: 400,
    };
  }

  // Step 3: Check exclude list
  const settings = await sanityWriteClient.fetch(RENDERING_SETTINGS_QUERY);
  const excludedUsers: string[] = settings?.renderingExcludedUsers || [];

  if (excludedUsers.includes(sanityUserId)) {
    return {
      authorized: false,
      error: "Your account does not have access to AI Rendering.",
      statusCode: 403,
    };
  }

  // Step 4: Check GEMINI_API_KEY (unless test mode)
  if (
    !import.meta.env.GEMINI_API_KEY &&
    import.meta.env.RENDERING_TEST_MODE !== "true"
  ) {
    return {
      authorized: false,
      error:
        "AI Rendering is not configured. Contact Paul to set up the Gemini API key.",
      statusCode: 503,
    };
  }

  return { authorized: true, sanityUserId };
}

/**
 * Check the usage quota for a designer in the current calendar month.
 *
 * Creates a new renderingUsage document if none exists for this
 * user + month combination.
 */
export async function checkUsageQuota(
  sanityUserId: string,
): Promise<UsageResult> {
  const month = new Date().toISOString().slice(0, 7);
  const docId = `usage-${sanityUserId}-${month}`;

  // Fetch allocation from siteSettings
  const settings = await sanityWriteClient.fetch(
    `*[_type == "siteSettings"][0]{ renderingAllocation }`,
  );
  const limit = settings?.renderingAllocation || 50;

  // Fetch existing usage doc
  const usageDoc = await sanityWriteClient.fetch(
    `*[_id == $docId][0]`,
    { docId },
  );

  if (!usageDoc) {
    // Create new usage document for this month
    await sanityWriteClient.createOrReplace({
      _id: docId,
      _type: "renderingUsage",
      sanityUserId,
      month,
      count: 0,
      limit,
      bytesStored: 0,
    });

    return { allowed: true, count: 0, limit, remaining: limit };
  }

  const count = usageDoc.count || 0;
  const remaining = Math.max(0, limit - count);

  return {
    allowed: remaining > 0,
    count,
    limit,
    remaining,
  };
}

/**
 * Atomically increment the usage counter and bytes stored for a designer
 * in the current calendar month.
 */
export async function incrementUsage(
  sanityUserId: string,
  bytesStored: number,
): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);
  const docId = `usage-${sanityUserId}-${month}`;

  await sanityWriteClient
    .patch(docId)
    .inc({ count: 1, bytesStored })
    .commit();
}
