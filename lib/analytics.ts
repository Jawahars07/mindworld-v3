// Thin wrapper around gtag so link components don't need to know GA4 exists,
// and clicks are still safe to fire before NEXT_PUBLIC_GA_ID is set (no-op).
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackClick(label: string, href: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "portfolio_link_click", {
    link_label: label,
    link_url: href,
  });
}
