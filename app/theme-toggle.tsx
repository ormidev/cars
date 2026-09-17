"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    });
    return () => { active = false; };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : 0;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    function applyTheme() {
      root.classList.add("theme-changing");
      root.dataset.theme = nextTheme;
      localStorage.setItem("car-accounts-theme", nextTheme);
      setTheme(nextTheme);
      window.setTimeout(() => root.classList.remove("theme-changing"), 700);
    }

    const viewTransition = (document as ViewTransitionDocument).startViewTransition;
    if (!viewTransition || reduceMotion) {
      applyTheme();
      return;
    }

    const transition = viewTransition.call(document, applyTheme);
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 620,
          easing: "cubic-bezier(.22,.8,.24,1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }

  return (
    <button ref={buttonRef} className={`theme-toggle ${theme === "dark" ? "is-dark" : "is-light"}`} type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.2A8.4 8.4 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" /></svg>
      )}
    </button>
  );
}
