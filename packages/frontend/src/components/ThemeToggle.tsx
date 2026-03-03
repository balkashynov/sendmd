"use client";

import { useCallback, useEffect, useState } from "react";

function getStoredTheme(): "light" | "dark" | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sendmd_theme") as "light" | "dark" | null;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getActiveTheme(): "light" | "dark" {
  return getStoredTheme() ?? getSystemTheme();
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync state on mount (the inline script already set data-theme)
  useEffect(() => {
    setTheme(getActiveTheme());
  }, []);

  const toggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const next = theme === "light" ? "dark" : "light";

      const x = e.clientX;
      const y = e.clientY;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Fallback for browsers without View Transition API
      if (!document.startViewTransition) {
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("sendmd_theme", next);
        setTheme(next);
        return;
      }

      const transition = document.startViewTransition(() => {
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("sendmd_theme", next);
        setTheme(next);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    },
    [theme]
  );

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="text-ink opacity-80 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0 flex items-center"
    >
      {theme === "light" ? (
        /* Moon icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        /* Sun icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}
