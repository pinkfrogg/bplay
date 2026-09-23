import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rail = readFileSync(new URL("../components/ListeningRail.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("shared header texture", () => {
  it("confines the decorative surface to the crown-through-search header", () => {
    expect(rail).toContain('<div className="rail-header-surface"><header className="rail-brand"><span className="rail-header-ornament"');
    expect(rail).toContain("<HeaderWalkVideo />");
    expect(rail).toContain('className="rail-search"');
    expect(css).toContain(".rail-header-surface { position: relative; z-index: 1;");
    expect(rail).toContain('className="rail-header-ornament"');
    expect(css).toContain(".rail-header-ornament-skyline");
    expect(css).toContain(".rail-header-ornament-birds");
    expect(rail).toContain('className="rail-header-ornament-skyline"');
    expect(rail).toContain('className="rail-header-ornament-birds"');
    expect(rail).not.toContain('>PARIS</text>');
    expect(rail).not.toContain('rail-header-ornament-washes');
    expect(rail).not.toContain('rail-header-ornament-pastels');
    expect(css).toContain("inset: 0 0 -5px");
  });

  it("keeps the reference-inspired texture visible in evening dusk without obscuring header content", () => {
    expect(css).toContain(".rail-header-surface > :not(.rail-header-ornament) { position: relative; z-index: 1; }");
    expect(css).toContain(".rail-header-surface { position: relative; z-index: 1;");
    expect(css).toContain("background: transparent");
    expect(css).toContain(".rail-brand");
    expect(css).toContain(".rail-header-ornament");
    expect(css).toContain(".rail-header-surface { position: relative; z-index: 1;");
    expect(css).toContain("background: transparent");
  });
});
