"use client";

import { useState, useEffect, useRef } from "react";
import type { SectorWithBeacons } from "@/types";

/**
 * Computes dominant hue (color category) for each beacon by
 * sampling its OG image or favicon. Results are cached per beacon
 * ID so they won't be recomputed unless the sector list changes.
 */
export function useBeaconColors(allSectors: SectorWithBeacons[]) {
  const [beaconColors, setBeaconColors] = useState<Record<string, number>>({});
  const processedColorsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const beaconsToProcess = allSectors
      .flatMap((s) => s.beacons)
      .filter(
        (b) =>
          beaconColors[b.id] === undefined && (b.imageUrl || b.faviconUrl),
      );

    if (beaconsToProcess.length === 0) return;

    let isMounted = true;

    const computeColors = async () => {
      const getProxyUrl = (url?: string | null) => {
        if (!url) return undefined;
        if (url.startsWith("/")) return url;
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
      };

      beaconsToProcess.forEach((b) => processedColorsRef.current.add(b.id));

      const promises = beaconsToProcess.map(async (b) => {
        const url = getProxyUrl(b.imageUrl || b.faviconUrl);
        if (!url) return { id: b.id, hue: -1 };

        try {
          const hue = await new Promise<number>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";

            const timeout = setTimeout(() => {
              img.src = ""; // cancel
              resolve(-1);
            }, 5000);

            img.onload = () => {
              clearTimeout(timeout);
              try {
                const canvas = document.createElement("canvas");
                const MAX_SIZE = 64;
                let w = img.width,
                  h = img.height;
                if (w > MAX_SIZE || h > MAX_SIZE) {
                  const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
                  w = Math.floor(w * ratio);
                  h = Math.floor(h * ratio);
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  resolve(-1);
                  return;
                }
                ctx.drawImage(img, 0, 0, w, h);
                const data = ctx.getImageData(0, 0, w, h).data;

                const bins: Record<
                  string,
                  { r: number; g: number; b: number; count: number }
                > = {};
                let maxCount = 0;
                let dominantRGB = { r: 0, g: 0, b: 0 };

                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i],
                    g = data[i + 1],
                    b_val = data[i + 2],
                    a = data[i + 3];
                  if (a < 128) continue;

                  const key = `${Math.floor(r / 32)},${Math.floor(g / 32)},${Math.floor(b_val / 32)}`;
                  if (!bins[key])
                    bins[key] = { r: 0, g: 0, b: 0, count: 0 };
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
                  s_val =
                    l_val > 0.5 ? d / (2 - max - min) : d / (max + min);
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
                if (l_val < 20 || (s_val < 15 && l_val < 50)) category = 7;
                else if (l_val > 80 || (s_val < 15 && l_val >= 50))
                  category = 8;
                else {
                  if (h_val < 15 || h_val >= 345) category = 1;
                  else if (h_val < 45) category = 2;
                  else if (h_val < 75) category = 3;
                  else if (h_val < 165) category = 4;
                  else if (h_val < 265) category = 5;
                  else category = 6;
                }

                let hueForSort = h_val;
                if (category === 1 && hueForSort >= 345) hueForSort -= 360;

                resolve(category * 1000 + hueForSort + 360);
              } catch (err) {
                resolve(-1);
              }
            };
            img.onerror = () => {
              clearTimeout(timeout);
              resolve(-1);
            };
            img.src = url;
          });
          return { id: b.id, hue };
        } catch {
          return { id: b.id, hue: -1 };
        }
      });

      const results = await Promise.all(promises);

      if (isMounted) {
        setBeaconColors((prev) => {
          const updated = { ...prev };
          results.forEach((r) => {
            updated[r.id] = r.hue;
          });
          return updated;
        });
      }
    };
    computeColors();
    return () => {
      isMounted = false;
    };
  }, [allSectors]);

  return beaconColors;
}
