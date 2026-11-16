import { describe, expect, it } from "vitest";
import { albumIdFromRouteParam, albumPath, publicDiscographyAlbums, relatedCatalogReleases, type CatalogAlbum } from "./catalogRoutes";

const release = (id: number, relatedGroupId: string | null = null, isHiddenFromDiscography = 0): CatalogAlbum => ({
  id,
  title: `Release ${id}`,
  coverImage: "cover.jpg",
  relatedGroupId,
  isHiddenFromDiscography,
  tracks: [],
});

describe("album routes", () => {
  it("creates a stable route for a movie sleeve", () => {
    expect(albumPath(30001)).toBe("/albums/30001");
  });

  it("accepts positive numeric route parameters and rejects malformed identifiers", () => {
    expect(albumIdFromRouteParam("30001")).toBe(30001);
    expect(albumIdFromRouteParam("0")).toBeNull();
    expect(albumIdFromRouteParam("nutcracker")).toBeNull();
    expect(albumIdFromRouteParam(undefined)).toBeNull();
  });

  it("keeps hidden related releases out of the public discography", () => {
    expect(publicDiscographyAlbums([release(1), release(2, "1", 1)]).map(album => album.id)).toEqual([1]);
  });

  it("shows every other release in the current group, never the current release", () => {
    const catalog = [release(1, "1"), release(2, "1", 1), release(3, "1", 1), release(4, "4")];
    expect(relatedCatalogReleases(catalog, catalog[0]).map(album => album.id)).toEqual([2, 3]);
    expect(relatedCatalogReleases(catalog, catalog[1]).map(album => album.id)).toEqual([1, 3]);
    expect(relatedCatalogReleases(catalog, catalog[2]).map(album => album.id)).toEqual([1, 2]);
  });
});
