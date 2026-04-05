#!/usr/bin/env node
/**
 * Seed Gantt chart data for the Darien Residence project.
 *
 * Patches the existing seed-project-darien with realistic contractors,
 * milestones, procurement items, and custom events so the Schedule tab
 * has something to render.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=sk... node scripts/seed-gantt-data.mjs
 *   node --env-file=.env scripts/seed-gantt-data.mjs
 */

import { createClient } from "@sanity/client";
import crypto from "node:crypto";

const PROJECT_ID = "e9tpu2os";
const DATASET = "production";
const TOKEN = process.env.SANITY_WRITE_TOKEN;

if (!TOKEN) {
  console.error(
    "Missing SANITY_WRITE_TOKEN.\nRun with:\n  SANITY_WRITE_TOKEN=sk... node scripts/seed-gantt-data.mjs",
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

function uuid() {
  return crypto.randomUUID().slice(0, 8);
}

/** YYYY-MM-DD date string offset from today */
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

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

// ---------------------------------------------------------------------------
// Contractor document IDs (must exist as contractor documents)
// ---------------------------------------------------------------------------
const CONTRACTOR_IDS = {
  jpPainting: "seed-contractor-jppainting",
  eliteFlooring: "seed-contractor-eliteflooring",
  luxeLighting: "seed-contractor-luxelighting",
  precisionPlumb: "seed-contractor-precisionplumb",
  artisanMill: "seed-contractor-artisanmill",
};

// ---------------------------------------------------------------------------
// Seed contractor documents (if they don't already exist)
// ---------------------------------------------------------------------------
const contractorDocs = [
  {
    _id: CONTRACTOR_IDS.jpPainting,
    _type: "contractor",
    name: "John Petroski",
    company: "JP Painting & Finishes",
    trades: ["painting", "wallpaper"],
    email: "john@jppaint.com",
    phone: "203-555-0101",
  },
  {
    _id: CONTRACTOR_IDS.eliteFlooring,
    _type: "contractor",
    name: "Maria Santos",
    company: "Elite Flooring Co",
    trades: ["flooring"],
    email: "maria@eliteflooring.com",
    phone: "203-555-0202",
  },
  {
    _id: CONTRACTOR_IDS.luxeLighting,
    _type: "contractor",
    name: "David Chen",
    company: "Luxe Lighting Design",
    trades: ["electrical", "lighting"],
    email: "david@luxelighting.com",
    phone: "203-555-0303",
  },
  {
    _id: CONTRACTOR_IDS.precisionPlumb,
    _type: "contractor",
    name: "Robert Kowalski",
    company: "Precision Plumbing",
    trades: ["plumbing"],
    email: "rob@precisionplumb.com",
    phone: "203-555-0404",
  },
  {
    _id: CONTRACTOR_IDS.artisanMill,
    _type: "contractor",
    name: "Sarah Williams",
    company: "Artisan Millwork",
    trades: ["carpentry", "millwork"],
    email: "sarah@artisanmill.com",
    phone: "203-555-0505",
  },
];

// ---------------------------------------------------------------------------
// Gantt data for Darien Residence
// ---------------------------------------------------------------------------

// Use fixed keys for items referenced by dependencies
const KEYS = {
  jpPainting: "cnt-jpp1",
  jpTouchups: "cnt-jpp2",
  eliteFloor: "cnt-elf1",
  luxeLight: "cnt-lux1",
  precPlumb: "cnt-prp1",
  artisanMill: "cnt-art1",
  designPresentation: "mil-dp01",
  designApproval: "mil-da01",
  demoComplete: "mil-dc01",
  roughInspection: "mil-ri01",
  furnitureDelivery: "mil-fd01",
  finalWalk: "mil-fw01",
  photoShoot: "mil-ps01",
  rhSofa: "pro-rhs1",
  vcPendants: "pro-vcp1",
  wwFixtures: "pro-wwf1",
  diningTable: "pro-dt01",
  carpetRunner: "pro-cr01",
  wallcovering: "pro-wc01",
  hoaReview: "evt-hoa1",
  siteWalk: "evt-sw01",
  bldgPermit: "evt-bp01",
  furnDelWin: "evt-fdw1",
  moveIn: "evt-mv01",
  punchList: "evt-pl01",
  presentation: "evt-pr01",
};

const contractors = [
  {
    _key: KEYS.jpPainting,
    contractor: { _type: "reference", _ref: CONTRACTOR_IDS.jpPainting },
    startDate: daysFromNow(-14),
    endDate: daysFromNow(10),
    scopeOfWork: textBlock(
      "Full interior painting: living room, dining room, master bedroom, two guest rooms. Benjamin Moore Revere Pewter throughout.",
    ),
    estimateAmount: 1850000,
    internalNotes: "Great work last time on the Thornton project",
  },
  {
    _key: KEYS.eliteFloor,
    contractor: { _type: "reference", _ref: CONTRACTOR_IDS.eliteFlooring },
    startDate: daysFromNow(-7),
    endDate: daysFromNow(21),
    scopeOfWork: textBlock(
      "Remove existing carpet, install wide-plank white oak hardwood in all common areas and bedrooms. Herringbone pattern in foyer.",
    ),
    estimateAmount: 3200000,
    internalNotes: "Need subfloor inspection before starting bedrooms",
  },
  {
    _key: KEYS.luxeLight,
    contractor: { _type: "reference", _ref: CONTRACTOR_IDS.luxeLighting },
    startDate: daysFromNow(5),
    endDate: daysFromNow(18),
    scopeOfWork: textBlock(
      "Install recessed lighting in kitchen and dining room. Pendant installation over kitchen island. Dimmer switches throughout.",
    ),
    estimateAmount: 980000,
  },
  {
    _key: KEYS.precPlumb,
    contractor: { _type: "reference", _ref: CONTRACTOR_IDS.precisionPlumb },
    startDate: daysFromNow(12),
    endDate: daysFromNow(20),
    scopeOfWork: textBlock(
      "Master bath fixture installation: freestanding tub, dual vanity, rain shower. Rough-in already complete.",
    ),
    estimateAmount: 1450000,
  },
  {
    _key: KEYS.artisanMill,
    contractor: { _type: "reference", _ref: CONTRACTOR_IDS.artisanMill },
    startDate: daysFromNow(15),
    endDate: daysFromNow(35),
    scopeOfWork: textBlock(
      "Custom built-in bookshelves for study. Wainscoting in dining room. Crown molding throughout first floor.",
    ),
    estimateAmount: 4500000,
    internalNotes: "Material lead time is 3 weeks — confirm walnut availability",
  },
  {
    _key: KEYS.jpTouchups,
    contractor: { _type: "reference", _ref: CONTRACTOR_IDS.jpPainting },
    startDate: daysFromNow(25),
    endDate: daysFromNow(30),
    scopeOfWork: textBlock(
      "Touch-up painting after flooring and millwork installation. Fill nail holes, patch drywall dings, repaint baseboards.",
    ),
    estimateAmount: 450000,
    internalNotes: "Schedule after Elite Flooring and Artisan Millwork are done",
  },
];

const milestones = [
  {
    _key: KEYS.designPresentation,
    name: "Design Presentation",
    date: daysFromNow(-21),
    completed: true,
    description: "Final design boards presented to client with material samples",
  },
  {
    _key: KEYS.designApproval,
    name: "Client Design Approval",
    date: daysFromNow(-14),
    completed: true,
    description: "Signed off on all room layouts, finishes, and fixture selections",
  },
  {
    _key: KEYS.demoComplete,
    name: "Demolition Complete",
    date: daysFromNow(-5),
    completed: true,
    description: "Carpet removed, old fixtures demolished, walls prepped",
  },
  {
    _key: KEYS.roughInspection,
    name: "Rough Inspection",
    date: daysFromNow(8),
    completed: false,
    description: "Building department rough electrical and plumbing inspection",
  },
  {
    _key: KEYS.furnitureDelivery,
    name: "Furniture Delivery Window",
    date: daysFromNow(28),
    completed: false,
    description: "RH and custom upholstery pieces scheduled for delivery",
  },
  {
    _key: KEYS.finalWalk,
    name: "Final Walkthrough",
    date: daysFromNow(38),
    completed: false,
    description: "Pre-photography punch list walk with client",
  },
  {
    _key: KEYS.photoShoot,
    name: "Photography Shoot",
    date: daysFromNow(42),
    completed: false,
    description: "Professional photography for portfolio",
  },
];

const procurementItems = [
  {
    _key: KEYS.rhSofa,
    name: "Restoration Hardware Cloud Sofa",
    status: "delivered",
    orderDate: daysFromNow(-30),
    expectedDeliveryDate: daysFromNow(-5),
    installDate: daysFromNow(30),
    clientCost: 899500,
    retailPrice: 1199900,
  },
  {
    _key: KEYS.vcPendants,
    name: "Visual Comfort Pendants (x3)",
    status: "ordered",
    orderDate: daysFromNow(-10),
    expectedDeliveryDate: daysFromNow(12),
    installDate: daysFromNow(16),
    clientCost: 285000,
    retailPrice: 375000,
  },
  {
    _key: KEYS.wwFixtures,
    name: "Waterworks Master Bath Fixtures",
    status: "in-transit",
    orderDate: daysFromNow(-20),
    expectedDeliveryDate: daysFromNow(3),
    installDate: daysFromNow(14),
    clientCost: 425000,
    retailPrice: 560000,
  },
  {
    _key: KEYS.diningTable,
    name: "Custom Dining Table (walnut)",
    status: "pending",
    orderDate: null,
    expectedDeliveryDate: daysFromNow(25),
    installDate: daysFromNow(30),
    clientCost: 650000,
    retailPrice: 850000,
  },
  {
    _key: KEYS.carpetRunner,
    name: "Stark Carpet Runner (stair)",
    status: "installed",
    orderDate: daysFromNow(-45),
    expectedDeliveryDate: daysFromNow(-10),
    installDate: daysFromNow(-3),
    clientCost: 180000,
    retailPrice: 245000,
  },
  {
    _key: KEYS.wallcovering,
    name: "Phillip Jeffries Wallcovering",
    status: "ordered",
    orderDate: daysFromNow(-5),
    expectedDeliveryDate: daysFromNow(18),
    installDate: daysFromNow(22),
    clientCost: 320000,
    retailPrice: 420000,
  },
];

const customEvents = [
  {
    _key: KEYS.hoaReview,
    name: "HOA Board Review",
    date: daysFromNow(-18),
    endDate: null,
    category: "permit",
    notes: "Exterior modification approval granted",
  },
  {
    _key: KEYS.siteWalk,
    name: "Site Walkthrough with Client",
    date: daysFromNow(2),
    endDate: null,
    category: "walkthrough",
    notes: "Review paint colors in situ, confirm lighting placement",
  },
  {
    _key: KEYS.bldgPermit,
    name: "Building Permit Inspection",
    date: daysFromNow(8),
    endDate: null,
    category: "inspection",
    notes: "Rough electrical and plumbing sign-off required",
  },
  {
    _key: KEYS.furnDelWin,
    name: "Furniture Delivery Window",
    date: daysFromNow(28),
    endDate: daysFromNow(30),
    category: "delivery-window",
    notes: "RH delivery requires 2-person team, clear path to living room",
  },
  {
    _key: KEYS.moveIn,
    name: "Move-In Week",
    date: daysFromNow(36),
    endDate: daysFromNow(40),
    category: "move",
    notes: "Staging, final styling, and client move-in",
  },
  {
    _key: KEYS.punchList,
    name: "Final Punch List Review",
    date: daysFromNow(35),
    endDate: null,
    category: "punch-list",
    notes: "Walk every room with client, document any touch-ups needed",
  },
  {
    _key: KEYS.presentation,
    name: "Client Presentation",
    date: daysFromNow(42),
    endDate: null,
    category: "presentation",
    notes: "Final reveal with photography session",
  },
];

// Dependencies: arrows connecting schedule items
const scheduleDependencies = [
  // Design flow
  {
    _key: uuid(),
    source: `milestone:${KEYS.designPresentation}`,
    target: `milestone:${KEYS.designApproval}`,
    linkType: "e2s",
  },
  // Approval unlocks contractors
  {
    _key: uuid(),
    source: `milestone:${KEYS.designApproval}`,
    target: `contractor:${KEYS.jpPainting}`,
    linkType: "e2s",
  },
  {
    _key: uuid(),
    source: `milestone:${KEYS.designApproval}`,
    target: `contractor:${KEYS.eliteFloor}`,
    linkType: "e2s",
  },
  // Demo must complete before lighting and flooring
  {
    _key: uuid(),
    source: `milestone:${KEYS.demoComplete}`,
    target: `contractor:${KEYS.luxeLight}`,
    linkType: "e2s",
  },
  // Lighting done triggers rough inspection
  {
    _key: uuid(),
    source: `contractor:${KEYS.luxeLight}`,
    target: `milestone:${KEYS.roughInspection}`,
    linkType: "e2s",
  },
  // Fixtures must arrive before plumber installs
  {
    _key: uuid(),
    source: `procurement:${KEYS.wwFixtures}`,
    target: `contractor:${KEYS.precPlumb}`,
    linkType: "e2s",
  },
  // Pendants must arrive before lighting installs them
  {
    _key: uuid(),
    source: `procurement:${KEYS.vcPendants}`,
    target: `contractor:${KEYS.luxeLight}`,
    linkType: "e2s",
  },
  // Flooring and millwork done before JP touch-ups
  {
    _key: uuid(),
    source: `contractor:${KEYS.eliteFloor}`,
    target: `contractor:${KEYS.jpTouchups}`,
    linkType: "e2s",
  },
  {
    _key: uuid(),
    source: `contractor:${KEYS.artisanMill}`,
    target: `contractor:${KEYS.jpTouchups}`,
    linkType: "e2s",
  },
  // Punch list before photo shoot
  {
    _key: uuid(),
    source: `event:${KEYS.punchList}`,
    target: `milestone:${KEYS.photoShoot}`,
    linkType: "e2s",
  },
  // Final walkthrough before move-in
  {
    _key: uuid(),
    source: `milestone:${KEYS.finalWalk}`,
    target: `event:${KEYS.moveIn}`,
    linkType: "e2s",
  },
];

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding contractor documents...");
  for (const doc of contractorDocs) {
    await client.createOrReplace(doc);
    console.log(`  ✓ ${doc.company} (${doc._id})`);
  }

  const ganttData = {
    contractors,
    milestones,
    procurementItems,
    customEvents,
    scheduleDependencies,
  };

  // Patch both published and draft documents so Studio shows the latest data
  console.log("\nPatching seed-project-darien (published + draft)...");
  await client.patch("seed-project-darien").set(ganttData).commit();
  const draftExists = await client.getDocument("drafts.seed-project-darien");
  if (draftExists) {
    await client.patch("drafts.seed-project-darien").set(ganttData).commit();
    console.log("  ✓ draft patched");
  } else {
    console.log("  ✓ no draft (published only)");
  }

  console.log("  ✓ contractors:", contractors.length);
  console.log("  ✓ milestones:", milestones.length);
  console.log("  ✓ procurementItems:", procurementItems.length);
  console.log("  ✓ customEvents:", customEvents.length);
  console.log("  ✓ scheduleDependencies:", scheduleDependencies.length);

  console.log("\n✅ Done! Open Darien Residence → Schedule tab to see the Gantt chart.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
