// Mock for sanity:client virtual module (Astro/Sanity integration)
// Only used in tests -- the real module is provided by @sanity/astro at build time
export const sanityClient = {
  fetch: async () => null,
};
