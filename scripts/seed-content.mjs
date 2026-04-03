#!/usr/bin/env node
/**
 * Seed script for La Sprezzatura portfolio content.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=sk... node scripts/seed-content.mjs
 *
 * Or add SANITY_WRITE_TOKEN to .env and:
 *   node --env-file=.env scripts/seed-content.mjs
 *
 * What it does:
 *   1. Uploads project images to Sanity CDN
 *   2. Creates 4 portfolio projects with text + images
 *   3. Updates site settings (contact info, hero slideshow)
 */

import { createClient } from "@sanity/client";
import { createReadStream, statSync, existsSync } from "fs";
import { basename, join } from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PROJECT_ID = "e9tpu2os";
const DATASET = "production";
const TOKEN = process.env.SANITY_WRITE_TOKEN;

if (!TOKEN) {
  console.error(
    "Missing SANITY_WRITE_TOKEN. Create one at:\nhttps://www.sanity.io/manage/project/e9tpu2os/api#tokens\n\nRun with:\n  SANITY_WRITE_TOKEN=sk... node scripts/seed-content.mjs"
  );
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2025-12-15",
  useCdn: false,
  token: TOKEN,
});

const IMAGE_BASE = join(
  process.env.HOME,
  "Dropbox/La Sprezzatura/Website/Images"
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Upload an image file to Sanity, return asset reference. Skip files < 100 bytes (broken placeholders). */
async function uploadImage(filePath, label) {
  if (!existsSync(filePath)) {
    console.warn(`  ⚠ File not found: ${filePath}`);
    return null;
  }
  const stat = statSync(filePath);
  if (stat.size < 100) {
    console.warn(`  ⚠ Skipping broken placeholder: ${basename(filePath)} (${stat.size} bytes)`);
    return null;
  }

  const filename = basename(filePath);
  const contentType = filename.endsWith(".png")
    ? "image/png"
    : filename.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";

  console.log(`  ↑ Uploading ${label || filename} (${(stat.size / 1024).toFixed(0)}KB)...`);
  const asset = await client.assets.upload("image", createReadStream(filePath), {
    filename,
    contentType,
  });
  return {
    _type: "image",
    asset: { _type: "reference", _ref: asset._id },
  };
}

/** Create a portable text block from a plain string. */
function textBlock(text) {
  return [
    {
      _type: "block",
      _key: crypto.randomUUID().slice(0, 8),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s0", text, marks: [] }],
    },
  ];
}

/** Add alt/caption fields to an image reference for gallery arrays. */
function galleryImage(imageRef, alt, caption) {
  if (!imageRef) return null;
  return {
    ...imageRef,
    _key: crypto.randomUUID().slice(0, 8),
    alt: alt || "",
    caption: caption || "",
  };
}

// ---------------------------------------------------------------------------
// Project definitions
// ---------------------------------------------------------------------------

const PROJECTS = [
  {
    title: "Darien Residence",
    slug: "darien-residence",
    roomType: "full-home",
    style: "transitional",
    location: "Darien, Connecticut",
    description:
      "A whole-home refresh for a young family in Darien, grounding every room in a serene neutral palette punctuated by rich walnut accents and unexpected touches of olive green.",
    challenge:
      "The homeowners wanted their 1990s colonial to feel current without losing its traditional bones. The existing rooms felt disconnected — the living areas were dark, the built-ins outdated, and the furnishings accumulated over years without a cohesive thread.",
    approach:
      "We started with the living room as the anchor: refinishing the built-in cabinetry in a clean white, replacing dated marble with a dramatic dark stone fireplace surround, and building a layered seating arrangement around a custom-upholstered sofa. A tonal honeycomb rug softens the dark hardwood floors, while olive velvet pillows and a high-gloss walnut tray add warmth and depth. Every detail — the cashmere throw draped just so, the green hydrangea on the ottoman — is deliberately casual.",
    outcome:
      "The home now reads as one continuous story. From the living room's composed calm to the kitchen's clean lines, there's a visual rhythm that makes each room feel both purposeful and lived-in. The family uses every corner now — which is the highest compliment a home can pay its designer.",
    featured: true,
    order: 1,
    heroDir: "darien",
    heroFile: "04-darien-living-room.jpg",
    galleryFiles: [
      { file: "05-darien-bedroom.jpg", alt: "Swivel chair detail with olive velvet pillow and walnut tray", caption: "Layered textures at the fireside" },
      { file: "06-darien-kitchen.jpg", alt: "Styled walnut tray with vintage book and dried hydrangea", caption: "The art of the everyday vignette" },
      { file: "02-darien-detail-1.jpg", alt: "Custom upholstered sofa with coordinating accent pillows", caption: "Custom fabric selection" },
      { file: "03-darien-detail-2.jpg", alt: "Built-in cabinetry flanking the fireplace", caption: "Refinished built-ins in bright white" },
      { file: "07-darien-detail-3.jpg", alt: "Bedroom styling detail", caption: "" },
      { file: "08-darien-detail-4.jpg", alt: "Window seat nook with coordinated textiles", caption: "" },
      { file: "09-darien-detail-5.jpg", alt: "Hallway console with curated accessories", caption: "" },
      { file: "10-darien-detail-6.jpg", alt: "Kitchen counter styling", caption: "" },
      { file: "11-darien-detail-7.jpg", alt: "Nightstand arrangement with reading lamp", caption: "" },
      { file: "12-darien-nightstand.jpg", alt: "Bedside vignette with layered textures", caption: "Bedside detail" },
      { file: "13-darien-detail-8.jpg", alt: "Accent chair with throw in secondary bedroom", caption: "" },
    ],
  },
  {
    title: "Flower Hill Kitchen & Office",
    slug: "flower-hill-kitchen-office",
    roomType: "full-home",
    style: "contemporary",
    location: "Flower Hill, Long Island",
    description:
      "A fearless renovation pairing a bold kitchen — anchored by a custom mustard range hood and black island — with a whimsical third-floor home office designed as a creative retreat.",
    challenge:
      "The client wanted spaces that reflected her personality: confident, colorful, and unapologetic. The kitchen felt generic despite a good layout, and an unused attic floor had potential as a home office but lacked character and function.",
    approach:
      "In the kitchen, we kept the white beadboard cabinetry but introduced high-contrast drama: a matte black island with green granite, a custom mustard-gold range hood that commands the room, and a sculptural brass-and-globe light fixture. The stacked stone backsplash and leather dining chairs add texture. Leopard-trim roman shades at the bay window bring in a playful edge. Upstairs, the office became a proper creative studio — a glass-top desk floats on a bold zebra-print rug beneath a brass sputnik chandelier. A teal velvet reading nook with magenta cushion and hand-painted pillows makes the dormer window a destination. Built-in shelving and a low credenza keep the room functional.",
    outcome:
      "Two rooms that feel like they belong to the same person — bold, warm, and fully alive. The kitchen is now the house's social center, and the office is where the client starts every morning. Both rooms photograph beautifully, but more importantly, they feel like home.",
    featured: true,
    order: 2,
    heroDir: "flower-hill-office",
    heroFile: "04-flower-hill-office-full-room.jpg",
    galleryFiles: [
      { file: "02-flower-hill-office-window-seat.jpg", alt: "Window seat reading nook with geometric wallpaper and teal velvet ottoman", caption: "The reading nook" },
      { file: "03-flower-hill-office-bookshelves.jpg", alt: "Custom built-in bookshelves with curated accessories", caption: "" },
      { file: "05-flower-hill-office-styling-detail.png", alt: "Desktop styling detail with floral arrangement", caption: "" },
    ],
    // Kitchen images from loose files
    extraImages: [
      { path: "340177153_1171673476876370_4945102209076271230_n.jpg", alt: "Kitchen with mustard range hood, brass fixture, and marble dining table", caption: "The kitchen transformation" },
      { path: "340178034_905780667317806_5878512400553725708_n.jpg", alt: "Custom mustard range hood with stacked stone backsplash and globe pendants", caption: "Custom range hood detail" },
      { path: "340943618_800933414924556_8992026753238068517_n.jpg", alt: "Kitchen from island perspective with black pendant and brass accents", caption: "Island and perimeter cabinetry" },
      { path: "340186408_1292423908356110_355231636993110328_n.jpg", alt: "Bay window with leopard-trim roman shades above green granite counter", caption: "Window treatments with personality" },
    ],
  },
  {
    title: "Gramercy Park Apartment",
    slug: "gramercy-park-apartment",
    roomType: "full-home",
    style: "transitional",
    location: "Gramercy Park, New York City",
    description:
      "A collected, travel-inspired apartment where every piece tells a story — from a chartreuse mid-century armchair to hand-blocked Indian textiles and a Costa Smeralda coffee table book that sets the tone.",
    challenge:
      "A well-traveled couple wanted their Gramercy apartment to feel like a curated gallery of their life together — not a showroom. The space had beautiful bones (hardwood floors, high ceilings) but felt flat and under-furnished after a recent move from overseas.",
    approach:
      "We built the living room around a few anchor pieces: a low-slung cream sofa dressed in geometric block-print pillows and a mustard velvet bolster, paired with a slim brass-and-glass coffee table. Opposite, a chartreuse mid-century chair with walnut frame and a botanical-print pillow creates an unexpected moment of color. A tripod floor lamp and gray textured credenza ground the composition. Custom curtains with a small triangle-print trim add subtle pattern play. We layered in the couple's own art and travel objects, editing rather than adding — the mirrored tray on the console with the brass mudra hand, the stacked books, the vase of garden flowers.",
    outcome:
      "The apartment now feels like it's been collected over years of interesting living — which is exactly the point. Every corner rewards a closer look, but the overall impression is calm and inviting. Guests always ask where things are from, and the answer is always a story.",
    featured: true,
    order: 3,
    heroDir: "gramercy-apartment",
    heroFile: "02-gramercy-apartment-lavender-room.jpg",
    galleryFiles: [
      { file: "03-gramercy-apartment-staircase.jpg", alt: "Living room vignette with cream sofa, Costa Smeralda book, and brass coffee table", caption: "The collected living room" },
      { file: "04-gramercy-apartment-stair-runner.jpg", alt: "Stair runner detail with geometric pattern", caption: "" },
      { file: "05-gramercy-apartment-mood-board.jpg", alt: "Design mood board with fabric and finish samples", caption: "Behind the scenes — the mood board" },
      { file: "06-gramercy-apartment-fabric-samples.jpg", alt: "Curated fabric samples for upholstery selection", caption: "Fabric selection process" },
    ],
    // Include the styling vignette from loose images
    extraImages: [
      { path: "121531725_160918708801042_8812002733310722995_n.jpg", alt: "Console styling with brass mudra hand, books, and mirrored tray", caption: "The art of the vignette" },
    ],
  },
  {
    title: "North Shore Primary Bath",
    slug: "north-shore-primary-bath",
    roomType: "bathroom",
    style: "traditional",
    location: "North Shore, Long Island",
    description:
      "A spa-inspired primary bathroom renovation featuring custom walnut cabinetry, a statement crystal chandelier, and a vaulted shower with skylight — transforming a dated master bath into a daily retreat.",
    challenge:
      "The original bathroom was a 1990s relic: beige tile, a cramped vanity, and fluorescent lighting. The homeowner wanted a true sanctuary — something with the presence of a boutique hotel but the warmth of home. The vaulted ceiling was an asset that had never been celebrated.",
    approach:
      "We designed a custom walnut vanity with glass-fronted display cabinets flanking a centered mirror — equal parts furniture and architecture. White marble countertops soften the rich wood tone. For the shower, we used wood-look porcelain tile on the walls and introduced a dramatic arched window paired with a crystal chandelier suspended from the vaulted ceiling beneath a new skylight. The patterned floor tile (a soft geometric in cream and gray) ties the two zones together without competing. Every fixture — from the sconces flanking the mirror to the shower hardware — was selected in a cohesive brushed nickel.",
    outcome:
      "The room now stops people at the door. The chandelier catches the skylight at golden hour in a way that genuinely takes your breath away. But it's the daily experience that matters most: the vanity has real storage, the lighting is layered and flattering, and the shower feels like a private grotto. It's a room designed to make you feel good — not just look good.",
    featured: true,
    order: 4,
    heroDir: "north-shore-bathroom",
    heroFile: "05-north-shore-bathroom-full-view.jpg",
    galleryFiles: [
      { file: "02-north-shore-bathroom-vanity.png", alt: "Custom walnut vanity with glass-fronted cabinets and marble countertop", caption: "Custom vanity cabinetry" },
      { file: "03-north-shore-bathroom-shower.png", alt: "Walk-in shower with wood-look porcelain tile walls", caption: "The shower alcove" },
      { file: "04-north-shore-bathroom-chandelier.png", alt: "Crystal chandelier beneath skylight in vaulted bathroom ceiling", caption: "Chandelier and skylight" },
      { file: "06-north-shore-bathroom-detail.png", alt: "Vanity detail with orchid and polished fixtures", caption: "" },
      { file: "07-north-shore-bathroom-fixtures.jpg", alt: "Arched window and crystal chandelier over wood-tile shower", caption: "Where light meets water" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

const SITE_SETTINGS = {
  siteTitle: "La Sprezzatura",
  tagline: "Luxury Interior Design · Long Island & New York City",
  contactEmail: "liz@lasprezz.com",
  contactPhone: "(516) 445-0756",
  studioLocation: "Long Island, New York",
  socialLinks: {
    instagram: "https://www.instagram.com/lasprezzatura_design/",
    pinterest: "https://www.pinterest.com/lasprezzatura_design/",
  },
};

// Hero slideshow uses select images from projects
const HERO_SLIDESHOW_SOURCES = [
  { dir: "darien", file: "04-darien-living-room.jpg", alt: "Darien living room with neutral palette and olive accents" },
  { dir: "north-shore-bathroom", file: "07-north-shore-bathroom-fixtures.jpg", alt: "Crystal chandelier in vaulted bathroom" },
  { dir: "gramercy-apartment", file: "03-gramercy-apartment-staircase.jpg", alt: "Gramercy apartment living room styling" },
  { path: "340943618_800933414924556_8992026753238068517_n.jpg", alt: "Bold kitchen with mustard range hood" },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🏠 La Sprezzatura Content Seed\n");

  // Check for existing projects
  const existing = await client.fetch('count(*[_type == "project"])');
  if (existing > 0) {
    console.log(`⚠ Found ${existing} existing project(s). Delete them first or they'll be duplicated.`);
    console.log("  To clear: npx sanity@latest documents delete --dataset production $(npx sanity@latest documents query '*[_type==\"project\"]._id' --dataset production)\n");
    const readline = await import("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => rl.question("Continue anyway? (y/N) ", resolve));
    rl.close();
    if (answer.toLowerCase() !== "y") {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  // -------------------------------------------------------------------------
  // 1. Create projects
  // -------------------------------------------------------------------------

  for (const proj of PROJECTS) {
    console.log(`\n📐 ${proj.title}`);

    // Upload hero image
    const heroPath = join(IMAGE_BASE, proj.heroDir, proj.heroFile);
    const heroImage = await uploadImage(heroPath, "hero");

    // Upload gallery images
    const gallery = [];
    for (const g of proj.galleryFiles) {
      const imgPath = join(IMAGE_BASE, proj.heroDir, g.file);
      const ref = await uploadImage(imgPath, g.alt?.slice(0, 40));
      const item = galleryImage(ref, g.alt, g.caption);
      if (item) gallery.push(item);
    }

    // Upload extra images (from loose files)
    if (proj.extraImages) {
      for (const e of proj.extraImages) {
        const imgPath = join(IMAGE_BASE, e.path);
        const ref = await uploadImage(imgPath, e.alt?.slice(0, 40));
        const item = galleryImage(ref, e.alt, e.caption);
        if (item) gallery.push(item);
      }
    }

    // Create the document
    const doc = {
      _type: "project",
      title: proj.title,
      slug: { _type: "slug", current: proj.slug },
      roomType: proj.roomType,
      style: proj.style,
      location: proj.location,
      description: proj.description,
      challenge: textBlock(proj.challenge),
      approach: textBlock(proj.approach),
      outcome: textBlock(proj.outcome),
      featured: proj.featured,
      order: proj.order,
      heroImage: heroImage || undefined,
      images: gallery.length > 0 ? gallery : undefined,
    };

    const result = await client.create(doc);
    console.log(`  ✓ Created: ${result._id}`);
  }

  // -------------------------------------------------------------------------
  // 2. Update site settings
  // -------------------------------------------------------------------------

  console.log("\n⚙️  Site Settings");

  // Upload hero slideshow images
  const heroSlideshow = [];
  for (const h of HERO_SLIDESHOW_SOURCES) {
    const imgPath = h.path
      ? join(IMAGE_BASE, h.path)
      : join(IMAGE_BASE, h.dir, h.file);
    const ref = await uploadImage(imgPath, h.alt?.slice(0, 40));
    if (ref) {
      heroSlideshow.push({
        _type: "object",
        _key: crypto.randomUUID().slice(0, 8),
        image: ref,
        alt: h.alt,
      });
    }
  }

  await client.createOrReplace({
    _type: "siteSettings",
    _id: "siteSettings",
    ...SITE_SETTINGS,
    heroSlideshow: heroSlideshow.length > 0 ? heroSlideshow : undefined,
  });
  console.log("  ✓ Site settings updated");

  // -------------------------------------------------------------------------
  // Done
  // -------------------------------------------------------------------------

  console.log("\n✅ Content seeded successfully!");
  console.log("   View at: https://la-sprezzatura.vercel.app/admin");
  console.log("   Portfolio: https://la-sprezzatura.vercel.app/portfolio");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
