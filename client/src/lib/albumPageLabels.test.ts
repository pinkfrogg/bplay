import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const albumPage = readFileSync(new URL("../pages/AlbumPage.tsx", import.meta.url), "utf8");
const stylesheet = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("album-page labels and navigation", () => {
  it("uses the concise Tracks heading and omits unselected-track helper copy", () => {
    expect(albumPage).toContain('id="album-tracklist-heading">Tracks</h2>');
    expect(albumPage).not.toContain("Lyrics appear after you select a track.");
  });

  it("presents the back navigation with the shared dusty-pink accent treatment", () => {
    expect(albumPage).toContain('className="album-back-link" href="/"');
    expect(stylesheet).toContain(".album-back-link { display: inline-flex; align-items: center");
    expect(stylesheet).toContain("background: linear-gradient(135deg, #d98a9d, var(--rosewood-blush)");
  });
});
