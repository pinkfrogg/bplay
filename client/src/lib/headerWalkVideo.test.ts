import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rail = readFileSync(new URL("../components/ListeningRail.tsx", import.meta.url), "utf8");
const video = readFileSync(new URL("../components/HeaderWalkVideo.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("header walking video", () => {
  it("keeps both directional passes preloaded and alternates them after every completed exit", () => {
    expect(rail).toContain("<HeaderWalkVideo />");
    expect(video).toContain("dreamhouse-walkers-cadence-locked-640_122fd97c.webm");
    expect(video).toContain("TURNAROUND_DELAY_MS = 500");
    expect(video).toContain("forwardRef");
    expect(video).toContain("reverseRef");
    expect(video).toContain("preload=\"auto\"");
    expect(video).toContain("isTurningRef.current");
    expect(video).toContain("setDirection((current) => (current === \"forward\" ? \"reverse\" : \"forward\"))");
    expect(video).toContain("onPlaying={forwardIsActive ? () => setIsPlaying(true) : undefined}");
    expect(video).toContain("onPlaying={reverseIsActive ? () => setIsPlaying(true) : undefined}");
    expect(video).toContain("onEnded={forwardIsActive ? continueFromSameEdge : undefined}");
    expect(video).toContain("onEnded={reverseIsActive ? continueFromSameEdge : undefined}");
    expect(video).toContain('aria-hidden="true"');
  });

  it("resets finite motion after each exit while retaining the compact 135px source-aligned pass", () => {
    expect(css).toContain("left: 50%; height: 135px; visibility: hidden; animation-duration: 24.5s; animation-fill-mode: both; animation-iteration-count: 1; animation-name: none; animation-play-state: paused; animation-timing-function: linear;");
    expect(css).toContain(".header-walk { position: absolute; right: 0; bottom: 0; left: 0; height: 150px; overflow: hidden; pointer-events: none; container-type: inline-size; }");
    expect(css).toContain(".header-walk-pass.is-active.is-playing { visibility: visible; animation-play-state: running; }");
    expect(css).toContain(".header-walk-pass--forward.is-playing { animation-name: header-walk-forward; }");
    expect(css).toContain(".header-walk-pass--reverse.is-playing { animation-name: header-walk-reverse; }");
    expect(css).toContain(".header-walk-pass.is-turning { visibility: hidden; }");
    expect(css).toContain("width: auto; height: 135px; object-fit: contain;");
    expect(css).toContain("44.897959%, 61.224490% { opacity: 1; transform: translateX(-50%);");
    expect(css).toContain("0% { opacity: 0; transform: translateX(calc(-50cqw - 100%)); }");
    expect(css).toContain("99.999% { opacity: 1; transform: translateX(50cqw); }");
    expect(css).toContain(".rail-brand { display: grid; justify-items: start; gap: 3px; padding-bottom: 112px;");
    expect(css).toContain(".rail-brand { padding-bottom: 150px; }");
    expect(css).toContain(".header-walk-pass, .header-walk-video { bottom: -1px; width: auto; height: 135px; object-fit: contain; }");
    expect(css).toContain(".header-walk-pass { display: none; animation: none; }");
  });
});
