"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type {
  TelegramWebApp,
  TelegramUser,
  StudentSession,
} from "@/types/telegram";

interface TelegramContextValue {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  session: StudentSession | null;
  isReady: boolean;
  isTelegram: boolean;
  isDevPreview: boolean;
  theme: "light" | "dark";
  triggerHaptic: (
    type: "light" | "medium" | "heavy" | "selection" | "success" | "error" | "warning"
  ) => void;
  setBackButton: (visible: boolean, onClick?: () => void) => void;
  loginAsPreview: () => Promise<void>;
  logout: () => Promise<void>;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  user: null,
  session: null,
  isReady: false,
  isTelegram: false,
  isDevPreview: false,
  theme: "light",
  triggerHaptic: () => {},
  setBackButton: () => {},
  loginAsPreview: async () => {},
  logout: async () => {},
});

export function useTelegram() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [session, setSession] = useState<StudentSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isDevPreview, setIsDevPreview] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Check existing session on mount
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/session");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.session) {
          setSession(data.session);
          if (data.session.telegramUser) {
            setUser(data.session.telegramUser);
          }
          if (data.session.isDevPreview) {
            setIsDevPreview(true);
          }
        }
      }
    } catch {
      // Ignore network errors
    }
  }, []);

  // Login as browser preview mode
  const loginAsPreview = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPreviewMode: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setUser(data.session.telegramUser);
        setIsDevPreview(true);
      }
    } catch (err) {
      console.error("Preview login error:", err);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch("/api/telegram/logout", { method: "POST" });
      setSession(null);
      setUser(null);
      setIsDevPreview(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  // Back button handler
  const setBackButton = useCallback(
    (visible: boolean, onClick?: () => void) => {
      if (!webApp?.BackButton) return;

      if (visible && onClick) {
        webApp.BackButton.show();
        webApp.BackButton.onClick(onClick);
      } else {
        webApp.BackButton.hide();
      }
    },
    [webApp]
  );

  // Haptic feedback
  const triggerHaptic = useCallback(
    (type: "light" | "medium" | "heavy" | "selection" | "success" | "error" | "warning") => {
      if (!webApp?.HapticFeedback) return;

      if (type === "selection") {
        webApp.HapticFeedback.selectionChanged();
      } else if (
        type === "success" ||
        type === "error" ||
        type === "warning"
      ) {
        webApp.HapticFeedback.notificationOccurred(
          type as "success" | "error"
        );
      } else {
        webApp.HapticFeedback.impactOccurred(type);
      }
    },
    [webApp]
  );

  // Initialize Telegram WebApp instance
  const initTelegram = useCallback(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      setIsTelegram(true);

      // Call lifecycle methods
      tg.ready();
      try {
        tg.expand();
      } catch {
        // Expand might not be supported in some desktop environments
      }

      if (tg.colorScheme) {
        setTheme(tg.colorScheme);
      }

      // Check initData
      if (tg.initData && tg.initData.length > 0) {
        // Verify with server
        fetch("/api/telegram/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: tg.initData }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.session) {
              setSession(data.session);
              setUser(data.session.telegramUser);
            }
          })
          .catch((err) => {
            console.error("Telegram initData verification failed:", err);
          })
          .finally(() => {
            setIsReady(true);
          });
      } else {
        // Unsafe data fallback for visual development preview
        if (tg.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user);
        }
        setIsReady(true);
      }
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    // 1. Check existing session
    checkSession();

    // 2. Immediate check for Telegram WebApp
    if (initTelegram()) {
      return;
    }

    // 3. Graceful check for afterInteractive script execution (checks every 50ms up to 1 second)
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (initTelegram() || attempts >= 20) {
        clearInterval(interval);
        if (attempts >= 20 && (!window.Telegram || !window.Telegram.WebApp)) {
          // Browser environment outside Telegram
          setIsTelegram(false);
          setIsReady(true);

          // In development, automatically initialize preview session if none exists
          if (process.env.NODE_ENV !== "production") {
            loginAsPreview();
          }
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [checkSession, initTelegram, loginAsPreview]);

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        session,
        isReady,
        isTelegram,
        isDevPreview,
        theme,
        triggerHaptic,
        setBackButton,
        loginAsPreview,
        logout,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}
