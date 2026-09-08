import React, { createContext, useContext, useEffect, useState } from "react";

const THEMES = ["parisian_chic", "tactical_dark", "deep_jungle", "desert_sand"];
export const THEME_LABELS = {
  parisian_chic: "Parisian Chic",
  tactical_dark: "Tactical Dark",
  deep_jungle: "Deep Jungle",
  desert_sand: "Desert Sand",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("eg_theme") || "parisian_chic";
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
