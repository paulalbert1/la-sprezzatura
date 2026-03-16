# Phase 2: Public Portfolio Site - Research

**Researched:** 2026-03-14
**Domain:** Astro 6 site development, Sanity v3 CMS schema design, GSAP animations, Resend email, Cal.com booking, image optimization, SEO
**Confidence:** HIGH

## Summary

Phase 2 transforms the Phase 1 scaffold into a complete, visually stunning interior design portfolio website. The technical scope is broad: 7 site pages, Sanity CMS schemas with editorial UX, a contact form with auto-response email, a booking widget, scroll animations, responsive image optimization, and full SEO infrastructure. The existing Astro 6 + Sanity + Tailwind v4 stack from Phase 1 provides a solid foundation, and the additions are all well-documented integrations.

The most significant technical decisions center on three areas: (1) Sanity schema design that serves both Phase 2's public site and Phase 3's client portal, requiring forward-thinking field architecture; (2) GSAP ScrollTrigger integration with Astro's view transitions, which has known lifecycle cleanup challenges documented in community forums; and (3) the Cal.com React embed, which has React 19 peer dependency conflicts that require `--force` installation. All three are solvable with documented patterns.

Astro 6 introduces a built-in Fonts API that handles self-hosting, preloading, and fallback generation -- eliminating the need for fontsource or manual font loading. Tailwind v4's CSS-first `@theme` directive replaces the old JavaScript config file, making design tokens pure CSS. Astro Actions (stable since Astro 5.0) provide type-safe form handling with Zod validation, which is the modern replacement for raw API endpoints.

**Primary recommendation:** Build the design system first (fonts, colors, spacing, components), then the Sanity schemas, then pages in dependency order (layout/navigation, home, portfolio, individual pages, contact with Resend + Cal.com), finishing with SEO infrastructure and GSAP animations as a polish layer.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Warm neutral palette: creamy off-white backgrounds (#FAF8F5 range), warm stone grays (#8A8478 range), deep charcoal for text (#2C2926)
- Accent color: muted terracotta or warm blush -- used sparingly for CTAs and hover states
- No bright or saturated colors -- everything should feel like natural materials (linen, stone, warm wood)
- Photography is the color -- the site palette recedes to let project images dominate
- Editorial serif for headings, clean geometric or humanist sans-serif for body text
- Very generous line heights and letter spacing -- the typography should breathe
- Type scale should feel magazine-editorial, not corporate
- Generous whitespace throughout, full-bleed imagery for hero sections
- Content width constrained to ~1200px max for text sections, full-width for imagery
- Subtle GSAP scroll animations: fade-in-up on scroll, parallax on hero images
- Smooth page transitions if Astro View Transitions support it cleanly
- Image hover effects on portfolio grid: subtle zoom or overlay
- Nothing flashy or attention-seeking -- animations serve the content
- Loading states: blur-up image placeholders, not spinners
- Minimal transparent header overlaying hero on home page, sticky with warm background on scroll
- Navigation: Home, Portfolio, Services, About, Contact
- Mobile: hamburger with full-screen overlay, large tap targets, editorial typography
- Logo: "La Sprezzatura" in heading serif font
- Portfolio: masonry or editorial grid, 4-5 projects, click-through to dedicated project pages (NOT lightbox from grid)
- Project pages: full-bleed hero, narrative (challenge/approach/outcome), scrolling gallery, testimonial
- Gallery within project pages: full-width images with optional lightbox for detail zoom
- Filtering on overview by room type and style -- simple pill/tag filter, not dropdown
- Home page: full-bleed hero, 2-3 featured projects, about teaser, process preview, testimonial, CTA
- Services page: service tiers (Full-Service, Consultation, Refresh & Styling) as elegant cards
- Design Process page: visual timeline (Discovery, Concept, Design Development, Procurement, Installation, Reveal)
- About page: personal story, headshot, philosophy, photos-first
- Contact form: name, email, phone, project type dropdown, location, budget range dropdown, timeline, description
- Auto-response via Resend confirming receipt
- Cal.com inline widget on contact page
- Privacy policy: template-based, link in footer only
- SEO: unique meta titles "[Page] | La Sprezzatura Interior Design", OG images, LocalBusiness schema, XML sitemap, semantic HTML, noindex on staging
- Sanity schemas designed with Phase 3 portal in mind: include pipelineStage field
- Document types: Project, Service, Page, SiteSettings
- Project schema: title, slug, heroImage, images array, roomType, style, location, description, challenge, approach, outcome, testimonial, completionDate, featured, order, pipelineStage
- All field labels in plain English ("Project Title" not "title")
- Sanity Studio customized with clean interface -- hide technical fields from Liz
- Image fields with hotspot/crop enabled
- Sanity Image CDN for all portfolio photography -- no Cloudinary
- Responsive images with srcset, WebP/AVIF, blur-up LQIP, lazy loading
- Target: largest image under 200KB on mobile
- Cal.com: inline widget, styled to match site, consultation booking type
- Resend: server-side form handling, auto-response to submitter, notification to Liz, rate limiting, sandbox mode on staging

### Claude's Discretion
- Exact hex values for the color palette (within the warm neutral direction)
- Specific font pairing selection (within the serif heading / sans body direction)
- Animation timing and easing curves
- Component library structure and naming
- Responsive breakpoints
- Footer design and content
- 404 page design
- Loading skeleton patterns
- Exact spacing values in the design system
- Whether to use Astro View Transitions or keep it simple
- Sanity schema field ordering and validation rules

### Deferred Ideas (OUT OF SCOPE)
- Before/after interactive sliders -- deferred to v2
- Instagram feed integration -- deferred to v2
- Pricing transparency on services page -- deferred to v2
- Blog/editorial content capability -- deferred to v2
- Email newsletter signup (Kit/ConvertKit) -- deferred to v2
- Plausible analytics -- deferred to v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PORT-01 | Portfolio gallery displaying 4-5 completed projects, filterable by room type and style | Sanity Project schema with roomType/style fields, GROQ query with filters, masonry/editorial grid layout with CSS grid, pill/tag filter UI |
| PORT-02 | Individual project pages with full-bleed imagery and lightbox detail views | Astro dynamic routes with getStaticPaths + GROQ, @sanity/image-url for responsive srcset, lightbox component (GLightbox or similar) |
| PORT-03 | Case study narrative per project -- challenge, approach, outcome, testimonial | Sanity Portable Text (block type) for rich narrative content, astro-portabletext for rendering |
| PORT-04 | CMS with form-like editing so Liz can manage portfolio independently | Sanity Studio embedded at /admin with structureTool customization, plain English field labels, hidden technical fields |
| SITE-01 | Home page with hero imagery and value proposition | Full-bleed hero with Sanity-sourced image, GSAP parallax, featured projects query, CTA components |
| SITE-02 | Services page with service packages | Sanity Service document type or static content, elegant card layout |
| SITE-03 | Design process page with timeline | Visual step flow component, static or Sanity-editable content |
| SITE-04 | About page with story and photo | Sanity Page type or static, Sanity image with hotspot for headshot |
| SITE-05 | Contact form with intake questions and auto-response | Astro Actions with Zod validation, Resend SDK for dual emails (auto-response + notification), rate limiting |
| SITE-06 | Cal.com booking embedded on contact page | @calcom/embed-react inline component in React island, styled to match site |
| SITE-07 | Privacy policy page | Static Astro page, linked from footer |
| DSGN-01 | Luxury visual design -- warm neutrals, editorial typography, generous whitespace | Tailwind v4 @theme design tokens, Astro 6 Fonts API for self-hosted fonts, CSS custom properties |
| DSGN-02 | Mobile-first responsive design with touch-optimized galleries | Tailwind responsive utilities, touch-friendly tap targets, swipe-enabled lightbox |
| DSGN-03 | Image optimization via Sanity Image CDN | @sanity/image-url with width/format/quality params, GROQ queries for asset->metadata.lqip, srcset generation |
| DSGN-04 | Page load under 3 seconds on mobile | Astro zero-JS by default, lazy loading, responsive srcset, Sanity CDN with auto=format, font preloading |
| SEO-01 | Unique meta titles and descriptions | BaseLayout extended with per-page meta props, pattern: "[Page] \| La Sprezzatura Interior Design" |
| SEO-02 | Open Graph tags with portfolio imagery | OG meta tags in BaseLayout, Sanity image URLs for dynamic OG images |
| SEO-03 | LocalBusiness structured data | JSON-LD script in BaseLayout with schema.org/LocalBusiness markup |
| SEO-04 | XML sitemap generation | @astrojs/sitemap integration with site URL config |
| SEO-05 | Proper heading hierarchy and semantic HTML | HTML5 semantic elements, one H1 per page, proper section/article/nav usage |
</phase_requirements>

## Standard Stack

### Core (Already Installed from Phase 1)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.x | Site framework | Zero-JS static pages, View Transitions, Server Islands, Fonts API, Actions |
| @astrojs/vercel | 10.x | Vercel adapter | Enables server-side routes (Actions, API endpoints) |
| @sanity/astro | 3.x | Sanity integration | Embedded Studio at /admin, client configuration |
| sanity | 5.x | Sanity Studio core | structureTool, schema system, Studio UI |
| @sanity/client | 7.x | GROQ queries | Data fetching for pages |
| @sanity/image-url | 2.x | Image URL builder | Responsive image URLs, crop/hotspot respect, format conversion |
| Tailwind CSS | 4.x | Styling | CSS-first @theme design tokens, no config file |
| @tailwindcss/vite | 4.x | Vite plugin | Tailwind v4 integration with Astro |
| @astrojs/react | 5.x | React islands | Required for Cal.com embed and interactive components |
| React | 19.x | UI library (islands only) | Peer dependency for @astrojs/react, Sanity Studio, Cal.com |
| TypeScript | 5.x | Type safety | Astro 6 first-class TS support |

### New Dependencies for Phase 2

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gsap | 3.x | Scroll animations | ScrollTrigger for fade-in, parallax effects. 100% free for commercial use since Webflow acquisition. |
| resend | latest | Email API | Contact form auto-response and notification emails. Server-side only. |
| @calcom/embed-react | 1.5.x | Booking widget | Inline scheduling embed on Contact page. Install with `--force` for React 19 compat. |
| astro-portabletext | latest | Rich text rendering | Render Sanity Portable Text (block content) as HTML in Astro components |
| @astrojs/sitemap | latest | XML sitemap | Auto-generated sitemap-index.xml at build time |
| zod | 4.x (bundled) | Form validation | Used by Astro Actions for type-safe form input validation. Bundled with Astro 6. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP ScrollTrigger | CSS scroll-driven animations | CSS-only is simpler but lacks parallax, sequencing, and easing control GSAP provides |
| @calcom/embed-react | Cal.com vanilla JS embed snippet | React embed provides typed props and inline rendering; vanilla JS snippet is less controllable |
| Astro Actions | Raw API route (src/pages/api/) | Actions provide Zod validation, type safety, progressive enhancement. Use Actions. |
| GLightbox (vanilla JS) | PhotoSwipe or Pandabox | GLightbox is lightweight (~11KB), zero-dependency, touch-friendly. PhotoSwipe is heavier but has more features. |
| Astro Fonts API | Fontsource NPM packages | Fonts API is built into Astro 6 with preloading, caching, fallback generation. Use the native API. |
| CSS-only masonry | astro-masonry component | CSS column-based masonry is simpler but reorders items. CSS grid with span calculations is acceptable. An editorial grid (non-masonry) may fit the luxury aesthetic better. |

**Installation:**
```bash
# New Phase 2 dependencies
npm install gsap resend astro-portabletext @astrojs/sitemap

# Cal.com embed -- requires --force due to React 19 peer dep conflict
npm install @calcom/embed-react --force

# Astro sitemap setup (adds to astro.config.mjs automatically)
npx astro add sitemap
```

## Architecture Patterns

### Recommended Project Structure (Phase 2 Additions)

```
src/
├── actions/
│   └── index.ts              # Astro Actions: contact form handler
├── components/
│   ├── layout/
│   │   ├── Header.astro       # Nav with transparent→sticky transition
│   │   ├── Footer.astro       # Site footer with links, privacy
│   │   ├── MobileMenu.astro   # Full-screen overlay menu
│   │   └── Navigation.astro   # Nav items shared between header/mobile
│   ├── ui/
│   │   ├── Button.astro       # CTA button with variants
│   │   ├── SectionHeading.astro # Editorial section headers
│   │   ├── FilterPills.astro  # Room type/style filter tags
│   │   └── ProcessStep.astro  # Timeline step component
│   ├── portfolio/
│   │   ├── ProjectCard.astro  # Grid card for portfolio overview
│   │   ├── ProjectGallery.astro # Image gallery within project page
│   │   └── Lightbox.astro     # Image lightbox wrapper
│   ├── home/
│   │   ├── Hero.astro         # Full-bleed hero with parallax
│   │   └── FeaturedProjects.astro # Editorial project cards
│   ├── contact/
│   │   ├── ContactForm.tsx    # React island: form with validation
│   │   └── CalBooking.tsx     # React island: Cal.com inline embed
│   ├── seo/
│   │   ├── SEOHead.astro      # Meta, OG, JSON-LD per page
│   │   └── JsonLd.astro       # Structured data component
│   └── SanityImage.astro      # Responsive image with srcset + LQIP
├── layouts/
│   └── BaseLayout.astro       # Extended with SEO, fonts, nav, footer
├── pages/
│   ├── index.astro            # Home page
│   ├── portfolio/
│   │   ├── index.astro        # Portfolio gallery with filters
│   │   └── [slug].astro       # Dynamic project pages
│   ├── services.astro         # Services page
│   ├── process.astro          # Design process page
│   ├── about.astro            # About page
│   ├── contact.astro          # Contact + Cal.com booking
│   └── privacy.astro          # Privacy policy
├── sanity/
│   ├── client.ts              # Sanity client helper (exists)
│   ├── queries.ts             # GROQ query library
│   ├── image.ts               # Image URL builder helper
│   └── schemas/
│       ├── index.ts           # Schema barrel export
│       ├── project.ts         # Portfolio project document
│       ├── service.ts         # Service offering document
│       ├── page.ts            # Generic editable page
│       └── siteSettings.ts    # Global site config singleton
└── styles/
    └── global.css             # Tailwind @theme tokens, @font-face, base styles
```

### Pattern 1: Tailwind v4 Design Tokens with @theme

**What:** Define the entire design system as CSS variables using Tailwind v4's @theme directive. No tailwind.config.js needed.
**When to use:** For all color, typography, spacing, and animation tokens.
**Example:**

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  /* Color palette -- warm neutrals */
  --color-cream: #FAF8F5;
  --color-cream-dark: #F5F0EB;
  --color-stone: #8A8478;
  --color-stone-light: #B8B0A4;
  --color-stone-dark: #6B6358;
  --color-charcoal: #2C2926;
  --color-charcoal-light: #4A4540;
  --color-terracotta: #C4836A;
  --color-terracotta-light: #D4A08A;
  --color-white: #FFFFFF;

  /* Typography */
  --font-heading: "Cormorant Garamond", "Georgia", serif;
  --font-body: "DM Sans", "system-ui", sans-serif;

  /* Spacing scale -- generous */
  --spacing-section: 8rem;
  --spacing-section-sm: 5rem;

  /* Content widths */
  --container-text: 1200px;

  /* Animations */
  --animate-fade-in-up: fade-in-up 0.8s ease-out forwards;

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

/* Base styles */
body {
  font-family: var(--font-body);
  color: var(--color-charcoal);
  background-color: var(--color-cream);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

### Pattern 2: Astro 6 Fonts API for Self-Hosted Fonts

**What:** Use Astro 6's built-in Fonts API to download, cache, and optimize web fonts from Google Fonts. Eliminates third-party font loading latency.
**When to use:** Always -- this is the recommended approach in Astro 6.
**Example:**

```javascript
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  // ... existing config
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Cormorant Garamond",
      cssVariable: "--font-heading",
    },
    {
      provider: fontProviders.google(),
      name: "DM Sans",
      cssVariable: "--font-body",
    },
  ],
});
```

```astro
---
// src/layouts/BaseLayout.astro
import { Font } from "astro:assets";
---
<head>
  <Font cssVariable="--font-heading" preload />
  <Font cssVariable="--font-body" preload />
</head>
```

Then in global.css, reference via @theme inline:
```css
@theme inline {
  --font-heading: var(--font-heading);
  --font-body: var(--font-body);
}
```

### Pattern 3: Sanity Data Fetching with GROQ

**What:** Centralized GROQ query library with typed results, used in Astro page frontmatter for static generation.
**When to use:** Every page that displays Sanity content.
**Example:**

```typescript
// src/sanity/queries.ts
import { sanityClient } from "sanity:client";

// Portfolio overview -- all published projects
export async function getProjects() {
  return sanityClient.fetch(`
    *[_type == "project"] | order(order asc) {
      _id,
      title,
      slug,
      "heroImageUrl": heroImage.asset->url,
      "heroImageLqip": heroImage.asset->metadata.lqip,
      heroImage,
      roomType,
      style,
      location,
      featured
    }
  `);
}

// Single project by slug
export async function getProjectBySlug(slug: string) {
  return sanityClient.fetch(`
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
      completionDate
    }
  `, { slug });
}

// Featured projects for home page
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
          metadata { lqip }
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
```

### Pattern 4: Dynamic Project Pages with getStaticPaths

**What:** Generate static pages for each portfolio project using Sanity slugs.
**When to use:** Portfolio project detail pages.
**Example:**

```astro
---
// src/pages/portfolio/[slug].astro
import BaseLayout from "../../layouts/BaseLayout.astro";
import { sanityClient } from "sanity:client";
import { getProjectBySlug } from "../../sanity/queries";

export async function getStaticPaths() {
  const projects = await sanityClient.fetch(`
    *[_type == "project" && defined(slug.current)] {
      "slug": slug.current
    }
  `);

  return projects.map((project: { slug: string }) => ({
    params: { slug: project.slug },
  }));
}

const { slug } = Astro.params;
const project = await getProjectBySlug(slug!);
---

<BaseLayout title={`${project.title} | La Sprezzatura Interior Design`}>
  <!-- Project content -->
</BaseLayout>
```

### Pattern 5: Responsive Sanity Images with LQIP

**What:** Reusable component that renders Sanity images with responsive srcset, blur-up placeholder, and lazy loading.
**When to use:** Every image from Sanity.
**Example:**

```astro
---
// src/components/SanityImage.astro
import { createImageUrlBuilder } from "@sanity/image-url";
import { sanityClient } from "sanity:client";

interface Props {
  image: any;
  alt: string;
  sizes?: string;
  widths?: number[];
  class?: string;
  loading?: "lazy" | "eager";
  fetchpriority?: "high" | "low" | "auto";
}

const {
  image,
  alt,
  sizes = "(max-width: 640px) 100vw, (max-width: 1200px) 80vw, 1200px",
  widths = [400, 640, 800, 1200, 1600],
  class: className = "",
  loading = "lazy",
  fetchpriority = "auto",
} = Astro.props;

const builder = createImageUrlBuilder(sanityClient);
const urlFor = (source: any) => builder.image(source);

const srcset = widths
  .map((w) => `${urlFor(image).width(w).auto("format").quality(80).url()} ${w}w`)
  .join(", ");

const src = urlFor(image).width(1200).auto("format").quality(80).url();
const lqip = image?.asset?.metadata?.lqip;
---

<div class:list={["relative overflow-hidden", className]}>
  {lqip && (
    <img
      src={lqip}
      alt=""
      aria-hidden="true"
      class="absolute inset-0 w-full h-full object-cover scale-110 blur-lg"
      style="filter: blur(20px); transform: scale(1.1);"
    />
  )}
  <img
    src={src}
    srcset={srcset}
    sizes={sizes}
    alt={alt}
    loading={loading}
    fetchpriority={fetchpriority}
    class="relative w-full h-full object-cover"
    onload="this.previousElementSibling?.remove()"
  />
</div>
```

### Pattern 6: Astro Actions for Contact Form

**What:** Type-safe server-side form handling with Zod validation and Resend email.
**When to use:** Contact form submission.
**Example:**

```typescript
// src/actions/index.ts
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const server = {
  submitContact: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email required"),
      phone: z.string().optional(),
      projectType: z.string().min(1, "Project type is required"),
      location: z.string().optional(),
      budgetRange: z.string().optional(),
      timeline: z.string().optional(),
      description: z.string().min(10, "Please describe your project"),
    }),
    handler: async (input) => {
      // Send notification to Liz
      const { error: notifyError } = await resend.emails.send({
        from: "La Sprezzatura <noreply@lasprezz.com>",
        to: ["liz@lasprezz.com"],
        subject: `New Inquiry from ${input.name}`,
        html: `<!-- formatted inquiry details -->`,
      });

      if (notifyError) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification",
        });
      }

      // Send auto-response to client
      await resend.emails.send({
        from: "La Sprezzatura <noreply@lasprezz.com>",
        to: [input.email],
        subject: "Thank you for reaching out to La Sprezzatura",
        html: `<!-- branded confirmation email -->`,
      });

      return { success: true };
    },
  }),
};
```

### Pattern 7: Cal.com React Island

**What:** Cal.com inline booking widget rendered as a React island in Astro.
**When to use:** Contact page booking section.
**Example:**

```tsx
// src/components/contact/CalBooking.tsx
import Cal from "@calcom/embed-react";

export default function CalBooking() {
  return (
    <Cal
      calLink="lasprezzatura/consultation"
      style={{ width: "100%", height: "100%", overflow: "auto" }}
      config={{
        layout: "month_view",
        theme: "light",
      }}
    />
  );
}
```

```astro
<!-- In contact.astro -->
<CalBooking client:visible />
```

### Pattern 8: GSAP ScrollTrigger with Astro Lifecycle

**What:** Initialize and clean up GSAP ScrollTrigger animations properly with Astro's page lifecycle.
**When to use:** All pages with scroll animations.
**Example:**

```astro
<script>
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";

  gsap.registerPlugin(ScrollTrigger);

  function initAnimations() {
    // Fade-in-up for content sections
    gsap.utils.toArray<HTMLElement>("[data-animate='fade-up']").forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    // Parallax for hero images
    gsap.utils.toArray<HTMLElement>("[data-animate='parallax']").forEach((el) => {
      gsap.to(el, {
        y: -50,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  }

  function cleanupAnimations() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    gsap.killTweensOf("*");
  }

  // Initial load
  document.addEventListener("astro:page-load", () => {
    initAnimations();
  });

  // Cleanup before page swap (view transitions)
  document.addEventListener("astro:before-swap", () => {
    cleanupAnimations();
  });
</script>
```

### Pattern 9: SEO Head Component with JSON-LD

**What:** Reusable SEO component that generates meta tags, OG tags, and structured data per page.
**When to use:** Every page via BaseLayout.
**Example:**

```astro
---
// src/components/seo/SEOHead.astro
interface Props {
  title: string;
  description: string;
  ogImage?: string;
  type?: "website" | "article";
  noindex?: boolean;
}

const {
  title,
  description,
  ogImage = "/og-default.jpg",
  type = "website",
  noindex = true, // true for staging
} = Astro.props;

const canonicalUrl = new URL(Astro.url.pathname, Astro.site);

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "La Sprezzatura Interior Design",
  "description": "Luxury interior design studio serving Long Island and New York City",
  "url": "https://lasprezz.com",
  "telephone": "+1-XXX-XXX-XXXX",
  "areaServed": [
    { "@type": "City", "name": "New York" },
    { "@type": "AdministrativeArea", "name": "Long Island" }
  ],
  "priceRange": "$$$",
  "sameAs": []
};
---

<title>{title}</title>
<meta name="description" content={description} />
{noindex && <meta name="robots" content="noindex, nofollow" />}
<link rel="canonical" href={canonicalUrl} />

<!-- Open Graph -->
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImage} />
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalUrl} />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />

<!-- Structured Data -->
<script type="application/ld+json" set:html={JSON.stringify(localBusinessSchema)} />
```

### Pattern 10: Sanity Singleton Documents (SiteSettings)

**What:** Configure Sanity Studio to present SiteSettings as a single editable document rather than a list.
**When to use:** Global site configuration (site title, contact info, social links).
**Example:**

```typescript
// sanity.config.ts
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemas";

export default defineConfig({
  name: "la-sprezzatura",
  title: "La Sprezzatura",
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            // Site Settings as singleton
            S.listItem()
              .title("Site Settings")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
              ),
            S.divider(),
            // Portfolio Projects
            S.documentTypeListItem("project").title("Portfolio Projects"),
            // Services
            S.documentTypeListItem("service").title("Services"),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
```

### Anti-Patterns to Avoid

- **Do NOT use `output: 'hybrid'` in Astro config:** This was removed in Astro 5. The default static output now supports per-page `export const prerender = false` for SSR routes. No output setting needed.
- **Do NOT use API routes (src/pages/api/) for form handling:** Use Astro Actions instead -- they provide type-safe validation, progressive enhancement, and better error handling.
- **Do NOT load all images eagerly:** Only hero/above-fold images should use `loading="eager"` and `fetchpriority="high"`. Everything else uses `loading="lazy"`.
- **Do NOT query raw Sanity image URLs without transformations:** Always use `?auto=format` at minimum to get WebP/AVIF delivery. Without it, you serve unoptimized originals and risk usage overages.
- **Do NOT put GSAP initialization in module-level code:** Always use `astro:page-load` event to ensure animations re-initialize after view transitions.
- **Do NOT use the old `<ViewTransitions />` component:** It was removed in Astro 6. Use `<ClientRouter />` from `astro:transitions`.
- **Do NOT try to style Cal.com embed extensively:** Cal.com provides limited theming (light/dark, primary color). Accept its styling constraints and wrap it in a container that blends with the page.
- **Do NOT store Resend API key with PUBLIC_ prefix:** It must remain server-side only. Use `RESEND_API_KEY` (no PUBLIC_ prefix) and access via `import.meta.env.RESEND_API_KEY` in Actions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image responsive URLs | Manual Sanity CDN URL string building | `@sanity/image-url` with `createImageUrlBuilder` | Handles crop, hotspot, format, quality, width -- all from image metadata |
| Blur-up image placeholders | Custom canvas blur or JS-generated placeholders | Sanity asset metadata LQIP (`asset->metadata.lqip`) | Server-generated base64 string, zero client JS required |
| Form validation | Manual req.body parsing and if/else validation | Astro Actions + Zod schema | Type inference, field-level errors, progressive enhancement built-in |
| Rich text rendering | Manual Portable Text JSON-to-HTML conversion | `astro-portabletext` component | Handles blocks, marks, lists, custom types with proper Astro component mapping |
| XML sitemap | Manual sitemap generation script | `@astrojs/sitemap` integration | Auto-discovers routes, handles index files, configurable filters |
| Scroll animations | Intersection Observer + CSS transitions | GSAP ScrollTrigger | Precise timing, parallax, stagger sequences, easing curves, proven performance |
| Font loading optimization | Manual @font-face declarations + preload links | Astro 6 Fonts API (`fontProviders.google()`) | Self-hosts fonts, generates fallbacks, adds preload links, caches for production |
| JSON-LD structured data | Manual JSON string concatenation | Type-safe object serialized with `JSON.stringify` + `set:html` | Prevents XSS, ensures valid JSON, IDE autocompletion |
| Email templating | Raw HTML strings for email bodies | Resend with template strings (upgrade to React Email in Phase 3 if needed) | Phase 2 can use simple HTML strings; React Email adds complexity not yet justified |

**Key insight:** Phase 2 has many moving parts but each one maps to a well-documented integration. The risk is not in any individual piece but in the coordination -- design system must come first, then schemas, then pages, then polish.

## Common Pitfalls

### Pitfall 1: Cal.com React 19 Peer Dependency Conflict
**What goes wrong:** `npm install @calcom/embed-react` fails with peer dependency errors because it declares React 18.2 as peer dep but the project uses React 19.
**Why it happens:** Cal.com has not updated their embed package's peer dependency range. The package works fine with React 19 at runtime.
**How to avoid:** Install with `npm install @calcom/embed-react --force`. Test that the inline embed renders correctly. This is a known issue (GitHub issue #20814, #20681).
**Warning signs:** npm ERESOLVE error during install, blank embed area.

### Pitfall 2: GSAP ScrollTrigger Breaking After View Transitions
**What goes wrong:** Scroll animations work on first page load but break when navigating between pages using Astro's ClientRouter.
**Why it happens:** GSAP ScrollTrigger creates DOM-bound instances that persist across soft navigations. When the DOM swaps but triggers remain, they reference stale elements.
**How to avoid:** Always cleanup on `astro:before-swap` and re-initialize on `astro:page-load`. Call `ScrollTrigger.getAll().forEach(t => t.kill())` before page swaps.
**Warning signs:** Animations fire on first visit, then stop working. ScrollTrigger markers appear in wrong positions.

### Pitfall 3: Sanity Image Serving Unoptimized Originals
**What goes wrong:** Images load slowly, page weight balloons, Sanity usage overages occur.
**Why it happens:** Querying `asset->url` directly serves the original uploaded file with no transformations. A 5MB DSLR photo gets served as-is.
**How to avoid:** Always use `@sanity/image-url` builder with `.width()`, `.auto("format")`, and `.quality(80)`. Never link to raw `asset->url` in production templates.
**Warning signs:** Network tab shows image responses >500KB, images served as JPEG instead of WebP.

### Pitfall 4: Missing LQIP Data in GROQ Queries
**What goes wrong:** Blur-up placeholders don't work, images pop in without transition.
**Why it happens:** GROQ queries that don't dereference the asset document (`asset->metadata.lqip`) return only the asset reference, not the metadata.
**How to avoid:** Always include `asset-> { url, metadata { lqip, dimensions } }` in image projections. The LQIP is stored on the asset document, not the image field.
**Warning signs:** `image.asset.metadata` is undefined, LQIP string is missing.

### Pitfall 5: Resend Sandbox Limitations on Staging
**What goes wrong:** Emails fail to send or only go to the Resend test address.
**Why it happens:** Without a verified sending domain, Resend operates in sandbox mode. Only `onboarding@resend.dev` can be used as the sender, and emails only go to the account owner's email.
**How to avoid:** For staging: use Resend sandbox mode (`from: "La Sprezzatura <onboarding@resend.dev>"`) and test with the account owner's email. Real domain verification happens in Phase 4 after DNS cutover.
**Warning signs:** 403 errors from Resend API, emails not arriving at test addresses.

### Pitfall 6: Sitemap Including Admin/SSR Pages
**What goes wrong:** The generated sitemap includes `/admin` or other pages that should not be indexed.
**Why it happens:** @astrojs/sitemap discovers all statically-generated routes by default.
**How to avoid:** Use the `filter` option: `sitemap({ filter: (page) => !page.includes("/admin") })`. Also remember that `noindex` in robots meta is already set for staging.
**Warning signs:** Sitemap includes /admin, /api, or other internal routes.

### Pitfall 7: Astro Fonts API Variable Name Collision with @theme
**What goes wrong:** Font CSS variables from the Fonts API conflict with @theme declarations, causing fonts to not apply.
**Why it happens:** The Fonts API generates CSS variables (e.g., `--font-heading`), and @theme also wants to define `--font-heading`. If both write the same variable, one overwrites the other.
**How to avoid:** Use `@theme inline { --font-heading: var(--font-heading); }` to bridge Fonts API variables into Tailwind utilities. The `inline` keyword tells Tailwind to reference the CSS variable rather than inline the value.
**Warning signs:** `font-heading` utility class doesn't apply the expected font.

### Pitfall 8: Dynamic Portfolio Filter Breaking Static Build
**What goes wrong:** Client-side filtering requires JavaScript, but Astro pages are static with zero JS by default.
**Why it happens:** Portfolio filtering (by room type/style) is a client-side interaction that needs JS to show/hide elements.
**How to avoid:** Two options: (a) Use a small inline `<script>` that toggles visibility via CSS classes (no framework needed), or (b) Use a React island (`client:load`) for the filter UI. Option (a) is preferred for minimal JS. The data is already in the DOM -- filtering is just showing/hiding.
**Warning signs:** Filter pills render but clicking them does nothing.

## Code Examples

### Sanity Project Schema

```typescript
// src/sanity/schemas/project.ts
// Source: https://www.sanity.io/docs/studio/schema-types
import { defineType, defineField } from "sanity";

export const project = defineType({
  name: "project",
  title: "Portfolio Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Project Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroImage",
      title: "Main Photo",
      type: "image",
      options: {
        hotspot: true,
        metadata: ["lqip", "palette"],
      },
      validation: (rule) => rule.required().assetRequired(),
    }),
    defineField({
      name: "images",
      title: "Project Gallery",
      type: "array",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
            metadata: ["lqip"],
          },
          fields: [
            defineField({
              name: "alt",
              title: "Image Description",
              type: "string",
            }),
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "roomType",
      title: "Room Type",
      type: "string",
      options: {
        list: [
          { title: "Living Room", value: "living-room" },
          { title: "Kitchen", value: "kitchen" },
          { title: "Bedroom", value: "bedroom" },
          { title: "Bathroom", value: "bathroom" },
          { title: "Dining Room", value: "dining-room" },
          { title: "Home Office", value: "home-office" },
          { title: "Outdoor", value: "outdoor" },
          { title: "Full Home", value: "full-home" },
        ],
      },
    }),
    defineField({
      name: "style",
      title: "Design Style",
      type: "string",
      options: {
        list: [
          { title: "Contemporary", value: "contemporary" },
          { title: "Traditional", value: "traditional" },
          { title: "Transitional", value: "transitional" },
          { title: "Coastal", value: "coastal" },
          { title: "Modern", value: "modern" },
        ],
      },
    }),
    defineField({
      name: "location",
      title: "Project Location",
      type: "string",
      description: "e.g., North Shore, Long Island",
    }),
    defineField({
      name: "description",
      title: "Project Overview",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "challenge",
      title: "Design Challenge",
      type: "array",
      of: [{ type: "block" }],
      description: "What was the design challenge for this project?",
    }),
    defineField({
      name: "approach",
      title: "Our Approach",
      type: "array",
      of: [{ type: "block" }],
      description: "How did we approach the design?",
    }),
    defineField({
      name: "outcome",
      title: "The Result",
      type: "array",
      of: [{ type: "block" }],
      description: "What was the final outcome?",
    }),
    defineField({
      name: "testimonial",
      title: "Client Testimonial",
      type: "object",
      fields: [
        defineField({ name: "quote", title: "Quote", type: "text" }),
        defineField({ name: "author", title: "Client Name", type: "string" }),
      ],
    }),
    defineField({
      name: "completionDate",
      title: "Completion Date",
      type: "date",
    }),
    defineField({
      name: "featured",
      title: "Feature on Home Page",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower numbers appear first",
    }),
    // Phase 3 forward-compatibility: pipeline stage for client portal
    defineField({
      name: "pipelineStage",
      title: "Pipeline Stage",
      type: "string",
      options: {
        list: [
          { title: "Discovery", value: "discovery" },
          { title: "Concept", value: "concept" },
          { title: "Design Development", value: "design-development" },
          { title: "Procurement", value: "procurement" },
          { title: "Installation", value: "installation" },
          { title: "Closeout", value: "closeout" },
        ],
      },
      hidden: true, // Hidden in Phase 2 -- exposed in Phase 3
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "location",
      media: "heroImage",
    },
  },
});
```

### Sanity SiteSettings Singleton

```typescript
// src/sanity/schemas/siteSettings.ts
import { defineType, defineField } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "siteTitle",
      title: "Site Title",
      type: "string",
      initialValue: "La Sprezzatura",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
    }),
    defineField({
      name: "contactEmail",
      title: "Contact Email",
      type: "string",
    }),
    defineField({
      name: "contactPhone",
      title: "Phone Number",
      type: "string",
    }),
    defineField({
      name: "studioLocation",
      title: "Studio Location",
      type: "string",
      description: "General area (e.g., Long Island, NY) -- not a home address",
    }),
    defineField({
      name: "socialLinks",
      title: "Social Media Links",
      type: "object",
      fields: [
        defineField({ name: "instagram", title: "Instagram URL", type: "url" }),
        defineField({ name: "pinterest", title: "Pinterest URL", type: "url" }),
        defineField({ name: "houzz", title: "Houzz URL", type: "url" }),
      ],
    }),
  ],
});
```

### Client-Side Portfolio Filter (Zero-Framework)

```astro
<!-- Minimal JS filter for portfolio grid -->
<div class="flex flex-wrap gap-3 mb-12">
  <button data-filter="all" class="filter-pill active">All</button>
  <button data-filter="living-room" class="filter-pill">Living Room</button>
  <button data-filter="kitchen" class="filter-pill">Kitchen</button>
  <!-- etc. -->
</div>

<div id="project-grid" class="grid grid-cols-1 md:grid-cols-2 gap-8">
  {projects.map((project) => (
    <article
      data-room={project.roomType}
      data-style={project.style}
      class="project-card"
    >
      <!-- Project card content -->
    </article>
  ))}
</div>

<script>
  document.addEventListener("astro:page-load", () => {
    const pills = document.querySelectorAll<HTMLButtonElement>(".filter-pill");
    const cards = document.querySelectorAll<HTMLElement>(".project-card");

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        const filter = pill.dataset.filter;

        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");

        cards.forEach((card) => {
          if (filter === "all" || card.dataset.room === filter || card.dataset.style === filter) {
            card.style.display = "";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  });
</script>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `output: 'hybrid'` | Default static + per-page `prerender = false` | Astro 5.0 | No output config needed; SSR opt-in per page |
| `<ViewTransitions />` | `<ClientRouter />` | Astro 5 (renamed), Astro 6 (old removed) | Must use ClientRouter for view transitions |
| Raw API routes for forms | Astro Actions with `defineAction` | Astro 5.0 (stable) | Type-safe validation, progressive enhancement |
| Fontsource / manual @font-face | Astro Fonts API (`fontProviders.google()`) | Astro 6.0 | Built-in self-hosting, preloading, fallback generation |
| tailwind.config.js | CSS @theme directive | Tailwind v4.0 (Jan 2025) | All design tokens in CSS, no JS config |
| GSAP paid plugins (SplitText, etc.) | All GSAP plugins free | Webflow acquisition (late 2024) | ScrollTrigger, SplitText, MorphSVG all free commercially |
| `Astro.glob()` | `import.meta.glob()` | Astro 6 | Old API removed entirely |
| Legacy content collections | Content Layer API | Astro 6 | Must use new Content Layer API if using collections |
| Separate Studio deployment | Embedded Studio at /admin | @sanity/astro plugin | One repo, one deploy, Studio accessible at /admin |

**Deprecated/outdated:**
- `output: 'hybrid'`: Removed in Astro 5. Static mode now handles SSR opt-in per page.
- `<ViewTransitions />`: Removed in Astro 6. Use `<ClientRouter />`.
- `@astrojs/tailwind`: Deprecated for Tailwind v4. Use `@tailwindcss/vite`.
- `Astro.glob()`: Removed in Astro 6. Use `import.meta.glob()`.
- GSAP Club membership: No longer needed. All plugins free.

## Open Questions

1. **Astro Fonts API Stability**
   - What we know: Announced as "built-in" in Astro 6.0 release, but docs page is titled "Experimental fonts API." This is likely a docs naming lag.
   - What's unclear: Whether it requires `experimental.fonts: true` in config or is on by default in Astro 6.
   - Recommendation: Test during implementation. If experimental flag needed, enable it. If it proves unstable, fall back to Fontsource NPM packages with manual @font-face declarations. Both paths are well-documented.

2. **Cal.com Embed Theming Depth**
   - What we know: Cal.com provides `theme: "light"` and limited color customization.
   - What's unclear: How much the embed's internal styling can be overridden to match the luxury warm neutral palette.
   - Recommendation: Accept Cal.com's default light theme. Wrap in a styled container that blends transitions. Do not fight the embed's CSS.

3. **Resend Sandbox Behavior on Vercel**
   - What we know: Resend sandbox mode only sends to the account owner's email. The `from` address must be `onboarding@resend.dev`.
   - What's unclear: Whether Resend's free tier provides enough for development/staging testing (100 emails/day limit).
   - Recommendation: Use sandbox mode for staging. For realistic testing, temporarily verify a test domain on Resend or accept the sandbox limitations until Phase 4 domain verification.

4. **Portfolio Project Count at Launch**
   - What we know: CONTEXT.md specifies "4-5 projects" for portfolio.
   - What's unclear: Whether Liz has 4-5 projects with professional photography ready to enter into the CMS.
   - Recommendation: Plan for the CMS to support any number of projects. If photos aren't ready, create 2-3 demo projects with placeholder images for design validation, then replace with real content before Phase 4 launch.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (compatible with Astro 6 via `getViteConfig()`) |
| Config file | vitest.config.ts (Wave 0 -- create if not exists) |
| Quick run command | `npm run build` (verifies all pages build cleanly) |
| Full suite command | `npm run build && npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PORT-01 | Portfolio gallery renders with projects | smoke | `npm run build` (build fails if GROQ queries error) | Wave 0 |
| PORT-02 | Project pages generate for each slug | smoke | `npm run build` (getStaticPaths fails if slugs missing) | Wave 0 |
| PORT-03 | Portable Text narrative renders | unit | `npx vitest run --testPathPattern sanity` | Wave 0 |
| PORT-04 | Sanity Studio editable at /admin | manual | Visual check: navigate to /admin, create test project | Manual |
| SITE-01 | Home page renders with hero | smoke | `curl -s staging-url \| grep "La Sprezzatura"` | Wave 0 |
| SITE-02 | Services page renders | smoke | `npm run build` | Wave 0 |
| SITE-03 | Process page renders | smoke | `npm run build` | Wave 0 |
| SITE-04 | About page renders | smoke | `npm run build` | Wave 0 |
| SITE-05 | Contact form validates and sends email | integration | `npx vitest run --testPathPattern contact` | Wave 0 |
| SITE-06 | Cal.com widget renders | manual | Visual check on contact page | Manual (Cal.com is third-party) |
| SITE-07 | Privacy page renders | smoke | `npm run build` | Wave 0 |
| DSGN-01 | Design tokens applied correctly | manual | Visual review of staging URL | Manual |
| DSGN-02 | Mobile responsive | manual | Chrome DevTools responsive mode check | Manual |
| DSGN-03 | Images use srcset and LQIP | unit | `npx vitest run --testPathPattern image` | Wave 0 |
| DSGN-04 | Page load under 3 seconds on 4G | performance | Lighthouse CLI: `npx lighthouse staging-url --only-categories=performance --throttling.cpuSlowdownMultiplier=4` | Wave 0 |
| SEO-01 | Unique meta titles per page | unit | `npx vitest run --testPathPattern seo` | Wave 0 |
| SEO-02 | OG tags present | unit | `npx vitest run --testPathPattern seo` | Wave 0 |
| SEO-03 | LocalBusiness JSON-LD valid | unit | `npx vitest run --testPathPattern seo` | Wave 0 |
| SEO-04 | Sitemap generated | smoke | Check `dist/sitemap-index.xml` exists after build | Wave 0 |
| SEO-05 | Semantic HTML with proper h1 | unit | `npx vitest run --testPathPattern seo` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run build` (must pass before pushing)
- **Per wave merge:** `npm run build && npx vitest run`
- **Phase gate:** Full suite green + Lighthouse performance 90+ + visual review on staging

### Wave 0 Gaps

- [ ] `vitest.config.ts` -- Vitest config using Astro's `getViteConfig()` helper
- [ ] `tests/seo.test.ts` -- Verify meta tags, OG tags, JSON-LD, heading hierarchy
- [ ] `tests/image.test.ts` -- Verify SanityImage component generates correct srcset
- [ ] `tests/contact.test.ts` -- Verify contact action validates input correctly
- [ ] Framework install: `npm install -D vitest` (Vitest compatible with Astro 6's Vite 7)
- [ ] Add `"test": "vitest run"` to package.json scripts

## Sources

### Primary (HIGH confidence)
- [Astro 6.0 Release](https://astro.build/blog/astro-6/) -- Fonts API, ClientRouter, output mode changes
- [Astro View Transitions Docs](https://docs.astro.build/en/guides/view-transitions/) -- ClientRouter lifecycle events, animation directives
- [Astro Actions Docs](https://docs.astro.build/en/guides/actions/) -- defineAction, Zod validation, form handling
- [Astro Build Forms with API Routes](https://docs.astro.build/en/recipes/build-forms-api/) -- API endpoint patterns
- [Astro Experimental Fonts API](https://docs.astro.build/en/reference/experimental-flags/fonts/) -- Font providers, CSS variable integration
- [Tailwind CSS v4 @theme](https://tailwindcss.com/docs/theme) -- Design token definition, namespace system
- [Sanity Image Schema Type](https://www.sanity.io/docs/studio/image-type) -- hotspot, crop, LQIP metadata extraction
- [Sanity Presenting Images](https://www.sanity.io/docs/apis-and-sdks/presenting-images) -- @sanity/image-url, responsive srcset, LQIP
- [Sanity Image Transformations](https://www.sanity.io/docs/apis-and-sdks/image-urls) -- URL parameters: width, format, quality, blur
- [Sanity Schema Types](https://www.sanity.io/docs/studio/schema-types) -- defineType, defineField, all field types
- [Sanity Singleton Guide](https://www.sanity.io/guides/singleton-document) -- SiteSettings singleton pattern
- [Sanity Structure Builder](https://www.sanity.io/docs/studio/structure-introduction) -- Custom Studio organization
- [Resend Astro Integration](https://resend.com/docs/send-with-astro) -- Actions-based email sending
- [Resend Rate Limits](https://resend.com/docs/api-reference/rate-limit) -- 2 req/sec default
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) -- Installation, filtering, output
- [GSAP Standard License](https://gsap.com/community/standard-license/) -- Free commercial use confirmed
- [Cal.com Embed Docs](https://cal.com/docs/core-features/embed/install-with-react) -- React embed component

### Secondary (MEDIUM confidence)
- [GSAP + Astro View Transitions Forum](https://gsap.com/community/forums/topic/40950-compatibility-with-gsap-scrolltrigger-astro-view-transitiosn-api/) -- Cleanup pattern for ScrollTrigger with ClientRouter
- [GSAP Astro Guide](https://www.launchfa.st/blog/gsap-astro/) -- Basic GSAP integration in Astro
- [Codrops GSAP + Astro Portfolio (2026)](https://tympanus.net/codrops/2026/02/18/joffrey-spitzer-portfolio-a-minimalist-astro-gsap-build-with-reveals-flip-transitions-and-subtle-motion/) -- Real-world GSAP + Astro portfolio examples
- [Cal.com React 19 Issue #20814](https://github.com/calcom/cal.com/issues/20814) -- React 19 peer dep not updated, --force works
- [Astro JSON-LD Guide](https://johndalesandro.com/blog/astro-add-json-ld-structured-data-to-your-website-for-rich-search-results/) -- Structured data patterns
- [LocalBusiness Schema.org](https://schema.org/LocalBusiness) -- Property reference for structured data
- [Google LocalBusiness Structured Data](https://developers.google.com/search/docs/appearance/structured-data/local-business) -- Google's requirements
- [astro-portabletext NPM](https://www.npmjs.com/package/astro-portabletext) -- Portable Text rendering for Astro
- [Astro Testing with Vitest](https://docs.astro.build/en/guides/testing/) -- getViteConfig helper for Vitest

### Tertiary (LOW confidence)
- Astro 6 Fonts API stability (docs title says "experimental" but release post says "built-in") -- verify during implementation
- Cal.com embed theming depth -- limited documentation on CSS override capabilities
- Resend sandbox mode behavior on Vercel serverless -- test empirically

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All packages verified against official docs; Astro 6 + Sanity + Tailwind v4 + GSAP pattern well-documented
- Architecture: HIGH -- File structure follows Astro conventions; Sanity schema patterns from official guides; GROQ queries from official templates
- Pitfalls: HIGH -- GSAP + view transitions issue documented in multiple forum threads; Cal.com React 19 conflict confirmed by GitHub issues; Resend sandbox limits documented
- Design tokens: HIGH -- Tailwind v4 @theme is the documented approach; Astro Fonts API is the Astro 6 recommended path
- Validation: MEDIUM -- Vitest with Astro is documented but test patterns are project-specific; Lighthouse as performance gate is standard practice

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stack is stable; Astro 6 just released)
