// Programmatic travel along the scroll runway. Everything that moves the camera
// does it by scrolling the page — ScrollDriver stays the single source of truth.
// One active tween at a time; any real user input cancels it.

let raf = 0;
let cancelFns: (() => void)[] = [];

export function cancelTravel() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  for (const off of cancelFns) off();
  cancelFns = [];
}

function maxScroll() {
  return document.documentElement.scrollHeight - window.innerHeight;
}

export function progressToY(p: number) {
  return maxScroll() * Math.min(Math.max(p, 0), 1);
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Tween scroll to a progress point. Resolves true if it arrived, false if
// cancelled (user grabbed the wheel). Duration scales gently with distance.
export function travelTo(
  p: number,
  opts: { duration?: number; onCancel?: () => void } = {}
): Promise<boolean> {
  cancelTravel();
  const from = window.scrollY;
  const to = progressToY(p);
  const dist = Math.abs(to - from) / Math.max(maxScroll(), 1);
  const duration = opts.duration ?? Math.max(800, Math.min(4000, dist * 9000));
  const t0 = performance.now();

  return new Promise((resolve) => {
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
      cancelTravel();
      opts.onCancel?.();
      resolve(false);
    };
    const onInput = () => cancel();
    window.addEventListener("wheel", onInput, { passive: true });
    window.addEventListener("touchmove", onInput, { passive: true });
    cancelFns.push(() => {
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchmove", onInput);
    });

    const step = (now: number) => {
      if (cancelled) return;
      const t = Math.min((now - t0) / duration, 1);
      window.scrollTo(0, from + (to - from) * easeInOut(t));
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        cancelTravel();
        resolve(true);
      }
    };
    raf = requestAnimationFrame(step);
  });
}
