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
      socialLinks
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
    select(engagementType == "full-interior-design" => {
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
