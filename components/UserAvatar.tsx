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
    <img 
      src={avatarUrl || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${fallbackSeed}`} 
      alt="Profile" 
      className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-900 object-cover"
    />
  );
}
