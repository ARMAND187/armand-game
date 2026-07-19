"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PathTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (pathname.startsWith("/auth")) return;

      const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      
      // Save current path for next time iOS suspends the app.
      // Note: The actual redirect logic is handled synchronously in app/layout.tsx
      // via a blocking <script> to prevent UI flickering.
      localStorage.setItem("pwa_last_path", JSON.stringify({ path: currentPath, time: Date.now() }));
    }
  }, [pathname, searchParams]);

  return null;
}
