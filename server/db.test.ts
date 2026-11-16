import { describe, expect, it } from "vitest";
import { buildCatalogAlbumUpdate } from "./db";

describe("catalog album partial updates", () => {
  it("preserves sort order and discography visibility when an artwork update omits them", () => {
    const savedAlbum = { title: "Original", sortOrder: 6, isHiddenFromDiscography: 1 };
    const update = buildCatalogAlbumUpdate({ title: "Artwork update" });

    expect({ ...savedAlbum, ...update }).toEqual({
      title: "Artwork update",
      sortOrder: 6,
      isHiddenFromDiscography: 1,
    });
  });
});
