import { describe, it, expect } from "vitest";
import { buildPortfolioPayload } from "./portfolioSpawn";

const mockAdminProject = {
  _id: "project-123",
  _type: "project",
  title: "Coastal Beach House",
  location: "North Shore, Long Island",
  description: "A stunning coastal renovation",
  roomType: "full-home",
  style: "coastal", // should NOT be copied
  challenge: [
    {
      _type: "block",
      _key: "k1",
      children: [{ _type: "span", text: "Challenge text" }],
    },
  ],
  approach: [
    {
      _type: "block",
      _key: "k2",
      children: [{ _type: "span", text: "Approach text" }],
    },
  ],
  outcome: [
    {
      _type: "block",
      _key: "k3",
      children: [{ _type: "span", text: "Outcome text" }],
    },
  ],
  testimonial: { quote: "Amazing work", author: "Jane Doe" },
  completionDate: "2026-01-15",
  featured: true,
  order: 1,
  heroImage: {
    _type: "image",
    asset: { _type: "reference", _ref: "image-abc-1200x800-jpg" },
    hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
    crop: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  images: [
    {
      _key: "gallery1",
      _type: "image",
      asset: { _type: "reference", _ref: "image-def-800x600-jpg" },
      alt: "Living room",
      caption: "Main living area",
    },
    {
      _key: "gallery2",
      _type: "image",
      asset: { _type: "reference", _ref: "image-ghi-800x600-jpg" },
      alt: "Kitchen",
      caption: "Kitchen detail",
    },
  ],
};

describe("buildPortfolioPayload", () => {
  it("sets _type to 'portfolioProject'", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result._type).toBe("portfolioProject");
  });

  it("copies title from admin project", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.title).toBe("Coastal Beach House");
  });

  it("copies location from admin project", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.location).toBe("North Shore, Long Island");
  });

  it("copies description from admin project", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.description).toBe("A stunning coastal renovation");
  });

  it("copies roomType from admin project", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.roomType).toBe("full-home");
  });

  it("does NOT copy challenge, approach, outcome, or testimonial", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.challenge).toBeUndefined();
    expect(result.approach).toBeUndefined();
    expect(result.outcome).toBeUndefined();
    expect(result.testimonial).toBeUndefined();
  });

  it("copies completionDate from admin project", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.completionDate).toBe("2026-01-15");
  });

  it("copies featured from admin project", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.featured).toBe(true);
  });

  it("copies order from admin project", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.order).toBe(1);
  });

  it("sets sourceAdminProject as a Sanity reference to admin project _id", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.sourceAdminProject).toEqual({
      _type: "reference",
      _ref: "project-123",
    });
  });

  it("sets published to false", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.published).toBe(false);
  });

  it("sets tags to empty array", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.tags).toEqual([]);
  });

  it("does NOT copy style field", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.style).toBeUndefined();
  });

  it("with selectedImages=[] produces payload with no heroImage and empty images array", () => {
    const result = buildPortfolioPayload(mockAdminProject, []);
    expect(result.heroImage).toBeUndefined();
    expect(result.images).toEqual([]);
  });

  it("with selectedImages, first image becomes heroImage", () => {
    const selectedImages = [
      mockAdminProject.heroImage,
      ...mockAdminProject.images,
    ];
    const result = buildPortfolioPayload(mockAdminProject, selectedImages);
    expect(result.heroImage).toEqual(mockAdminProject.heroImage);
  });

  it("with selectedImages, rest become images array", () => {
    const selectedImages = [
      mockAdminProject.heroImage,
      ...mockAdminProject.images,
    ];
    const result = buildPortfolioPayload(mockAdminProject, selectedImages);
    expect(result.images).toHaveLength(2);
  });

  it("copies entire image objects including hotspot, crop, alt, caption", () => {
    const selectedImages = [
      mockAdminProject.heroImage,
      ...mockAdminProject.images,
    ];
    const result = buildPortfolioPayload(mockAdminProject, selectedImages);
    // Hero image should include hotspot and crop
    expect(result.heroImage.hotspot).toEqual({
      x: 0.5,
      y: 0.5,
      width: 1,
      height: 1,
    });
    expect(result.heroImage.crop).toEqual({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
    // Gallery images should include alt and caption
    expect(result.images[0].alt).toBe("Living room");
    expect(result.images[0].caption).toBe("Main living area");
  });

  it("generates new _key values for image array items (format: img-0, img-1, etc.)", () => {
    const selectedImages = [
      mockAdminProject.heroImage,
      ...mockAdminProject.images,
    ];
    const result = buildPortfolioPayload(mockAdminProject, selectedImages);
    expect(result.images[0]._key).toBe("img-0");
    expect(result.images[1]._key).toBe("img-1");
  });
});
