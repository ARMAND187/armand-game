"use client";

import { useWalletStore } from "@/store/useWalletStore";
import { Wallet } from "lucide-react";

export default function WalletDisplay() {
  const armandBalance = useWalletStore((s) => s.armandBalance);

  return (
    <div className="wallet-pill">
      <Wallet size={15} className="wallet-icon" />
      <span className="wallet-text">
        Armand Balance = <strong>{armandBalance.toLocaleString()}</strong>
      </span>
    </div>
  );
}
