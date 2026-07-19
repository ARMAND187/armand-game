"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata?: any;
}

export default function GlobalToaster() {
  const [toast, setToast] = useState<NotificationPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const channel = supabase
        .channel(`realtime:public:notifications`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as NotificationPayload;
            setToast(newNotif);
            
            // Auto hide after 10 seconds
            setTimeout(() => {
              setToast(null);
            }, 10000);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, []);

  if (!toast) return null;

  const handleAction = () => {
    setToast(null);
    if (toast.type === "match" && toast.metadata?.roomId) {
      router.push(`/lobby/${toast.metadata.gameId || 'geokurdistan'}?join=${toast.metadata.roomId}`);
    } else {
      router.push("/notifications");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      background: "var(--bg-elevated)",
      border: "1px solid var(--neon)",
      boxShadow: "0 8px 32px rgba(167, 139, 250, 0.2)",
      borderRadius: 16,
      padding: "16px 20px",
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      width: "90%",
      maxWidth: 400,
      animation: "slideDown 0.3s ease-out forwards",
    }}>
      <div style={{
        background: "rgba(167, 139, 250, 0.1)",
        padding: 10,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        <Bell size={20} color="var(--neon)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 4 }}>
          {toast.title}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.4 }}>
          {toast.body}
        </div>
        
        <div style={{ display: "flex", gap: 10 }}>
          {toast.type === "match" && (
            <button 
              onClick={handleAction}
              style={{
                flex: 1,
                background: "var(--neon)",
                color: "#000",
                border: "none",
                padding: "8px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Accept Invite
            </button>
          )}
          <button 
            onClick={() => setToast(null)}
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.05)",
              color: "white",
              border: "none",
              padding: "8px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
      
      <button 
        onClick={() => setToast(null)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          padding: 4,
          margin: "-8px -8px 0 0"
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
