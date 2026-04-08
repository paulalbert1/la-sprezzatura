/**
 * Tenant hardcoded string audit test.
 *
 * Scans all admin source files for forbidden single-tenant patterns
 * (hardcoded brand names, domains, emails) that should be replaced
 * with tenant config values.
 *
 * This is a static analysis test -- it reads files from disk and
 * checks for patterns that indicate single-tenant assumptions.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const FORBIDDEN_PATTERNS = [
  { pattern: /la-sprezzatura/i, name: "dataset name (la-sprezzatura)" },
  { pattern: /lasprezz\.com/, name: "domain (lasprezz.com)" },
  { pattern: /La Sprezzatura/, name: "business name (La Sprezzatura)" },
  { pattern: /noreply@send/, name: "hardcoded sender email" },
  { pattern: /office@lasprezz/, name: "hardcoded contact email" },
];

const ADMIN_DIRS = [
  "src/pages/api/admin",
  "src/pages/admin",
  "src/components/admin",
];

const ADMIN_FILES = [
  "src/layouts/AdminLayout.astro",
];

function getFilesRecursive(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...getFilesRecursive(fullPath));
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist in test environment
  }
  return files;
}

function getAllAdminFiles(): string[] {
  const files: string[] = [];
  for (const dir of ADMIN_DIRS) {
    files.push(...getFilesRecursive(dir));
  }
  for (const file of ADMIN_FILES) {
    try {
      statSync(file);
      files.push(file);
    } catch {
      // File may not exist
    }
  }
  // Exclude test files and login page (pre-auth, no tenant context available — D-14)
  return files.filter((f) => !f.includes(".test.") && !f.endsWith("/admin/login.astro"));
}

function scanFile(
  filePath: string,
  pattern: RegExp,
): { line: number; content: string }[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: { line: number; content: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimStart();
    // Skip comment lines
    if (line.startsWith("//") || line.startsWith("*") || line.startsWith("/*")) {
      continue;
    }
    if (pattern.test(lines[i])) {
      violations.push({ line: i + 1, content: lines[i].trim() });
    }
  }

  return violations;
}

describe("Tenant hardcoded string audit", () => {
  const adminFiles = getAllAdminFiles();

  it("should find admin files to scan", () => {
    expect(adminFiles.length).toBeGreaterThan(0);
  });

  for (const { pattern, name } of FORBIDDEN_PATTERNS) {
    it(`should not contain ${name} in admin code`, () => {
      const allViolations: { file: string; line: number; content: string }[] = [];

      for (const file of adminFiles) {
        const violations = scanFile(file, pattern);
        for (const v of violations) {
          allViolations.push({ file, ...v });
        }
      }

      if (allViolations.length > 0) {
        const report = allViolations
          .map((v) => `  ${v.file}:${v.line} -> ${v.content}`)
          .join("\n");
        expect.fail(
          `Found ${allViolations.length} violation(s) of "${name}":\n${report}`,
        );
      }
    });
  }
});
