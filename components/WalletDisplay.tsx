"use client";

import { useWalletStore } from "@/store/useWalletStore";
import { Wallet } from "lucide-react";
import { useEffect } from "react";

export default function WalletDisplay() {
  const armandBalance = useWalletStore((s) => s.armandBalance);
  const setBalance = useWalletStore((s) => s.setBalance);

  useEffect(() => {
    const syncBalance = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();
        if (profile?.balance !== undefined) {
          setBalance(profile.balance);
        }
      }
    };
    syncBalance();
  }, [setBalance]);

  return (
    <div className="wallet-pill">
      <Wallet size={15} className="wallet-icon" />
      <span className="wallet-text">
        <span className="hidden sm:inline">Balance = </span><strong>{armandBalance.toLocaleString()}</strong>
      </span>
    </div>
  );
}
