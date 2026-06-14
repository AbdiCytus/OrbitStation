"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Cropper from "react-easy-crop";
import { deleteAccount } from "@/lib/actions";
import { toast } from "sonner";

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  bannerUrl: string | null;
  titleBadge: string | null;
  callsign: string | null;
  animationEnabled: boolean;
  hologramEnabled: boolean;
  station: { isPublic: boolean } | null;
};

type Props = { profile: Profile };

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number, y: number, width: number, height: number }
) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null;

  canvas.width = 256;
  canvas.height = 256;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    256,
    256
  )

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          resolve(reader.result as string);
        }
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, 'image/jpeg', 0.8)
  })
}

export default function SettingsClient({ profile }: Props) {
  const [name, setName] = useState(profile.name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [callsign, setCallsign] = useState(profile.callsign ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? "");
  const [titleBadge, setTitleBadge] = useState(profile.titleBadge ?? "");
  const [animationEnabled, setAnimationEnabled] = useState(profile.animationEnabled);
  const [hologramEnabled, setHologramEnabled] = useState(profile.hologramEnabled);
  const [isPublic, setIsPublic] = useState(profile.station?.isPublic ?? false);
  const [image, setImage] = useState(profile.image ?? "");
  
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [formErrors, setFormErrors] = useState<{name?: string, username?: string}>({});
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Avatar Upload & Crop State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropImage = async () => {
    try {
      if (imageSrc && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (croppedImage) {
          setImage(croppedImage);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setImageSrc(null);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const res = await deleteAccount();
    if (res.error) {
      toast.error(res.error);
      setIsDeleting(false);
    } else {
      toast.success("Account deleted");
      signOut({ callbackUrl: "/" });
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errors: {name?: string, username?: string} = {};
    if (!name.trim()) errors.name = "Display name is required.";
    if (!username.trim()) errors.username = "Username is required.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, callsign, bio, bannerUrl, titleBadge, animationEnabled, hologramEnabled, isPublic, image }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
        toast.error(data.error ?? "Failed to save settings");
      } else {
        setStatus("saved");
        toast.success("Settings saved successfully");
        router.refresh();
        setTimeout(() => setStatus("idle"), 2500);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    }
  }

  return (
    <>
      <form onSubmit={handleSave} className="settings-content">
        {/* Header */}
        <div className="settings-page-header">
          <div>
            <h1 className="settings-page-title">Settings</h1>
            <p className="settings-page-sub">Manage your Orbit Station profile and preferences.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button type="button" className="btn btn-secondary" onClick={() => window.location.href = "/station"}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={status === "saving"}>
              {status === "saving" ? <span className="spinner" /> : "Save Changes"}
            </button>
            {status === "saved" && <span style={{ color: "#4ade80", fontSize: "0.875rem" }}>✓</span>}
          </div>
        </div>

        <div className="settings-grid-layout">
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Public profile cosmetics */}
            <section className="settings-section">
              <h2 className="settings-section-title">Public Profile</h2>

              {/* Title badge */}
              <div className="form-group">
                <label className="form-label" htmlFor="s-badge">Title Badge</label>
                <input
                  id="s-badge"
                  className="input"
                  value={titleBadge}
                  onChange={(e) => setTitleBadge(e.target.value)}
                  maxLength={40}
                  placeholder="e.g. Pioneer Pilot, Star Navigator…"
                />
              </div>

              {/* Banner URL */}
              <div className="form-group">
                <label className="form-label" htmlFor="s-banner">Banner Image URL</label>
                {bannerUrl && (
                  <div className="beacon-preview-image" style={{ marginBottom: "0.5rem" }}>
                    <img src={bannerUrl} alt="Banner preview"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <input
                  id="s-banner"
                  className="input"
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/your-banner.jpg"
                />
              </div>
            </section>

            {/* Preferences */}
            <section className="settings-section">
              <h2 className="settings-section-title">Preferences</h2>

              {/* Animation toggle */}
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Enable Animations</span>
                  <span className="settings-toggle-desc">
                    Starfield canvas, floating beacons, sector transitions. Disable for performance or accessibility.
                  </span>
                </div>
                <label className="toggle-switch" htmlFor="toggle-animation">
                  <input
                    id="toggle-animation"
                    type="checkbox"
                    checked={animationEnabled}
                    onChange={(e) => setAnimationEnabled(e.target.checked)}
                  />
                  <span className="toggle-thumb" />
                </label>
              </div>

              {/* Hologram toggle */}
              <div className="settings-toggle-row desktop-only" style={{ marginTop: "1rem" }}>
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Hologram Effect</span>
                  <span className="settings-toggle-desc">
                    Show a holographic text effect when hovering over beacons.
                  </span>
                </div>
                <label className="toggle-switch" htmlFor="toggle-hologram">
                  <input
                    id="toggle-hologram"
                    type="checkbox"
                    checked={hologramEnabled}
                    onChange={(e) => setHologramEnabled(e.target.checked)}
                  />
                  <span className="toggle-thumb" />
                </label>
              </div>

              {/* Public Profile toggle */}
              <div className="settings-toggle-row" style={{ marginTop: "1rem" }}>
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Public Station</span>
                  <span className="settings-toggle-desc">
                    Allow anyone to visit your Orbit Station via your public URL.
                  </span>
                  {isPublic && (
                    <a href={`/station/${username}`} target="_blank" rel="noreferrer" style={{ marginTop: "0.5rem", display: "inline-block", fontSize: "0.8rem", color: "#a78bfa", textDecoration: "underline" }}>
                      View your public station
                    </a>
                  )}
                </div>
                <label className="toggle-switch" htmlFor="toggle-public">
                  <input
                    id="toggle-public"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <span className="toggle-thumb" />
                </label>
              </div>
            </section>
            
            {/* Danger Zone */}
            <section className="settings-section" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
              <h2 className="settings-section-title" style={{ color: "#ef4444" }}>Danger Zone</h2>
              <p className="text-gray-400 text-sm mb-4" style={{ marginBottom: "1rem" }}>
                Once you delete your account, there is no going back. Please be certain. All data will be permanently removed.
              </p>
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(true)}
                style={{ padding: "8px 16px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", fontWeight: "500", fontSize: "0.875rem" }}
              >
                Delete Account
              </button>
            </section>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Profile */}
            <section className="settings-section">
              <h2 className="settings-section-title">Profile</h2>

              {/* Avatar row */}
              <div className="settings-avatar-row">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  onChange={handleFileChange}
                />
                <div 
                  className="settings-avatar group relative overflow-hidden" 
                  style={{ cursor: "pointer" }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Avatar (Max 2MB)"
                >
                  {image ? (
                    <img src={image} alt={profile.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      background: "linear-gradient(135deg,#5b3fde,#22d3ee)",
                      width: "100%", height: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.5rem", fontWeight: 800, color: "#fff"
                    }}>
                      {(profile.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold text-white tracking-widest">
                    EDIT
                  </div>
                </div>
                <div className="settings-avatar-info">
                  <span className="settings-avatar-name">{profile.name ?? "No name"}</span>
                  <span className="settings-avatar-email">{profile.email}</span>
                </div>
              </div>

              {/* Display name */}
              <div className="form-group">
                <label className="form-label" htmlFor="s-name">Display Name</label>
                <input
                  id="s-name"
                  className="input"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFormErrors(p => ({...p, name: ""})); }}
                  maxLength={60}
                  placeholder="How others see your name"
                />
                {formErrors.name && <span className="text-red-500 text-xs mt-1 block">{formErrors.name}</span>}
              </div>

              {/* Username */}
              <div className="form-group">
                <label className="form-label" htmlFor="s-username">
                  Username
                  <span className="form-label-hint"> — used in your public URL: /@username</span>
                </label>
                <input
                  id="s-username"
                  className="input"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")); setFormErrors(p => ({...p, username: ""})); }}
                  maxLength={32}
                  placeholder="yourname"
                />
                {formErrors.username && <span className="text-red-500 text-xs mt-1 block">{formErrors.username}</span>}
                {errorMsg && errorMsg.toLowerCase().includes("username") && <span className="text-red-500 text-xs mt-1 block">{errorMsg}</span>}
              </div>

              {/* Callsign */}
              <div className="form-group">
                <label className="form-label" htmlFor="s-callsign">
                  Callsign
                  <span className="form-label-hint"> — shown in the dashboard instead of "Pilot"</span>
                </label>
                <input
                  id="s-callsign"
                  className="input"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  maxLength={32}
                  placeholder="e.g. Commander, Captain, Navigator…"
                />
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label" htmlFor="s-bio">Bio</label>
                <textarea
                  id="s-bio"
                  className="input"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Tell the galaxy about yourself…"
                />
              </div>
            </section>
          </div>
        </div>
        {status === "error" && (
          <p className="login-form-error" style={{ marginTop: "1rem" }}>{errorMsg}</p>
        )}
      </form>

      {/* Crop Modal */}
      <AnimatePresence>
        {imageSrc && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "white" }}>Crop Profile Picture</h3>
              <div style={{ position: "relative", width: "100%", height: "300px", background: "#000", borderRadius: "8px", overflow: "hidden" }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={false}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ color: "gray", fontSize: "0.875rem" }}>Zoom</span>
                <input 
                  type="range" 
                  value={zoom} 
                  min={1} 
                  max={3} 
                  step={0.1} 
                  onChange={(e) => setZoom(Number(e.target.value))} 
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button type="button" onClick={() => setImageSrc(null)} style={{ padding: "8px 16px", borderRadius: "8px", background: "transparent", color: "gray", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button" onClick={handleCropImage} style={{ padding: "8px 16px", borderRadius: "8px", background: "#8b5cf6", color: "white", border: "none", cursor: "pointer", fontWeight: "500" }}>
                  Apply Crop
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div style={{ background: "#111", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#ef4444" }}>Delete Account</h3>
              <p style={{ color: "gray", fontSize: "0.875rem", lineHeight: "1.5" }}>
                Are you absolutely sure you want to delete your account? This action cannot be undone. 
                All your data, settings, beacons, sectors, friendships, and messages will be permanently deleted from our servers.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowDeleteModal(false)} disabled={isDeleting} style={{ padding: "8px 16px", borderRadius: "8px", background: "transparent", color: "gray", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteAccount} disabled={isDeleting} style={{ padding: "8px 16px", borderRadius: "8px", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" }}>
                  {isDeleting ? "Deleting..." : "Yes, Delete Account"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
