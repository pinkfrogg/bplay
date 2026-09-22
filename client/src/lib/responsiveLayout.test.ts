import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("responsive public layout", () => {
  it("anchors the mobile header walker below the brand while preserving native video proportions", () => {
    expect(css).toContain(".collection-rail { padding: 14px 20px 18px; }");
    expect(css).toContain(".rail-brand { padding-bottom: 112px; }");
    expect(css).toContain(".header-walk { right: 0; bottom: 0; left: 0; height: 112px; }");
    expect(css).toContain(".header-walk-pass, .header-walk-video { bottom: -1px; width: auto; height: 135px; object-fit: contain; }");
    expect(css).toContain(".rail-search { margin-top: 4px; }");
  });

  it("keeps narrow transport controls and album packages contained instead of squeezed or overlapping", () => {
    expect(css).toContain(".transport { position: relative; width: 100%; min-width: 0; box-sizing: border-box;");
    expect(css).toContain(".control-row { display: flex; justify-content: center; gap: 11px; }");
    expect(css).toContain(".volume-control { display: none; }");
    expect(css).toContain(".album-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }");
    expect(css).toContain(".album-card, .album-card:hover, .album-card:focus-visible, .album-card:focus-within { min-height: 190px; overflow: hidden; isolation: isolate; }");
    expect(css).toContain(".album-card-copy { position: absolute; z-index: 4;");
    expect(css).toContain(".dvd-case { left: 11px; top: 13px; width: 72px; height: 95px; }");
    expect(css).toContain(".album-disc { right: 10px; top: 15px; width: 90px; transform: translateX(-34px) rotate(-4deg); }");
  });
});
