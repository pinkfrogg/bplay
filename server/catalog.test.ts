import { describe, expect, it } from "vitest";
import { groupCatalog, makeTrackOrder } from "./catalog";

describe("public catalog grouping", () => {
  it("keeps every track attached to its matching curated album", () => {
    const catalog = groupCatalog(
      [{ id: 8, title: "Swan Lake", coverImage: "cover.jpg", releaseYear: 2004, sortOrder: 0 }],
      [{ id: 3, albumId: 8, title: "Theme", artist: "Soundtrack", audioUrl: "https://example.com/theme.mp3", lrcUrl: "https://example.com/theme.lrc", sortOrder: 0, lyrics: null }],
    );
    expect(catalog).toEqual([{ id: 8, title: "Swan Lake", coverImage: "cover.jpg", releaseYear: 2004, sortOrder: 0, relatedGroupId: null, isHiddenFromDiscography: 0, tracks: [{ id: 3, albumId: 8, title: "Theme", artist: "Soundtrack", audioUrl: "https://example.com/theme.mp3", lrcUrl: "https://example.com/theme.lrc", sortOrder: 0, lyrics: [] }] }]);
  });

  it("preserves related release grouping and homepage visibility", () => {
    const [album] = groupCatalog(
      [{ id: 8, title: "Swan Lake", coverImage: "cover.jpg", sortOrder: 0, relatedGroupId: "related-group", isHiddenFromDiscography: 1 }],
      [],
    );
    expect(album).toMatchObject({ relatedGroupId: "related-group", isHiddenFromDiscography: 1, tracks: [] });
  });

  it("assigns consecutive saved positions from a drag-and-drop order", () => {
    expect(makeTrackOrder([14, 3, 8])).toEqual([
      { id: 14, sortOrder: 0 },
      { id: 3, sortOrder: 1 },
      { id: 8, sortOrder: 2 },
    ]);
  });
});
