import { useEffect, useRef, useState } from "react";

const WALKING_ASSETS = {
  forward: "/manus-storage/dreamhouse-walkers-cadence-locked-640_78c5c681.webm",
  reverse: "/manus-storage/dreamhouse-walkers-cadence-locked-640_78c5c681.webm",
} as const;
const HEADER_WALK_POSTER = "/manus-storage/dreamhouse-walkers-poster_5f638e33.png";
const TURNAROUND_DELAY_MS = 500;

type WalkDirection = keyof typeof WALKING_ASSETS;

/**
 * Both clips remain preloaded. Each finite CSS traversal is reset by removing
 * its animation name after exit, allowing the same directional pass to start
 * cleanly on every return without a download or terminal-animation freeze.
 */
export default function HeaderWalkVideo() {
  const forwardRef = useRef<HTMLVideoElement>(null);
  const reverseRef = useRef<HTMLVideoElement>(null);
  const turnaroundTimerRef = useRef<number | null>(null);
  const isTurningRef = useRef(false);
  const [direction, setDirection] = useState<WalkDirection>("forward");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTurning, setIsTurning] = useState(false);

  useEffect(() => {
    const activeVideo = direction === "forward" ? forwardRef.current : reverseRef.current;
    if (!activeVideo) return;

    setIsPlaying(false);
    setIsTurning(false);
    activeVideo.pause();
    activeVideo.currentTime = 0;
    void activeVideo.play().catch(() => undefined);

    return () => activeVideo.pause();
  }, [direction]);

  useEffect(
    () => () => {
      if (turnaroundTimerRef.current !== null) {
        window.clearTimeout(turnaroundTimerRef.current);
      }
    },
    [],
  );

  const continueFromSameEdge = () => {
    if (isTurningRef.current) return;

    isTurningRef.current = true;
    setIsPlaying(false);
    setIsTurning(true);
    turnaroundTimerRef.current = window.setTimeout(() => {
      turnaroundTimerRef.current = null;
      isTurningRef.current = false;
      setDirection((current) => (current === "forward" ? "reverse" : "forward"));
    }, TURNAROUND_DELAY_MS);
  };

  const forwardIsActive = direction === "forward";
  const reverseIsActive = direction === "reverse";

  return (
    <div className="header-walk" aria-hidden="true">
      <div
        className={`header-walk-pass header-walk-pass--forward${forwardIsActive ? " is-active" : ""}${forwardIsActive && isPlaying ? " is-playing" : ""}${forwardIsActive && isTurning ? " is-turning" : ""}`}
      >
        <div className="header-walk-facing">
          <video
            ref={forwardRef}
            className="header-walk-video"
            src={WALKING_ASSETS.forward}
            poster={HEADER_WALK_POSTER}
            muted
            playsInline
            preload="auto"
            onPlaying={forwardIsActive ? () => setIsPlaying(true) : undefined}
            onEnded={forwardIsActive ? continueFromSameEdge : undefined}
          />
        </div>
      </div>
      <div
        className={`header-walk-pass header-walk-pass--reverse${reverseIsActive ? " is-active" : ""}${reverseIsActive && isPlaying ? " is-playing" : ""}${reverseIsActive && isTurning ? " is-turning" : ""}`}
      >
        <div className="header-walk-facing">
          <video
            ref={reverseRef}
            className="header-walk-video"
            src={WALKING_ASSETS.reverse}
            poster={HEADER_WALK_POSTER}
            muted
            playsInline
            preload="auto"
            onPlaying={reverseIsActive ? () => setIsPlaying(true) : undefined}
            onEnded={reverseIsActive ? continueFromSameEdge : undefined}
          />
        </div>
      </div>
    </div>
  );
}
