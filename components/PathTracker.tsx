"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Track the last time the user physically touched or clicked the app.
// If the route changes to "/" without a recent interaction, we know the OS forced it!
let lastInteractionTime = 0;
if (typeof window !== "undefined") {
  const updateInteraction = () => { lastInteractionTime = Date.now(); };
  window.addEventListener("touchstart", updateInteraction, { passive: true });
  window.addEventListener("mousedown", updateInteraction, { passive: true });
  window.addEventListener("keydown", updateInteraction, { passive: true });
}

export default function PathTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (typeof window !== "undefined") {
      if (pathname.startsWith("/auth")) return;

      const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      const timeSinceLastInteraction = Date.now() - lastInteractionTime;
      
      // If iOS soft-resumes to Home ("/") but the user hasn't touched the screen in over 1.5 seconds,
      // it means the OS forced the navigation!
      if (pathname === "/" && timeSinceLastInteraction > 1500) {
        const saved = localStorage.getItem("pwa_last_path");
        if (saved) {
          try {
            const { path, time } = JSON.parse(saved);
            const NOW = Date.now();
            
            // Restore the state if it's less than 2 hours old and not Home
            if (NOW - time < 2 * 60 * 60 * 1000 && path !== "/") {
              // We use window.location.replace to prevent adding the unwanted Home page to browser history
              window.location.replace(path);
              return;
            }
          } catch (e) {}
        }
      }
      
      localStorage.setItem("pwa_last_path", JSON.stringify({ path: currentPath, time: Date.now() }));
    }
  }, [pathname, searchParams]);

  return null;
}
