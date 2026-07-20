"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, Users, Send, Loader2, ArrowLeft, Trash2, Edit2, ListOrdered, UploadCloud, Target, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getRankFromRP } from "@/utils/RankSystem";
import { adminToggleStatus } from "@/app/actions/admin";
import { OnlinePlayersModal } from "@/components/OnlinePlayersModal";
import { ShopManagementModal } from "@/components/ShopManagementModal";
import { AdminSpecialItemsPanel } from "@/components/AdminSpecialItemsPanel";
import { AdminPlayerInventoryPanel } from "@/components/AdminPlayerInventoryPanel";
import { AdminChallengePanel } from "@/components/AdminChallengePanel";

const AdminDashboardStats = dynamic(() => import("@/components/AdminDashboardStats"), {
  ssr: false,
  loading: () => <div style={{ height: 110, width: "100%", background: "var(--bg-card)", borderRadius: 16, marginBottom: 24, display: "flex", justifyContent: "center", alignItems: "center" }}><Loader2 className="mly-spinner" color="var(--neon)" /></div>
});

interface Profile {
  id: string;
  username: string;
  wins: number;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
  rp: number;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalLocations, setTotalLocations] = useState(0);
  const [userLimit, setUserLimit] = useState<number | "All">("All");
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showSpecialItems, setShowSpecialItems] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showPlayerInventory, setShowPlayerInventory] = useState(false);

  // Notification states
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifType, setNotifType] = useState("broadcast");
  const [notifImageUrl, setNotifImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifStatus, setNotifStatus] = useState("");

  const [bulkJson, setBulkJson] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadingLocations, setUploadingLocations] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Check if user is admin
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error checking admin status:", error);
      // Don't redirect on transient network errors
      if (error.code !== "PGRST116") {
        setIsAdmin(true); // Assume admin to prevent kicking out if they were already here
        fetchData();
        return;
      }
    }

    if (!profile?.is_admin) {
      router.replace("/profile");
      return;
    }

    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    const [{ data: pData }, { count: locCount }] = await Promise.all([
      supabase.from("profiles").select("*").order("is_verified", { ascending: false }).order("rp", { ascending: false }),
      supabase.from("locations").select("*", { count: "exact", head: true })
    ]);
    
    if (pData) {
      setProfiles(pData as Profile[]);
      setTotalUsers(pData.length);
    }
    if (locCount !== null) {
      setTotalLocations(locCount);
    }
    setLoading(false);
  };

  const handleSendGlobalNotif = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setSendingNotif(true);
    setNotifStatus("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Send to all users
    const inserts = profiles.map(p => ({
      receiver_id: p.id,
      sender_id: user.id,
      type: notifType,
      title: notifTitle,
      body: notifBody,
      image_url: notifImageUrl.trim() || null,
    }));

    const { error } = await supabase.from("notifications").insert(inserts);

    if (error) {
      setNotifStatus("Failed to send notification.");
    } else {
      setNotifStatus("Broadcast sent!");
      setNotifTitle("");
      setNotifBody("");
      setNotifImageUrl("");
    }
    setSendingNotif(false);
    
    setTimeout(() => setNotifStatus(""), 3000);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setNotifStatus("");
    const ext = file.name.split(".").pop();
    const filename = `broadcast_${Date.now()}.${ext}`;
    console.log("[ImageUpload] Uploading", filename, "to broadcast-images bucket");
    const { error } = await supabase.storage
      .from("broadcast-images")
      .upload(filename, file, { upsert: true, contentType: file.type });
    if (error) {
      console.error("[ImageUpload] Error:", error);
      setNotifStatus("❌ Image upload failed: " + error.message);
      setUploadingImage(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("broadcast-images").getPublicUrl(filename);
    console.log("[ImageUpload] Success, public URL:", publicUrl);
    setNotifImageUrl(publicUrl);
    setNotifStatus("✅ Image uploaded!");
    setTimeout(() => setNotifStatus(""), 3000);
    setUploadingImage(false);
  };

  const handleBulkUpload = async () => {
    setUploadStatus("");
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array of locations.");
      
      setUploadingLocations(true);

      const { data: existingData } = await supabase.from('locations').select('lat, lng, name');
      const existingLocs = new Set(existingData?.map(l => `${l.lat},${l.lng}`) || []);
      const existingNames = new Set(existingData?.map(l => l.name) || []);

      const newLocations = [];
      let skippedCount = 0;

      for (const loc of parsed) {
        if (!loc.name || !loc.lat || !loc.lng || !loc.source_type) {
          throw new Error(`Location missing required fields: ${JSON.stringify(loc)}`);
        }
        
        if (loc.source_type === "mapillary" && !loc.image_id) {
          throw new Error(`Mapillary location requires an image_id: ${loc.name}`);
        }
        if (loc.source_type === "custom" && !loc.image_url) {
          throw new Error(`Custom location requires an image_url: ${loc.name}`);
        }

        const isDupCoords = existingLocs.has(`${loc.lat},${loc.lng}`);
        const isDupName = existingNames.has(loc.name);

        if (isDupCoords || isDupName) {
          skippedCount++;
          continue;
        }

        newLocations.push({
          name: loc.name,
          city: loc.city || null,
          country: loc.country || null,
          lat: loc.lat,
          lng: loc.lng,
          image_id: loc.image_id || null,
          image_url: loc.image_url || null,
          source_type: loc.source_type,
          created_at: new Date().toISOString()
        });
      }

      if (newLocations.length === 0) {
        setUploadStatus(`Skipped ${skippedCount} existing locations. Nothing new to add.`);
        setUploadingLocations(false);
        return;
      }

      const { error } = await supabase.from("locations").insert(newLocations);
      if (error) throw error;
      
      setUploadStatus(`Successfully imported ${newLocations.length} locations! Skipped ${skippedCount} duplicates.`);
      setBulkJson("");
      fetchData(); // Refresh the counts
    } catch (err: any) {
      setUploadStatus(err.message || "Failed to parse or upload locations.");
    } finally {
      setUploadingLocations(false);
    }
  };

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    const res = await adminToggleStatus(id, "is_admin", !currentStatus);
    if (!res.success) {
      alert("Failed to toggle admin status: " + res.error);
      return;
    }
    fetchData();
  };

  const toggleVerify = async (id: string, currentStatus: boolean) => {
    const res = await adminToggleStatus(id, "is_verified", !currentStatus);
    if (!res.success) {
      alert("Failed to toggle verify status: " + res.error);
      return;
    }
    fetchData();
  };

  if (isAdmin === null || loading) {
    return (
      <div className="page-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Loader2 className="mly-spinner" size={48} color="var(--neon)" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div style={{ marginBottom: 16 }}>
        <Link href="/profile" className="back-link">
          <ArrowLeft size={16} />
          Profile
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "rgba(167, 139, 250, 0.2)", padding: 12, borderRadius: 12 }}>
            <Shield size={32} color="var(--neon)" />
          </div>
          <div>
            <h1 className="page-header" style={{ margin: 0 }}>Admin Dashboard</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>Manage users and send broadcasts</p>
          </div>
        </div>
        <button 
          className="btn-play" 
          onClick={() => setShowOnlineModal(true)}
          style={{ padding: "10px 20px", fontSize: 13, gap: 6 }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px #4ade80" }} />
          View Online Players
        </button>
      </div>

      {showOnlineModal && <OnlinePlayersModal onClose={() => setShowOnlineModal(false)} />}

      <AdminDashboardStats totalRegistered={totalUsers} totalLocations={totalLocations} />

      {/* Location Bulk Uploader */}
      <div className="settings-card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <UploadCloud size={18} color="var(--neon)" /> Location Bulk-Uploader
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            Paste a JSON array of hybrid locations here. Must include <code style={{ color: "var(--neon)" }}>source_type</code> ('mapillary' or 'custom'). 
            Mapillary locations require <code style={{ color: "var(--neon)" }}>image_id</code>, while custom locations require <code style={{ color: "var(--neon)" }}>image_url</code>.
          </p>
          <textarea 
            className="search-input" 
            placeholder={'[\n  {\n    "name": "Erbil Citadel",\n    "city": "Erbil",\n    "lat": 36.1911,\n    "lng": 44.0091,\n    "source_type": "mapillary",\n    "image_id": "12345"\n  }\n]'} 
            value={bulkJson}
            onChange={e => setBulkJson(e.target.value)}
            style={{ background: "var(--bg-base)", minHeight: 140, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
          />
          <button 
            className="btn-lobby-play" 
            onClick={handleBulkUpload}
            disabled={uploadingLocations || !bulkJson.trim()}
            style={{ justifyContent: "center" }}
          >
            {uploadingLocations ? <Loader2 className="mly-spinner" size={18} /> : "Upload Locations"}
          </button>
          {uploadStatus && <div style={{ fontSize: 12, color: uploadStatus.includes("Failed") || uploadStatus.includes("Missing") || uploadStatus.includes("requires") ? "#ef4444" : "#4ade80", textAlign: "center" }}>{uploadStatus}</div>}
        </div>
      </div>

      {/* Shop Items Management */}
      {showShopModal && <ShopManagementModal onClose={() => setShowShopModal(false)} />}
      
      {/* Shop Management Button */}
      <div className="settings-card" style={{ padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>Shop Management</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>Manage active shop items and storage.</p>
        </div>
        <button 
          onClick={() => setShowShopModal(true)}
          style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: 8, padding: "8px 16px", color: "var(--neon)", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
        >
          Open Shop Manager
        </button>
      </div>

      {/* Challenge Items Management */}
      {showSpecialItems && <AdminSpecialItemsPanel onClose={() => setShowSpecialItems(false)} />}
      <div className="settings-card" style={{ padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(245, 158, 11, 0.1)" }}>
            <Zap size={24} color="#f59e0b" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>Daily Streak Items</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>Manage rewards for daily streaks.</p>
          </div>
        </div>
        <button
          onClick={() => setShowSpecialItems(true)}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
        >
          Open Manager
        </button>
      </div>

      {/* Challenge Management Button */}
      {showChallengeModal && <AdminChallengePanel onClose={() => setShowChallengeModal(false)} />}
      <div className="settings-card" style={{ padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>Challenge Management</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>Manage active dynamic challenges and rewards.</p>
        </div>
        <button 
          onClick={() => setShowChallengeModal(true)}
          style={{ background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 8, padding: "8px 16px", color: "#60a5fa", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
        >
          Open Challenge Manager
        </button>
      </div>

      {/* Player Inventory Management Button */}
      {showPlayerInventory && <AdminPlayerInventoryPanel onClose={() => setShowPlayerInventory(false)} />}
      <div className="settings-card" style={{ padding: 20, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>Player Inventories</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>Search players and manage their locker items directly.</p>
        </div>
        <button 
          onClick={() => setShowPlayerInventory(true)}
          style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, padding: "8px 16px", color: "#10b981", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
        >
          Manage Lockers
        </button>
      </div>

      {/* Global Notifications */}
      <div className="settings-card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Send size={18} color="var(--neon)" /> Global Broadcast
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <select
            className="search-input"
            value={notifType}
            onChange={e => setNotifType(e.target.value)}
            style={{ background: "var(--bg-base)", cursor: "pointer" }}
          >
            <option value="broadcast">📢 News Carousel Broadcast (Dashboard Only)</option>
            <option value="system">🔔 System Notification (Bell Popup Only)</option>
          </select>
          <input 
            className="search-input" 
            placeholder="Notification Title" 
            value={notifTitle}
            onChange={e => setNotifTitle(e.target.value)}
            style={{ background: "var(--bg-base)" }}
          />
          <textarea 
            className="search-input" 
            placeholder="Notification Body..." 
            value={notifBody}
            onChange={e => setNotifBody(e.target.value)}
            style={{ background: "var(--bg-base)", minHeight: 80, resize: "vertical" }}
          />
          {/* Image Picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                background: "var(--bg-base)",
                border: "1px dashed rgba(167,139,250,0.4)",
                borderRadius: 10,
                cursor: uploadingImage ? "not-allowed" : "pointer",
                color: notifImageUrl ? "var(--neon)" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: 600,
                transition: "border-color 0.2s",
              }}
            >
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={uploadingImage}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              {uploadingImage ? (
                <><Loader2 className="mly-spinner" size={16} /> Uploading image...</>
              ) : notifImageUrl ? (
                <>✅ Image ready — click to replace</>
              ) : (
                <>🖼️ Click to pick a slide background image (optional)</>
              )}
            </label>
            {notifImageUrl && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img src={notifImageUrl} alt="preview" style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(167,139,250,0.3)" }} />
                <button
                  onClick={() => setNotifImageUrl("")}
                  style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <button 
            className="btn-lobby-play" 
            onClick={handleSendGlobalNotif}
            disabled={sendingNotif}
            style={{ justifyContent: "center" }}
          >
            {sendingNotif ? <Loader2 className="mly-spinner" size={18} /> : "Broadcast to Everyone"}
          </button>
          {notifStatus && <div style={{ fontSize: 12, color: notifStatus.includes("Failed") ? "#ef4444" : "#4ade80", textAlign: "center" }}>{notifStatus}</div>}
        </div>
      </div>

      {/* User List */}
      <div className="settings-card" style={{ padding: 20, overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>Registered Users</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "var(--bg-base)", padding: 4, borderRadius: 8, gap: 4 }}>
              {(["Top 10", "Top 20", "All"] as const).map(opt => {
                const limitVal = opt === "All" ? "All" : parseInt(opt.replace("Top ", ""));
                return (
                  <button
                    key={opt}
                    onClick={() => setUserLimit(limitVal)}
                    style={{
                      background: userLimit === limitVal ? "rgba(167, 139, 250, 0.2)" : "transparent",
                      color: userLimit === limitVal ? "var(--neon)" : "var(--text-muted)",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            <input
              className="search-input"
              placeholder="Search username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "var(--bg-base)", width: "100%", maxWidth: 200, margin: 0 }}
            />
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", textAlign: "left" }}>
              <th style={{ paddingBottom: 12 }}>Username</th>
              <th style={{ paddingBottom: 12 }}>Rank / RP</th>
              <th style={{ paddingBottom: 12 }}>Status</th>
              <th style={{ paddingBottom: 12 }}>Role</th>
              <th style={{ paddingBottom: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {profiles
              .filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, userLimit === "All" ? undefined : userLimit)
              .map(p => {
                const rankInfo = getRankFromRP(p.rp);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 0", color: "white", fontWeight: 600 }}>@{p.username}</td>
                    <td style={{ padding: "12px 0" }}>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 800, 
                        color: rankInfo.color, 
                        background: rankInfo.glow, 
                        padding: "4px 8px", 
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        {rankInfo.icon} {p.rp.toLocaleString()} RP
                      </span>
                    </td>
                <td style={{ padding: "12px 0" }}>
                  <span style={{ 
                    background: p.is_verified ? "rgba(74, 222, 128, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: p.is_verified ? "#4ade80" : "var(--text-muted)",
                    padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4
                  }}>
                    {p.is_verified && <Shield size={12} />}
                    {p.is_verified ? "Verified" : "Unverified"}
                  </span>
                </td>
                <td style={{ padding: "12px 0" }}>
                  <span style={{ 
                    background: p.is_admin ? "rgba(167, 139, 250, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    color: p.is_admin ? "var(--neon)" : "var(--text-muted)",
                    padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700
                  }}>
                    {p.is_admin ? "ADMIN" : "USER"}
                  </span>
                </td>
                <td style={{ padding: "12px 0" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button 
                      onClick={() => toggleVerify(p.id, p.is_verified)}
                      style={{ background: "none", border: "none", color: p.is_verified ? "#f59e0b" : "#4ade80", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                    >
                      {p.is_verified ? "Revoke Verify" : "Verify User"}
                    </button>
                    <button 
                      onClick={() => toggleAdmin(p.id, p.is_admin)}
                      style={{ background: "none", border: "none", color: p.is_admin ? "#ef4444" : "var(--neon)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                    >
                      {p.is_admin ? "Revoke Admin" : "Make Admin"}
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

    </div>
  );
}
