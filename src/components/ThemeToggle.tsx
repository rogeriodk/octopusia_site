"use client";

import { useSyncExternalStore } from "react";
import { icons } from "./Icons";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "../lib/theme";

type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sem armazenamento disponível: o tema vale só para esta visita.
    }
  }

  return (
    <button
      type="button"
      className="themeToggle"
      onClick={toggle}
      aria-label={next === "dark" ? "Ativar tema escuro" : "Ativar tema claro"}
      title={next === "dark" ? "Tema escuro" : "Tema claro"}
    >
      {theme === "dark" ? icons.sun : icons.moon}
    </button>
  );
}

