let frame = 0;

/**
 * Scrolls the window to `top` with an eased animation. The browser's own smooth
 * scrolling is skipped on machines with animations turned off, so this runs it by hand.
 */
export function smoothScrollTo(top: number, duration = 700) {
  cancelAnimationFrame(frame);
  const from = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const to = Math.max(0, Math.min(top, max));
  const start = performance.now();

  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
  };
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    window.scrollTo({ top: from + (to - from) * eased, behavior: "instant" });
    if (t < 1) frame = requestAnimationFrame(step);
    else stop();
  };
  frame = requestAnimationFrame(step);
}
