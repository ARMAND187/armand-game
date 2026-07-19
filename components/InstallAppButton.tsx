"use client";

import { useEffect, useState } from "react";
import { Smartphone, ChevronRight } from "lucide-react";

export default function InstallAppButton() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Install prompt not ready! You may have already installed the app, or you need to completely clear your Chrome cache so it sees the new manifest icons.");
    }
  };

  return (
    <button 
      onClick={handleInstall} 
      className="w-full flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors text-left"
    >
      <div className="flex items-center gap-4">
        <div className="bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/20 text-purple-400">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-200 font-medium text-sm">Install the App to Home screen</span>
          <span className="text-zinc-500 text-xs mt-0.5">Install the app for the full experience</span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-zinc-600" />
    </button>
  );
}
