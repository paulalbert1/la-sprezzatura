import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";

const sanityProjectId =
  process.env.PUBLIC_SANITY_PROJECT_ID ||
  import.meta.env?.PUBLIC_SANITY_PROJECT_ID;
const hasSanity = sanityProjectId && sanityProjectId !== "placeholder";

export default defineConfig({
  adapter: vercel(),
  integrations: [
    ...(hasSanity
      ? [
          sanity({
            projectId: sanityProjectId,
            dataset:
              process.env.PUBLIC_SANITY_DATASET ||
              import.meta.env?.PUBLIC_SANITY_DATASET ||
              "production",
            useCdn: false,
            studioBasePath: "/admin",
          }),
        ]
      : []),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
