"use client";

/**
 * Cloudflare Turnstile widget (Prompt 5).
 * - Loads the Turnstile script once and renders an explicit widget.
 * - Reports the token upward via onToken; a null token means "not solved"
 *   (expired, errored, or still pending).
 * - Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured,
 *   so local/dev environments without anti-bot keep working.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
  getResponse: (widgetId?: string) => string;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser"));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );
    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile loaded but API missing"));
    };
    const onError = () => {
      scriptPromise = null; // allow retry on next mount
      reject(new Error("Could not load the captcha. Check your connection."));
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    } else if (window.turnstile) {
      resolve(window.turnstile);
    }
  });
  return scriptPromise;
}

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
}

export function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleToken = useCallback(
    (token: string | null) => onToken(token),
    [onToken]
  );

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    loadTurnstile()
      .then((ts) => {
        if (cancelled || !containerRef.current) return;
        if (widgetIdRef.current !== null) return;
        widgetIdRef.current = ts.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            setError(null);
            handleToken(token);
          },
          "expired-callback": () => handleToken(null),
          "error-callback": () => {
            handleToken(null);
            setError("Captcha failed to load — refresh the page to retry.");
          },
          theme: "light",
          "response-field": false,
        });
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Captcha failed to load — refresh the page to retry.");
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // widget already gone
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, handleToken]);

  if (!siteKey) return null; // anti-bot disabled in this environment

  return (
    <div className="space-y-1.5">
      <span className="font-grotesk text-xs font-bold uppercase tracking-wide">
        Security check
      </span>
      <div
        id={containerId}
        ref={containerRef}
        className={loaded ? "" : "min-h-[65px] rounded-lg bg-cream"}
        role="group"
        aria-label="Human verification"
      />
      {error ? (
        <p role="alert" className="text-xs font-medium text-brand-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const turnstileEnabled = Boolean(
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
);
