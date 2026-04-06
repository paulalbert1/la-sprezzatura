/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

declare namespace App {
  interface Locals {
    clientId: string | undefined;
    contractorId: string | undefined;
    buildingManagerEmail: string | undefined;
    adminEmail: string | undefined;
    role: 'client' | 'contractor' | 'building_manager' | 'admin' | undefined;
  }
}
