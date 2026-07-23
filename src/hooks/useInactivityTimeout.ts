import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useInactivityTimeout(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const { token, signOut } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only monitor if the user is currently authenticated
    if (!token) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        handleLogout();
      }, timeoutMs);
    };

    const handleLogout = () => {
      signOut();
      toast.warning("Logged out due to inactivity", {
        description: "Your session expired after 30 minutes of inactivity.",
        duration: 8000,
      });
    };

    // User interactions to listen to
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];

    // Initialize timer
    resetTimer();

    // Attach listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Pause timer when page is hidden (e.g. user switched tabs) and resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      } else {
        resetTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [token, signOut, timeoutMs]);
}
