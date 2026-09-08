import React, { createContext, useContext, useEffect, useState } from "react";

const THEMES = ["espanol_chic", "tactical_dark", "deep_jungle", "desert_sand"];
export const THEME_LABELS = {
  espanol_chic: "Chic Español",
  tactical_dark: "Tactical Dark",
  deep_jungle: "Deep Jungle",
  desert_sand: "Desert Sand",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("eg_theme");
    return THEMES.includes(stored) ? stored : "espanol_chic";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("eg_theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
