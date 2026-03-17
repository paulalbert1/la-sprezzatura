import { describe, it, expect } from "vitest";
import {
  CLIENT_BY_EMAIL_QUERY,
  PROJECTS_BY_CLIENT_QUERY,
  CONTRACTOR_BY_EMAIL_QUERY,
  CONTRACTOR_BY_ID_QUERY,
  PROJECTS_BY_CONTRACTOR_QUERY,
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
  });
});
