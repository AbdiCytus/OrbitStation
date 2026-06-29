"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, DocumentDuplicateIcon, CheckIcon } from "@heroicons/react/24/outline";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { generateSectorInvite } from "@/lib/actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sectorId: string;
  sectorName: string;
}

export default function SectorQRModal({ isOpen, onClose, sectorId, sectorName }: Props) {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && sectorId && !inviteToken) {
      const fetchToken = async () => {
        setIsLoading(true);
        const res = await generateSectorInvite(sectorId);
        if (res.error) {
          toast.error(res.error);
        } else if (res.data) {
          setInviteToken(res.data.token);
        }
        setIsLoading(false);
      };
      fetchToken();
    }
  }, [isOpen, sectorId, inviteToken]);

  if (!isOpen) return null;

  const joinUrl = inviteToken ? `${window.location.origin}/join/${inviteToken}` : "";

  const copyToClipboard = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success("Invite link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ padding: "20px" }}
        >
          <motion.div
            className="relative flex flex-col items-center rounded-3xl max-w-sm w-full overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            style={{
              padding: "32px",
              background: "rgba(15, 15, 25, 0.65)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 20px rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Cosmic Background Animation */}
            <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true" style={{ borderRadius: "inherit" }}>
              <div className="cosmic-stars"></div>
              <div className="cosmic-aurora" style={{ opacity: 0.4 }}></div>
            </div>

            {/* Header */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-comet hover:text-starlight bg-starlight/5 hover:bg-starlight/10 rounded-full transition-colors border-none cursor-pointer z-10"
              style={{ padding: "8px" }}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-starlight text-center relative z-10" style={{ margin: "8px 0 12px 0", textShadow: "0 0 12px rgba(139, 92, 246, 0.6)" }}>Invite to {sectorName}</h2>
            <p className="text-comet text-sm text-center relative z-10" style={{ margin: "0 0 24px 0" }}>
              Scan the QR code below or share the link to invite members without adding them as friends.
            </p>

            {/* QR Code */}
            <div className="bg-white rounded-2xl shadow-inner flex items-center justify-center relative z-10" style={{ width: "200px", height: "200px", margin: "0 0 24px 0", padding: "16px", boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
              {isLoading ? (
                <div className="w-10 h-10 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin"></div>
              ) : inviteToken ? (
                <QRCodeSVG
                  value={joinUrl}
                  size={168}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"Q"}
                  includeMargin={false}
                />
              ) : (
                <span className="text-red-500 text-sm">Failed to load</span>
              )}
            </div>

            {/* Link Copy */}
            <div className="w-full flex bg-cosmos/40 rounded-xl border border-border overflow-hidden relative z-10 shadow-inner" style={{ margin: "0" }}>
              <input
                type="text"
                readOnly
                value={joinUrl}
                className="w-full bg-transparent border-none text-comet text-sm focus:outline-none"
                style={{ padding: "12px 16px" }}
                placeholder={isLoading ? "Generating link..." : ""}
              />
              <button
                onClick={copyToClipboard}
                disabled={!inviteToken}
                className="bg-violet-600 hover:bg-violet-500 text-white transition-colors border-none cursor-pointer disabled:opacity-50 flex-shrink-0 flex items-center justify-center"
                style={{ padding: "12px 16px" }}
              >
                {copied ? <CheckIcon className="w-5 h-5" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
