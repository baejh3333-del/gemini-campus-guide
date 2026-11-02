"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.dataset.theme === "light");
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    try { localStorage.setItem("site-theme", next ? "light" : "dark"); } catch {}
  }

  return <button type="button" className="theme-toggle" onClick={toggle} aria-label={light ? "다크모드로 전환" : "화이트모드로 전환"} aria-pressed={light}>
    <span aria-hidden="true">{light ? "☾" : "☀"}</span><span>{light ? "다크모드" : "화이트모드"}</span>
  </button>;
}
