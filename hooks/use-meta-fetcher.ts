"use client";

import { useState, useCallback } from "react";
import type { MetaResult } from "@/types";

type FetchMetaState = {
  data: MetaResult | null;
  loading: boolean;
  error: string | null;
};

/**
 * Hook untuk fetch metadata dari URL via /api/meta
 * Digunakan di form "Tambah Beacon" untuk auto-fill title, description, image.
 */
export function useMetaFetcher() {
  const [state, setState] = useState<FetchMetaState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchMeta = useCallback(async (url: string) => {
    if (!url.trim()) return;

    // Tambahkan https:// jika tidak ada protocol
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    setState({ data: null, loading: true, error: null });

    try {
      const res = await fetch(
        `/api/meta?url=${encodeURIComponent(normalizedUrl)}`
      );

      if (!res.ok) {
        const err = await res.json();
        setState({ data: null, loading: false, error: err.error ?? "Failed to fetch" });
        return null;
      }

      const meta: MetaResult = await res.json();
      setState({ data: meta, loading: false, error: null });
      return meta;
    } catch {
      setState({ data: null, loading: false, error: "Network error" });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, fetchMeta, reset };
}
