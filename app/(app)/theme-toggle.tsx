"use client";

import { useSyncExternalStore } from "react";

const THEMES: [string, string][] = [
  ["modern", "모던"],
  ["warm", "따뜻함"],
  ["minimal", "미니멀"],
  ["dark", "다크"],
];

const EVENT = "themechange";

// DOM(data-theme)을 외부 스토어로 구독 — 인라인 스크립트가 페인트 전 적용한 값을 그대로 반영.
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function getSnapshot() {
  return document.documentElement.dataset.theme || "modern";
}
function getServerSnapshot() {
  return "modern";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function change(v: string) {
    document.documentElement.dataset.theme = v;
    try {
      localStorage.setItem("theme", v);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <label className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
      테마
      <select
        value={theme}
        onChange={(e) => change(e.target.value)}
        suppressHydrationWarning
        className="rounded-md border border-border bg-background px-1.5 py-1 text-xs text-foreground"
      >
        {THEMES.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
