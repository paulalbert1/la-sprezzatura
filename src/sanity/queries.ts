import { sanityClient } from "sanity:client";

// Portfolio overview -- all published projects ordered by display order
export async function getProjects() {
  return sanityClient.fetch(`
    *[_type == "project"] | order(order asc) {
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
      roomType,
      style,
      location,
      featured
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

// GROQ: Site settings for Contact Liz section
export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    contactEmail,
    contactPhone
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

// -- Phase 28: Admin Artifact Queries --

// GROQ: Admin artifact data for the artifact manager
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

export async function getAdminArtifactData(projectId: string) {
  return sanityClient.fetch(ADMIN_ARTIFACT_QUERY, { projectId });
}

// -- Phase 28: Admin Schedule Queries --

// GROQ: Admin schedule data for the Gantt editor
const ADMIN_SCHEDULE_QUERY = `
  *[_type == "project" && _id == $projectId][0] {
    _id,
    title,
    engagementType,
    isCommercial,
    contractors[]{ ..., contractor->{_id, name, company, trades} },
    milestones,
    procurementItems[] { _key, name, status, installDate, orderDate, expectedDeliveryDate },
    customEvents,
    scheduleDependencies
  }
`;

export async function getAdminScheduleData(projectId: string) {
  return sanityClient.fetch(ADMIN_SCHEDULE_QUERY, { projectId });
}
