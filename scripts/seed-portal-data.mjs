#!/usr/bin/env node
/**
 * Seed script for La Sprezzatura Client Portal data.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=sk... node scripts/seed-portal-data.mjs
 *
 * Or add SANITY_WRITE_TOKEN to .env and:
 *   node --env-file=.env scripts/seed-portal-data.mjs
 *
 * What it does:
 *   1. Creates/replaces 6 client documents
 *   2. Creates/replaces 5 contractor documents
 *   3. Creates/replaces 5 projects with milestones, procurement, contractors, artifacts, and commercial data
 *
 * All documents use deterministic IDs (seed-*) so re-running is idempotent.
 * Use createOrReplace to upsert safely.
 */

import { createClient } from "@sanity/client";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PROJECT_ID = "e9tpu2os";
const DATASET = "production";
const TOKEN = process.env.SANITY_WRITE_TOKEN;

if (!TOKEN) {
  console.error(
    "Missing SANITY_WRITE_TOKEN. Create one at:\nhttps://www.sanity.io/manage/project/e9tpu2os/api#tokens\n\nRun with:\n  SANITY_WRITE_TOKEN=sk... node scripts/seed-portal-data.mjs"
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a short random key for Sanity array items. */
function uuid() {
  return crypto.randomUUID().slice(0, 8);
}

/** Create a portable text block from a plain string. */
function textBlock(text) {
  return [
    {
      _type: "block",
      _key: uuid(),
      children: [{ _type: "span", _key: uuid(), text, marks: [] }],
      markDefs: [],
      style: "normal",
    },
  ];
}

/** Create a date string N days from now (positive = future, negative = past). */
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

/** Create a datetime string N days from now at a given hour. */
function datetimeFromNow(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Generate a simple portal token (alphanumeric, 8 chars). */
function portalToken() {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes)
    .map((b) => charset[b % charset.length])
    .join("");
}

// ---------------------------------------------------------------------------
// Deterministic IDs
// ---------------------------------------------------------------------------

const ID = {
  // Clients
  thornton: "seed-client-thornton",
  chen: "seed-client-chen",
  mitchell_r: "seed-client-mitchell-robert",
  mitchell_s: "seed-client-mitchell-sarah",
  vasquez: "seed-client-vasquez",
  park: "seed-client-park",
  walsh: "seed-client-walsh",
  // Contractors
  deluca: "seed-contractor-deluca",
  simmons: "seed-contractor-simmons",
  rahman: "seed-contractor-rahman",
  costa: "seed-contractor-costa",
  obrien: "seed-contractor-obrien",
  // Projects
  gramercy: "seed-project-gramercy",
  darien: "seed-project-darien",
  northshore: "seed-project-northshore",
  parkave: "seed-project-parkave",
  flowerhill: "seed-project-flowerhill",
};

// ---------------------------------------------------------------------------
// 1. Clients
// ---------------------------------------------------------------------------

const CLIENTS = [
  {
    _id: ID.thornton,
    _type: "client",
    name: "Victoria & James Thornton",
    email: "thornton@example.com",
    phone: "(212) 555-0142",
    preferredContact: "email",
    address: {
      street: "22 Gramercy Park South, Apt 8B",
      city: "New York",
      state: "NY",
      zip: "10003",
    },
  },
  {
    _id: ID.chen,
    _type: "client",
    name: "Catherine Chen",
    email: "cchen@example.com",
    phone: "(203) 555-0178",
    preferredContact: "text",
    address: {
      street: "147 Hollow Tree Ridge Rd",
      city: "Darien",
      state: "CT",
      zip: "06820",
    },
  },
  {
    _id: ID.mitchell_r,
    _type: "client",
    name: "Robert Mitchell",
    email: "rmitchell@example.com",
    phone: "(516) 555-0163",
    preferredContact: "phone",
    address: {
      street: "88 Harbor Rd",
      city: "Port Washington",
      state: "NY",
      zip: "11050",
    },
  },
  {
    _id: ID.mitchell_s,
    _type: "client",
    name: "Sarah Mitchell",
    email: "smitchell@example.com",
    phone: "(516) 555-0164",
    preferredContact: "email",
    address: {
      street: "88 Harbor Rd",
      city: "Port Washington",
      state: "NY",
      zip: "11050",
    },
  },
  {
    _id: ID.vasquez,
    _type: "client",
    name: "Elena Vasquez",
    email: "evasquez@example.com",
    phone: "(201) 555-0155",
    preferredContact: "email",
    address: {
      street: "340 Boulevard",
      city: "Mountain Lakes",
      state: "NJ",
      zip: "07046",
    },
  },
  {
    _id: ID.park,
    _type: "client",
    name: "David Park",
    email: "dpark@example.com",
    phone: "(212) 555-0189",
    preferredContact: "email",
    address: {
      street: "450 Park Ave, Suite 2200",
      city: "New York",
      state: "NY",
      zip: "10022",
    },
  },
  {
    _id: ID.walsh,
    _type: "client",
    name: "Margaret Walsh",
    email: "mwalsh@example.com",
    phone: "(516) 555-0137",
    preferredContact: "phone",
    address: {
      street: "12 Flower Hill Rd",
      city: "Roslyn",
      state: "NY",
      zip: "11576",
    },
  },
];

// ---------------------------------------------------------------------------
// 2. Contractors
// ---------------------------------------------------------------------------

const CONTRACTORS = [
  {
    _id: ID.deluca,
    _type: "contractor",
    name: "Marco DeLuca",
    email: "marco@delucaconstruction.example.com",
    phone: "(718) 555-0201",
    company: "DeLuca Construction",
    trades: ["general-contractor", "custom-millwork"],
  },
  {
    _id: ID.simmons,
    _type: "contractor",
    name: "Patricia Simmons",
    email: "patricia@simmonsfinishes.example.com",
    phone: "(914) 555-0215",
    company: "Simmons Fine Finishes",
    trades: ["painter"],
  },
  {
    _id: ID.rahman,
    _type: "contractor",
    name: "Yusuf Rahman",
    email: "yusuf@rahmanelectric.example.com",
    phone: "(718) 555-0228",
    company: "Rahman Electric",
    trades: ["electrician", "hvac"],
  },
  {
    _id: ID.costa,
    _type: "contractor",
    name: "Ana Costa",
    email: "ana@costatileworks.example.com",
    phone: "(516) 555-0233",
    company: "Costa Tileworks",
    trades: ["tile-stone", "flooring"],
  },
  {
    _id: ID.obrien,
    _type: "contractor",
    name: "James O'Brien",
    email: "james@obriencabinets.example.com",
    phone: "(203) 555-0247",
    company: "O'Brien Custom Cabinets",
    trades: ["cabinetry"],
  },
];

// ---------------------------------------------------------------------------
// 3. Projects
// ---------------------------------------------------------------------------

// ---- Project A: Gramercy Park Apartment ----
const projectGramercy = {
  _id: ID.gramercy,
  _type: "project",
  title: "Gramercy Park Apartment",
  slug: { _type: "slug", current: "gramercy-park-apartment" },
  roomType: "full-home",
  style: "transitional",
  location: "Gramercy Park, New York City",
  description:
    "A collected, travel-inspired apartment where every piece tells a story — from a chartreuse mid-century armchair to hand-blocked Indian textiles.",
  challenge: textBlock(
    "A well-traveled couple wanted their Gramercy apartment to feel like a curated gallery of their life together — not a showroom. The space had beautiful bones but felt flat and under-furnished after a recent move from overseas."
  ),
  approach: textBlock(
    "We built the living room around a few anchor pieces: a low-slung cream sofa dressed in geometric block-print pillows, paired with a slim brass-and-glass coffee table. A chartreuse mid-century chair creates an unexpected moment of color."
  ),
  outcome: textBlock(
    "The apartment now feels like it's been collected over years of interesting living — which is exactly the point. Every corner rewards a closer look, but the overall impression is calm and inviting."
  ),
  featured: true,
  order: 3,
  isCommercial: false,

  // Portal fields
  pipelineStage: "design-development",
  portalToken: portalToken(),
  portalEnabled: true,
  projectStatus: "active",
  engagementType: "full-interior-design",
  clients: [
    {
      _key: uuid(),
      client: { _type: "reference", _ref: ID.thornton },
      isPrimary: true,
    },
  ],
  projectAddress: {
    street: "22 Gramercy Park South",
    city: "New York",
    state: "NY",
    zip: "10003",
    adminNotes: "Doorman building. Call ahead — name must be on the list.",
  },

  // Milestones
  milestones: [
    {
      _key: uuid(),
      name: "Initial Consultation",
      date: daysFromNow(-45),
      completed: true,
      description: "On-site walkthrough and lifestyle interview with Victoria and James.",
    },
    {
      _key: uuid(),
      name: "Concept Presentation",
      date: daysFromNow(-21),
      completed: true,
      description: "Mood boards, color palettes, and initial furniture layouts presented.",
    },
    {
      _key: uuid(),
      name: "Design Development Review",
      date: daysFromNow(7),
      completed: false,
      description: "Detailed floor plans, elevations, and material selections for client review.",
    },
    {
      _key: uuid(),
      name: "Final Design Approval",
      date: daysFromNow(28),
      completed: false,
      description: "All design documents finalized and approved before procurement begins.",
    },
  ],

  // Procurement
  procurementItems: [
    {
      _key: uuid(),
      name: "Custom Sectional Sofa — Kravet Crypton Fabric",
      status: "ordered",
      installDate: daysFromNow(42),
      trackingNumber: "1Z999AA10123456784",
    },
    {
      _key: uuid(),
      name: "Handknotted Wool & Silk Rug — 9x12",
      status: "in-transit",
      installDate: daysFromNow(21),
      trackingNumber: "9400111899223100684",
    },
    {
      _key: uuid(),
      name: "Italian Pendant Lights (set of 3) — Flos IC",
      status: "pending",
    },
  ],

  // Contractors
  contractors: [
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.deluca },
      scopeOfWork: textBlock(
        "Custom walnut built-in millwork for the living room — floor-to-ceiling bookcases flanking the fireplace, floating media console, and integrated lighting. Includes demolition of existing shelving and all finish carpentry."
      ),
      estimateAmount: 4250000,
      startDate: daysFromNow(14),
      endDate: daysFromNow(56),
      internalNotes: "Marco is booked tight in June. Confirmed he can start the 2nd week.",
      contractorNotes: "Gate code for service entrance: 4521. Use freight elevator only.",
      appointments: [
        {
          _key: uuid(),
          dateTime: datetimeFromNow(-10, 9),
          label: "Site Measurement",
          notes: "Bring laser measure. Need exact dims for the fireplace alcove.",
        },
        {
          _key: uuid(),
          dateTime: datetimeFromNow(14, 8),
          label: "Millwork Install — Day 1",
          notes: "Delivery of pre-built carcasses. Need building freight reservation.",
        },
      ],
    },
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.costa },
      scopeOfWork: textBlock(
        "Primary bathroom tile installation — Calacatta marble floor tile in herringbone pattern, full-height subway tile in shower with niche. Includes waterproofing membrane and all prep work."
      ),
      estimateAmount: 1875000,
      startDate: daysFromNow(35),
      endDate: daysFromNow(49),
      contractorNotes: "Marble is being held at ABC Stone. Ana to pick up directly.",
    },
  ],

  // Artifacts
  artifacts: [
    {
      _key: uuid(),
      artifactType: "proposal",
      investmentSummary: {
        tiers: [
          {
            _key: uuid(),
            name: "Essential",
            description: "Core living spaces — living room, primary bedroom, and entry. Quality furnishings with a curated but restrained palette.",
            lineItems: [
              { _key: uuid(), name: "Design Fee", price: 750000 },
              { _key: uuid(), name: "Furniture & Fixtures", price: 2500000 },
              { _key: uuid(), name: "Millwork & Carpentry", price: 1250000 },
            ],
          },
          {
            _key: uuid(),
            name: "Signature",
            description: "Full apartment including kitchen, dining, guest rooms, and hallways. Custom pieces and upgraded materials throughout.",
            lineItems: [
              { _key: uuid(), name: "Design Fee", price: 1200000 },
              { _key: uuid(), name: "Furniture & Fixtures", price: 4200000 },
              { _key: uuid(), name: "Millwork & Carpentry", price: 2400000 },
            ],
          },
          {
            _key: uuid(),
            name: "Bespoke",
            description: "The complete vision — every room fully realized with bespoke furnishings, artisan finishes, custom lighting, and art advisory.",
            lineItems: [
              { _key: uuid(), name: "Design Fee", price: 1800000 },
              { _key: uuid(), name: "Furniture & Fixtures", price: 6500000 },
              { _key: uuid(), name: "Millwork & Carpentry", price: 3200000 },
              { _key: uuid(), name: "Art Advisory", price: 1000000 },
            ],
          },
        ],
      },
    },
    {
      _key: uuid(),
      artifactType: "floor-plan",
    },
  ],
};

// ---- Project B: Darien Residence ----
const projectDarien = {
  _id: ID.darien,
  _type: "project",
  title: "Darien Residence",
  slug: { _type: "slug", current: "darien-residence" },
  roomType: "full-home",
  style: "transitional",
  location: "Darien, Connecticut",
  description:
    "A whole-home refresh for a young family in Darien, grounding every room in a serene neutral palette punctuated by rich walnut accents and unexpected touches of olive green.",
  challenge: textBlock(
    "The homeowners wanted their 1990s colonial to feel current without losing its traditional bones. The existing rooms felt disconnected — the living areas were dark, the built-ins outdated, and the furnishings accumulated over years without a cohesive thread."
  ),
  approach: textBlock(
    "We started with the living room as the anchor: refinishing the built-in cabinetry in a clean white, replacing dated marble with a dramatic dark stone fireplace surround, and building a layered seating arrangement around a custom-upholstered sofa."
  ),
  outcome: textBlock(
    "The home now reads as one continuous story. From the living room's composed calm to the kitchen's clean lines, there's a visual rhythm that makes each room feel both purposeful and lived-in."
  ),
  featured: true,
  order: 1,
  isCommercial: false,

  // Portal fields
  pipelineStage: "procurement",
  portalToken: portalToken(),
  portalEnabled: true,
  projectStatus: "active",
  engagementType: "full-interior-design",
  clients: [
    {
      _key: uuid(),
      client: { _type: "reference", _ref: ID.chen },
      isPrimary: true,
    },
  ],
  projectAddress: {
    street: "147 Hollow Tree Ridge Rd",
    city: "Darien",
    state: "CT",
    zip: "06820",
    adminNotes: "Ring doorbell. If no answer, key is under the blue planter on the back porch.",
  },

  // Milestones
  milestones: [
    {
      _key: uuid(),
      name: "Initial Consultation",
      date: daysFromNow(-90),
      completed: true,
      description: "Full-home walkthrough and design questionnaire with Catherine.",
    },
    {
      _key: uuid(),
      name: "Concept Presentation",
      date: daysFromNow(-60),
      completed: true,
      description: "Room-by-room mood boards and color story presented.",
    },
    {
      _key: uuid(),
      name: "Design Development Approval",
      date: daysFromNow(-30),
      completed: true,
      description: "All floor plans, elevations, and material palettes approved.",
    },
    {
      _key: uuid(),
      name: "Procurement Midpoint Review",
      date: daysFromNow(3),
      completed: false,
      description: "Review order status, confirm delivery schedule, and address any backorder substitutions.",
    },
    {
      _key: uuid(),
      name: "Installation Kickoff",
      date: daysFromNow(30),
      completed: false,
      description: "First delivery day — living room and dining room furnishings.",
    },
  ],

  // Procurement
  procurementItems: [
    {
      _key: uuid(),
      name: "Custom Upholstered Sofa — Performance Linen",
      status: "warehouse",
      installDate: daysFromNow(30),
    },
    {
      _key: uuid(),
      name: "Walnut Dining Table — 96\" Extension",
      status: "ordered",
      installDate: daysFromNow(45),
      trackingNumber: "1Z999BB10987654321",
    },
    {
      _key: uuid(),
      name: "Tonal Honeycomb Area Rug — 10x14",
      status: "delivered",
    },
    {
      _key: uuid(),
      name: "Dark Stone Fireplace Surround — Honed Basalt",
      status: "in-transit",
      trackingNumber: "9274899223100123456",
    },
    {
      _key: uuid(),
      name: "Olive Velvet Accent Pillows (set of 6)",
      status: "installed",
    },
  ],

  // Contractors
  contractors: [
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.deluca },
      scopeOfWork: textBlock(
        "Living room built-in cabinetry refinishing — strip existing dark stain, prime, and paint in Benjamin Moore Simply White. Fireplace surround demolition and new stone installation. All trim and crown molding touch-ups."
      ),
      estimateAmount: 3500000,
      startDate: daysFromNow(-14),
      endDate: daysFromNow(21),
      contractorNotes: "Catherine prefers morning work (before 9am). Driveway can fit one truck.",
      appointments: [
        {
          _key: uuid(),
          dateTime: datetimeFromNow(-14, 8),
          label: "Demolition Start",
          notes: "Fireplace surround demolition. Lay drop cloths — hardwood is staying.",
        },
        {
          _key: uuid(),
          dateTime: datetimeFromNow(5, 8),
          label: "Stone Install",
          notes: "Basalt slabs arriving from ABC Stone at 7:30am. Need two people for lift.",
        },
      ],
    },
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.simmons },
      scopeOfWork: textBlock(
        "Interior painting — all common areas (living room, dining room, hallway, staircase). Benjamin Moore Edgecomb Gray HC-173 walls, Simply White OC-117 trim. Two coats on walls, one coat touch-up on all trim."
      ),
      estimateAmount: 1200000,
      startDate: daysFromNow(7),
      endDate: daysFromNow(18),
      appointments: [
        {
          _key: uuid(),
          dateTime: datetimeFromNow(7, 7),
          label: "Paint Start — Living Room",
          notes: "Furniture will be moved to center and covered. Start with ceiling.",
        },
      ],
    },
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.obrien },
      scopeOfWork: textBlock(
        "Custom kitchen cabinetry — Shaker-style doors in maple with soft-close hardware. Upper cabinets to ceiling with glass-front accent doors. Under-cabinet LED lighting integration."
      ),
      estimateAmount: 5500000,
      startDate: daysFromNow(35),
      endDate: daysFromNow(56),
      appointments: [
        {
          _key: uuid(),
          dateTime: datetimeFromNow(22, 10),
          label: "Final Kitchen Measurement",
          notes: "Appliance cutouts confirmed. Bring updated CAD drawings for sign-off.",
        },
      ],
    },
  ],

  // Artifacts
  artifacts: [
    {
      _key: uuid(),
      artifactType: "proposal",
      investmentSummary: {
        tiers: [
          {
            _key: uuid(),
            name: "Curated Refresh",
            description: "Living room and dining room only — new furnishings, paint, and fireplace update.",
            lineItems: [
              { _key: uuid(), name: "Design Fee", price: 500000 },
              { _key: uuid(), name: "Furniture", price: 1800000 },
              { _key: uuid(), name: "Paint & Finishes", price: 350000 },
            ],
          },
          {
            _key: uuid(),
            name: "Whole Home",
            description: "All common areas plus primary bedroom — comprehensive transformation with custom cabinetry.",
            lineItems: [
              { _key: uuid(), name: "Design Fee", price: 900000 },
              { _key: uuid(), name: "Furniture & Textiles", price: 3500000 },
              { _key: uuid(), name: "Cabinetry & Millwork", price: 2200000 },
              { _key: uuid(), name: "Paint & Finishes", price: 600000 },
            ],
          },
        ],
        selectedTierKey: null,
      },
      decisionLog: [
        {
          _key: uuid(),
          action: "approved",
          clientId: ID.chen,
          clientName: "Catherine Chen",
          feedback: "Going with the Whole Home package. Let's do it right.",
          timestamp: datetimeFromNow(-62, 14),
        },
      ],
    },
    {
      _key: uuid(),
      artifactType: "contract",
    },
    {
      _key: uuid(),
      artifactType: "design-board",
    },
  ],
};

// ---- Project C: North Shore Primary Bath ----
const projectNorthShore = {
  _id: ID.northshore,
  _type: "project",
  title: "North Shore Primary Bath",
  slug: { _type: "slug", current: "north-shore-primary-bath" },
  roomType: "bathroom",
  style: "traditional",
  location: "North Shore, Long Island",
  description:
    "A spa-inspired primary bathroom renovation featuring custom walnut cabinetry, a statement crystal chandelier, and a vaulted shower with skylight.",
  challenge: textBlock(
    "The original bathroom was a 1990s relic: beige tile, a cramped vanity, and fluorescent lighting. The homeowner wanted a true sanctuary — something with the presence of a boutique hotel but the warmth of home."
  ),
  approach: textBlock(
    "We designed a custom walnut vanity with glass-fronted display cabinets flanking a centered mirror. For the shower, we used wood-look porcelain tile and introduced a dramatic arched window paired with a crystal chandelier."
  ),
  outcome: textBlock(
    "The room now stops people at the door. The chandelier catches the skylight at golden hour in a way that genuinely takes your breath away. It's a room designed to make you feel good — not just look good."
  ),
  featured: true,
  order: 4,
  isCommercial: false,

  // Portal fields
  pipelineStage: "installation",
  portalToken: portalToken(),
  portalEnabled: true,
  projectStatus: "active",
  engagementType: "styling-refreshing",
  clients: [
    {
      _key: uuid(),
      client: { _type: "reference", _ref: ID.mitchell_r },
      isPrimary: true,
    },
    {
      _key: uuid(),
      client: { _type: "reference", _ref: ID.mitchell_s },
      isPrimary: false,
    },
  ],
  projectAddress: {
    street: "88 Harbor Rd",
    city: "Port Washington",
    state: "NY",
    zip: "11050",
    adminNotes: "Side entrance for contractors. Dog (golden retriever, friendly) may be in the yard.",
  },

  // Milestones
  milestones: [
    {
      _key: uuid(),
      name: "Initial Consultation & Measurement",
      date: daysFromNow(-60),
      completed: true,
      description: "On-site measurement and design preferences discussion with Robert and Sarah.",
    },
    {
      _key: uuid(),
      name: "Design Presentation",
      date: daysFromNow(-35),
      completed: true,
      description: "Material samples, layout options, and fixture selections presented. Client chose Option B with walnut vanity.",
    },
    {
      _key: uuid(),
      name: "Styling Day",
      date: daysFromNow(-5),
      completed: true,
      description: "Final accessorizing — towels, soap dispensers, orchid arrangement, candles, and art placement.",
    },
  ],
};

// ---- Project D: Park Avenue Commercial ----
const projectParkAve = {
  _id: ID.parkave,
  _type: "project",
  title: "Park Avenue Commercial",
  slug: { _type: "slug", current: "park-avenue-commercial" },
  roomType: "full-home",
  style: "modern",
  location: "Midtown East, New York City",
  description:
    "A 4,200 sq ft executive office suite on Park Avenue — blending hospitality-grade finishes with a functional commercial workspace for a private equity firm.",
  challenge: textBlock(
    "David's firm needed a space that conveyed credibility and quiet sophistication to visiting investors, while remaining a practical daily workplace for a team of twelve. The existing buildout was sterile corporate — drop ceilings, gray carpet, fluorescent panels."
  ),
  approach: textBlock(
    "We're creating distinct zones: a reception gallery with custom walnut paneling and curated art, a partner's office with a bespoke desk and lounge seating, and a conference room anchored by a 14-foot live-edge walnut table. Acoustic panels are integrated into the design as sculptural elements."
  ),
  outcome: textBlock(
    "Design is in the concept phase. Initial mood boards and space planning have been presented. The client is reviewing two direction options before we proceed to design development."
  ),
  featured: false,
  order: 5,
  isCommercial: true,

  // Portal fields
  pipelineStage: "concept",
  portalToken: portalToken(),
  portalEnabled: true,
  projectStatus: "active",
  engagementType: "full-interior-design",
  clients: [
    {
      _key: uuid(),
      client: { _type: "reference", _ref: ID.park },
      isPrimary: true,
    },
  ],
  projectAddress: {
    street: "450 Park Ave, Suite 2200",
    city: "New York",
    state: "NY",
    zip: "10022",
    adminNotes: "Building requires 48hr advance notice for contractor access. Insurance certs must be filed with management office.",
  },

  // Building Manager (commercial only)
  buildingManager: {
    name: "Thomas Brennan",
    email: "tbrennan@example.com",
    phone: "(212) 555-0190",
  },

  // Milestones
  milestones: [
    {
      _key: uuid(),
      name: "Site Survey & Programming",
      date: daysFromNow(-14),
      completed: true,
      description: "Full site measurement, MEP documentation, and team interview for space programming requirements.",
    },
    {
      _key: uuid(),
      name: "Concept Presentation",
      date: daysFromNow(10),
      completed: false,
      description: "Two design directions presented — Modern Warmth vs. Classic Refined. Floor plans and mood boards for each.",
    },
  ],

  // COIs (commercial only)
  cois: [
    {
      _key: uuid(),
      issuerName: "Hartford General Insurance",
      coverageType: "general-liability",
      policyNumber: "GL-2025-0847291",
      expirationDate: daysFromNow(240),
    },
    {
      _key: uuid(),
      issuerName: "Liberty Mutual",
      coverageType: "workers-comp",
      policyNumber: "WC-2025-1139847",
      expirationDate: daysFromNow(21),
    },
  ],

  // Legal Docs (commercial only)
  legalDocs: [
    {
      _key: uuid(),
      documentName: "Building Access Agreement",
      description: "Standard building access agreement for 450 Park Ave management. Covers working hours, freight elevator reservations, and loading dock scheduling.",
    },
    {
      _key: uuid(),
      documentName: "Alteration Agreement",
      description: "Condo board alteration agreement covering scope of permitted modifications, noise restrictions (no work before 9am or after 5pm), and deposit requirements.",
    },
  ],

  // Contractors
  contractors: [
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.deluca },
      scopeOfWork: textBlock(
        "General contracting for full office buildout — demolition of existing partitions, new framing for private offices, custom walnut wall paneling in reception and conference room, ceiling modifications, and all finish carpentry."
      ),
      estimateAmount: 18500000,
      internalNotes: "Waiting on final concept approval before locking scope. Estimate is for Direction A (Modern Warmth).",
    },
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.rahman },
      scopeOfWork: textBlock(
        "Complete electrical retrofit — new LED lighting plan with dimmers, dedicated circuits for AV equipment in conference room, under-cabinet task lighting, and HVAC zone controls for the partner's office."
      ),
      estimateAmount: 7200000,
      internalNotes: "Yusuf needs to coordinate with building engineer on HVAC tie-in. Meeting scheduled.",
    },
  ],
};

// ---- Project E: Flower Hill Kitchen & Office (Completed) ----
const projectFlowerHill = {
  _id: ID.flowerhill,
  _type: "project",
  title: "Flower Hill Kitchen & Office",
  slug: { _type: "slug", current: "flower-hill-kitchen-office" },
  roomType: "full-home",
  style: "contemporary",
  location: "Flower Hill, Long Island",
  description:
    "A fearless renovation pairing a bold kitchen — anchored by a custom mustard range hood and black island — with a whimsical third-floor home office designed as a creative retreat.",
  challenge: textBlock(
    "The client wanted spaces that reflected her personality: confident, colorful, and unapologetic. The kitchen felt generic despite a good layout, and an unused attic floor had potential as a home office but lacked character and function."
  ),
  approach: textBlock(
    "In the kitchen, we kept the white beadboard cabinetry but introduced high-contrast drama: a matte black island with green granite, a custom mustard-gold range hood. Upstairs, the office became a proper creative studio with a zebra-print rug and brass sputnik chandelier."
  ),
  outcome: textBlock(
    "Two rooms that feel like they belong to the same person — bold, warm, and fully alive. The kitchen is now the house's social center, and the office is where the client starts every morning."
  ),
  featured: true,
  order: 2,
  isCommercial: false,

  // Portal fields
  pipelineStage: "closeout",
  portalToken: portalToken(),
  portalEnabled: true,
  projectStatus: "completed",
  completedAt: datetimeFromNow(-15, 16),
  engagementType: "full-interior-design",
  clients: [
    {
      _key: uuid(),
      client: { _type: "reference", _ref: ID.walsh },
      isPrimary: true,
    },
  ],
  projectAddress: {
    street: "12 Flower Hill Rd",
    city: "Roslyn",
    state: "NY",
    zip: "11576",
  },

  // Milestones — all completed
  milestones: [
    {
      _key: uuid(),
      name: "Initial Consultation",
      date: daysFromNow(-180),
      completed: true,
      description: "On-site walkthrough with Margaret. Discussed her bold aesthetic and love of color.",
    },
    {
      _key: uuid(),
      name: "Concept Presentation",
      date: daysFromNow(-150),
      completed: true,
      description: "Mood boards for kitchen and office presented. Margaret chose the 'Fearless Color' direction immediately.",
    },
    {
      _key: uuid(),
      name: "Design Development Approval",
      date: daysFromNow(-120),
      completed: true,
      description: "All material selections, cabinetry specs, and lighting fixtures approved.",
    },
    {
      _key: uuid(),
      name: "Installation Complete",
      date: daysFromNow(-30),
      completed: true,
      description: "All furnishings delivered and installed. Punch list completed.",
    },
    {
      _key: uuid(),
      name: "Final Styling & Photography",
      date: daysFromNow(-15),
      completed: true,
      description: "Professional photography session. Final accessories placed. Project complete.",
    },
  ],

  // Procurement — all delivered/installed
  procurementItems: [
    {
      _key: uuid(),
      name: "Custom Mustard Range Hood — Powder Coated Steel",
      status: "installed",
    },
    {
      _key: uuid(),
      name: "Brass Sputnik Chandelier — 24-Light",
      status: "installed",
    },
    {
      _key: uuid(),
      name: "Zebra Print Area Rug — 8x10",
      status: "installed",
    },
    {
      _key: uuid(),
      name: "Teal Velvet Ottoman",
      status: "installed",
    },
    {
      _key: uuid(),
      name: "Glass-Top Desk with Brass Frame",
      status: "installed",
    },
  ],

  // Contractors — all work completed
  contractors: [
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.deluca },
      scopeOfWork: textBlock(
        "Kitchen renovation — island demolition and rebuild with new countertop, range hood custom fabrication and install, backsplash installation, and all associated plumbing/electrical coordination."
      ),
      estimateAmount: 3800000,
      startDate: daysFromNow(-90),
      endDate: daysFromNow(-45),
    },
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.simmons },
      scopeOfWork: textBlock(
        "Kitchen and office painting — accent walls, ceiling treatment in office (dark navy), and all trim work. Special prep required for beadboard cabinetry touch-ups."
      ),
      estimateAmount: 850000,
      startDate: daysFromNow(-50),
      endDate: daysFromNow(-40),
    },
    {
      _key: uuid(),
      contractor: { _type: "reference", _ref: ID.rahman },
      scopeOfWork: textBlock(
        "Electrical — new lighting circuits for sputnik chandelier (heavy fixture, needs reinforced junction box), under-cabinet LED strips in kitchen, and dimmer installation throughout."
      ),
      estimateAmount: 450000,
      startDate: daysFromNow(-55),
      endDate: daysFromNow(-48),
    },
  ],

  // Artifacts
  artifacts: [
    {
      _key: uuid(),
      artifactType: "proposal",
      investmentSummary: {
        tiers: [
          {
            _key: uuid(),
            name: "Kitchen Only",
            description: "Complete kitchen transformation — new island, range hood, lighting, and finishes.",
            lineItems: [
              { _key: uuid(), name: "Design Fee", price: 400000 },
              { _key: uuid(), name: "Construction & Millwork", price: 2500000 },
              { _key: uuid(), name: "Furnishings & Fixtures", price: 800000 },
            ],
          },
          {
            _key: uuid(),
            name: "Kitchen + Office",
            description: "Both spaces fully designed — kitchen renovation plus third-floor office transformation.",
            lineItems: [
              { _key: uuid(), name: "Design Fee", price: 600000 },
              { _key: uuid(), name: "Construction & Millwork", price: 3200000 },
              { _key: uuid(), name: "Furnishings & Fixtures", price: 1500000 },
              { _key: uuid(), name: "Window Treatments", price: 250000 },
            ],
          },
        ],
        selectedTierKey: null,
      },
      decisionLog: [
        {
          _key: uuid(),
          action: "approved",
          clientId: ID.walsh,
          clientName: "Margaret Walsh",
          feedback: "The office was always the dream. Let's do both!",
          timestamp: datetimeFromNow(-152, 11),
        },
      ],
    },
    {
      _key: uuid(),
      artifactType: "contract",
    },
    {
      _key: uuid(),
      artifactType: "close-document",
    },
  ],

  // Testimonial — completed project
  testimonial: {
    quote: "Liz understood what I wanted before I could articulate it. Walking into my kitchen every morning genuinely makes me happy. The office is my favorite room in the house — I never want to leave it.",
    author: "Margaret Walsh",
  },
};

const PROJECTS = [
  projectGramercy,
  projectDarien,
  projectNorthShore,
  projectParkAve,
  projectFlowerHill,
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("La Sprezzatura Portal Data Seed\n");

  // -------------------------------------------------------------------------
  // 1. Create/replace clients
  // -------------------------------------------------------------------------

  console.log("--- Clients ---");
  for (const c of CLIENTS) {
    await client.createOrReplace(c);
    console.log(`  + ${c.name} (${c._id})`);
  }
  console.log(`  Created ${CLIENTS.length} clients.\n`);

  // -------------------------------------------------------------------------
  // 2. Create/replace contractors
  // -------------------------------------------------------------------------

  console.log("--- Contractors ---");
  for (const c of CONTRACTORS) {
    await client.createOrReplace(c);
    console.log(`  + ${c.name} — ${c.company} (${c._id})`);
  }
  console.log(`  Created ${CONTRACTORS.length} contractors.\n`);

  // -------------------------------------------------------------------------
  // 3. Create/replace projects
  // -------------------------------------------------------------------------

  console.log("--- Projects ---");
  for (const p of PROJECTS) {
    await client.createOrReplace(p);
    const stage = p.pipelineStage || "—";
    const status = p.projectStatus || "—";
    console.log(`  + ${p.title} [${stage} / ${status}] (${p._id})`);
  }
  console.log(`  Created ${PROJECTS.length} projects.\n`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------

  console.log("=== Seed Summary ===");
  console.log(`  Clients:     ${CLIENTS.length}`);
  console.log(`  Contractors: ${CONTRACTORS.length}`);
  console.log(`  Projects:    ${PROJECTS.length}`);
  console.log("");
  console.log("Portal-enabled projects:");
  for (const p of PROJECTS) {
    if (p.portalEnabled) {
      console.log(`  - ${p.title} (token: ${p.portalToken})`);
    }
  }
  console.log("");
  console.log("Done. View at: https://la-sprezzatura.vercel.app/admin");

  // List deterministic IDs for easy cleanup
  console.log("\nTo remove all seed data:");
  const allIds = [...CLIENTS, ...CONTRACTORS, ...PROJECTS].map((d) => d._id);
  console.log(`  npx sanity@latest documents delete ${allIds.join(" ")}`);
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  if (err.statusCode) console.error("  Status:", err.statusCode);
  if (err.details) console.error("  Details:", JSON.stringify(err.details, null, 2));
  process.exit(1);
});
