import { describe, expect, it } from "vitest";
import { albumIdFromRouteParam, albumPath } from "./catalogRoutes";

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
});
