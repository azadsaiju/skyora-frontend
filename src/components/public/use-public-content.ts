"use client";

/**
 * Shared data hook for the public marketing site.
 * Fetches GET /api/public/content (always fresh) and exposes
 * loading / error state plus a retry function so sections can
 * render skeletons and an inline error state with a Retry button.
 */

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { PublicContentDTO } from "@/lib/types";

export interface UsePublicContentResult {
  data: PublicContentDTO | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

export function usePublicContent(): UsePublicContentResult {
  const [data, setData] = useState<PublicContentDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api<PublicContentDTO>("/api/public/content", { cache: "no-store" })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData(null);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Could not load content. Check your connection and try again."
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Event handler — safe place to reset state before re-fetching.
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { data, error, loading, refetch };
}
