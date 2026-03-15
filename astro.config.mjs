import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env manually so astro.config.mjs can read PUBLIC_SANITY_* before Vite processes it
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    });
}

const sanityProjectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const hasSanity = sanityProjectId && sanityProjectId !== "placeholder";

export default defineConfig({
  site: "https://lasprezz.com",
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
    sitemap({
      filter: (page) => !page.includes("/admin") && !page.includes("/portal"),
    }),
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Cormorant Garamond",
      cssVariable: "--font-heading",
      weights: ["300", "400", "500", "600"],
      styles: ["normal", "italic"],
    },
    {
      provider: fontProviders.google(),
      name: "DM Sans",
      cssVariable: "--font-body",
      weights: ["300", "400", "500"],
      styles: ["normal"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
