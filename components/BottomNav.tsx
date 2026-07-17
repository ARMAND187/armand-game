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

  return (
    <nav className="bottom-nav">
      {tabs.map(({ href, label, icon: Icon, match }) => {
        const isActive = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item${isActive ? " active" : ""}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="bottom-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
