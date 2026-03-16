import type { APIRoute } from "astro";
import { generateClosePdf } from "../../lib/generateClosePdf";
import { getSession } from "../../lib/session";
import { sanityClient } from "sanity:client";
import { getArtifactLabel } from "../../lib/artifactUtils";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  // Auth check
  const clientId = await getSession(context.cookies);
  if (!clientId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const projectId = context.url.searchParams.get("projectId");
  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }

  // Fetch project data
  const project = await sanityClient.fetch(
    `*[_type == "project" && _id == $projectId && portalEnabled == true && references($clientId)][0] {
      title,
      completedAt,
      projectStatus,
      engagementType,
      clients[] { client-> { name } },
      milestones[] | order(date asc) { name, date, completed },
      "totalSavings": math::sum(procurementItems[].retailPrice) - math::sum(procurementItems[].clientCost),
      artifacts[] {
        artifactType,
        customTypeName,
        decisionLog[] { action }
      }
    }`,
    { projectId, clientId },
  );

  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  // Only generate for completed Full Interior Design projects
  if (project.engagementType !== "full-interior-design") {
    return new Response("Close document not available for this engagement type", { status: 400 });
  }

  const clientNames = (project.clients || [])
    .map((c: any) => c.client?.name)
    .filter(Boolean);

  const approvedArtifacts = (project.artifacts || [])
    .filter((a: any) => a.decisionLog?.some((d: any) => d.action === "approved"))
    .map((a: any) => getArtifactLabel(a.artifactType, a.customTypeName));

  const pdfBuffer = await generateClosePdf({
    projectTitle: project.title,
    clientNames,
    milestones: project.milestones || [],
    totalSavings: project.totalSavings || 0,
    approvedArtifacts,
  });

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${project.title.replace(/[^a-zA-Z0-9 ]/g, "")}-Close-Document.pdf"`,
    },
  });
};
