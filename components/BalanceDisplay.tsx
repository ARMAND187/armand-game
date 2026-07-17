"use client";
import { useWalletStore } from "@/store/useWalletStore";

/**
 * Thin client component — just reads armandBalance from Zustand
 * and renders the large display number on the home hero.
 */
export default function BalanceDisplay() {
  const armandBalance = useWalletStore((s) => s.armandBalance);
  return (
    <div className="balance-hero-value">
      {armandBalance.toLocaleString()}
    </div>
  );
}
