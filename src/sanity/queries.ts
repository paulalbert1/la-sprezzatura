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
