import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, UserPlusIcon, GlobeAltIcon, EyeIcon, RocketLaunchIcon, UsersIcon } from "@heroicons/react/24/outline";
import { DynamicIcon } from "@/components/dynamic-icon";
import { BADGE_REGISTRY } from "@/lib/badges/registry";
import { getModalTint, getModalBorder } from "@/components/group-chat-modal";

type MentionDetailPopupProps = {
  mentionDetail: { type: "user" | "beacon"; data: any } | null;
  onClose: () => void;
  myFriends: any[];
  pendingRequests: Set<string>;
  onSendFriendRequest: (userId: string) => void;
  onViewBeaconDetail: (beaconId: string) => void;
};

export default function MentionDetailPopup({
  mentionDetail,
  onClose,
  myFriends,
  pendingRequests,
  onSendFriendRequest,
  onViewBeaconDetail,
}: MentionDetailPopupProps) {
  return (
    <AnimatePresence>
      {mentionDetail &&
        (() => {
          const isUserType = mentionDetail.type === "user";
          const allowAddFriend = isUserType && mentionDetail.data.allowFriendRequests !== false;
          const allowVisitProfile = isUserType && mentionDetail.data.station?.isPublic !== false;
          const isAlreadyFriend = isUserType && myFriends.some((f) => f.id === mentionDetail.data.id);
          const isPending = isUserType && pendingRequests.has(mentionDetail.data.id);

          const dataAsUser = mentionDetail.data as any;
          const badge =
            isUserType && dataAsUser.titleBadge
              ? BADGE_REGISTRY.find((b) => b.id === dataAsUser.titleBadge)
              : null;
          const isSpecial = badge?.rarity === "ekslusif";
          const isExclusive = badge?.rarity === "super-ekslusif" || badge?.rarity === "developer";

          const avatarBadgeClass = badge
            ? isExclusive
              ? `avatar-badge avatar-exclusive-${badge.id}`
              : isSpecial
                ? `avatar-badge avatar-badge-special-${badge.color}`
                : `avatar-badge avatar-badge-common-${badge.color}`
            : "";

          const avatarSweepClass = isExclusive || isSpecial ? "public-badge-sweep" : "";

          return (
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={`!absolute z-[120] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border flex flex-col gap-4 min-w-[300px] chat-mention-modal ${isExclusive && badge ? badge.effectClass : ""} ${badge?.id === "shattered" ? "modal-shattered" : ""}`}
              style={{
                padding: "1.5rem",
                backgroundColor: "rgba(15,15,25,0.95)",
                backgroundImage:
                  badge && isSpecial
                    ? `radial-gradient(circle at top right, ${getModalTint(badge.color)}, transparent)`
                    : undefined,
                borderColor: getModalBorder(badge?.color),
                backdropFilter: "blur(20px)",
              }}
            >
              {isExclusive && <div className="modal-exclusive-sparkles" />}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  borderRadius: "inherit",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              >
                {badge?.id === "the-completionist" && <div className="modal-completionist-wave" />}
                {badge?.id === "zodiac-horizon" && <div className="modal-zodiac-wave-layer" />}
                {badge?.id === "zodiac-horizon" && <div className="modal-zodiac-blackhole" />}
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer z-50"
              >
                <XMarkIcon width={20} height={20} />
              </button>

              <div className="flex items-center gap-5 relative z-10">
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {badge?.id === "zodiac-horizon" && (
                    <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-back" />
                  )}
                  {badge?.id === "zodiac-horizon" && (
                    <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-back" />
                  )}
                  <div
                    className={`shrink-0 flex items-center justify-center rounded-full bg-[#1a1a2e] ${avatarBadgeClass}`}
                    style={
                      {
                        width: "74px",
                        height: "74px",
                        "--avatar-radius": "37px",
                        overflow: "visible",
                        position: "relative",
                        zIndex: 1,
                        ...(!badge
                          ? {
                              border: "3px solid #a78bfa",
                              boxShadow: "0 0 20px rgba(167, 139, 250, 0.4)",
                            }
                          : {}),
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className={`w-full h-full rounded-full overflow-hidden relative ${avatarSweepClass}`}
                    >
                      <img
                        src={
                          mentionDetail.data.image ||
                          mentionDetail.data.faviconUrl ||
                          "/default.png"
                        }
                        alt=""
                        className="w-full h-full object-cover relative z-10"
                      />
                    </div>
                  </div>
                  {badge?.id === "zodiac-horizon" && (
                    <div className="avatar-exclusive-zodiac-horizon-orbit-1 avatar-exclusive-zodiac-horizon-orbit-front" />
                  )}
                  {badge?.id === "zodiac-horizon" && (
                    <div className="avatar-exclusive-zodiac-horizon-orbit-2 avatar-exclusive-zodiac-horizon-orbit-front" />
                  )}
                </div>
                <div className="flex flex-col pr-6">
                  <h4 className="text-white font-bold text-lg m-0">
                    {mentionDetail.data.name || mentionDetail.data.title}
                  </h4>
                  {isUserType ? (
                    <>
                      <p className="text-gray-400 text-sm m-0">
                        @{mentionDetail.data.username}{" "}
                        {mentionDetail.data.callsign ? `• ${mentionDetail.data.callsign}` : ""}
                      </p>
                      {badge && (
                        <div
                          className="zodiac-orbit-wrapper"
                          style={{ position: "relative", width: "fit-content" }}
                        >
                          {badge.id === "zodiac-horizon" && (
                            <>
                              <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-back" />
                              <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-back" />
                            </>
                          )}
                          <div
                            className={`badge-card ${isExclusive || isSpecial ? "public-badge-sweep" : ""} ${badge.effectClass} pr-5 py-1 pl-1 rounded-full flex items-center gap-2.5 border backdrop-blur-sm shadow-lg mt-1.5`}
                            style={{
                              width: "fit-content",
                              position: "relative",
                              zIndex: 1,
                              marginTop: "0.25rem",
                            }}
                          >
                            {badge.id === "the-completionist" && (
                              <div className="badge-wave-layer" />
                            )}
                            {badge.id === "zodiac-horizon" && (
                              <div className="badge-zodiac-wave-layer" />
                            )}
                            <div className="badge-icon w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                              <DynamicIcon
                                name={badge.icon as any}
                                className="w-3.5 h-3.5 relative z-10"
                              />
                            </div>
                            <span
                              className="badge-content relative z-10 text-white font-bold tracking-wide text-[12px] drop-shadow-md"
                              style={{ marginRight: "0.5rem" }}
                            >
                              {badge.name}
                            </span>
                          </div>
                          {badge.id === "zodiac-horizon" && (
                            <>
                              <div className="badge-zodiac-orbit-1 badge-zodiac-orbit-front" />
                              <div className="badge-zodiac-orbit-2 badge-zodiac-orbit-front" />
                            </>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-violet-400 text-sm m-0">Sector Beacon Reference</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full">
                {isUserType ? (
                  <>
                    {allowAddFriend && (
                      <button
                        disabled={isAlreadyFriend || isPending}
                        onClick={() => {
                          if (!isAlreadyFriend && !isPending) {
                            onSendFriendRequest(mentionDetail.data.id);
                          }
                        }}
                        style={{ padding: "5px 0" }}
                        className={`flex-1 flex justify-center items-center gap-2 rounded-xl text-sm font-semibold transition-colors border-none ${
                          isAlreadyFriend || isPending
                            ? "bg-white/5 text-gray-400 cursor-default"
                            : "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                        }`}
                      >
                        {isAlreadyFriend ? (
                          <UsersIcon width={18} height={18} />
                        ) : (
                          <UserPlusIcon width={18} height={18} />
                        )}
                        {isAlreadyFriend ? "Friends" : isPending ? "Pending" : "Add Friend"}
                      </button>
                    )}
                    {allowVisitProfile && (
                      <a
                        href={`/station/${mentionDetail.data.username}`}
                        target="_blank"
                        style={{ padding: "5px 0", color: "white" }}
                        className="flex-1 flex justify-center items-center gap-2 text-center bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors no-underline"
                      >
                        <GlobeAltIcon width={18} height={18} /> Visit Profile
                      </a>
                    )}
                    {!allowAddFriend && !allowVisitProfile && (
                      <p className="text-gray-500 text-sm italic w-full text-center m-0">
                        This pilot&apos;s station is completely private.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onViewBeaconDetail(mentionDetail.data.id);
                      }}
                      style={{ padding: "5px 0" }}
                      className="flex-1 flex justify-center items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors border-none cursor-pointer"
                    >
                      <EyeIcon width={18} height={18} /> See Detail
                    </button>
                    <a
                      href={mentionDetail.data.url}
                      target="_blank"
                      style={{ padding: "5px 0", color: "white" }}
                      className="flex-1 flex justify-center items-center gap-2 text-center bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors no-underline"
                    >
                      <RocketLaunchIcon width={18} height={18} /> Launch
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          );
        })()}
    </AnimatePresence>
  );
}
