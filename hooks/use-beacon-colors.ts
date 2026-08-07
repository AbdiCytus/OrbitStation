"use client";

import { useState, useEffect, useRef } from "react";
import type { SectorWithBeacons } from "@/types";

// Persistent memory cache across mounts
const globalHueCache = new Map<string, number>();

/**
 * Computes dominant hue (color category) for each beacon by
 * sampling its OG image or favicon. Results are cached per beacon
 * ID so they won't be recomputed unless the sector list changes.
 */
export function useBeaconColors(allSectors: SectorWithBeacons[], enabled: boolean = true) {
  const [beaconColors, setBeaconColors] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const [k, v] of globalHueCache.entries()) {
      initial[k] = v;
    }
    return initial;
  });

  const isComputingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const allBeacons = allSectors.flatMap((s) => s.beacons);
    const beaconsToProcess = allBeacons.filter(
      (b) => !globalHueCache.has(b.id) && (b.imageUrl || b.faviconUrl)
    );

    if (beaconsToProcess.length === 0) {
      // Sync any cached values to state
      setBeaconColors((prev) => {
        let changed = false;
        const updated = { ...prev };
        for (const b of allBeacons) {
          const cached = globalHueCache.get(b.id);
          if (cached !== undefined && updated[b.id] !== cached) {
            updated[b.id] = cached;
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
      return;
    }

    if (isComputingRef.current) return;
    isComputingRef.current = true;

    let isCancelled = false;

    const getProxyUrl = (url?: string | null) => {
      if (!url) return undefined;
      if (url.startsWith("/")) return url;
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    };

    const processSingleBeacon = (b: { id: string; imageUrl?: string | null; faviconUrl?: string | null }) => {
      return new Promise<number>((resolve) => {
        const url = getProxyUrl(b.imageUrl || b.faviconUrl);
        if (!url) {
          resolve(-1);
          return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";

        const timeout = setTimeout(() => {
          img.src = "";
          resolve(-1);
        }, 4000);

        img.onload = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 48; // Smaller thumbnail for faster processing
            let w = img.width || 48;
            let h = img.height || 48;
            if (w > MAX_SIZE || h > MAX_SIZE) {
              const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
              w = Math.max(1, Math.floor(w * ratio));
              h = Math.max(1, Math.floor(h * ratio));
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) {
              resolve(-1);
              return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;

            const bins: Record<string, { r: number; g: number; b: number; count: number }> = {};
            let maxCount = 0;
            let dominantRGB = { r: 0, g: 0, b: 0 };

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i],
                g = data[i + 1],
                b_val = data[i + 2],
                a = data[i + 3];
              if (a < 128) continue;

              const key = `${Math.floor(r / 32)},${Math.floor(g / 32)},${Math.floor(b_val / 32)}`;
              if (!bins[key]) bins[key] = { r: 0, g: 0, b: 0, count: 0 };
              bins[key].r += r;
              bins[key].g += g;
              bins[key].b += b_val;
              bins[key].count++;

              if (bins[key].count > maxCount) {
                maxCount = bins[key].count;
                dominantRGB = {
                  r: Math.round(bins[key].r / maxCount),
                  g: Math.round(bins[key].g / maxCount),
                  b: Math.round(bins[key].b / maxCount),
                };
              }
            }

            if (maxCount === 0) {
              resolve(-1);
              return;
            }

            const r = dominantRGB.r / 255;
            const g = dominantRGB.g / 255;
            const b_val = dominantRGB.b / 255;

            let max = Math.max(r, g, b_val),
              min = Math.min(r, g, b_val);
            let h_val = 0,
              s_val = 0,
              l_val = (max + min) / 2;

            if (max !== min) {
              let d = max - min;
              s_val = l_val > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case r:
                  h_val = (g - b_val) / d + (g < b_val ? 6 : 0);
                  break;
                case g:
                  h_val = (b_val - r) / d + 2;
                  break;
                case b_val:
                  h_val = (r - g) / d + 4;
                  break;
              }
              h_val /= 6;
            }

            h_val = Math.round(h_val * 360);
            s_val = Math.round(s_val * 100);
            l_val = Math.round(l_val * 100);

            let category = 0;
            if (l_val < 20 || (s_val < 15 && l_val < 50)) category = 8;
            else if (l_val > 80 || (s_val < 15 && l_val >= 50)) category = 1;
            else {
              if (h_val < 15 || h_val >= 345) category = 2;
              else if (h_val < 45) category = 3;
              else if (h_val < 75) category = 4;
              else if (h_val < 165) category = 5;
              else if (h_val < 265) category = 6;
              else category = 7;
            }

            let hueForSort = h_val;
            if (category === 2 && hueForSort >= 345) hueForSort -= 360;

            resolve(category * 1000 + hueForSort + 360);
          } catch {
            resolve(-1);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          resolve(-1);
        };

        img.src = url;
      });
    };

    const processInBatches = async () => {
      const BATCH_SIZE = 3;
      for (let i = 0; i < beaconsToProcess.length; i += BATCH_SIZE) {
        if (isCancelled) break;
        const batch = beaconsToProcess.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (b) => {
            const hue = await processSingleBeacon(b);
            globalHueCache.set(b.id, hue);
            return { id: b.id, hue };
          })
        );

        if (!isCancelled) {
          setBeaconColors((prev) => {
            const updated = { ...prev };
            results.forEach((r) => {
              updated[r.id] = r.hue;
            });
            return updated;
          });
        }

        // Yield to browser main thread between batches
        await new Promise((res) => setTimeout(res, 40));
      }
      isComputingRef.current = false;
    };

    processInBatches();

    return () => {
      isCancelled = true;
      isComputingRef.current = false;
    };
  }, [allSectors, enabled]);

  return beaconColors;
}

