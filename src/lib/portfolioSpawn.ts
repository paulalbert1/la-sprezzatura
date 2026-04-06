/**
 * Build a portfolioProject document payload from an admin project.
 * Pure function - no Sanity client dependency, fully testable.
 *
 * @param adminProject - The admin project document (draft or published)
 * @param selectedImages - Array of image objects to include. First becomes heroImage, rest become gallery.
 *                         Pass empty array for no-photos scenario.
 * @returns Document payload ready for client.create()
 */
export function buildPortfolioPayload(
  adminProject: Record<string, any>,
  selectedImages: Record<string, any>[],
): Record<string, any> {
  const heroImage = selectedImages.length > 0 ? selectedImages[0] : undefined;
  const galleryImages = selectedImages.slice(1).map((img, i) => ({
    ...img,
    _key: `img-${i}`,
  }));

  return {
    _type: "portfolioProject",
    title: adminProject.title,
    location: adminProject.location,
    description: adminProject.description,
    tags: [],
    roomType: adminProject.roomType,
    challenge: adminProject.challenge,
    approach: adminProject.approach,
    outcome: adminProject.outcome,
    testimonial: adminProject.testimonial,
    completionDate: adminProject.completionDate,
    featured: adminProject.featured,
    order: adminProject.order,
    sourceAdminProjectId: adminProject._id,
    ...(heroImage ? { heroImage } : {}),
    images: galleryImages,
  };
}
