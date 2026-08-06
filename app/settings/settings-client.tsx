"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/lib/actions/social.actions";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-compress";
import DeveloperTab from "@/components/developer-tab";
import ChangePasswordModal from "@/components/change-password-modal";

import type { SettingsProfile, SettingsShortcuts, FormErrors } from "@/components/settings/types";
import SettingsHeader from "@/components/settings/settings-header";
import SettingsSidebar from "@/components/settings/settings-sidebar";
import ProfileTab from "@/components/settings/profile-tab";
import PublicStationTab from "@/components/settings/public-station-tab";
import PreferencesTab from "@/components/settings/preferences-tab";
import ShortcutsTab from "@/components/settings/shortcuts-tab";
import DangerZone from "@/components/settings/danger-zone";
import CropImageModal from "@/components/settings/crop-image-modal";
import DeleteAccountModal from "@/components/settings/delete-account-modal";
import BadgePreviewModal from "@/components/settings/badge-preview-modal";

// ── Utility: crop image to 256×256 ──────────────────────────────
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

// ── Props ───────────────────────────────────────────────────────
type Props = {
  profile: SettingsProfile;
  unlockedBadges: string[];
};

// ── Main Component (Orchestrator) ───────────────────────────────
export default function SettingsClient({ profile, unlockedBadges = [] }: Props) {
  // ─ Profile State ─
  const [name, setName] = useState(profile.name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [callsign, setCallsign] = useState(profile.callsign ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? "");
  const [titleBadge, setTitleBadge] = useState(profile.titleBadge ?? "");
  const [image, setImage] = useState(profile.image ?? "");

  // ─ Preferences State ─
  const [animationEnabled, setAnimationEnabled] = useState(profile.animationEnabled);
  const [hologramEnabled, setHologramEnabled] = useState(profile.hologramEnabled);
  const [allowFriendRequests, setAllowFriendRequests] = useState(profile.allowFriendRequests ?? true);
  const [staticBackgroundEnabled, setStaticBackgroundEnabled] = useState(profile.staticBackgroundEnabled ?? false);
  const [saveFilterSortEnabled, setSaveFilterSortEnabled] = useState(profile.saveFilterSortEnabled ?? false);
  const [notifSoundEnabled, setNotifSoundEnabled] = useState(profile.notifSoundEnabled ?? true);
  const [notifSoundUrl, setNotifSoundUrl] = useState(profile.notifSoundUrl ?? "/sounds/notif-default.mp3");
  const [notifSoundType, setNotifSoundType] = useState<"default" | "custom">(
    !profile.notifSoundUrl || profile.notifSoundUrl === "/sounds/notif-default.mp3" ? "default" : "custom"
  );
  const [autoHttps, setAutoHttps] = useState(true);
  const [autoFetchMeta, setAutoFetchMeta] = useState(true);

  // ─ Public Station State ─
  const [isPublic, setIsPublic] = useState(profile.station?.isPublic ?? false);
  const [allowPublicWorkspace, setAllowPublicWorkspace] = useState((profile.station as any)?.allowPublicWorkspace ?? false);

  // ─ Shortcuts State ─
  const defaultShortcuts: SettingsShortcuts = { myStation: "Escape", publicStation: "F1", friends: "F2", analytics: "F3", settings: "F4" };
  const [shortcuts, setShortcuts] = useState<SettingsShortcuts>(profile.shortcuts ? { ...defaultShortcuts, ...JSON.parse(profile.shortcuts) } : defaultShortcuts);

  // ─ UI State ─
  const [activeTab, setActiveTab] = useState<"profile" | "public" | "preferences" | "shortcuts" | "developer">("profile");
  const [isScrolled, setIsScrolled] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [, startTransition] = useTransition();
  const router = useRouter();

  // ─ Modal State ─
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openBadgeCategory, setOpenBadgeCategory] = useState<string>("biasa");
  const [previewBadge, setPreviewBadge] = useState<any>(null);

  // ─ Avatar Crop State ─
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // ── Effects ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAutoHttps(localStorage.getItem("os_auto_https") !== "false");
      setAutoFetchMeta(localStorage.getItem("os_auto_fetch_meta") !== "false");
    }
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────
  const handleShortcutKeyDown = (keyName: keyof SettingsShortcuts) => (e: React.KeyboardEvent<HTMLInputElement>) => {
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

    const isDuplicate = Object.entries(shortcuts).some(([k, v]) => k !== keyName && v === finalCombo);
    if (isDuplicate) {
      toast.error(`Shortcut ${finalCombo} is already in use.`);
      (e.target as HTMLInputElement).blur();
      return;
    }

    setShortcuts(s => ({ ...s, [keyName]: finalCombo }));
    (e.target as HTMLInputElement).blur();
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit.");
        return;
      }
      try {
        const compressed = await compressImage(file, 800, 0.8);
        setImageSrc(compressed);
      } catch (err) {
        toast.error("Failed to process image.");
      }
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
          staticBackgroundEnabled, saveFilterSortEnabled, notifSoundEnabled,
          notifSoundUrl: finalSoundUrl,
          shortcuts: JSON.stringify(shortcuts),
          isPublic, allowPublicWorkspace, image
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
        toast.error(data.error ?? "Failed to save settings");
      } else {
        localStorage.setItem("os_auto_https", String(autoHttps));
        localStorage.setItem("os_auto_fetch_meta", String(autoFetchMeta));
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

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <form onSubmit={handleSave} className="settings-content" style={{ padding: "2rem 1rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 80px)", width: "100%", gap: "1rem" }}>

        <div className="settings-modal-wrapper" style={{ width: "100%", maxWidth: "900px", background: "rgba(0, 0, 0, 0.2)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "visible", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>

          <SettingsHeader
            activeTab={activeTab}
            status={status}
            isScrolled={isScrolled}
            onBack={() => window.location.href = "/station"}
          />

          <div style={{ display: "flex", flex: 1 }} className="settings-scroll-container flex-col">
            {/* Left Sidebar (Desktop Only) */}
            <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Content Area */}
            <div className="settings-right-pane">

              <ProfileTab
                isActive={activeTab === "profile"}
                profile={profile}
                name={name}
                setName={setName}
                username={username}
                setUsername={setUsername}
                callsign={callsign}
                setCallsign={setCallsign}
                bio={bio}
                setBio={setBio}
                image={image}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                errorMsg={errorMsg}
                setShowPasswordModal={setShowPasswordModal}
              />

              <PublicStationTab
                isActive={activeTab === "public"}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
                username={username}
                allowPublicWorkspace={allowPublicWorkspace}
                setAllowPublicWorkspace={setAllowPublicWorkspace}
                bannerUrl={bannerUrl}
                setBannerUrl={setBannerUrl}
                titleBadge={titleBadge}
                setTitleBadge={setTitleBadge}
                unlockedBadges={unlockedBadges}
                openBadgeCategory={openBadgeCategory}
                setOpenBadgeCategory={setOpenBadgeCategory}
                setPreviewBadge={setPreviewBadge}
              />

              <PreferencesTab
                isActive={activeTab === "preferences"}
                animationEnabled={animationEnabled}
                setAnimationEnabled={setAnimationEnabled}
                hologramEnabled={hologramEnabled}
                setHologramEnabled={setHologramEnabled}
                staticBackgroundEnabled={staticBackgroundEnabled}
                setStaticBackgroundEnabled={setStaticBackgroundEnabled}
                saveFilterSortEnabled={saveFilterSortEnabled}
                setSaveFilterSortEnabled={setSaveFilterSortEnabled}
                allowFriendRequests={allowFriendRequests}
                setAllowFriendRequests={setAllowFriendRequests}
                autoHttps={autoHttps}
                setAutoHttps={setAutoHttps}
                autoFetchMeta={autoFetchMeta}
                setAutoFetchMeta={setAutoFetchMeta}
                notifSoundEnabled={notifSoundEnabled}
                setNotifSoundEnabled={setNotifSoundEnabled}
                notifSoundType={notifSoundType}
                setNotifSoundType={setNotifSoundType}
                notifSoundUrl={notifSoundUrl}
                setNotifSoundUrl={setNotifSoundUrl}
                handleAudioFileChange={handleAudioFileChange}
              />

              <ShortcutsTab
                isActive={activeTab === "shortcuts"}
                shortcuts={shortcuts}
                handleShortcutKeyDown={handleShortcutKeyDown}
              />

              {/* Developer Section */}
              <section className="settings-section settings-inner-section desktop-only-section" style={{ display: activeTab === "developer" ? "flex" : "none" }}>
                <DeveloperTab />
              </section>

            </div>
          </div>

          {status === "error" && (
            <p className="login-form-error absolute bottom-6 left-1/2 -translate-x-1/2 m-0 bg-red-900/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-500/50 z-50">{errorMsg}</p>
          )}
        </div>

        <DangerZone onOpenDeleteModal={() => setShowDeleteModal(true)} />
      </form>

      {/* Modals */}
      <CropImageModal
        imageSrc={imageSrc}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        onCropComplete={onCropComplete}
        onClose={() => setImageSrc(null)}
        onApplyCrop={handleCropImage}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        isDeleting={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={handleDeleteAccount}
      />

      <BadgePreviewModal
        previewBadge={previewBadge}
        onClose={() => setPreviewBadge(null)}
        image={image}
        profile={profile}
        name={name}
        username={username}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
}
