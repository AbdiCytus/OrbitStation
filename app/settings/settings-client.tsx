"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Cropper from "react-easy-crop";
import { deleteAccount } from "@/lib/actions";
import { toast } from "sonner";
import { BADGE_REGISTRY, BADGE_COLORS } from "@/lib/badges/registry";
import * as SolidIcons from "@heroicons/react/24/solid";

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const Icon = (SolidIcons as any)[name];
  return Icon ? <Icon className={className} /> : <SolidIcons.StarIcon className={className} />;
};

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

type Props = {
  profile: Profile;
  unlockedBadges: string[];
};

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

export default function SettingsClient({ profile, unlockedBadges = [] }: Props) {
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Badge Display State
  const [openBadgeCategory, setOpenBadgeCategory] = useState<string>("biasa");
  const [previewBadge, setPreviewBadge] = useState<any>(null);

  const getModalTint = (color?: string) => {
    const tintMap: Record<string, string> = {
      amber: "rgba(251, 191, 36, 0.15)", rose: "rgba(244, 63, 94, 0.15)", emerald: "rgba(16, 185, 129, 0.15)",
      cyan: "rgba(6, 182, 212, 0.15)", purple: "rgba(168, 85, 247, 0.15)", pink: "rgba(236, 72, 153, 0.15)",
      blue: "rgba(59, 130, 246, 0.15)", indigo: "rgba(99, 102, 241, 0.15)", gray: "rgba(156, 163, 175, 0.15)"
    };
    return color ? (tintMap[color] || "rgba(255,255,255,0.05)") : "rgba(255,255,255,0.05)";
  };

  const getModalBorder = (color?: string) => {
    const borderMap: Record<string, string> = {
      amber: "rgba(251, 191, 36, 0.3)", rose: "rgba(244, 63, 94, 0.3)", emerald: "rgba(16, 185, 129, 0.3)",
      cyan: "rgba(6, 182, 212, 0.3)", purple: "rgba(168, 85, 247, 0.3)", pink: "rgba(236, 72, 153, 0.3)",
      blue: "rgba(59, 130, 246, 0.3)", indigo: "rgba(99, 102, 241, 0.3)", gray: "rgba(156, 163, 175, 0.3)"
    };
    return color ? (borderMap[color] || "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.1)";
  };

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
        if (animationEnabled) {
          document.body.classList.remove("no-loading-anim");
        } else {
          document.body.classList.add("no-loading-anim");
        }
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

        <div className="settings-modal-wrapper" style={{ width: "100%", maxWidth: "900px", background: "rgba(0, 0, 0, 0.2)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "visible", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>

          {/* DESKTOP UNIFIED HEADER */}
          <div className="hidden md:block">
            <div className="settings-page-header" style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--glass-border)", background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", position: "sticky", top: "60px", zIndex: 40, borderTopLeftRadius: "16px", borderTopRightRadius: "16px", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 className="settings-page-title m-0">
                  {activeTab === "profile" && "Profile"}
                  {activeTab === "public" && "Public Station"}
                  {activeTab === "preferences" && "Preferences"}
                  {activeTab === "shortcuts" && "Shortcuts"}
                </h1>
                <p className="settings-page-sub m-0 mt-1">
                  {activeTab === "profile" && "Manage your personal profile details."}
                  {activeTab === "public" && "Customize how others see your station."}
                  {activeTab === "preferences" && "Adjust your station experience."}
                  {activeTab === "shortcuts" && "Configure quick navigation keys."}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {status === "saved" && <span style={{ color: "#4ade80", fontSize: "0.875rem", marginRight: "0.5rem" }}>✓ Saved</span>}
                <button type="button" className="btn btn-secondary shadow-lg shadow-black/50" onClick={() => window.location.href = "/station"} style={{ background: "rgba(15, 15, 20, 0.9)", backdropFilter: "blur(12px)" }}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary shadow-lg shadow-purple-500/30" disabled={status === "saving"}>
                  {status === "saving" ? <span className="spinner" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE HEADERS */}
          {/* Split Title */}
          <div className="md:hidden">
            <div className="settings-page-header" style={{ padding: "2rem 2rem 0.5rem 2rem", background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <h1 className="settings-page-title m-0">Settings</h1>
              <p className="settings-page-sub m-0 mt-1">Manage your Orbit Station profile and preferences.</p>
            </div>
          </div>

          {/* Sticky Action Bar */}
          <div className="flex md:hidden" style={{ padding: "0.5rem 2rem 1rem 2rem", position: "sticky", top: "60px", zIndex: 40, justifyContent: "flex-end", alignItems: "center", gap: "0.5rem", pointerEvents: "none", background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", borderBottom: "1px solid var(--glass-border)", borderTop: isScrolled ? "1px solid var(--glass-border)" : "1px solid transparent", borderLeft: isScrolled ? "1px solid var(--glass-border)" : "1px solid transparent", borderRight: isScrolled ? "1px solid var(--glass-border)" : "1px solid transparent", borderTopLeftRadius: isScrolled ? "16px" : "0", borderTopRightRadius: isScrolled ? "16px" : "0", borderBottomLeftRadius: isScrolled ? "16px" : "0", borderBottomRightRadius: isScrolled ? "16px" : "0", transition: "all 0.3s ease" }}>
            <div style={{ pointerEvents: "auto", display: "flex", gap: "0.5rem", alignItems: "center", width: "100%", justifyContent: "flex-end" }}>
              {status === "saved" && <span style={{ color: "#4ade80", fontSize: "0.875rem", marginRight: "auto", background: "rgba(0,0,0,0.6)", padding: "4px 12px", borderRadius: "999px", backdropFilter: "blur(8px)" }}>✓ Saved</span>}
              <button type="button" className="btn btn-secondary shadow-lg shadow-black/50" onClick={() => window.location.href = "/station"} style={{ background: "rgba(15, 15, 20, 0.9)", backdropFilter: "blur(12px)" }}>
                Back
              </button>
              <button type="submit" className="btn btn-primary shadow-lg shadow-purple-500/30" disabled={status === "saving"}>
                {status === "saving" ? <span className="spinner" /> : "Save Changes"}
              </button>
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
                  <div className="settings-toggle-row rounded-lg border border-white/10" style={{ padding: "1rem" }}>
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

                  {/* Banner URL (Moved above Title Badge) */}
                  <div className="form-group">
                    <label className="form-label text-sm text-gray-300" htmlFor="s-banner">Banner Image URL</label>
                    <p className="text-xs text-gray-500 mb-3">
                      Used as the background banner on your public station profile. Leave blank to use default.
                    </p>
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

                  {/* Title badge selection */}
                  <div className="form-group">
                    <label className="form-label text-sm text-gray-300">Title Badge</label>
                    <p className="text-xs text-gray-500 mb-3">
                      Unlock prestigious badges by reaching milestones in Orbit Station.
                    </p>
                    <div className="flex flex-col gap-8">
                      {(() => {
                        let globalIndex = 0;
                        return [
                          { id: 'biasa', label: 'Common Badges', icon: 'CheckBadgeIcon', color: 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' },
                          { id: 'ekslusif', label: 'Special Badges', icon: 'StarIcon', color: 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]' },
                          { id: 'super-ekslusif', label: 'Premium Badges', icon: 'SparklesIcon', color: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' },
                          { id: 'developer', label: 'Exclusive Badges', icon: 'CpuChipIcon', color: 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' }
                        ].map(group => {
                          const colorOrder: Record<string, number> = {
                            rose: 1, pink: 2, amber: 3, emerald: 4, cyan: 5, blue: 6, indigo: 7, purple: 8, gray: 9
                          };

                          const sortedBadges = BADGE_REGISTRY
                            .filter(b => b.rarity === group.id)
                            .sort((a, b) => {
                              if (a.id === 'rookie-pilot') return -1;
                              if (b.id === 'rookie-pilot') return 1;
                              return (colorOrder[a.color] || 99) - (colorOrder[b.color] || 99);
                            });

                          const groupStartIndex = globalIndex;
                          globalIndex += sortedBadges.length;

                          return (
                            <div key={group.id} className="mb-2">
                              <div
                                className="flex justify-between items-center cursor-pointer md:cursor-default mb-3"
                                onClick={() => {
                                  if (window.innerWidth < 768) {
                                    setOpenBadgeCategory(openBadgeCategory === group.id ? "" : group.id);
                                  }
                                }}
                              >
                                <h4 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 m-0 ${group.color}`} style={{ marginBottom: "0.5rem" }}>
                                  <DynamicIcon name={group.icon} className="w-5 h-5" />
                                  {group.label}
                                </h4>
                                <SolidIcons.ChevronDownIcon
                                  className={`w-5 h-5 text-gray-400 md:hidden transition-transform duration-300 ${openBadgeCategory === group.id ? 'rotate-180' : ''}`}
                                />
                              </div>
                              <motion.div
                                initial={false}
                                animate={{ height: openBadgeCategory === group.id ? "auto" : 0, opacity: openBadgeCategory === group.id ? 1 : 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden md:!overflow-visible md:!h-auto md:!opacity-100"
                                style={{ paddingLeft: "1rem", paddingRight: "1rem", marginLeft: "-1rem", marginRight: "-1rem" }}
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  {sortedBadges.map((badge, idx) => {

                                    const isUnlocked = unlockedBadges.includes(badge.id);
                                    const isSelected = titleBadge === badge.id;

                                    return (
                                      <div className="zodiac-orbit-wrapper" style={{ position: 'relative' }} key={badge.id}>
                                        {isUnlocked && badge.id === 'zodiac-horizon' && (
                                          <>
                                            <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-back" />
                                            <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-back" />
                                          </>
                                        )}
                                        <div
                                          onClick={() => {
                                            if (isUnlocked) setTitleBadge(badge.id);
                                            else setPreviewBadge(badge);
                                          }}
                                          className={`badge-card relative group p-4 rounded-xl border flex gap-3 items-center cursor-pointer ${isSelected
                                            ? `ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0f0f16]`
                                            : isUnlocked
                                              ? 'hover:scale-[1.02] hover:shadow-lg'
                                              : 'bg-black/40 border-white/5 opacity-60 grayscale'
                                            } ${isUnlocked ? badge.effectClass : ''}`}
                                          style={{ position: 'relative', zIndex: 1 }}
                                        >
                                          {isUnlocked && badge.id === 'the-completionist' && <div className="badge-wave-layer" />}
                                          {isUnlocked && badge.id === 'zodiac-horizon' && <div className="badge-zodiac-wave-layer" />}
                                          <div className={`flex-1 min-w-0 flex items-center gap-2 pr-10`}>
                                            <div className={`badge-icon w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isUnlocked ? '' : 'bg-gray-800 text-gray-500 border border-gray-700 group-hover:bg-purple-500/20 group-hover:text-purple-400 group-hover:border-purple-500/50'
                                              }`} style={{ marginLeft: "0.5rem" }}>
                                              {isUnlocked ? (
                                                <DynamicIcon name={badge.icon} className="w-5 h-5 relative z-10" />
                                              ) : (
                                                <>
                                                  <SolidIcons.LockClosedIcon className="w-5 h-5 relative z-10 block group-hover:hidden" />
                                                  <SolidIcons.EyeIcon className="w-5 h-5 relative z-10 hidden group-hover:block" />
                                                </>
                                              )}
                                            </div>
                                            <div className="badge-content flex-1 min-w-0" style={{ margin: "0.4rem 0", padding: "0 0.3rem" }}>
                                              <h4 className={`text-sm font-bold truncate ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                                                {badge.name}
                                              </h4>
                                              <p className="text-xs text-gray-400 leading-snug mt-0.5 max-h-[2rem] overflow-y-auto hide-scrollbar">
                                                {badge.hint}
                                              </p>
                                            </div>
                                          </div>

                                          {isSelected && (
                                            <div className="absolute top-1/2 -translate-y-1/2 right-3 text-white bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7] z-10">
                                              <SolidIcons.CheckCircleIcon className="w-5 h-5" />
                                            </div>
                                          )}

                                        </div>
                                        {isUnlocked && badge.id === 'zodiac-horizon' && (
                                          <>
                                            <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-front" />
                                            <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-front" />
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </section>

              {/* Preferences Section */}
              <section className="settings-section settings-inner-section" style={{ display: activeTab === "preferences" ? "flex" : "none" }}>
                <h2 className="settings-section-title md:text-2xl mb-6">Preferences</h2>

                <div className="flex flex-col gap-4">
                  {/* Animation toggle */}
                  <div className="settings-toggle-row p-4 rounded-lg border border-white/10" style={{ padding: "1rem" }}>
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
                  <div className="settings-toggle-row p-4 rounded-lg border border-white/10 md:flex hidden" style={{ padding: "1rem" }}>
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
                    <div className="settings-toggle-row p-4 rounded-lg border border-white/10" style={{ padding: "1rem" }}>
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
                  <div className="settings-toggle-row p-4 rounded-lg border border-white/10" style={{ padding: "1rem" }}>
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
                  <div className="p-4 rounded-lg border border-white/10" style={{ padding: "1rem" }}>
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
                        <div className="flex gap-3 flex-wrap flex-col md:flex-row" style={{ padding: "0.5rem" }}>
                          <label
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md cursor-pointer transition-all ${notifSoundType === "default" ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-gray-400"}`}
                            style={{ borderStyle: "solid", borderWidth: "1px", padding: "0.5rem" }}
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
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md cursor-pointer transition-all ${notifSoundType === "custom" ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-gray-400"}`}
                            style={{ borderStyle: "solid", borderWidth: "1px", padding: "0.5rem" }}
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
                          <div className="flex items-center bg-black/30 rounded-lg border border-dashed border-white/20 flex-wrap" style={{ padding: "1rem" }}>
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
                              className={`text-xs px-4 py-2 rounded-sm font-semibold transition-all ${(!notifSoundUrl || notifSoundUrl === "/sounds/notif-default.mp3") ? "bg-white/5 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(109,40,217,0.4)]"}`}
                              style={{ padding: "0.5rem" }}
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
                  <div className="form-group flex flex-row items-center justify-between rounded-lg border border-white/10">
                    <label className="form-label text-sm text-gray-300 mb-0">Public Station</label>
                    <input
                      className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
                      value={shortcuts.publicStation}
                      readOnly
                      onKeyDown={handleShortcutKeyDown("publicStation")}
                      placeholder="Press key..."
                    />
                  </div>
                  <div className="form-group flex flex-row items-center justify-between rounded-lg border border-white/10">
                    <label className="form-label text-sm text-gray-300 mb-0">Friends</label>
                    <input
                      className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
                      value={shortcuts.friends}
                      readOnly
                      onKeyDown={handleShortcutKeyDown("friends")}
                      placeholder="Press key..."
                    />
                  </div>
                  <div className="form-group flex flex-row items-center justify-between rounded-lg border border-white/10">
                    <label className="form-label text-sm text-gray-300 mb-0">Analytics</label>
                    <input
                      className="input bg-black/30 border border-white/10 rounded-lg text-center font-mono focus:border-purple-500 uppercase"
                      value={shortcuts.analytics}
                      readOnly
                      onKeyDown={handleShortcutKeyDown("analytics")}
                      placeholder="Press key..."
                    />
                  </div>
                  <div className="form-group flex flex-row items-center justify-between rounded-lg border border-white/10">
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
                style={{ padding: "0.5rem 1rem" }}
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

      {/* Badge Preview Modal */}
      <AnimatePresence>
        {previewBadge && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setPreviewBadge(null)}
          >
            <div
              style={{ background: "#03000a", backgroundImage: "radial-gradient(circle at 50% 0%, #1a0b2e 0%, #03000a 80%)", border: "1px solid rgba(139, 92, 246, 0.3)", boxShadow: "0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(139, 92, 246, 0.1)", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "550px", display: "flex", flexDirection: "column", gap: "24px", maxHeight: "90vh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "white", margin: 0 }}>Badge Preview</h3>
                <button type="button" onClick={() => setPreviewBadge(null)} style={{ background: "transparent", border: "none", color: "gray", cursor: "pointer", padding: 0, display: "flex" }}>
                  <SolidIcons.XMarkIcon style={{ width: "24px", height: "24px" }} />
                </button>
              </div>

              {/* Preview Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: "32px", alignItems: "center", width: "100%" }}>

                {/* Top Row: Avatar & Badge Card */}
                <div style={{ display: "flex", width: "100%", gap: "24px", alignItems: "flex-start" }}>

                  {/* Avatar Preview (Left) */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold", textAlign: "center", margin: "0 0 12px 0" }}>Avatar Ring</p>

                    <div style={{ position: "relative", width: "80px", height: "80px", borderRadius: "50%", padding: "4px" }}
                      className={
                        previewBadge.rarity === "super-ekslusif" || previewBadge.rarity === "developer"
                          ? `avatar-badge avatar-exclusive-${previewBadge.id}`
                          : previewBadge.rarity === "ekslusif"
                            ? `avatar-badge avatar-badge-special-${previewBadge.color}`
                            : `avatar-badge avatar-badge-common-${previewBadge.color}`
                      }>
                      {previewBadge.id === 'zodiac-horizon' && (
                        <>
                          <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-back" />
                          <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-back" />
                        </>
                      )}
                      <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", position: "relative", zIndex: 1 }} className={(previewBadge.rarity === "super-ekslusif" || previewBadge.rarity === "developer" || previewBadge.rarity === "ekslusif") ? 'public-badge-sweep' : ''}>
                        {image ? (
                          <img src={image} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ background: "linear-gradient(135deg,#5b3fde,#22d3ee)", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 800, color: "#fff" }}>
                            {(profile.name ?? "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {previewBadge.id === 'zodiac-horizon' && (
                        <>
                          <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-front" />
                          <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-front" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Badge Card Preview (Right) */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold", textAlign: "left", margin: "0 0 12px 0" }}>Badge Card</p>

                    <div className="zodiac-orbit-wrapper" style={{ position: "relative", width: "100%" }}>
                      {previewBadge.id === 'zodiac-horizon' && (
                        <>
                          <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-back" />
                          <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-back" />
                        </>
                      )}
                      <div className={`badge-card relative p-4 rounded-xl border flex gap-3 items-center ${previewBadge.effectClass}`} style={{ position: "relative", zIndex: 1, overflow: "hidden", margin: 0, padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", height: "80px" }}>
                        {previewBadge.id === 'the-completionist' && <div className="badge-wave-layer" />}
                        {previewBadge.id === 'zodiac-horizon' && <div className="badge-zodiac-wave-layer" />}
                        <div style={{ display: "flex", flex: 1, minWidth: 0, alignItems: "center", gap: "12px", height: "100%" }}>
                          <div className="badge-icon" style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <DynamicIcon name={previewBadge.icon} className="w-5 h-5 relative z-10" />
                          </div>
                          <div className="badge-content hide-scrollbar" style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, maxHeight: "56px", overflowY: "auto", paddingRight: "4px" }}>
                            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "white", flexShrink: 0 }}>{previewBadge.name}</h4>
                            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "gray", lineHeight: "1.2" }}>{previewBadge.hint}</p>
                          </div>
                        </div>
                      </div>
                      {previewBadge.id === 'zodiac-horizon' && (
                        <>
                          <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-front" />
                          <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-front" />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Popup Profile Preview */}
                <div style={{ width: "100%" }}>
                  <p style={{ fontSize: "12px", color: "gray", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold", margin: "0 0 8px 0" }}>Popup Profile View</p>

                  {(() => {
                    const isExclusive = previewBadge.rarity === "super-ekslusif" || previewBadge.rarity === "developer";
                    const isSpecial = previewBadge.rarity === "ekslusif";
                    return (
                      <div className={`chat-mention-modal ${isExclusive ? previewBadge.effectClass : ''} ${previewBadge.id === 'shattered' ? 'modal-shattered' : ''}`}
                        style={{
                          position: "relative",
                          padding: "24px",
                          backgroundColor: "rgba(15,15,25,0.95)",
                          backgroundImage: isSpecial
                            ? `radial-gradient(circle at top right, ${getModalTint(previewBadge.color)}, transparent)`
                            : undefined,
                          borderColor: getModalBorder(previewBadge.color),
                          borderWidth: "1px",
                          borderStyle: "solid",
                          backdropFilter: "blur(20px)",
                          borderRadius: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px"
                        }}>

                        {isExclusive && <div className="modal-exclusive-sparkles" />}
                        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit", pointerEvents: "none", zIndex: 0 }}>
                          {previewBadge.id === "the-completionist" && <div className="modal-completionist-wave" />}
                          {previewBadge.id === "zodiac-horizon" && <div className="modal-zodiac-wave-layer" />}
                          {previewBadge.id === "zodiac-horizon" && <div className="modal-zodiac-blackhole" />}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative", zIndex: 10 }}>
                          <div style={{ position: "relative", flexShrink: 0, width: "64px", height: "64px", borderRadius: "50%", padding: "3px" }}
                            className={
                              previewBadge.rarity === "super-ekslusif" || previewBadge.rarity === "developer"
                                ? `avatar-badge avatar-exclusive-${previewBadge.id}`
                                : previewBadge.rarity === "ekslusif"
                                  ? `avatar-badge avatar-badge-special-${previewBadge.color}`
                                  : `avatar-badge avatar-badge-common-${previewBadge.color}`
                            }>
                            {previewBadge.id === 'zodiac-horizon' && (
                              <>
                                <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-back" />
                                <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-back" />
                              </>
                            )}
                            <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", position: "relative", zIndex: 1 }} className={(previewBadge.rarity === "super-ekslusif" || previewBadge.rarity === "developer" || previewBadge.rarity === "ekslusif") ? 'public-badge-sweep' : ''}>
                              {image ? (
                                <img src={image} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ background: "linear-gradient(135deg,#5b3fde,#22d3ee)", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
                                  {(profile.name ?? "?").charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {previewBadge.id === 'zodiac-horizon' && (
                              <>
                                <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-front" />
                                <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-front" />
                              </>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0, zIndex: 10, position: "relative" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                              <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>{name || profile.name || "Pilot"}</h4>
                            </div>
                            <p style={{ margin: "2px 0 0 0", fontSize: "14px", color: "gray" }}>@{username || profile.username || "pilot"}</p>

                            <div className={`badge-card ${(previewBadge.rarity === "super-ekslusif" || previewBadge.rarity === "developer" || previewBadge.rarity === "ekslusif") ? 'public-badge-sweep' : ''} ${previewBadge.effectClass}`}
                              style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "4px 20px 4px 4px", borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", marginTop: "6px", position: "relative", zIndex: 1 }}>
                              <div className="badge-icon" style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <DynamicIcon name={previewBadge.icon} className="w-[14px] h-[14px] relative z-10" />
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: "bold", color: "white" }}>{previewBadge.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
