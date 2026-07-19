"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PathTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Avoid tracking auth routes so we don't accidentally restore a login/signup page loop
      if (pathname.startsWith("/auth")) return;

      const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      
      // We use sessionStorage to flag if this specific tab/app session has booted
      const hasBooted = sessionStorage.getItem("pwa_booted");
      
      if (!hasBooted && pathname === "/") {
        // App just cold-booted to the home page (e.g. from PWA icon or iOS Safari resuming)
        const saved = localStorage.getItem("pwa_last_path");
        if (saved) {
          try {
            const { path, time } = JSON.parse(saved);
            const NOW = Date.now();
            
            // If the saved path is from the last 2 hours, and it's not the home page
            if (NOW - time < 2 * 60 * 60 * 1000 && path !== "/") {
              sessionStorage.setItem("pwa_booted", "true");
              window.location.href = path; // Hard redirect to restore state
              return;
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }

      // Mark as booted so we don't infinitely redirect if they manually click the Home button
      sessionStorage.setItem("pwa_booted", "true");
      
      // Save current path for next time iOS suspends the app
      localStorage.setItem("pwa_last_path", JSON.stringify({ path: currentPath, time: Date.now() }));
    }
  }, [pathname, searchParams]);

  return null;
}
