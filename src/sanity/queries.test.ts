import { describe, it, expect } from "vitest";
import {
  CLIENT_BY_EMAIL_QUERY,
  PROJECTS_BY_CLIENT_QUERY,
  CONTRACTOR_BY_EMAIL_QUERY,
  CONTRACTOR_BY_ID_QUERY,
  PROJECTS_BY_CONTRACTOR_QUERY,
  WORK_ORDER_DETAIL_QUERY,
  BUILDING_MANAGER_PROJECT_QUERY,
  PROJECTS_BY_BUILDING_MANAGER_QUERY,
  PROJECT_DETAIL_QUERY,
  SITE_SETTINGS_QUERY,
  SEND_UPDATE_PROJECT_QUERY,
} from "./queries";

describe("GROQ query strings", () => {
  describe("CLIENT_BY_EMAIL_QUERY", () => {
    it("filters by client type", () => {
      expect(CLIENT_BY_EMAIL_QUERY).toContain('_type == "client"');
    });
    it("filters by email parameter", () => {
      expect(CLIENT_BY_EMAIL_QUERY).toContain("email == $email");
    });
    it("projects _id and name", () => {
      expect(CLIENT_BY_EMAIL_QUERY).toContain("_id");
      expect(CLIENT_BY_EMAIL_QUERY).toContain("name");
    });
  });
  describe("PROJECTS_BY_CLIENT_QUERY", () => {
    it("uses references() for client lookup", () => {
      expect(PROJECTS_BY_CLIENT_QUERY).toContain("references($clientId)");
    });
    it("filters by portalEnabled", () => {
      expect(PROJECTS_BY_CLIENT_QUERY).toContain("portalEnabled == true");
    });
    it("projects required fields", () => {
      expect(PROJECTS_BY_CLIENT_QUERY).toContain("title");
      expect(PROJECTS_BY_CLIENT_QUERY).toContain("pipelineStage");
      expect(PROJECTS_BY_CLIENT_QUERY).toContain("engagementType");
    });
  });

  // Phase 7: Contractor Queries
  describe("CONTRACTOR_BY_EMAIL_QUERY", () => {
    it("filters by contractor type", () => {
      expect(CONTRACTOR_BY_EMAIL_QUERY).toContain('_type == "contractor"');
    });
    it("filters by email parameter", () => {
      expect(CONTRACTOR_BY_EMAIL_QUERY).toContain("email == $email");
    });
    it("projects _id, name, email", () => {
      expect(CONTRACTOR_BY_EMAIL_QUERY).toContain("_id");
      expect(CONTRACTOR_BY_EMAIL_QUERY).toContain("name");
      expect(CONTRACTOR_BY_EMAIL_QUERY).toContain("email");
    });
  });

  describe("CONTRACTOR_BY_ID_QUERY", () => {
    it("filters by _id parameter", () => {
      expect(CONTRACTOR_BY_ID_QUERY).toContain("_id == $contractorId");
    });
    it("filters by contractor type", () => {
      expect(CONTRACTOR_BY_ID_QUERY).toContain('_type == "contractor"');
    });
    it("projects _id, name, email, company", () => {
      expect(CONTRACTOR_BY_ID_QUERY).toContain("_id");
      expect(CONTRACTOR_BY_ID_QUERY).toContain("name");
      expect(CONTRACTOR_BY_ID_QUERY).toContain("email");
      expect(CONTRACTOR_BY_ID_QUERY).toContain("company");
    });
  });

  describe("PROJECTS_BY_CONTRACTOR_QUERY", () => {
    it("filters by contractor reference", () => {
      expect(PROJECTS_BY_CONTRACTOR_QUERY).toContain("contractor._ref == $contractorId");
    });
    it("filters by full-interior-design engagement type", () => {
      expect(PROJECTS_BY_CONTRACTOR_QUERY).toContain('engagementType == "full-interior-design"');
    });
    it("filters by portalEnabled", () => {
      expect(PROJECTS_BY_CONTRACTOR_QUERY).toContain("portalEnabled == true");
    });
    it("projects assignment with startDate and endDate", () => {
      expect(PROJECTS_BY_CONTRACTOR_QUERY).toContain("startDate");
      expect(PROJECTS_BY_CONTRACTOR_QUERY).toContain("endDate");
    });
    it("includes projectAddress for dashboard cards", () => {
      expect(PROJECTS_BY_CONTRACTOR_QUERY).toContain("projectAddress");
    });
  });

  // Phase 8: Work Order Detail Query
  describe("WORK_ORDER_DETAIL_QUERY", () => {
    it("contains primaryClientName but NOT email or phone (information boundary)", () => {
      expect(WORK_ORDER_DETAIL_QUERY).toContain("primaryClientName");
      // Must not dereference client email or phone
      expect(WORK_ORDER_DETAIL_QUERY).not.toMatch(/client->\s*\{[^}]*email/);
      expect(WORK_ORDER_DETAIL_QUERY).not.toMatch(/client->\s*\{[^}]*phone/);
    });
    it("contains appointments with notes field", () => {
      expect(WORK_ORDER_DETAIL_QUERY).toContain("appointments");
      expect(WORK_ORDER_DETAIL_QUERY).toContain("notes");
    });
    it("contains scopeOfWork, estimateFile, and estimateAmount", () => {
      expect(WORK_ORDER_DETAIL_QUERY).toContain("scopeOfWork");
      expect(WORK_ORDER_DETAIL_QUERY).toContain("estimateFile");
      expect(WORK_ORDER_DETAIL_QUERY).toContain("estimateAmount");
    });
    it("contains floorPlans", () => {
      expect(WORK_ORDER_DETAIL_QUERY).toContain("floorPlans");
    });
    it("contains submissionNotes and contractorNotes", () => {
      expect(WORK_ORDER_DETAIL_QUERY).toContain("submissionNotes");
      expect(WORK_ORDER_DETAIL_QUERY).toContain("contractorNotes");
    });
  });

  // Phase 8: Building Manager Project Query
  describe("BUILDING_MANAGER_PROJECT_QUERY", () => {
    it("contains primaryClient with email and phone", () => {
      expect(BUILDING_MANAGER_PROJECT_QUERY).toContain("primaryClient");
      expect(BUILDING_MANAGER_PROJECT_QUERY).toContain("email");
      expect(BUILDING_MANAGER_PROJECT_QUERY).toContain("phone");
    });
    it("contains cois with expirationDate", () => {
      expect(BUILDING_MANAGER_PROJECT_QUERY).toContain("cois");
      expect(BUILDING_MANAGER_PROJECT_QUERY).toContain("expirationDate");
    });
    it("contains legalDocs", () => {
      expect(BUILDING_MANAGER_PROJECT_QUERY).toContain("legalDocs");
    });
    it("contains contractors with name and trades but NOT email/phone", () => {
      expect(BUILDING_MANAGER_PROJECT_QUERY).toContain("contractors");
      expect(BUILDING_MANAGER_PROJECT_QUERY).toContain("contractor->name");
      expect(BUILDING_MANAGER_PROJECT_QUERY).toContain("contractor->trades");
      // contractors block should NOT expose email/phone
      expect(BUILDING_MANAGER_PROJECT_QUERY).not.toContain("contractor->email");
      expect(BUILDING_MANAGER_PROJECT_QUERY).not.toContain("contractor->phone");
    });
    it("does NOT contain scopeOfWork or estimateFile", () => {
      expect(BUILDING_MANAGER_PROJECT_QUERY).not.toContain("scopeOfWork");
      expect(BUILDING_MANAGER_PROJECT_QUERY).not.toContain("estimateFile");
    });
  });

  // Phase 8: Projects by Building Manager Query
  describe("PROJECTS_BY_BUILDING_MANAGER_QUERY", () => {
    it("matches on buildingManager.email and isCommercial == true", () => {
      expect(PROJECTS_BY_BUILDING_MANAGER_QUERY).toContain("buildingManager.email == $email");
      expect(PROJECTS_BY_BUILDING_MANAGER_QUERY).toContain("isCommercial == true");
    });
  });

  // Phase 8: Extended PROJECT_DETAIL_QUERY with CVIS-01 contractor data
  describe("PROJECT_DETAIL_QUERY (CVIS-01 extension)", () => {
    it("contains contractors with name, trades, appointments with dateTime and label", () => {
      expect(PROJECT_DETAIL_QUERY).toContain("contractors");
      expect(PROJECT_DETAIL_QUERY).toContain("contractor->name");
      expect(PROJECT_DETAIL_QUERY).toContain("contractor->trades");
      expect(PROJECT_DETAIL_QUERY).toContain("dateTime");
      expect(PROJECT_DETAIL_QUERY).toContain("label");
    });
    it("CVIS-01 appointments do NOT include notes (information boundary)", () => {
      // The contractors projection within the select() block must NOT include notes
      // We check by finding the contractors block within the select() and ensuring notes is not there
      // The select block contains "contractors": contractors[]
      const selectBlock = PROJECT_DETAIL_QUERY.split("select(")[1];
      expect(selectBlock).toBeDefined();
      // The contractors sub-query within select should have appointments but the appointments should NOT have notes
      const contractorsSection = selectBlock.split('"contractors"')[1]?.split('}')[0];
      // This is inside the select block -- appointments here should NOT have notes
      // We verify by checking the appointments inside contractors doesn't reference notes
      // A simpler check: after "contractors" in the select block, find "appointments" and ensure "notes" is NOT between that and the closing bracket
      expect(contractorsSection).toBeDefined();
      expect(contractorsSection).not.toContain("notes");
    });
  });

  // Phase 8: Site Settings Query
  describe("SITE_SETTINGS_QUERY", () => {
    it("contains contactEmail and contactPhone", () => {
      expect(SITE_SETTINGS_QUERY).toContain("contactEmail");
      expect(SITE_SETTINGS_QUERY).toContain("contactPhone");
    });
  });

  // Phase 9: Send Update Query
  describe("SEND_UPDATE_PROJECT_QUERY", () => {
    it("filters by project type and projectId parameter", () => {
      expect(SEND_UPDATE_PROJECT_QUERY).toContain('_type == "project"');
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("_id == $projectId");
    });

    it("includes client references with name and email", () => {
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("clients[]");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("client->");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("name");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("email");
    });

    it("includes milestones with name, date, completed", () => {
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("milestones[]");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("date");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("completed");
    });

    it("uses select() for engagement-type-gated procurement", () => {
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("select(");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("full-interior-design");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("procurementItems");
    });

    it("computes savings from retailPrice - clientCost but does NOT expose clientCost directly", () => {
      expect(SEND_UPDATE_PROJECT_QUERY).toContain('"savings"');
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("retailPrice - clientCost");
      const withoutSavings = SEND_UPDATE_PROJECT_QUERY.replace(/retailPrice\s*-\s*clientCost/, "");
      expect(withoutSavings).not.toContain("clientCost");
    });

    it("includes artifacts with _key, artifactType, hasApproval", () => {
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("artifacts[]");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("artifactType");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("hasApproval");
    });

    it("includes lastUpdateSentAt from updateLog", () => {
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("lastUpdateSentAt");
      expect(SEND_UPDATE_PROJECT_QUERY).toContain("updateLog");
    });
  });
});
