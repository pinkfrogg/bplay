import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const albumPage = readFileSync(new URL("../pages/AlbumPage.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const pixieTrail = readFileSync(new URL("../components/PixieTrail.tsx", import.meta.url), "utf8");

describe("collection atmosphere effects", () => {
  it("layers the decorative glitter on collection and album pages, with the shared pointer trail mounted for every route", () => {
    expect(home).toContain("<CollectionGlitter />");
    expect(albumPage).toContain("<CollectionGlitter />");
    expect(app).toContain("<PixieTrail />");
    expect(css).toContain(".collection-glitter");
    expect(css).toContain(".collection-glitter::before");
    expect(css).toContain(".pixie-particle");
    expect(css).toContain("mix-blend-mode: multiply");
    expect(css).toContain("mix-blend-mode: screen");
    expect(css).toContain("rgba(194,75,110,.58)");
  });

  it("uses falling glitter while honoring reduced-motion preferences", () => {
    expect(css).toContain("@keyframes glitter-fall");
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain(".pixie-trail { display: none; }");
  });

  it("uses a capped, fine-pointer comet-dust trail with directional drift while honoring motion preferences", () => {
    expect(pixieTrail).toContain("(hover: hover) and (pointer: fine)");
    expect(pixieTrail).toContain("prefers-reduced-motion: reduce");
    expect(pixieTrail).toContain("MAX_PARTICLES = 20");
    expect(pixieTrail).toContain("PARTICLE_LIFETIME_MS = 1450");
    expect(pixieTrail).toContain("MIN_INTERVAL_MS = 38");
    expect(pixieTrail).toContain("--pixie-angle");
    expect(pixieTrail).toContain("--pixie-tail-length");
    expect(css).toContain("@keyframes comet-dust-fade");
    expect(css).toContain("linear-gradient(90deg");
    expect(css).toContain(".pixie-particle::before");
    expect(pixieTrail).toContain('window.addEventListener("pointermove"');
  });
});
