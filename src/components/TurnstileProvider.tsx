import {
  createContext,
  useContext,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

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

interface TurnstileProviderProps {
  children: ReactNode;
}

export function TurnstileProvider({ children }: TurnstileProviderProps) {
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const pendingResolvers = useRef<((token: string) => void)[]>([]);

  const handleSuccess = useCallback((token: string) => {
    // Resolve all pending getToken promises
    const resolvers = pendingResolvers.current;
    pendingResolvers.current = [];
    for (const resolve of resolvers) {
      resolve(token);
    }
  }, []);

  const getToken = useCallback((): Promise<string> => {
    // Try to get token directly from the widget
    const existing = turnstileRef.current?.getResponse();
    if (existing) {
      return Promise.resolve(existing);
    }

    // Widget not ready yet — queue a resolver
    return new Promise<string>((resolve) => {
      pendingResolvers.current.push(resolve);
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
