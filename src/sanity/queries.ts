import { sanityClient } from "sanity:client";
import type { SanityClient } from "@sanity/client";

// Portfolio overview -- only projects marked for public portfolio, ordered by portfolio order
export async function getProjects() {
  return sanityClient.fetch(`
    *[_type == "project" && showInPortfolio == true] | order(portfolioOrder asc, order asc) {
      _id,
      title,
      "displayTitle": coalesce(portfolioTitle, title),
      slug,
      "displayImage": coalesce(portfolioImage, heroImage) {
        ...,
        asset-> {
          url,
          metadata {
            lqip,
            dimensions
          }
        }
      },
      heroImage {
        ...,
        asset-> {
          url,
          metadata {
            lqip,
            dimensions
          }
        }
      },
      roomType,
      style,
      location,
      featured,
      portfolioRoomTags
    }
  `);
}

// Single project by slug -- full field projection
export async function getProjectBySlug(slug: string) {
  return sanityClient.fetch(
    `
    *[_type == "project" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      heroImage {
        ...,
        asset-> {
          url,
          metadata {
            lqip,
            dimensions
          }
        }
      },
      images[] {
        ...,
        asset-> {
          url,
          metadata {
            lqip,
            dimensions
          }
        }
      },
      roomType,
      style,
      location,
      description,
      challenge,
      approach,
      outcome,
      testimonial,
      completionDate,
      featured,
      order
    }
  `,
    { slug },
  );
}

// Portal token lookup -- find project by PURL token (only if portal is enabled)
export async function getProjectByPortalToken(token: string) {
  return sanityClient.fetch(
    `*[_type == "project" && portalToken == $token && portalEnabled == true][0]{
      title, clientName, pipelineStage
    }`,
    { token },
  );
}

// Featured projects for home page -- max 3
export async function getFeaturedProjects() {
  return sanityClient.fetch(`
    *[_type == "project" && featured == true] | order(order asc) [0...3] {
      _id,
      title,
      slug,
      heroImage {
        ...,
        asset-> {
          url,
          metadata { lqip, dimensions }
        }
      },
      roomType,
      location
    }
  `);
}

// Site settings singleton
export async function getSiteSettings() {
  return sanityClient.fetch(`
    *[_type == "siteSettings"][0] {
      siteTitle,
      tagline,
      contactEmail,
      contactPhone,
      studioLocation,
      socialLinks,
      heroSlideshow[] {
        alt,
        image {
          ...,
          asset-> {
            url,
            metadata {
              lqip,
              dimensions
            }
          }
        }
      }
    }
  `);
}

// All services ordered by display order
export async function getServices() {
  return sanityClient.fetch(`
    *[_type == "service"] | order(order asc) {
      _id,
      title,
      slug,
      tagline,
      description,
      features,
      idealFor,
      order,
      icon
    }
  `);
}

// -- Phase 5: Auth & Client Queries --

// GROQ: Look up client by email (magic link request)
export const CLIENT_BY_EMAIL_QUERY = `
  *[_type == "client" && email == $email][0] {
    _id,
    name,
    email
  }
`;

export async function getClientByEmail(email: string) {
  return sanityClient.fetch(CLIENT_BY_EMAIL_QUERY, { email });
}

// GROQ: Look up client by portalToken (Phase 34 Plan 06 — /portal/client/[token]).
// The token is cryptographically random (generatePortalToken, CHARSET^8 space),
// so the equality filter is safe from enumeration. Used by the PURL dashboard
// route handler in src/lib/portal/clientDashboard.ts; duplicated as a local
// const in that module so its Vitest mocks only need to stub sanityClient.fetch
// once. Exported here so other admin surfaces can reuse the same GROQ.
//
// Param name is `$purl` rather than `$token` to sidestep a @sanity/client
// TS overload-inference quirk that breaks `fetch(Q, { token })` when Q is a
// literal string const (see pre-existing error at line ~92 for the twin case).
export const CLIENT_BY_PORTAL_TOKEN_QUERY = `
  *[_type == "client" && portalToken == $purl][0] {
    _id,
    name,
    email,
    portalToken
  }
`;

export async function getClientByPortalToken(token: string) {
  return sanityClient.fetch(CLIENT_BY_PORTAL_TOKEN_QUERY, { purl: token });
}

// GROQ: Get all portal-enabled projects for an authenticated client
// Uses references() built-in to match the client _id in the clients[] array
export const PROJECTS_BY_CLIENT_QUERY = `
  *[_type == "project" && portalEnabled == true && references($clientId)] | order(pipelineStage asc) {
    _id,
    title,
    pipelineStage,
    engagementType,
    completedAt,
    projectStatus,
    "isPrimary": clients[client._ref == $clientId][0].isPrimary
  }
`;

export async function getProjectsByClientId(clientId: string) {
  return sanityClient.fetch(PROJECTS_BY_CLIENT_QUERY, { clientId });
}

// GROQ: Get client by ID (for dashboard greeting)
export const CLIENT_BY_ID_QUERY = `
  *[_type == "client" && _id == $clientId][0] {
    _id,
    name,
    email
  }
`;

export async function getClientById(clientId: string) {
  return sanityClient.fetch(CLIENT_BY_ID_QUERY, { clientId });
}

// -- Phase 6: Project Detail Query --

// Full project detail for the portal project page.
// IMPORTANT: clientCost is NEVER included in projections -- only used to compute savings.
export const PROJECT_DETAIL_QUERY = `
  *[_type == "project" && _id == $projectId && portalEnabled == true && references($clientId)][0] {
    _id,
    title,
    pipelineStage,
    engagementType,
    projectStatus,
    completedAt,
    isCommercial,
    "isPrimary": clients[client._ref == $clientId][0].isPrimary,
    milestones[] | order(date asc) {
      _key,
      name,
      date,
      completed,
      description,
      notes[] {
        _key,
        text,
        clientId,
        clientName,
        timestamp
      }
    },
    ...select(engagementType == "full-interior-design" => {
      "procurementItems": procurementItems[] {
        _key,
        name,
        status,
        installDate,
        retailPrice,
        "savings": retailPrice - clientCost,
        trackingNumber
      },
      "contractors": contractors[] {
        "name": contractor->name,
        "trades": contractor->trades,
        "appointments": appointments[] | order(dateTime asc) {
          dateTime,
          label
        }
      }
    }),
    artifacts[] {
      _key,
      artifactType,
      customTypeName,
      currentVersionKey,
      signedFile {
        asset-> {
          url,
          originalFilename
        }
      },
      versions[] {
        _key,
        file {
          asset-> {
            url,
            originalFilename,
            mimeType,
            size
          }
        },
        uploadedAt,
        note
      },
      decisionLog[] {
        _key,
        action,
        versionKey,
        clientId,
        clientName,
        feedback,
        timestamp
      },
      notes[] {
        _key,
        text,
        clientId,
        clientName,
        timestamp
      },
      notificationLog[] {
        _key,
        sentAt,
        recipientEmail
      },
      investmentSummary {
        tiers[] {
          _key, name, description,
          lineItems[] {
            _key, name, price
          }
        },
        selectedTierKey,
        eagerness,
        reservations
      }
    }
  }
`;

export async function getProjectDetail(
  projectId: string,
  clientId: string,
) {
  return sanityClient.fetch(PROJECT_DETAIL_QUERY, { projectId, clientId });
}

// PROC-03 Convention: All financial values (procurement costs, retail prices)
// MUST be stored as integer cents using Sanity number field with .integer() validation.
// Example: validation: (r) => r.integer().min(0)
// This prevents floating-point rounding errors (e.g., $19.99 stored as 1999).
// Procurement schema fields added in Phase 6 following this pattern.

// -- Phase 7: Contractor Queries --

// GROQ: Look up contractor by email (magic link request)
export const CONTRACTOR_BY_EMAIL_QUERY = `
  *[_type == "contractor" && email == $email][0] {
    _id,
    name,
    email
  }
`;

export async function getContractorByEmail(email: string) {
  return sanityClient.fetch(CONTRACTOR_BY_EMAIL_QUERY, { email });
}

// GROQ: Get contractor by ID (for dashboard greeting)
export const CONTRACTOR_BY_ID_QUERY = `
  *[_type == "contractor" && _id == $contractorId][0] {
    _id,
    name,
    email,
    company
  }
`;

export async function getContractorById(contractorId: string) {
  return sanityClient.fetch(CONTRACTOR_BY_ID_QUERY, { contractorId });
}

// GROQ: Projects assigned to a contractor (for work order dashboard)
// Only returns Full Interior Design projects with portal enabled
export const PROJECTS_BY_CONTRACTOR_QUERY = `
  *[_type == "project" && portalEnabled == true &&
    engagementType == "full-interior-design" &&
    count(contractors[contractor._ref == $contractorId]) > 0
  ] | order(projectStatus asc) {
    _id,
    title,
    pipelineStage,
    projectStatus,
    "projectAddress": projectAddress {
      street, city, state, zip
    },
    "assignment": contractors[contractor._ref == $contractorId][0] {
      startDate,
      endDate
    }
  }
`;

export async function getProjectsByContractorId(contractorId: string) {
  return sanityClient.fetch(PROJECTS_BY_CONTRACTOR_QUERY, { contractorId });
}

// -- Phase 8: Work Order Detail, Building Manager, Site Settings Queries --

// GROQ: Work order project detail for contractor view
// INFORMATION BOUNDARY: primaryClientName only (no email, no phone), appointment notes included
export const WORK_ORDER_DETAIL_QUERY = `
  *[_type == "project" && _id == $projectId && portalEnabled == true &&
    engagementType == "full-interior-design" &&
    count(contractors[contractor._ref == $contractorId]) > 0
  ][0] {
    _id,
    title,
    "projectAddress": projectAddress {
      street, city, state, zip
    },
    "primaryClientName": clients[isPrimary == true][0].client->name,
    "assignment": contractors[contractor._ref == $contractorId][0] {
      _key,
      startDate,
      endDate,
      estimateFile,
      estimateAmount,
      scopeOfWork,
      contractorNotes,
      appointments[] | order(dateTime asc) {
        _key,
        dateTime,
        label,
        notes
      },
      submissionNotes[] | order(timestamp desc) {
        _key,
        text,
        contractorName,
        timestamp
      }
    },
    floorPlans[] {
      _key,
      planName,
      file,
      description
    }
  }
`;

export async function getWorkOrderDetail(projectId: string, contractorId: string) {
  return sanityClient.fetch(WORK_ORDER_DETAIL_QUERY, { projectId, contractorId });
}

// GROQ: Building manager project detail
// INFORMATION BOUNDARY: includes client email+phone, COIs, legal docs, contractor names+trades only
export const BUILDING_MANAGER_PROJECT_QUERY = `
  *[_type == "project" && _id == $projectId &&
    buildingManager.email == $email &&
    isCommercial == true && portalEnabled == true
  ][0] {
    _id,
    title,
    "projectAddress": projectAddress {
      street, city, state, zip
    },
    "primaryClient": clients[isPrimary == true][0].client-> {
      name, email, phone
    },
    cois[] {
      _key,
      issuerName,
      file,
      expirationDate,
      coverageType,
      policyNumber
    },
    legalDocs[] {
      _key,
      documentName,
      file,
      description
    },
    "contractors": contractors[] {
      "name": contractor->name,
      "trades": contractor->trades
    }
  }
`;

export async function getBuildingManagerProject(projectId: string, email: string) {
  return sanityClient.fetch(BUILDING_MANAGER_PROJECT_QUERY, { projectId, email });
}

// GROQ: All commercial projects for a building manager email (dashboard)
export const PROJECTS_BY_BUILDING_MANAGER_QUERY = `
  *[_type == "project" && buildingManager.email == $email &&
    isCommercial == true && portalEnabled == true
  ] | order(title asc) {
    _id,
    title,
    "projectAddress": projectAddress {
      street, city, state, zip
    }
  }
`;

export async function getProjectsByBuildingManagerEmail(email: string) {
  return sanityClient.fetch(PROJECTS_BY_BUILDING_MANAGER_QUERY, { email });
}

// GROQ: Full site settings singleton. Phase 34 Plan 03 widened this from a
// contactEmail+contactPhone-only projection to the full field set consumed
// by /admin/settings. Legacy portal consumers (workorder, building) still
// read only contactEmail and contactPhone — extra fields are harmless.
//
// Filters by `_type == "siteSettings"` (first match) rather than the fixed
// `_id == "siteSettings"` singleton so that legacy documents created by the
// pre-Phase-34 Studio UI (which used auto-generated IDs) keep resolving for
// portal consumers. The Phase 34 admin write path targets the fixed singleton
// ID via `sanityWriteClient.patch("siteSettings").setIfMissing({ ... })` —
// see /api/admin/site-settings.
export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    _id,
    siteTitle,
    tagline,
    contactEmail,
    contactPhone,
    studioLocation,
    socialLinks {
      instagram,
      pinterest,
      houzz
    },
    heroSlideshow[] {
      _key,
      image {
        _type,
        asset-> {
          _id,
          url
        }
      },
      alt
    },
    renderingAllocation,
    renderingImageTypes,
    renderingExcludedUsers,
    updateLog[] | order(savedAt desc)[0...5] {
      _key,
      savedAt,
      actor,
      action
    }
  }
`;

export async function getSiteContactInfo() {
  return sanityClient.fetch(SITE_SETTINGS_QUERY);
}

// -- Phase 9: Send Update Query --

// GROQ: Full project snapshot for Send Update email
// IMPORTANT: clientCost is NEVER included -- only used to compute savings server-side.
export const SEND_UPDATE_PROJECT_QUERY = `
  *[_type == "project" && _id == $projectId][0] {
    _id,
    title,
    engagementType,
    clients[] { client-> { _id, name, email } },
    milestones[] | order(date asc) {
      name, date, completed
    },
    ...select(engagementType == "full-interior-design" => {
      "procurementItems": procurementItems[] {
        name, status, installDate, retailPrice,
        "savings": retailPrice - clientCost
      }
    }),
    artifacts[] {
      _key, artifactType, customTypeName,
      currentVersionKey,
      "hasApproval": count(decisionLog[action == "approved"]) > 0
    },
    "lastUpdateSentAt": updateLog | order(sentAt desc) [0].sentAt
  }
`;

export async function getProjectForSendUpdate(projectId: string) {
  return sanityClient.fetch(SEND_UPDATE_PROJECT_QUERY, { projectId });
}

// -- Phase 10: Rendering Queries --

// GROQ: Rendering session by ID (for status polling and API routes)
export const RENDERING_SESSION_BY_ID_QUERY = `
  *[_type == "renderingSession" && _id == $sessionId][0] {
    _id,
    sessionTitle,
    project-> { _id, title },
    aspectRatio,
    stylePreset,
    description,
    status,
    lastError,
    createdBy,
    createdAt,
    images[] {
      _key,
      blobPathname,
      imageType,
      location,
      notes,
      copyExact
    },
    renderings[] {
      _key,
      blobPathname,
      prompt,
      textResponse,
      isPromoted,
      generatedAt,
      status,
      errorMessage,
      modelId,
      latencyMs,
      inputTokens,
      outputTokens,
      costEstimate,
      bytesStored
    },
    conversation[] {
      _key,
      role,
      text,
      image,
      timestamp
    }
  }
`;

// GROQ: Rendering sessions by project (for Studio tool session list)
export const RENDERING_SESSIONS_BY_PROJECT_QUERY = `
  *[_type == "renderingSession" && project._ref == $projectId] | order(createdAt desc) {
    _id,
    sessionTitle,
    status,
    createdAt,
    "renderingCount": count(renderings)
  }
`;

// GROQ: All rendering sessions by creator (for Studio tool -- includes scratchpad)
export const RENDERING_SESSIONS_BY_CREATOR_QUERY = `
  *[_type == "renderingSession" && createdBy == $sanityUserId] | order(createdAt desc) {
    _id,
    sessionTitle,
    project-> { _id, title },
    status,
    createdAt,
    "renderingCount": count(renderings)
  }
`;

// GROQ: All rendering sessions for the tenant dataset (admin view -- all designers)
// Tenant scoping is implicit: getTenantClient() already targets the correct dataset.
// Optional "Mine" filter applied client-side by SessionListPage by comparing createdBy.
export const RENDERING_SESSIONS_TENANT_QUERY = `
  *[_type == "renderingSession"] | order(createdAt desc) {
    _id,
    sessionTitle,
    project-> { _id, title },
    status,
    createdAt,
    createdBy,
    "renderingCount": count(renderings),
    "thumbnail": renderings[0].blobPathname
  }
`;

// GROQ: Design options by project (for client portal gallery)
export const DESIGN_OPTIONS_BY_PROJECT_QUERY = `
  *[_type == "designOption" && project._ref == $projectId] | order(sortOrder asc) {
    _id,
    blobPathname,
    caption,
    sortOrder,
    promotedAt,
    reactions[] {
      _key,
      clientId,
      type,
      text,
      createdAt
    }
  }
`;

// GROQ: Usage by designer and month
export const RENDERING_USAGE_QUERY = `
  *[_type == "renderingUsage" && _id == $docId][0] {
    _id,
    sanityUserId,
    month,
    count,
    limit,
    bytesStored
  }
`;

// GROQ: Rendering allocation from siteSettings
export const RENDERING_SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    renderingAllocation,
    renderingImageTypes,
    renderingExcludedUsers
  }
`;

// -- Phase 30: Admin Dashboard Queries --

// Active projects with pipeline stage and days-in-stage date
const ADMIN_DASHBOARD_PROJECTS_QUERY = `
  *[_type == "project" && projectStatus in ["active", "reopened"]] | order(title asc) {
    _id,
    title,
    pipelineStage,
    "stageChangedAt": coalesce(pipelineStageChangedAt, _createdAt),
    projectStatus,
    "clientName": clients[0].client->name,
    "clientId": clients[0].client->._id,
    "clientEmail": clients[0].client->.email,
    "clientPhone": clients[0].client->.phone,
    "clientPreferredContact": clients[0].client->.preferredContact
  }
`;

// Milestones from active projects (upcoming + overdue, sorted by date)
const ADMIN_DASHBOARD_MILESTONES_QUERY = `
  *[_type == "project" && projectStatus in ["active", "reopened"]] {
    _id,
    title,
    "milestones": milestones[date != null] | order(date asc) {
      _key,
      name,
      date,
      completed
    }
  }[count(milestones) > 0]
`;

// All deliveries (ordered/warehouse/in-transit/delivered) across active projects.
// Phase 35 Plan 02 (DASH-11..15): include delivered items with a `delivered`
// flag so the UpcomingDeliveriesCard can offer an inline Show delivered (N)
// disclosure. Also project clientName so the row's primary-anchor text reads
// client-name-first.
const ADMIN_DASHBOARD_DELIVERIES_QUERY = `
  *[_type == "project" && projectStatus in ["active", "reopened"]
    && engagementType == "full-interior-design"] {
    _id,
    title,
    "clientName": clients[0].client->name,
    "deliveries": procurementItems[status in ["ordered", "warehouse", "in-transit", "delivered"]] {
      _key,
      name,
      status,
      expectedDeliveryDate,
      trackingNumber,
      carrierETA,
      carrierName,
      lastSyncAt,
      "delivered": status == "delivered"
    }
  }[count(deliveries) > 0]
`;

// All tasks from active projects
const ADMIN_DASHBOARD_TASKS_QUERY = `
  *[_type == "project" && projectStatus in ["active", "reopened"]] {
    _id,
    title,
    "tasks": tasks[] | order(completed asc, createdAt desc) {
      _key,
      description,
      dueDate,
      completed,
      completedAt,
      createdAt
    }
  }[count(tasks) > 0]
`;

// Recent activity across all active projects (15 most recent)
const ADMIN_DASHBOARD_ACTIVITY_QUERY = `
  *[_type == "project" && projectStatus in ["active", "reopened"]
    && defined(activityLog) && count(activityLog) > 0] {
    _id,
    title,
    "activities": activityLog[] | order(timestamp desc) [0...5] {
      _key,
      action,
      description,
      actor,
      timestamp
    }
  }
`;

// Top-N recently-created contractors for the dashboard Contractor card.
// Phase 35 Plan 04 (DASH-17): tenant-scoped contractor list used by the
// dashboard Contractor card. Render-only projection (id/name/company/trades);
// the full CRUD view lives on /admin/contractors.
const ADMIN_DASHBOARD_CONTRACTORS_QUERY = `
  *[_type == "contractor"] | order(_createdAt desc) [0...6] {
    _id, name, company, trades
  }
`;

/** Fetch all dashboard data in parallel using the tenant-scoped client */
export async function getAdminDashboardData(client: SanityClient) {
  const [
    projects,
    milestoneData,
    deliveryData,
    taskData,
    activityData,
    contractors,
  ] = await Promise.all([
    client.fetch(ADMIN_DASHBOARD_PROJECTS_QUERY),
    client.fetch(ADMIN_DASHBOARD_MILESTONES_QUERY),
    client.fetch(ADMIN_DASHBOARD_DELIVERIES_QUERY),
    client.fetch(ADMIN_DASHBOARD_TASKS_QUERY),
    client.fetch(ADMIN_DASHBOARD_ACTIVITY_QUERY),
    client.fetch(ADMIN_DASHBOARD_CONTRACTORS_QUERY),
  ]);

  // Flatten milestones from all projects, keeping project reference
  const milestones = (milestoneData || []).flatMap((p: any) =>
    (p.milestones || []).map((m: any) => ({
      ...m,
      projectId: p._id,
      projectTitle: p.title,
    })),
  );

  // Flatten deliveries; surface the project's clientName onto each row and
  // normalise carrierName (e.g. "FedEx"/"UPS"/"USPS" from Ship24) to a
  // lowercase `carrier` slug for UpcomingDeliveriesCard's tracked-carrier
  // match (D-07). Preserve carrierName for any legacy consumers.
  const deliveries = (deliveryData || []).flatMap((p: any) =>
    (p.deliveries || []).map((d: any) => ({
      ...d,
      projectId: p._id,
      projectTitle: p.title,
      clientName: p.clientName ?? null,
      carrier: d.carrierName ? String(d.carrierName).toLowerCase() : null,
    })),
  );

  // Flatten tasks
  const tasks = (taskData || []).flatMap((p: any) =>
    (p.tasks || []).map((t: any) => ({
      ...t,
      projectId: p._id,
      projectTitle: p.title,
    })),
  );

  // Flatten and sort activity, take top 15
  const activities = (activityData || [])
    .flatMap((p: any) =>
      (p.activities || []).map((a: any) => ({
        ...a,
        projectId: p._id,
        projectTitle: p.title,
      })),
    )
    .sort((a: any, b: any) =>
      (b.timestamp || "").localeCompare(a.timestamp || ""),
    )
    .slice(0, 15);

  return {
    activeProjects: projects || [],
    milestones,
    deliveries,
    tasks,
    recentActivity: activities,
    // Phase 35 Plan 04 (DASH-17): top-6 recently-created contractors powers
    // the dashboard Contractor card. Shape: { _id, name, company, trades }[].
    contractors: contractors || [],
  };
}

// All projects for the /admin/projects list page
const ADMIN_PROJECTS_LIST_QUERY = `
  *[_type == "project"] | order(_updatedAt desc) {
    _id,
    title,
    pipelineStage,
    projectStatus,
    engagementType,
    "stageChangedAt": coalesce(pipelineStageChangedAt, _createdAt),
    "clientName": clients[0].client->name,
    _createdAt,
    _updatedAt
  }
`;

export async function getAdminProjects(client: SanityClient) {
  return client.fetch(ADMIN_PROJECTS_LIST_QUERY);
}

// Admin project detail for dashboard navigation target
const ADMIN_PROJECT_DETAIL_QUERY = `
  *[_type == "project" && _id == $projectId][0] {
    _id,
    title,
    pipelineStage,
    projectStatus,
    engagementType,
    "stageChangedAt": coalesce(pipelineStageChangedAt, _createdAt),
    "milestones": milestones[] | order(date asc) {
      _key, name, date, completed
    },
    "tasks": tasks[] | order(completed asc, createdAt desc) {
      _key,
      description,
      dueDate,
      completed,
      completedAt,
      createdAt
    },
    "clientActionItems": clientActionItems[] | order(completed asc, createdAt desc) {
      _key,
      description,
      dueDate,
      completed,
      completedAt,
      createdAt
    },
    "projectClients": clients[defined(client)].client-> {
      _id, name, email, phone, preferredContact
    },
    "projectContractors": contractors[defined(contractor)] {
      _key,
      trade,
      "contractor": contractor-> { _id, name, email, phone, company, trades }
    },
    ...select(engagementType == "full-interior-design" => {
      "procurementItems": procurementItems[] {
        _key, name, status, orderDate, expectedDeliveryDate, installDate,
        clientCost, retailPrice, trackingNumber, vendor, notes,
        carrierETA, carrierName, trackingUrl, lastSyncAt, syncSource,
        retrievedStatus,
        itemUrl,
        "itemImage": itemImage{ "assetRef": asset._ref, "url": asset->url }
      }
    })
  }
`;

export async function getAdminProjectDetail(
  client: SanityClient,
  projectId: string,
) {
  return client.fetch(ADMIN_PROJECT_DETAIL_QUERY, { projectId });
}

// GROQ: Admin artifact data for the Documents page (restored — was removed in Phase 30-01)
const ADMIN_ARTIFACT_QUERY = `
  *[_type == "project" && _id == $projectId][0] {
    _id,
    title,
    "artifacts": artifacts[] {
      _key,
      artifactType,
      customTypeName,
      currentVersionKey,
      "signedFile": signedFile {
        "asset": asset-> { url, originalFilename }
      },
      "versions": versions[] {
        _key,
        "file": file {
          "asset": asset-> { url, originalFilename, mimeType, size }
        },
        uploadedAt,
        note
      },
      "decisionLog": decisionLog[] {
        _key, action, versionKey, clientId, clientName, feedback, timestamp
      },
      "investmentSummary": investmentSummary {
        tiers[] { _key, name, description, lineItems[] { _key, name, price } },
        selectedTierKey,
        eagerness,
        reservations
      }
    }
  }
`;

export async function getAdminArtifactData(
  client: SanityClient,
  projectId: string,
) {
  return client.fetch(ADMIN_ARTIFACT_QUERY, { projectId });
}

export async function getAdminScheduleData(
  client: SanityClient,
  projectId: string,
) {
  return client.fetch(
    `*[_type == "project" && _id == $projectId][0] {
      _id,
      title,
      engagementType,
      isCommercial,
      "contractors": contractors[] {
        _key, trade,
        "contractor": contractor-> { _id, name, company, trades }
      },
      milestones[] | order(date asc) {
        _key, name, date, completed
      },
      ...select(engagementType == "full-interior-design" => {
        "procurementItems": procurementItems[] {
          _key, name, status, orderDate, expectedDeliveryDate, installDate
        }
      }),
      customEvents[] | order(date asc) {
        _key, name, date, endDate, category, notes
      },
      scheduleDependencies[] {
        _key, source, target, linkType
      }
    }`,
    { projectId },
  );
}

export async function getAllContractors(client: SanityClient) {
  return client.fetch(`
    *[_type == "contractor"] | order(name asc) {
      _id, name, company, trades
    }
  `);
}

// -- Phase 31: Admin CRUD Queries --

// Admin: All clients for list page
export async function getAdminClients(client: SanityClient) {
  return client.fetch(`
    *[_type == "client"] | order(name asc) {
      _id, name, email, phone, preferredContact
    }
  `);
}

// Admin: Single client with full detail
export async function getAdminClientDetail(client: SanityClient, clientId: string) {
  return client.fetch(`{
    "client": *[_type == "client" && _id == $clientId][0] {
      _id, name, email, phone, preferredContact, address, notes
    },
    "projects": *[_type == "project" && references($clientId)] | order(title asc) {
      _id, title, pipelineStage, engagementType, projectStatus
    }
  }`, { clientId });
}

// Admin: All contractors for list page
export async function getAdminContractors(client: SanityClient) {
  return client.fetch(`
    *[_type == "contractor"] | order(name asc) {
      _id, name, email, phone, company, trades
    }
  `);
}

// Admin: Single contractor with full detail
export async function getAdminContractorDetail(client: SanityClient, contractorId: string) {
  return client.fetch(`{
    "contractor": *[_type == "contractor" && _id == $contractorId][0] {
      _id, name, email, phone, company, trades, documents[] { _key, fileName, fileType, url, uploadedAt }
    },
    "projects": *[_type == "project" && references($contractorId)] | order(title asc) {
      _id, title, pipelineStage, engagementType, projectStatus
    }
  }`, { contractorId });
}

// Admin: Portfolio projects (completed projects with portfolio fields)
export async function getAdminPortfolioProjects(client: SanityClient) {
  return client.fetch(`
    *[_type == "project" && projectStatus == "completed"] | order(portfolioOrder asc, title asc) {
      _id,
      title,
      heroImage { asset-> { url, metadata { lqip, dimensions } } },
      showInPortfolio,
      portfolioTitle,
      portfolioDescription,
      portfolioOrder,
      portfolioRoomTags,
      portfolioImage { asset-> { url, metadata { lqip, dimensions } } }
    }
  `);
}

// Admin: Single project portfolio detail for edit form
export async function getAdminPortfolioDetail(client: SanityClient, projectId: string) {
  return client.fetch(`
    *[_type == "project" && _id == $projectId][0] {
      _id,
      title,
      heroImage { asset-> { url, metadata { lqip, dimensions } } },
      showInPortfolio,
      portfolioTitle,
      portfolioDescription,
      portfolioOrder,
      portfolioRoomTags,
      portfolioImage { asset-> { url, metadata { lqip, dimensions } } }
    }
  `, { projectId });
}

// Admin: Search clients and contractors by name (for typeahead)
export async function searchEntities(client: SanityClient, searchTerm: string) {
  return client.fetch(`{
    "clients": *[_type == "client" && name match $searchTerm + "*"] | order(name asc) [0...10] {
      _id, name, email, "entityType": "client"
    },
    "contractors": *[_type == "contractor" && name match $searchTerm + "*"] | order(name asc) [0...10] {
      _id, name, email, trades, "entityType": "contractor"
    }
  }`, { searchTerm });
}

// -- Phase 32: Procurement Cron Query --

// GROQ: Active projects with trackable procurement items (for daily cron sync)
export const ADMIN_PROCUREMENT_CRON_QUERY = `
  *[_type == "project" && projectStatus in ["active", "reopened"]
    && engagementType == "full-interior-design"] {
    _id,
    "trackableItems": procurementItems[
      status in ["ordered", "warehouse", "in-transit"]
      && defined(trackingNumber)
      && trackingNumber != ""
    ] {
      _key, trackingNumber, status, lastSyncAt
    }
  }[count(trackableItems) > 0]
`;

export type CronProject = {
  _id: string;
  trackableItems: {
    _key: string;
    trackingNumber: string;
    status: string;
    lastSyncAt: string | null;
  }[];
};

export async function getAdminProcurementCronData(
  client: SanityClient,
): Promise<CronProject[]> {
  return client.fetch(ADMIN_PROCUREMENT_CRON_QUERY);
}
