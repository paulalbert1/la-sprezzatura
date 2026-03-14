import imageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "sanity:client";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

const builder = imageUrlBuilder(sanityClient);

// Returns a builder instance for the given Sanity image source.
// Usage: urlFor(image).width(800).auto("format").quality(80).url()
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
