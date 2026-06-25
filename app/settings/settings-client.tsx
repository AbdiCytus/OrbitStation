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
  allowFriendRequests?: boolean;
  staticBackgroundEnabled?: boolean;
  notifSoundEnabled?: boolean;
  notifSoundUrl?: string | null;
  shortcuts?: string | null;
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
  const [allowFriendRequests, setAllowFriendRequests] = useState(profile.allowFriendRequests ?? true);
  const [staticBackgroundEnabled, setStaticBackgroundEnabled] = useState(profile.staticBackgroundEnabled ?? false);
  const [notifSoundEnabled, setNotifSoundEnabled] = useState(profile.notifSoundEnabled ?? true);
  const [notifSoundUrl, setNotifSoundUrl] = useState(profile.notifSoundUrl ?? "/sounds/notif-default.mp3");
  const [notifSoundType, setNotifSoundType] = useState<"default" | "custom">(
    !profile.notifSoundUrl || profile.notifSoundUrl === "/sounds/notif-default.mp3" ? "default" : "custom"
  );
  const [isPublic, setIsPublic] = useState(profile.station?.isPublic ?? false);
  const [image, setImage] = useState(profile.image ?? "");

  const defaultShortcuts = { publicStation: "F1", friends: "F2", analytics: "F3", settings: "F4" };
  const [shortcuts, setShortcuts] = useState<typeof defaultShortcuts>(profile.shortcuts ? { ...defaultShortcuts, ...JSON.parse(profile.shortcuts) } : defaultShortcuts);
  const [activeTab, setActiveTab] = useState<"profile" | "public" | "preferences" | "shortcuts">("profile");

  const handleShortcutKeyDown = (keyName: keyof typeof defaultShortcuts) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const key = e.key;
    if (key === "Tab" || key === "Escape" || key === "Enter") return;
    
    const modifiers = [];
    if (e.ctrlKey) modifiers.push("Ctrl");
    if (e.altKey) modifiers.push("Alt");
    if (e.shiftKey) modifiers.push("Shift");
    if (e.metaKey) modifiers.push("Meta");
    
    // Ignore if only modifier keys are pressed
    if (["Control", "Alt", "Shift", "Meta"].includes(key)) return;
    
    const keyString = key === " " ? "Space" : key.length === 1 ? key.toUpperCase() : key;
    const finalCombo = [...modifiers, keyString].join("+");
    
    setShortcuts(s => ({ ...s, [keyName]: finalCombo }));
    (e.target as HTMLInputElement).blur();
  };

  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string, username?: string }>({});
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

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Batasi ukuran file audio maksimal 1 MB
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Audio file is too large! Maximum allowed is 1MB.");
        return;
      }

      // Konversi ke Base64 String agar bisa disimpan ke Database
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setNotifSoundUrl(reader.result?.toString() || "");
        toast.success("Audio loaded! Click 'Play Test' to preview.");
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
    const errors: { name?: string, username?: string } = {};
    if (!name.trim()) errors.name = "Display name is required.";
    if (!username.trim()) errors.username = "Username is required.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("saving");
    setErrorMsg("");

    try {
      const finalSoundUrl = notifSoundType === "default" ? "/sounds/notif-default.mp3" : notifSoundUrl;
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, username, callsign, bio, bannerUrl, titleBadge,
          animationEnabled, hologramEnabled, allowFriendRequests,
          staticBackgroundEnabled, notifSoundEnabled,
          notifSoundUrl: finalSoundUrl,
          shortcuts: JSON.stringify(shortcuts),
          isPublic, image
        }),
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
      <form onSubmit={handleSave} className="settings-content" style={{ padding: "2rem 1rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 80px)", width: "100%", gap: "1rem" }}>

        <div className="settings-modal-wrapper" style={{ width: "100%", maxWidth: "900px", background: "rgba(0, 0, 0, 0.2)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>

          {/* Header */}
          <div className="settings-page-header" style={{ padding: "2rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", background: "transparent" }}>
            <div>
              <h1 className="settings-page-title hidden md:block">
                {activeTab === "profile" && "Profile"}
                {activeTab === "public" && "Public Station"}
                {activeTab === "preferences" && "Preferences"}
                {activeTab === "shortcuts" && "Shortcuts"}
              </h1>
              <h1 className="settings-page-title md:hidden">Settings</h1>
              <p className="settings-page-sub hidden md:block">
                {activeTab === "profile" && "Manage your personal profile details."}
                {activeTab === "public" && "Customize how others see your station."}
                {activeTab === "preferences" && "Adjust your station experience."}
                {activeTab === "shortcuts" && "Configure quick navigation keys."}
              </p>
              <p className="settings-page-sub md:hidden">Manage your Orbit Station profile and preferences.</p>
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

          <div style={{ display: "flex", flex: 1 }} className="settings-scroll-container flex-col">
            {/* Left Sidebar (Desktop Only) */}
            <div className="hidden md:flex md:flex-col md:w-64" style={{ padding: "1.5rem", gap: "0.5rem", borderRight: "1px solid rgba(255, 255, 255, 0.1)", background: "transparent" }}>
              <button type="button" onClick={() => setActiveTab("profile")} className={`text-left rounded-lg flex items-center transition-colors ${activeTab === "profile" ? "bg-white/10 text-white font-medium" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`} style={{ padding: "0.75rem 1rem", gap: "0.75rem" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Profile
              </button>
              <button type="button" onClick={() => setActiveTab("public")} className={`text-left rounded-lg flex items-center transition-colors ${activeTab === "public" ? "bg-white/10 text-white font-medium" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`} style={{ padding: "0.75rem 1rem", gap: "0.75rem" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                Public Station
              </button>
              <button type="button" onClick={() => setActiveTab("preferences")} className={`text-left rounded-lg flex items-center transition-colors ${activeTab === "preferences" ? "bg-white/10 text-white font-medium" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`} style={{ padding: "0.75rem 1rem", gap: "0.75rem" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Preferences
              </button>
              <button type="button" onClick={() => setActiveTab("shortcuts")} className={`text-left rounded-lg flex items-center transition-colors ${activeTab === "shortcuts" ? "bg-white/10 text-white font-medium" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`} style={{ padding: "0.75rem 1rem", gap: "0.75rem" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Shortcuts
              </button>
            </div>

            {/* Content Area */}
            <div className="settings-right-pane">

              {/* Profile Section */}
              <section className="settings-section settings-inner-section" style={{ display: activeTab === "profile" ? "flex" : "none" }}>
                <h2 className="settings-section-title md:text-2xl mb-6">Profile</h2>

                {/* Avatar row */}
                <div className="settings-avatar-row mb-8">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <div
                    className="settings-avatar group relative overflow-hidden"
                    style={{ cursor: "pointer", width: "80px", height: "80px" }}
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
                        fontSize: "2rem", fontWeight: 800, color: "#fff"
                      }}>
                        {(profile.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold text-white tracking-widest">
                      EDIT
                    </div>
                  </div>
                  <div className="settings-avatar-info ml-4">
                    <span className="settings-avatar-name text-lg">{profile.name ?? "No name"}</span>
                    <span className="settings-avatar-email text-sm text-gray-400">{profile.email}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  {/* Display name */}
                  <div className="form-group">
                    <label className="form-label text-sm text-gray-300" htmlFor="s-name">Display Name</label>
                    <input
                      id="s-name"
                      className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setFormErrors(p => ({ ...p, name: "" })); }}
                      maxLength={60}
                      placeholder="How others see your name"
                    />
                    {formErrors.name && <span className="text-red-500 text-xs mt-1 block">{formErrors.name}</span>}
                  </div>

                  {/* Username */}
                  <div className="form-group">
                    <label className="form-label text-sm text-gray-300" htmlFor="s-username">
                      Username
                      <span className="text-gray-500 text-xs ml-2 font-normal">— used in your public URL: /@username</span>
                    </label>
                    <input
                      id="s-username"
                      className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")); setFormErrors(p => ({ ...p, username: "" })); }}
                      maxLength={32}
                      placeholder="yourname"
                    />
                    {formErrors.username && <span className="text-red-500 text-xs mt-1 block">{formErrors.username}</span>}
                    {errorMsg && errorMsg.toLowerCase().includes("username") && <span className="text-red-500 text-xs mt-1 block">{errorMsg}</span>}
                  </div>

                  {/* Callsign */}
                  <div className="form-group">
                    <label className="form-label text-sm text-gray-300" htmlFor="s-callsign">
                      Callsign
                      <span className="text-gray-500 text-xs ml-2 font-normal">— shown in dashboard instead of "Pilot"</span>
                    </label>
                    <input
                      id="s-callsign"
                      className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors"
                      value={callsign}
                      onChange={(e) => setCallsign(e.target.value)}
                      maxLength={32}
                      placeholder="e.g. Commander, Captain, Navigator…"
                    />
                  </div>

                  {/* Bio */}
                  <div className="form-group">
                    <label className="form-label text-sm text-gray-300" htmlFor="s-bio">Bio</label>
                    <textarea
                      id="s-bio"
                      className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors resize-y min-h-[100px]"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder="Tell the galaxy about yourself…"
                    />
                  </div>
                </div>
              </section>

              {/* Public Station Section */}
              <section className="settings-section settings-inner-section" style={{ display: activeTab === "public" ? "flex" : "none" }}>
                <h2 className="settings-section-title md:text-2xl mb-6">Public Station</h2>

                <div className="flex flex-col">
                  {/* Public Profile toggle */}
                  <div className="settings-toggle-row bg-white/5 rounded-lg border border-white/10" style={{ padding: "1rem" }}>
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label text-white font-medium">Public Station</span>
                      <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
                        Allow anyone to visit your Orbit Station via your public URL.
                      </span>
                      {isPublic && (
                        <a href={`/station/${username}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors">
                          View your public station ↗
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

                  {/* Title badge */}
                  <div className="form-group">
                    <label className="form-label text-sm text-gray-300" htmlFor="s-badge">Title Badge</label>
                    <input
                      id="s-badge"
                      className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors"
                      value={titleBadge}
                      onChange={(e) => setTitleBadge(e.target.value)}
                      maxLength={40}
                      placeholder="e.g. Pioneer Pilot, Star Navigator…"
                    />
                  </div>

                  {/* Banner URL */}
                  <div className="form-group">
                    <label className="form-label text-sm text-gray-300" htmlFor="s-banner">Banner Image URL</label>
                    {bannerUrl && (
                      <div className="beacon-preview-image mb-3 rounded-lg overflow-hidden border border-white/10">
                        <img src={bannerUrl} alt="Banner preview" className="w-full h-32 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                    <input
                      id="s-banner"
                      className="input w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 transition-colors"
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://example.com/your-banner.jpg"
                    />
                  </div>
                </div>
              </section>

              {/* Preferences Section */}
              <section className="settings-section settings-inner-section" style={{ display: activeTab === "preferences" ? "flex" : "none" }}>
                <h2 className="settings-section-title md:text-2xl mb-6">Preferences</h2>

                <div className="flex flex-col gap-4">
                  {/* Animation toggle */}
                  <div className="settings-toggle-row bg-white/5 p-4 rounded-lg border border-white/10" style={{ padding: "1rem" }}>
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label text-white font-medium">Enable Animations</span>
                      <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
                        Starfield canvas, floating beacons, sector transitions. Disable for performance or accessibility.
                      </span>
                    </div>
                    <label className="toggle-switch" htmlFor="toggle-animation">
                      <input
                        id="toggle-animation"
                        type="checkbox"
                        checked={animationEnabled}
                        onChange={(e) => {
                          setAnimationEnabled(e.target.checked);
                          if (e.target.checked) {
                            setStaticBackgroundEnabled(false);
                          }
                        }}
                      />
                      <span className="toggle-thumb" />
                    </label>
                  </div>

                  {/* Hologram toggle */}
                  <div className="settings-toggle-row bg-white/5 p-4 rounded-lg border border-white/10 md:flex hidden" style={{ padding: "1rem" }}>
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label text-white font-medium">Hologram Effect</span>
                      <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
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

                  {/* Static Background toggle */}
                  {!animationEnabled && (
                    <div className="settings-toggle-row bg-white/5 p-4 rounded-lg border border-white/10" style={{ padding: "1rem" }}>
                      <div className="settings-toggle-info">
                        <span className="settings-toggle-label text-white font-medium">Static Background Mode</span>
                        <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
                          Use a completely static space image instead of dynamic particle background.
                        </span>
                      </div>
                      <label className="toggle-switch" htmlFor="toggle-static-bg">
                        <input
                          id="toggle-static-bg"
                          type="checkbox"
                          checked={staticBackgroundEnabled}
                          onChange={(e) => setStaticBackgroundEnabled(e.target.checked)}
                        />
                        <span className="toggle-thumb" />
                      </label>
                    </div>
                  )}

                  {/* Friend Requests toggle */}
                  <div className="settings-toggle-row bg-white/5 p-4 rounded-lg border border-white/10" style={{ padding: "1rem" }}>
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label text-white font-medium">Allow Friend Requests</span>
                      <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
                        Show the "Add Friend" button on your Public Profile to other logged-in pilots.
                      </span>
                    </div>
                    <label className="toggle-switch" htmlFor="toggle-friend-request">
                      <input
                        id="toggle-friend-request"
                        type="checkbox"
                        checked={allowFriendRequests}
                        onChange={(e) => setAllowFriendRequests(e.target.checked)}
                      />
                      <span className="toggle-thumb" />
                    </label>
                  </div>

                  {/* Notification Sound Group */}
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10" style={{ padding: "1rem" }}>
                    <div className="settings-toggle-row">
                      <div className="settings-toggle-info">
                        <span className="settings-toggle-label text-white font-medium">Notification Sound</span>
                        <span className="settings-toggle-desc text-sm text-gray-400 mt-1">
                          Play a sound when you receive a new message or friend request.
                        </span>
                      </div>
                      <label className="toggle-switch" htmlFor="toggle-notif-sound">
                        <input
                          id="toggle-notif-sound"
                          type="checkbox"
                          checked={notifSoundEnabled}
                          onChange={(e) => setNotifSoundEnabled(e.target.checked)}
                        />
                        <span className="toggle-thumb" />
                      </label>
                    </div>

                    {notifSoundEnabled && (
                      <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/5 flex flex-col gap-4" style={{ padding: "1rem" }}>
                        <div className="flex gap-3 flex-wrap">
                          <label
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${notifSoundType === "default" ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-gray-400"}`}
                            style={{ borderStyle: "solid", borderWidth: "1px" }}
                          >
                            <input
                              type="radio"
                              name="soundType"
                              className="hidden"
                              checked={notifSoundType === "default"}
                              onChange={() => {
                                setNotifSoundType("default");
                                setNotifSoundUrl("/sounds/notif-default.mp3");
                              }}
                            />
                            <div className={`w-4 h-4 rounded-full transition-all ${notifSoundType === "default" ? "border-4 border-purple-400" : "border-2 border-gray-600"}`} />
                            <span className="text-sm font-semibold">System Default</span>
                          </label>

                          <label
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${notifSoundType === "custom" ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-gray-400"}`}
                            style={{ borderStyle: "solid", borderWidth: "1px" }}
                          >
                            <input
                              type="radio"
                              name="soundType"
                              className="hidden"
                              checked={notifSoundType === "custom"}
                              onChange={() => {
                                setNotifSoundType("custom");
                                setNotifSoundUrl(""); // Reset url agar siap di-upload
                              }}
                            />
                            <div className={`w-4 h-4 rounded-full transition-all ${notifSoundType === "custom" ? "border-4 border-purple-400" : "border-2 border-gray-600"}`} />
                            <span className="text-sm font-semibold">Custom Upload</span>
                          </label>
                        </div>

                        {notifSoundType === "custom" && (
                          <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-dashed border-white/20 flex-wrap">
                            <input
                              type="file"
                              accept="audio/mp3, audio/mpeg, audio/wav, audio/ogg"
                              onChange={handleAudioFileChange}
                              className="flex-1 text-xs text-gray-300 cursor-pointer"
                            />
                            <button
                              type="button"
                              disabled={!notifSoundUrl || notifSoundUrl === "/sounds/notif-default.mp3"}
                              onClick={() => {
                                const audio = new Audio(notifSoundUrl);
                                audio.volume = 0.5;
                                audio.play().catch(e => toast.error("Could not play sound. Format might be unsupported."));
                              }}
                              className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all ${(!notifSoundUrl || notifSoundUrl === "/sounds/notif-default.mp3") ? "bg-white/5 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(109,40,217,0.4)]"}`}
                            >
                              Play Test
                            </button>
                          </div>
                        )}
                        {notifSoundType === "custom" && notifSoundUrl && notifSoundUrl.startsWith("data:audio") && (
                          <span className="text-xs text-emerald-400 ml-1">✓ Custom audio ready to be saved</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Shortcuts Section */}
              <section className="settings-section settings-inner-section desktop-only-section" style={{ display: activeTab === "shortcuts" ? "flex" : "none" }}>
                <h2 className="settings-section-title md:text-2xl mb-6">Shortcuts</h2>
                <p className="text-gray-400 text-sm mb-6">Configure keyboard shortcuts for quick navigation on desktop.</p>

                <div className="flex flex-col gap-4">
                  <div className="form-group flex flex-row items-center justify-between bg-white/5 rounded-lg border border-white/10">
                    <label className="form-label text-sm text-gray-300 mb-0">Public Station</label>
                    <input
                      className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
                      value={shortcuts.publicStation}
                      readOnly
                      onKeyDown={handleShortcutKeyDown("publicStation")}
                      placeholder="Press key..."
                    />
                  </div>
                  <div className="form-group flex flex-row items-center justify-between bg-white/5 rounded-lg border border-white/10">
                    <label className="form-label text-sm text-gray-300 mb-0">Friends</label>
                    <input
                      className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
                      value={shortcuts.friends}
                      readOnly
                      onKeyDown={handleShortcutKeyDown("friends")}
                      placeholder="Press key..."
                    />
                  </div>
                  <div className="form-group flex flex-row items-center justify-between bg-white/5 rounded-lg border border-white/10">
                    <label className="form-label text-sm text-gray-300 mb-0">Analytics</label>
                    <input
                      className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
                      value={shortcuts.analytics}
                      readOnly
                      onKeyDown={handleShortcutKeyDown("analytics")}
                      placeholder="Press key..."
                    />
                  </div>
                  <div className="form-group flex flex-row items-center justify-between bg-white/5 rounded-lg border border-white/10">
                    <label className="form-label text-sm text-gray-300 mb-0">Settings</label>
                    <input
                      className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
                      value={shortcuts.settings}
                      readOnly
                      onKeyDown={handleShortcutKeyDown("settings")}
                      placeholder="Press key..."
                    />
                  </div>
                </div>
              </section>

            </div>
          </div>

          {status === "error" && (
            <p className="login-form-error absolute bottom-6 left-1/2 -translate-x-1/2 m-0 bg-red-900/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-500/50 z-50">{errorMsg}</p>
          )}
        </div>

        {/* Danger Zone */}
        <div style={{ width: "100%", maxWidth: "900px", marginTop: "1rem" }}>
          <section className="settings-section w-full md:bg-[#111] md:border md:border-red-500/20 md:rounded-xl md:p-4 border border-red-500/20 rounded-xl p-4 bg-red-500/5 md:mb-0 mb-12">
            <div className="flex md:items-center justify-between flex-col md:flex-row gap-4">
              <div>
                <h2 className="settings-section-title text-red-500 m-0">Danger Zone</h2>
                <p className="text-gray-400 text-xs mt-1 max-w-md">
                  Once you delete your account, there is no going back. All data will be permanently removed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="rounded-md bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium text-sm whitespace-nowrap"
                style={{padding: "0.5rem 1rem"}}
              >
                Delete Account  
              </button>
            </div>
          </section>
        </div>
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
