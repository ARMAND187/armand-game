"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Users, Trophy, User } from "lucide-react";

const tabs = [
  { href: "/",            label: "Home",    icon: Home,     match: (p: string) => p === "/" },
  { href: "/games",       label: "Games",   icon: Gamepad2, match: (p: string) => p === "/games" || p.startsWith("/lobby") || p.startsWith("/play") },
  { href: "/friends",     label: "Friends", icon: Users,    match: (p: string) => p.startsWith("/friends") },
  { href: "/leaderboard", label: "Ranks",   icon: Trophy,   match: (p: string) => p.startsWith("/leaderboard") },
  { href: "/profile",     label: "Profile", icon: User,     match: (p: string) => p.startsWith("/profile") || p.startsWith("/settings") || p.startsWith("/notifications") || p.startsWith("/redeem") },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide entirely on auth pages
  if (pathname.startsWith("/auth")) return null;

  return (
    <nav className="bottom-nav pb-[max(env(safe-area-inset-bottom),1rem)]">
      {tabs.map(({ href, label, icon: Icon, match }) => {
        const isActive = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            className={`bottom-nav-item${isActive ? " active" : ""}`}
            style={{ position: 'relative' }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} style={{ zIndex: 2 }} />
            <span className="bottom-nav-label" style={{ zIndex: 2 }}>{label}</span>
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: -8,
                width: 24,
                height: 4,
                borderRadius: 2,
                background: 'var(--neon)',
                boxShadow: '0 0 10px var(--neon), 0 0 20px var(--neon)',
                animation: 'slide-up-fade 0.2s ease-out'
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
