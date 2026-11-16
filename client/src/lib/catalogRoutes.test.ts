import { describe, expect, it } from "vitest";
import { albumIdFromRouteParam, albumPath, relatedReleasesForAlbum, type CatalogAlbum, visibleDiscographyAlbums } from "./catalogRoutes";

const release = (id: number, relatedGroupId: string | null, isHiddenFromDiscography = 0): CatalogAlbum => ({
  id,
  title: `Release ${id}`,
  coverImage: `cover-${id}.jpg`,
  vinylImage: null,
  sortOrder: id,
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

  it("shows all other members of the current group, but never the current release", () => {
    const catalog = [release(1, "group"), release(2, "group"), release(3, "group"), release(4, null)];

    expect(relatedReleasesForAlbum(catalog, catalog[1])).toEqual([catalog[0], catalog[2]]);
    expect(relatedReleasesForAlbum(catalog, catalog[3])).toEqual([]);
  });

  it("excludes hidden related releases from the homepage discography", () => {
    const catalog = [release(1, null), release(2, "group", 1)];

    expect(visibleDiscographyAlbums(catalog)).toEqual([catalog[0]]);
  });
});
