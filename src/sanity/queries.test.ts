import { describe, it, expect } from "vitest";
import {
  CLIENT_BY_EMAIL_QUERY,
  PROJECTS_BY_CLIENT_QUERY,
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
});
