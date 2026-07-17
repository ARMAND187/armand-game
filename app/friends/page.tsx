"use client";

import { useState } from "react";
import { useWalletStore } from "@/store/useWalletStore";
import {
  UserPlus, Check, X, Search, Users, Bell, Settings,
  ChevronRight, Clock, Shield,
} from "lucide-react";

// Mock friend data — replace with Supabase queries
const MOCK_FRIENDS = [
  { id: "1", username: "soran_k",   displayName: "Soran K.",  online: true,  score: 12450 },
  { id: "2", username: "dilan_h",   displayName: "Dilan H.",  online: false, score: 11200 },
  { id: "3", username: "hana_b",    displayName: "Hana B.",   online: true,  score: 9870  },
  { id: "4", username: "rayan_m",   displayName: "Rayan M.",  online: false, score: 8640  },
];

const MOCK_REQUESTS = [
  { id: "5", username: "lavin_a", displayName: "Lavin A." },
  { id: "6", username: "kawa_z",  displayName: "Kawa Z."  },
];

type Tab = "friends" | "requests";

export default function FriendsPage() {
  const [tab, setTab]             = useState<Tab>("friends");
  const [query, setQuery]         = useState("");
  const [addValue, setAddValue]   = useState("");
  const [requests, setRequests]   = useState(MOCK_REQUESTS);
  const [addFeedback, setAddFeedback] = useState<string | null>(null);

  const filtered = MOCK_FRIENDS.filter(
    (f) =>
      f.displayName.toLowerCase().includes(query.toLowerCase()) ||
      f.username.toLowerCase().includes(query.toLowerCase())
  );

  const handleAdd = () => {
    const trimmed = addValue.trim();
    if (!trimmed) return;
    setAddFeedback(`Request sent to @${trimmed}!`);
    setAddValue("");
    setTimeout(() => setAddFeedback(null), 3000);
  };

  const handleAccept = (id: string) =>
    setRequests((r) => r.filter((req) => req.id !== id));
  const handleReject = (id: string) =>
    setRequests((r) => r.filter((req) => req.id !== id));

  return (
    <div className="page-shell">
      <h1 className="page-header">Friends</h1>
      <p className="page-subtitle">Connect and compete</p>

      {/* ── Add Friend ── */}
      <div className="add-friend-bar">
        <UserPlus size={16} color="var(--neon)" style={{ flexShrink: 0 }} />
        <input
          className="add-friend-input"
          placeholder="Add by username…"
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="add-friend-btn" onClick={handleAdd} id="add-friend-btn">
          Add
        </button>
      </div>
      {addFeedback && (
        <p style={{ fontSize: 12, color: "#4ade80", marginBottom: 12, paddingLeft: 4 }}>
          ✓ {addFeedback}
        </p>
      )}

      {/* ── Tabs ── */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button
          className={`tab-btn${tab === "friends" ? " active" : ""}`}
          onClick={() => setTab("friends")}
        >
          <Users size={14} /> Friends ({MOCK_FRIENDS.length})
        </button>
        <button
          className={`tab-btn${tab === "requests" ? " active" : ""}`}
          onClick={() => setTab("requests")}
        >
          <Bell size={14} />
          Requests
          {requests.length > 0 && (
            <span className="tab-badge">{requests.length}</span>
          )}
        </button>
      </div>

      {/* ── Friends list ── */}
      {tab === "friends" && (
        <>
          <div className="search-bar" style={{ marginBottom: 14 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              className="search-input"
              placeholder="Search friends…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Users size={28} color="var(--text-muted)" />
              <span>No friends found</span>
            </div>
          ) : (
            filtered.map((friend) => (
              <div key={friend.id} className="friend-row">
                <div className="friend-avatar">
                  {friend.displayName[0]}
                  <span className={`online-dot${friend.online ? " online-dot--on" : ""}`} />
                </div>
                <div className="friend-info">
                  <div className="friend-name">{friend.displayName}</div>
                  <div className="friend-handle">
                    @{friend.username}
                    <span style={{ color: friend.online ? "#4ade80" : "var(--text-muted)", marginLeft: 6 }}>
                      {friend.online ? "● Online" : "○ Offline"}
                    </span>
                  </div>
                </div>
                <div className="friend-score">{friend.score.toLocaleString()}</div>
              </div>
            ))
          )}
        </>
      )}

      {/* ── Requests list ── */}
      {tab === "requests" && (
        <>
          {requests.length === 0 ? (
            <div className="empty-state">
              <Check size={28} color="var(--text-muted)" />
              <span>No pending requests</span>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="request-row">
                <div className="friend-avatar">{req.displayName[0]}</div>
                <div className="friend-info">
                  <div className="friend-name">{req.displayName}</div>
                  <div className="friend-handle">@{req.username}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="req-btn req-btn--accept"
                    onClick={() => handleAccept(req.id)}
                    id={`accept-${req.id}`}
                    title="Accept"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="req-btn req-btn--reject"
                    onClick={() => handleReject(req.id)}
                    id={`reject-${req.id}`}
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
