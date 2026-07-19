import { createClient } from "@/utils/supabase/server";
import { Megaphone, Activity } from "lucide-react";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function NewsBoard() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  let broadcasts: any[] = [];
  
  if (userData?.user) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "system")
      .eq("receiver_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(10);
      
    if (data) broadcasts = data;
  }

  if (broadcasts.length === 0) {
    return (
      <div className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-zinc-500">
        <Activity size={32} className="mb-2 opacity-50" />
        <p>No recent broadcasts</p>
      </div>
    );
  }

  const hero = broadcasts[0];
  const patches = broadcasts.slice(1);

  return (
    <div className="flex flex-col h-full w-full max-h-[600px]">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Megaphone size={18} className="text-purple-400" />
        <h2 className="text-lg font-bold text-white m-0">Global Broadcasts</h2>
      </div>

      {/* The Hero Card */}
      <div 
        className="relative bg-zinc-900 border rounded-2xl p-5 mb-4 shrink-0 overflow-hidden"
        style={{
          borderColor: "var(--neon)",
          boxShadow: "0 0 20px var(--neon-glow)",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-transparent opacity-50" />
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white m-0 leading-tight">
            {hero.title}
          </h3>
          <span className="text-xs font-semibold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md whitespace-nowrap ml-3">
            Featured
          </span>
        </div>
        <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
          {hero.body}
        </p>
        <div className="text-xs text-zinc-500 mt-4 font-mono">
          {formatTime(hero.created_at)}
        </div>
      </div>

      {/* The Patch List */}
      <div className="flex-1 overflow-y-auto pr-2 news-scrollbar flex flex-col gap-3">
        {patches.map((patch) => (
          <div 
            key={patch.id} 
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 transition-colors hover:bg-zinc-900 hover:border-zinc-700"
          >
            <h4 className="text-base font-bold text-zinc-100 m-0 mb-1 leading-snug">
              {patch.title}
            </h4>
            <p className="text-zinc-400 text-sm leading-relaxed mb-3">
              {patch.body}
            </p>
            <div className="text-xs text-zinc-600 font-mono">
              {formatTime(patch.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
