"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export default function UpdateNotification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // This fires when the service worker controlling this page
        // changes, eg a new worker has skipped waiting and become active.
        setShow(true);
      });

      // Aggressively check for updates when the app comes into focus
      const checkForUpdates = () => {
        navigator.serviceWorker.ready.then((reg) => {
          console.log("Service Worker: Checking for updates...");
          reg.update();
        });
      };

      // Check on visibility change (user switching tabs/apps back)
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          checkForUpdates();
        }
      });

      // Check on window focus
      window.addEventListener("focus", checkForUpdates);

      // Initial check on mount
      checkForUpdates();
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between bg-zinc-900 border border-purple-500/50 shadow-2xl shadow-purple-900/20 rounded-xl p-4 animate-in slide-in-from-bottom-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-zinc-100 font-bold text-sm flex items-center gap-2">
          <RefreshCw size={16} className="text-purple-400" />
          Update Available
        </h3>
        <p className="text-zinc-400 text-xs">
          A new version of Armand Games is available!
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShow(false)}
          className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X size={18} />
        </button>
        <button
          onClick={handleUpdate}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}
