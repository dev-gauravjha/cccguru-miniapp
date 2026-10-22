export type LanguageMode = "en" | "hi" | "bilingual";

export const LANGUAGE_STORAGE_KEY = "ccc_language_preference";

/**
 * Returns saved language mode from localStorage.
 * Defaults to "hi" (Hindi) as CCC students predominantly prefer Hindi.
 */
export function getSavedLanguage(): LanguageMode {
  if (typeof window === "undefined") return "hi";
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "hi" || saved === "bilingual") {
      return saved;
    }
  } catch {
    // ignore
  }
  return "hi";
}

/**
 * Saves language mode to localStorage and emits an event for reactive updates across the app.
 */
export function setSavedLanguage(lang: LanguageMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    window.dispatchEvent(
      new CustomEvent("ccc_language_changed", { detail: lang })
    );
  } catch {
    // ignore
  }
}
