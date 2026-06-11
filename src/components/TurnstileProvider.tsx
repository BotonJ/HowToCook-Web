import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
const TOKEN_TIMEOUT_MS = 10_000;

interface TurnstileContextValue {
  getToken: () => Promise<string>;
}

const TurnstileContext = createContext<TurnstileContextValue | null>(null);

export function useTurnstileToken(): TurnstileContextValue {
  const ctx = useContext(TurnstileContext);
  if (!ctx) {
    throw new Error("useTurnstileToken must be used within TurnstileProvider");
  }
  return ctx;
}

interface PendingEntry {
  resolve: (token: string) => void;
  reject: (reason: Error) => void;
  timerId: ReturnType<typeof setTimeout>;
}

interface TurnstileProviderProps {
  children: ReactNode;
}

export function TurnstileProvider({ children }: TurnstileProviderProps) {
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const pendingResolvers = useRef<PendingEntry[]>([]);

  // H-18: Clean up all pending resolvers on unmount
  useEffect(() => {
    return () => {
      for (const entry of pendingResolvers.current) {
        clearTimeout(entry.timerId);
        entry.reject(new Error("TurnstileProvider unmounted while waiting for token"));
      }
      pendingResolvers.current = [];
    };
  }, []);

  const handleSuccess = useCallback((token: string) => {
    // Resolve all pending getToken promises
    const entries = pendingResolvers.current;
    pendingResolvers.current = [];
    for (const entry of entries) {
      clearTimeout(entry.timerId);
      entry.resolve(token);
    }
  }, []);

  const getToken = useCallback((): Promise<string> => {
    // Try to get token directly from the widget
    const existing = turnstileRef.current?.getResponse();
    if (existing) {
      return Promise.resolve(existing);
    }

    // Widget not ready yet — queue a resolver with a timeout
    return new Promise<string>((resolve, reject) => {
      const timerId = setTimeout(() => {
        // Remove this entry from pending list
        const idx = pendingResolvers.current.findIndex(e => e.timerId === timerId);
        if (idx !== -1) pendingResolvers.current.splice(idx, 1);
        reject(new Error("Turnstile token request timed out"));
      }, TOKEN_TIMEOUT_MS);

      pendingResolvers.current.push({ resolve, reject, timerId });
    });
  }, []);

  // No site key configured → skip Turnstile entirely
  if (!SITE_KEY) {
    return (
      <TurnstileContext.Provider
        value={{ getToken: () => Promise.resolve("") }}
      >
        {children}
      </TurnstileContext.Provider>
    );
  }

  return (
    <TurnstileContext.Provider value={{ getToken }}>
      {children}
      {/* Hidden widget — renders invisible challenge */}
      <div style={{ position: "fixed", bottom: 0, left: 0, zIndex: -1 }}>
        <Turnstile
          ref={turnstileRef}
          siteKey={SITE_KEY}
          onSuccess={handleSuccess}
          options={{ size: "invisible" }}
        />
      </div>
    </TurnstileContext.Provider>
  );
}
