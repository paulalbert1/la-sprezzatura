#!/usr/bin/env node
/**
 * Seed sample project workflows.
 * Usage: node --env-file=.env scripts/seed-workflows.mjs
 *
 * For each active project that has no workflow yet, instantiates the
 * Full-service residential template (wt-full-service-residential) and
 * advances a handful of milestones so the schedule page isn't empty.
 */

import { createClient } from "@sanity/client";

const PROJECT_ID = "e9tpu2os";
const DATASET = "production";
const TENANT_ID = "lasprezz";
const TOKEN = process.env.SANITY_WRITE_TOKEN;

if (!TOKEN) {
  console.error("SANITY_WRITE_TOKEN is required");
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  token: TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// ── helpers ──────────────────────────────────────────────────────────────────

function slugId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20)
    + "-" + Math.random().toString(36).slice(2, 6);
}

function randomUUID() {
  return crypto.randomUUID();
}

/** Deep-clone the template phases, generating fresh _key / id values. */
function instantiatePhases(templatePhases) {
  const idMap = new Map(); // old id → new id
  // First pass: build id mapping
  for (const phase of templatePhases) {
    for (const ms of phase.milestones) {
      idMap.set(ms.id, slugId(ms.name));
    }
  }
  return templatePhases.map((phase) => ({
    _key: randomUUID(),
    id: slugId(phase.name),
    name: phase.name,
    order: phase.order,
    execution: phase.execution,
    canOverlapWith: phase.canOverlapWith.map((pid) => {
      // remap to new phase id — find by old id
      const targetPhase = templatePhases.find((p) => p.id === pid);
      return targetPhase ? slugId(targetPhase.name) : pid;
    }),
    milestones: phase.milestones.map((ms) => ({
      _key: randomUUID(),
      id: idMap.get(ms.id) ?? slugId(ms.name),
      name: ms.name,
      assignee: ms.assignee,
      gate: ms.gate ?? null,
      optional: ms.optional,
      multiInstance: ms.multiInstance,
      status: "not_started",
      hardPrereqs: ms.hardPrereqs.map((pid) => idMap.get(pid) ?? pid),
      softPrereqs: ms.softPrereqs.map((pid) => idMap.get(pid) ?? pid),
      instances: ms.defaultInstances?.map((di) => ({
        _key: randomUUID(),
        name: di.name,
        status: "not_started",
        assignedTradeId: null,
      })) ?? [],
    })),
  }));
}

// ── main ─────────────────────────────────────────────────────────────────────

const [template, projects, existingWorkflows] = await Promise.all([
  client.fetch(`*[_type == "workflowTemplate" && _id == "wt-full-service-residential"][0]`),
  client.fetch(`*[_type == "project" && !(_id in path("drafts.**"))] | order(_createdAt desc) { _id, title, status }`),
  client.fetch(`*[_type == "projectWorkflow"] { projectId }`),
]);

if (!template) {
  console.error("Template wt-full-service-residential not found — run seed first");
  process.exit(1);
}

const coveredProjects = new Set(existingWorkflows.map((w) => w.projectId));
const targets = projects.filter((p) => !coveredProjects.has(p._id));

console.log(`Projects: ${projects.length} total, ${targets.length} without a workflow`);

if (targets.length === 0) {
  console.log("All projects already have workflows. Done.");
  process.exit(0);
}

let created = 0;
for (const project of targets) {
  const phases = instantiatePhases(template.phases);

  // Advance onboarding milestones to "complete" for a realistic sample
  const onboarding = phases[0];
  if (onboarding) {
    for (const ms of onboarding.milestones) {
      ms.status = "complete";
    }
    // Mark first design dev milestone as in_progress
    if (phases[1]?.milestones[0]) {
      phases[1].milestones[0].status = "in_progress";
    }
  }

  const now = new Date().toISOString();
  const doc = {
    _id: `wf-${project._id}`,
    _type: "projectWorkflow",
    tenantId: TENANT_ID,
    projectId: project._id,
    templateId: template._id,
    status: "active",
    version: template.version,
    defaults: template.defaults,
    phases,
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await client.createIfNotExists(doc);
  console.log(`  ✓ ${project.title ?? project._id}`);
  created++;
}

console.log(`\nDone — ${created} workflow(s) created.`);
