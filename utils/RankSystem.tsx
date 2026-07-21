import React, { ReactNode } from 'react';

export type RankTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export interface RankInfo {
  tier: RankTier;
  color: string;
  glow: string;
  icon: ReactNode;
}

const BronzeIcon = () => (
  <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" style={{ display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-1px)' }} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#bronzeGrad)" stroke="#78350f" strokeWidth="1.5" />
    <path d="M12 2.5v18.5c5-2.5 7-7.5 7-9V5.5L12 2.5z" fill="#f59e0b" opacity="0.4" />
    <defs>
      <linearGradient id="bronzeGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
    </defs>
  </svg>
);

const SilverIcon = () => (
  <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" style={{ display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-1px)' }} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l2 11 8 4 8-4 2-11-10-5z" fill="url(#silverGrad)" stroke="#475569" strokeWidth="1.5" />
    <path d="M12 2v20c4.5-1.5 6.5-6.5 7.5-10.5L20 7l-8-5z" fill="#e2e8f0" opacity="0.4" />
    <circle cx="12" cy="11" r="3" fill="#ffffff" />
    <defs>
      <linearGradient id="silverGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
    </defs>
  </svg>
);

const GoldIcon = () => (
  <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" style={{ display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-1px)' }} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.5s7.5-3.5 7.5-9v-6L12 3.5 4.5 6.5v6c0 5.5 7.5 9 7.5 9z" fill="url(#goldGrad)" stroke="#b45309" strokeWidth="1.5" />
    <path d="M12 4v16.5c4-2 6-6 6-8V7.5L12 4z" fill="#fde047" opacity="0.5" />
    <path d="M12 8l2.5 3h3.5l-2.5 2.5 1 3.5-4-2.5-4 2.5 1-3.5-2.5-2.5h3.5L12 8z" fill="#ffffff" />
    <defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
  </svg>
);

const PlatinumIcon = () => (
  <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" style={{ display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-1px)' }} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l7 6-7 14L5 8l7-6z" fill="url(#platGrad)" stroke="#5b21b6" strokeWidth="1.5" />
    <path d="M12 2v20c3.5-6 6-11 6-14L12 2z" fill="#ddd6fe" opacity="0.4" />
    <path d="M12 2l4 6-4 3-4-3 4-6z" fill="#ffffff" opacity="0.8" />
    <defs>
      <linearGradient id="platGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
  </svg>
);

const DiamondIcon = () => (
  <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" style={{ display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-1px)' }} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22L2 9l5-6h10l5 6-10 13z" fill="url(#diaGrad)" stroke="#0369a1" strokeWidth="1.5" />
    <path d="M12 22l8-13H4l8 13z" fill="#38bdf8" opacity="0.5" />
    <path d="M12 3L7 9h10l-5-6z" fill="#ffffff" opacity="0.9" />
    <defs>
      <linearGradient id="diaGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
    </defs>
  </svg>
);

export function getRankFromRP(rp: number): RankInfo {
  if (rp >= 3600) {
    return { tier: "Diamond", color: "#38bdf8", glow: "rgba(56, 189, 248, 0.5)", icon: <DiamondIcon /> };
  } else if (rp >= 2800) {
    return { tier: "Platinum", color: "#a78bfa", glow: "rgba(167, 139, 250, 0.5)", icon: <PlatinumIcon /> };
  } else if (rp >= 1800) {
    return { tier: "Gold", color: "#fbbf24", glow: "rgba(251, 191, 36, 0.5)", icon: <GoldIcon /> };
  } else if (rp >= 1000) {
    return { tier: "Silver", color: "#94a3b8", glow: "rgba(148, 163, 184, 0.5)", icon: <SilverIcon /> };
  } else {
    return { tier: "Bronze", color: "#b45309", glow: "rgba(180, 83, 9, 0.5)", icon: <BronzeIcon /> };
  }
}
