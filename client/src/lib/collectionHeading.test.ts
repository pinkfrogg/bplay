import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("public collection heading", () => {
  it("uses the concise Choose a sleeve heading", () => {
    expect(home).toContain('catalog.length ? "Choose a sleeve"');
    expect(home).not.toContain("Choose a sleeve. Let it play.");
  });
});
