"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";

type CropImageModalProps = {
  imageSrc: string | null;
  crop: { x: number; y: number };
  setCrop: (crop: { x: number; y: number }) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  onClose: () => void;
  onApplyCrop: () => void;
};

export default function CropImageModal({
  imageSrc,
  crop,
  setCrop,
  zoom,
  setZoom,
  onCropComplete,
  onClose,
  onApplyCrop,
}: CropImageModalProps) {
  return (
    <AnimatePresence>
      {imageSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div
            style={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "white",
              }}>
              Crop Profile Picture
            </h3>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "300px",
                background: "#000",
                borderRadius: "8px",
                overflow: "hidden",
              }}>
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
            <div
              style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "8px",
              }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "gray",
                  border: "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onApplyCrop}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#8b5cf6",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                }}>
                Apply Crop
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
