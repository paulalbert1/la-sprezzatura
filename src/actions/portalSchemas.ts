import { z } from "zod";

export const approveArtifactSchema = z.object({
  projectId: z.string().min(1),
  artifactKey: z.string().min(1),
  versionKey: z.string().min(1),
  confirmed: z.literal("true"),
});

export const requestChangesSchema = z.object({
  projectId: z.string().min(1),
  artifactKey: z.string().min(1),
  versionKey: z.string().min(1),
  feedback: z.string().min(1, "Please describe what changes you'd like"),
});

export const milestoneNoteSchema = z.object({
  projectId: z.string().min(1),
  milestoneKey: z.string().min(1),
  text: z.string().min(1, "Please enter a note").max(500, "Note must be 500 characters or less"),
});

export const artifactNoteSchema = z.object({
  projectId: z.string().min(1),
  artifactKey: z.string().min(1),
  text: z.string().min(1, "Please enter a note").max(500, "Note must be 500 characters or less"),
});

export const warrantyClaimSchema = z.object({
  projectId: z.string().min(1),
  description: z.string().min(10, "Please describe the issue in at least 10 characters"),
  photo: z.instanceof(File).optional(),
});

export const contractorNoteSchema = z.object({
  projectId: z.string().min(1),
  assignmentKey: z.string().min(1),
  text: z.string().min(1, "Please enter a note").max(500, "Note must be 500 characters or less"),
});

// Phase 9: Tier selection schema for investment proposals
export const selectTierSchema = z.object({
  projectId: z.string().min(1),
  artifactKey: z.string().min(1),
  tierKey: z.string().min(1),
  eagerness: z.coerce.number().int().min(1).max(5),
  reservations: z.string().optional(),
  confirmed: z.literal("true"),
});

// Phase 36: Archive lifecycle for admin projects list
export const archiveProjectSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
});
