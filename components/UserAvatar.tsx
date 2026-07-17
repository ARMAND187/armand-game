"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function UserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("AG");
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsername(user.user_metadata?.username || "AG");
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
          
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      }
    };
    fetchUser();
  }, [supabase.auth, supabase]);

  const fallbackSeed = username !== "AG" ? username : "guest";

  return (
    <div 
      style={{ 
        width: "36px", height: "36px", borderRadius: "50%", 
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.1)", background: "var(--bg-elevated)", flexShrink: 0
      }}
    >
      <img 
        src={avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${fallbackSeed}`} 
        alt="Avatar" 
        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
      />
    </div>
  );
}
