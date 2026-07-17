"use client";

import { useEffect } from "react";

export default function PWAUpdater() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // This fires when the service worker controlling this page
        // changes, eg a new worker has skipped waiting and become active.
        const confirmUpdate = window.confirm(
          "A new update for Armand Games is available! Click OK to refresh and apply the update."
        );
        if (confirmUpdate) {
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
