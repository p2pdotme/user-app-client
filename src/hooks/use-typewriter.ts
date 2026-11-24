import { useEffect, useMemo, useState } from "react";

const TYPE_MS = 70;
const HOLD_MS = 2600;
const RESTART_MS = 500;

/** Split into user-perceived characters so combining marks (e.g. Hindi) stay intact. */
export function splitGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter().segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Types `text` out one character at a time, holds, then starts over.
 * Returns the full text immediately when the user prefers reduced motion.
 */
export function useTypewriter(text: string): string {
  const graphemes = useMemo(() => splitGraphemes(text), [text]);
  const [count, setCount] = useState(0);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const done = count >= graphemes.length;
    const delay = done ? HOLD_MS : count === 0 ? RESTART_MS : TYPE_MS;
    const id = setTimeout(() => setCount(done ? 0 : count + 1), delay);
    return () => clearTimeout(id);
  }, [count, graphemes, reducedMotion]);

  return reducedMotion ? text : graphemes.slice(0, count).join("");
}
