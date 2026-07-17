"use client";

import { LogOut } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="settings-menu-item"
      style={{
        borderBottom: "none",
        color: "#f87171",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        background: "transparent",
        fontFamily: "inherit",
      }}
    >
      <div className="settings-menu-left">
        <div
          className="profile-menu-icon"
          style={{ color: "#f87171", background: "rgba(248,113,113,0.08)" }}
        >
          <LogOut size={17} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Sign Out</div>
        </div>
      </div>
      <ChevronRight size={16} color="#f87171" />
    </button>
  );
}
