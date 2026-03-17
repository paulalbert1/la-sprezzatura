# Hero Slideshow Design Spec

**Date**: 2026-03-16
**Status**: Draft
**Scope**: Replace the single-image hero on the home page with a crossfading slideshow driven by Sanity CMS.

## Problem

The current hero displays a single static image (or gradient fallback). For a luxury interior design studio, the first impression should showcase multiple spaces immediately. A slow crossfade slideshow lets the photography sell the work without any interaction required from the visitor.

## Design Decisions

### Why a crossfade slideshow

Every top-tier interior design firm lands on some version of this pattern because it works. Clients browsing for a designer want to feel the spaces immediately, not admire a clever scroll interaction. A full-bleed slideshow gets completely out of the way and lets the rooms be the hero.

### Why pure dissolve (not sequential fade or wipe)

A simultaneous crossfade keeps a room on screen at all times. There is never a moment where the visitor is looking at nothing. The two images briefly layer together, creating a subtle double-exposure effect that feels painterly. A sequential fade introduces a gap that breaks the spell. A directional wipe draws attention to the transition itself rather than the content.

### Why Ken Burns zoom

It gives the images just enough life to feel cinematic without competing with the interiors. Alternating zoom directions (push-in, drift-left, pull-back, drift-right) prevents the animation from feeling mechanical.

## Specification

### Layout

- Full-viewport hero: `h-screen`, `min-h-[600px]`, `overflow-hidden`.
- Slideshow images fill the screen with `object-cover`.
- Dark gradient overlay (unchanged from current): `linear-gradient(to top, rgba(44,41,38,0.65) 0%, rgba(44,41,38,0.2) 50%, rgba(44,41,38,0.05) 100%)`.
- Brand text anchored bottom-left.
- Scroll indicator line at bottom-center.
- Progress bar at the very bottom edge.

### Animation

| Property | Value |
|---|---|
| Crossfade type | Pure dissolve (simultaneous opacity transition) |
| Crossfade duration | 1.5s, ease-in-out |
| Hold duration | 7s per image |
| Total cycle per slide | ~8.5s |
| Ken Burns scale | 1.0 to 1.06 (desktop), 1.0 to 1.03 (mobile). All directions scale outward from 1.0 to avoid exposing edges. |
| Ken Burns direction | Alternates per slide: push-in (scale to 1.06), drift-left (translateX(-2%) + scale to 1.06), drift-right (translateX(2%) + scale to 1.06), scale-only (scale to 1.04). All start at scale(1.0) and grow outward. |
| Looping | Infinite, wraps from last slide back to first |

### Text Treatment

- **Title**: Cormorant Garamond Light (weight 300). Responsive sizing: `text-6xl md:text-7xl lg:text-8xl xl:text-9xl`. Color: `rgba(255,255,255,0.65)` (**changed from current solid `text-white`** to better balance against the rotating imagery). Leading: none. Tracking: wide.
- **Tagline**: DM Sans. Size: `text-xs`. Transform: uppercase. Tracking: `0.35em`. Color: `rgba(184,176,164,0.65)` (**changed from current `text-stone-light` / `#B8B0A4`** at full opacity, now at 65% to match the reduced title opacity).
- **Position**: Bottom-left. Padding: `px-8 md:px-16 lg:px-24 pb-20 md:pb-28` (matches current layout).
- Title and tagline values come from Sanity site settings (same as current).

### Scroll Indicator

- Line only; **removes the `<span>Scroll</span>` text element** present in the current hero (line 64 of Hero.astro).
- Width: 1px. Height: 36px (reduced from current 40px).
- Color: `rgba(255,255,255,0.4)`.
- Animation: slow downward draw on a 3s cycle. Uses `scaleY` with `transform-origin: top`, same keyframe approach as current but slower (3s vs 2s) to avoid competing with the crossfade rhythm.
- Position: bottom-center, `bottom-6 left-1/2 -translate-x-1/2`.
- `aria-hidden="true"`.

### Progress Bar

- Position: absolute bottom of the hero, full width.
- Height: 2px.
- Background track: `rgba(255,255,255,0.1)`.
- Active fill: `rgba(196,131,106,0.4)` (terracotta at 40% opacity).
- Width animates from 0% to 100% over each slide's hold+fade duration, then resets.
- CSS `transition` for smooth width changes.

### Accessibility

- `prefers-reduced-motion: reduce`: disables Ken Burns zoom (images remain static), pauses auto-advance (shows first image only). Progress bar hidden. **Note**: this is a new accessibility pattern in this codebase. The existing GSAP scroll animations in `ScrollAnimations.astro` do not currently respect `prefers-reduced-motion`; that is out of scope for this change but should be addressed separately.
- All images have alt text (required field in Sanity schema).
- Slideshow does not trap focus or require interaction. Content below is always scrollable.

## Sanity CMS Changes

### Schema: `src/sanity/schemas/siteSettings.ts`

Add a `heroSlideshow` field to the existing `siteSettings` document type:

```ts
defineField({
  name: "heroSlideshow",
  title: "Hero Slideshow",
  type: "array",
  description: "Images that rotate in the homepage hero. Drag to reorder.",
  of: [
    {
      type: "object",
      fields: [
        defineField({
          name: "image",
          title: "Image",
          type: "image",
          options: { hotspot: true },
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Describe what is shown in the image for accessibility.",
          validation: (Rule) => Rule.required(),
        }),
      ],
      preview: {
        select: { title: "alt", media: "image" },
      },
    },
  ],
}),
```

### Query: `src/sanity/queries.ts`

Add the `heroSlideshow` projection to the existing `getSiteSettings` query. This is an additive change: append the following to the existing GROQ projection (after `socialLinks`). Verify the existing fields still match the current query before applying.

```groq
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
```

## Component Changes

### `src/components/home/Hero.astro`

**Props interface changes:**

```ts
interface Props {
  images?: Array<{ image: any; alt: string }>;  // new: slideshow array
  image?: any;                                    // kept for backward compat
  title?: string;
  tagline?: string;
}
```

**Rendering logic:**

1. If `images` array has 2+ entries: render slideshow.
2. If `images` has exactly 1 entry or only `image` is provided: render single static image (current behavior).
3. If neither: render gradient fallback (current behavior).

**Slideshow DOM structure:**

```html
<section class="hero relative w-full h-screen min-h-[600px] overflow-hidden">
  <!-- Slide container: all slides stacked absolutely -->
  <div class="absolute inset-0">
    {images.map((slide, i) => (
      <div
        class="hero-slide absolute inset-0 opacity-0 transition-opacity duration-[1500ms] ease-in-out"
        data-slide-index={i}
        data-ken-burns-direction={["push-in", "drift-left", "pull-back", "drift-right"][i % 4]}
      >
        <SanityImage
          image={slide.image}
          alt={slide.alt}
          loading={i === 0 ? "eager" : "lazy"}
          fetchpriority={i === 0 ? "high" : "auto"}
          sizes="100vw"
          widths={[640, 1024, 1440, 1920]}
          class="w-full h-full"
        />
      </div>
    ))}
  </div>

  <!-- Gradient overlay (unchanged) -->
  <!-- Text content (unchanged, opacity reduced) -->
  <!-- Scroll indicator (line only, no text) -->
  <!-- Progress bar -->
</section>
```

**Slideshow script (inline `<script>`):**

- On `astro:page-load`: initialize slideshow state, set first slide to `opacity-1`, start timer.
- Timer advances slides every 7s by toggling `opacity-0` / `opacity-1` classes. CSS handles the 1.5s dissolve transition.
- **Image readiness check**: Before advancing to the next slide, verify the target slide's `<img>` element has `complete === true`. If not loaded yet, skip to the next slide that is ready, or hold the current slide until the target loads. This prevents the LQIP blur placeholder (from `SanityImage`) from being visible during the crossfade.
- Ken Burns: each slide gets a CSS class that applies the appropriate `transform` over the full 8.5s hold+fade duration. All directions start at `scale(1.0)` and grow outward (never shrink below 1.0, which would expose edges). Directions cycle: `scale(1.06)`, `translateX(-2%) scale(1.06)`, `translateX(2%) scale(1.06)`, `scale(1.04)`.
- Progress bar width: updated via inline style on each timer tick using `requestAnimationFrame` for smooth advancement.
- On `astro:before-swap`: clear interval, reset state (view-transition safe).
- `prefers-reduced-motion` check: skip Ken Burns transforms, do not start auto-advance timer.

### `src/pages/index.astro`

Update the Hero invocation to pass the slideshow array:

```astro
<Hero
  images={settings?.heroSlideshow}
  title={heroTitle}
  tagline={heroTagline}
/>
```

No other page changes required.

## Fallback Chain

```
heroSlideshow (2+ images)  -->  slideshow with crossfade
heroSlideshow (1 image)    -->  single static image (current behavior)
heroSlideshow (empty/null) -->  gradient fallback (current behavior)
```

This is fully backward-compatible. If the Sanity `heroSlideshow` field is never populated, the hero renders exactly as it does today.

## Image Loading Strategy

- **Slide 0**: `loading="eager"`, `fetchpriority="high"`. Rendered in the initial HTML. Critical for LCP.
- **Slides 1+**: `loading="lazy"`. Preloaded via `requestIdleCallback` after page load to ensure smooth first transition. Each slide's `<img>` is present in the DOM from initial render (for SSR), but the browser defers fetching due to `loading="lazy"`.

## Files Changed

| File | Change |
|---|---|
| `src/sanity/schemas/siteSettings.ts` | Add `heroSlideshow` array field |
| `src/sanity/queries.ts` | Expand `getSiteSettings` projection to include `heroSlideshow` with asset metadata |
| `src/components/home/Hero.astro` | Add slideshow logic: multiple stacked slides, inline script for timer/Ken Burns, progress bar, simplified scroll indicator |
| `src/pages/index.astro` | Pass `settings?.heroSlideshow` as `images` prop to Hero |

## Out of Scope

- Slideshow navigation controls (arrows, dots for manual slide selection). The slideshow is ambient, not interactive.
- Video slides. Images only for v1.
- Per-slide text overlays. The title/tagline remain static across all slides.
- Transition to/from the hero on scroll (parallax). The current parallax behavior on the hero wrapper is removed since the slideshow handles visual interest. The `data-animate="parallax"` attribute is dropped.
