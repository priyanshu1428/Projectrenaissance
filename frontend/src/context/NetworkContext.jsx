import React, { createContext, useContext, useEffect, useState } from "react";

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine);
  const [manualOffline, setManualOffline] = useState(false);

  useEffect(() => {
    const up = () => setBrowserOnline(true);
    const down = () => setBrowserOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const online = browserOnline && !manualOffline;
  const toggle = () => setManualOffline((v) => !v);

  return (
    <NetworkContext.Provider value={{ online, toggle, manualOffline, browserOnline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);
