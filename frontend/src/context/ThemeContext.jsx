import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

// localStorage-аас уншиж, html дээр .dark class нэмнэ (default: dark)
const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem("aura-theme");
    return saved === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
};

const applyTheme = (t) => {
  const html = document.documentElement;
  if (t === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const t = getInitialTheme();
    applyTheme(t);
    return t;
  });

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem("aura-theme", theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
