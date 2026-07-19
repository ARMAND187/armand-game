"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Module-level variable persists across client-side navigations
// but completely resets on a hard browser reload or PWA cold boot.
let isInitialLoad = true;

export default function PathTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Avoid tracking auth routes so we don't accidentally restore a login/signup page loop
      if (pathname.startsWith("/auth")) return;

      const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      
      if (isInitialLoad && pathname === "/") {
        // App just cold-booted (or was forced to start_url by iOS)
        const saved = localStorage.getItem("pwa_last_path");
        if (saved) {
          try {
            const { path, time } = JSON.parse(saved);
            const NOW = Date.now();
            
            // If the saved path is from the last 2 hours, and it's not the home page
            if (NOW - time < 2 * 60 * 60 * 1000 && path !== "/") {
              isInitialLoad = false;
              window.location.href = path; // Hard redirect to restore state
              return;
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }

      // Mark as booted so we don't infinitely redirect if they manually click the Home button
      isInitialLoad = false;
      
      // Save current path for next time iOS suspends the app
      localStorage.setItem("pwa_last_path", JSON.stringify({ path: currentPath, time: Date.now() }));
    }
  }, [pathname, searchParams]);

  return null;
}
