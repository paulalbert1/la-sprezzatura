import { client } from "./client";
import { contractor } from "./contractor";
import { designOption } from "./designOption";
import { impersonationAudit } from "./impersonationAudit";
import { project } from "./project";
import { projectWorkflow } from "./projectWorkflow";
import { renderingSession } from "./renderingSession";
import { renderingUsage } from "./renderingUsage";
import { service } from "./service";
import { siteSettings } from "./siteSettings";
import { workflowTemplate } from "./workflowTemplate";
import { workOrder } from "./workOrder";

export const schemaTypes = [client, contractor, designOption, impersonationAudit, project, projectWorkflow, renderingSession, renderingUsage, service, siteSettings, workflowTemplate, workOrder];
