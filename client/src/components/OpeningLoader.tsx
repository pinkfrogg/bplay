import { useEffect, useState } from "react";
import PrincessCrown from "./PrincessCrown";

export const OPENING_GATHER_DURATION_MS = 2300;
export const OPENING_EXIT_DURATION_MS = 560;
export const OPENING_PIANO_START_AT_MS = 60;
export const OPENING_CROWN_COMPLETE_AT_MS = 2230;

/** A soft, synthesized piano phrase for the user-initiated preview replay. */
export function scheduleOpeningPiano(startDelayMs = OPENING_PIANO_START_AT_MS) {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return false;

  try {
    const context = new AudioContextConstructor();
    void context.resume();
    const startAt = context.currentTime + startDelayMs / 1000;
    const phrase = [
      { frequency: 261.63, offset: 0, duration: 0.56, volume: 0.034 },
      { frequency: 329.63, offset: 0.33, duration: 0.54, volume: 0.03 },
      { frequency: 392, offset: 0.67, duration: 0.5, volume: 0.027 },
      { frequency: 523.25, offset: 1, duration: 0.5, volume: 0.024 },
      { frequency: 659.25, offset: 1.32, duration: 0.46, volume: 0.02 },
      { frequency: 783.99, offset: 1.66, duration: 0.51, volume: 0.016 },
    ];

    phrase.forEach(({ frequency, offset, duration, volume }) => {
      const noteStart = startAt + offset;
      const noteEnd = noteStart + duration;

      [
        { harmonic: 1, level: 1 },
        { harmonic: 2, level: 0.19 },
        { harmonic: 3.01, level: 0.07 },
      ].forEach(({ harmonic, level }) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency * harmonic, noteStart);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(volume * level, noteStart + 0.014);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteEnd);
      });
    });

    window.setTimeout(() => void context.close(), OPENING_CROWN_COMPLETE_AT_MS + 300);
    return true;
  } catch {
    return false;
  }
}

export default function OpeningLoader() {
  const [phase, setPhase] = useState<"gathering" | "leaving">("gathering");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gatherFor = reducedMotion ? 120 : OPENING_GATHER_DURATION_MS;
    const exitFor = reducedMotion ? 1 : OPENING_EXIT_DURATION_MS;
    if (!reducedMotion) scheduleOpeningPiano();
    const beginExit = window.setTimeout(() => setPhase("leaving"), gatherFor);
    const finish = window.setTimeout(() => setVisible(false), gatherFor + exitFor);
    return () => {
      window.clearTimeout(beginExit);
      window.clearTimeout(finish);
    };
  }, []);

  if (!visible) return null;

  return <div className="opening-loader" data-phase={phase} role="status" aria-label="Opening Studio Pavilion">
    <span className="sr-only">Opening Studio Pavilion</span>
    <div className="opening-loader-glow" aria-hidden="true" />
    <div className="opening-loader-fragments" aria-hidden="true">
      <span className="loader-fragment loader-note loader-note--one">♪</span>
      <span className="loader-fragment loader-note loader-note--two">♫</span>
      <span className="loader-fragment loader-note loader-note--three">♪</span>
      <span className="loader-fragment loader-note loader-note--four">♫</span>
      <span className="loader-fragment loader-note loader-note--five">♪</span>
      <span className="loader-fragment loader-note loader-note--six">♫</span>
      <span className="loader-fragment loader-note loader-note--seven">♪</span>
      <span className="loader-fragment loader-note loader-note--eight">♫</span>
      <span className="loader-fragment loader-spark loader-spark--one">✦</span>
      <span className="loader-fragment loader-spark loader-spark--two">✦</span>
      <span className="loader-fragment loader-spark loader-spark--three">✦</span>
      <span className="loader-fragment loader-spark loader-spark--four">✦</span>
      <span className="loader-fragment loader-spark loader-spark--five">✦</span>
      <span className="loader-fragment loader-spark loader-spark--six">✦</span>
      <span className="loader-fragment loader-spark loader-spark--seven">✦</span>
      <span className="loader-fragment loader-spark loader-spark--eight">✦</span>
    </div>
    <PrincessCrown className="opening-loader-crown" />
  </div>;
}
