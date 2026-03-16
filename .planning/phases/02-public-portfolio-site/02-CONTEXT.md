# Phase 2: Public Portfolio Site - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete public-facing portfolio website on the Vercel staging URL (la-sprezzatura.vercel.app). Includes portfolio gallery with project pages, all site pages (Home, Services, Process, About, Contact, Privacy), Sanity CMS schemas, Cal.com booking embed, Resend contact form, luxury visual design, image optimization, and SEO. This replaces the Wix site — but DNS cutover happens in Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Visual Identity & Color Palette
- Warm neutral palette: creamy off-white backgrounds (#FAF8F5 range), warm stone grays (#8A8478 range), deep charcoal for text (#2C2926)
- Accent color: muted terracotta or warm blush — used sparingly for CTAs and hover states
- No bright or saturated colors — everything should feel like natural materials (linen, stone, warm wood)
- Photography is the color — the site palette recedes to let project images dominate
- UI/UX Pro Max should select the exact palette and validate accessibility contrast ratios

### Typography
- Editorial serif for headings — elegant, high-contrast serifs in the vein of Playfair Display, Cormorant Garamond, or similar luxury editorial fonts
- Clean geometric or humanist sans-serif for body text — Inter, DM Sans, or similar for readability
- Very generous line heights and letter spacing — the typography should breathe like the whitespace
- Type scale should feel magazine-editorial, not corporate
- UI/UX Pro Max should select the specific font pairing and define the full type scale

### Layout & Spacing
- Generous whitespace throughout — err on the side of too much space, not too little
- Full-bleed imagery for hero sections and portfolio features
- Content width constrained to ~1200px max for text sections, full-width for imagery
- Section spacing should feel luxurious — large vertical gaps between content blocks
- Asymmetric layouts where appropriate — not everything centered, occasional offset compositions

### Animation & Interactions
- Subtle GSAP scroll animations: fade-in-up on scroll for content sections, parallax on hero images
- Smooth page transitions if Astro View Transitions support it cleanly
- Image hover effects on portfolio grid: subtle zoom or overlay
- Nothing flashy or attention-seeking — animations serve the content, not the other way around
- Loading states should feel intentional: blur-up image placeholders, not spinners

### Navigation
- Minimal transparent header overlaying hero imagery on home page
- Header becomes sticky with subtle warm background on scroll
- Navigation items: Home, Portfolio, Services, About, Contact — clean, widely spaced
- Mobile: hamburger menu with full-screen overlay, large tap targets, editorial typography
- Logo: "La Sprezzatura" in the heading serif font — no graphic logo needed unless Liz has one

### Portfolio Presentation
- Portfolio overview page: masonry or editorial grid showing 4-5 projects with hero image, project name, and location
- Click through to dedicated project pages — NOT lightbox from the grid
- Project pages: full-bleed hero → project narrative (challenge/approach/outcome) → scrolling gallery → testimonial if available
- Gallery within project pages: full-width images with optional lightbox for detail zoom
- Filtering on overview by room type and style — simple pill/tag filter, not dropdown
- Each project should feel like a magazine spread

### Home Page
- Full-bleed hero image (one of Liz's best project shots) with minimal text overlay: "La Sprezzatura" + tagline
- Below hero: 2-3 featured projects as large editorial cards
- Brief "about" teaser section with link to full About page
- Design process preview — 3-4 steps visualized simply
- Testimonial quote if available
- Clear CTA to contact/book consultation

### Services Page
- Frame services as a design experience, not a price list
- Service tiers or packages presented with elegant cards: Full-Service Design, Design Consultation, Refresh & Styling
- Each service: brief description, what's included, who it's for
- Link to the Design Process page for detail
- CTA to book a consultation at the bottom

### Design Process Page
- Visual numbered timeline or step flow: Discovery → Concept → Design Development → Procurement → Installation → Reveal
- Each step: brief description of what happens, what the client does, approximate timeline
- Warm, reassuring tone — demystify working with a designer
- This page reduces friction for first-time clients

### About Page
- Liz's story told warmly and personally — not a corporate bio
- Professional headshot prominently featured
- Design philosophy section
- Personal touches that make her relatable (while maintaining luxury positioning)
- Photos-first: images of Liz in her element, not just a wall of text

### Contact Page
- Contact form with intake fields: name, email, phone, project type (dropdown), location, budget range (dropdown with ranges), timeline, brief description
- Auto-response email via Resend confirming receipt within 24 hours
- Cal.com booking widget embedded below or alongside the form
- Studio contact info: email, phone, location (general area, not home address)
- Warm, inviting tone: "Let's talk about your space"

### Privacy Policy Page
- Standard privacy policy covering data collection, analytics, email marketing consent
- Template-based, clean formatting — not a legal wall of text
- Link in footer, not in main navigation

### SEO Strategy
- Unique meta titles per page following "[Page] | La Sprezzatura Interior Design" pattern
- Open Graph images: use project photography for portfolio pages, branded image for site pages
- LocalBusiness schema markup with Long Island/NYC service area
- XML sitemap auto-generated
- Semantic HTML with proper heading hierarchy (one H1 per page)
- Image alt text describing the design work shown
- noindex on staging URL until Phase 4 cutover (already set in placeholder)

### Sanity CMS Schema Design
- Design schemas with Phase 3 portal in mind — project schema should include pipeline stage fields even if not exposed in Phase 2
- Document types: Project, Service, Page (for editable pages), SiteSettings (global config)
- Project schema: title, slug, heroImage, images (array), roomType, style, location, description, challenge, approach, outcome, testimonial, completionDate, featured (boolean), order, pipelineStage (for Phase 3)
- All field labels in plain English — "Project Title" not "title", "Main Photo" not "heroImage"
- Sanity Studio customized with clean, simple interface — hide technical fields from Liz
- Image fields should use Sanity's built-in image type with hotspot/crop enabled

### Image Optimization
- Sanity Image CDN for all portfolio photography — no Cloudinary at launch
- Responsive images with srcset for different viewport widths
- WebP/AVIF format conversion
- Blur-up placeholder (LQIP) for progressive loading
- Lazy loading for below-fold images
- Target: largest image under 200KB on mobile

### Cal.com Integration
- Embedded widget on Contact page — inline, not popup
- Styled to match site aesthetic as much as Cal.com allows
- Consultation booking type with appropriate duration and intake questions
- Calendar sync with Liz's Google Calendar

### Resend Contact Form
- Server-side form handling via Astro API route
- Auto-response email to submitter: branded, warm, confirms receipt
- Notification email to Liz with all form fields formatted cleanly
- Rate limiting to prevent spam
- On staging: use Resend sandbox/test mode until domain is verified in Phase 4

### Claude's Discretion
- Exact hex values for the color palette (within the warm neutral direction above)
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BaseLayout.astro`: Base HTML layout with meta tags — extend for SEO per-page meta
- `global.css`: Has `@import "tailwindcss"` — add custom design tokens here
- `astro.config.mjs`: Sanity integration configured, Tailwind via Vite plugin, Vercel adapter
- `vercel.json`: Studio rewrite rule in place

### Established Patterns
- Astro 6 with Tailwind v4 via @tailwindcss/vite (NOT @astrojs/tailwind)
- Sanity v3 with embedded Studio at /admin
- Hybrid output mode via Vercel adapter (supports API routes for contact form)

### Integration Points
- `src/sanity/schemas/index.ts`: Empty barrel file — all schema types registered here
- `src/pages/index.astro`: Replace placeholder with real home page
- `src/components/`: Empty — all components built from scratch
- Sanity project ID: e9tpu2os, dataset: production

</code_context>

<specifics>
## Specific Ideas

- "Polished design is the most important requirement" — Paul explicitly stated this as #1 priority
- "I've heard lots of good things about UI UX Pro Max" — use it for design system, component design, and layout decisions
- The site should feel like the best luxury interior design studio websites: Kelly Wearstler caliber quality, but with the intimacy of a boutique studio
- Photos do the talking — minimal text, let the work speak for itself
- Liz is "average with technology" — CMS must be dead simple, form-based, no developer concepts
- "Agents should be relatively self-directed" — execution agents have broad discretion on implementation details
- Research recommended before/after sliders for Phase 1 but user deferred to v2 — do NOT include in this phase
- Research recommended Instagram feed integration — also deferred to v2, do NOT include

</specifics>

<deferred>
## Deferred Ideas

- Before/after interactive sliders — deferred to v2
- Instagram feed integration — deferred to v2
- Pricing transparency on services page — deferred to v2
- Blog/editorial content capability — deferred to v2
- Email newsletter signup (Kit/ConvertKit) — deferred to v2
- Plausible analytics — deferred to v2

</deferred>

---

*Phase: 02-public-portfolio-site*
*Context gathered: 2026-03-14*
