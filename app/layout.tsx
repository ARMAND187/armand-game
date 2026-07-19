import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Armand Games",
  description:
    "A mobile-first gaming platform. Play GeoKurdistan and explore the Kurdistan Region.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Armand Games",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
};

import GlobalToaster from "@/components/GlobalToaster";
import { Suspense } from "react";
import UpdateNotification from "@/components/UpdateNotification";
import AuthProvider from "@/components/AuthProvider";
import PathTracker from "@/components/PathTracker";
import VerifyOverlay from "@/components/VerifyOverlay";

import { ThemeProvider } from "@/components/ThemeProvider";

const PWA_RESTORE_SCRIPT = `
  try {
    if (window.location.pathname === "/") {
      var saved = localStorage.getItem("pwa_last_path");
      if (saved) {
        var data = JSON.parse(saved);
        var NOW = Date.now();
        if (NOW - data.time < 2 * 60 * 60 * 1000 && data.path !== "/") {
          window.location.replace(data.path);
        }
      }
    }
  } catch(e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PWA_RESTORE_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <Suspense fallback={null}>
            <PathTracker />
          </Suspense>
          <AuthProvider />
          <UpdateNotification />
          <GlobalToaster />
          <VerifyOverlay />
          {/* Main scrollable area — padded so content clears the bottom nav */}
          <main className="app-shell">{children}</main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
