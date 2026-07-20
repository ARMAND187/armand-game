"use client";

import React from "react";
import { X } from "lucide-react";

export function FullScreenOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#09090b",
        overflowY: "auto",
        paddingBottom: "100px",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "linear-gradient(to bottom, #09090b 80%, transparent)",
          padding: "max(env(safe-area-inset-top), 1rem) 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>{title}</h1>
        <button
          onClick={onClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <X size={20} />
        </button>
      </div>
      <div style={{ padding: "8px 16px" }}>{children}</div>
    </div>
  );
}
