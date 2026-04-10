/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

declare namespace App {
  interface Locals {
    clientId: string | undefined;
    contractorId: string | undefined;
    buildingManagerEmail: string | undefined;
    tenantId: string | undefined;
    role: 'client' | 'contractor' | 'building_manager' | 'admin' | undefined;
    sanityUserId: string | undefined; // Resolved from tenant admin config for admin sessions
  }
}
