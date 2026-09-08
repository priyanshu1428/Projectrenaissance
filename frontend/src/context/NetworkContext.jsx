import React, { createContext, useContext, useEffect, useState } from "react";

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [online, setOnline] = useState(true);
  const [lastKnown, setLastKnown] = useState(() => {
    const raw = localStorage.getItem("eg_last_known");
    return raw ? JSON.parse(raw) : null;
  });

  const toggle = () => {
    setOnline((prev) => {
      const next = !prev;
      if (!next) {
        // going offline -> capture last-known coords
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                at: new Date().toISOString(),
              };
              setLastKnown(coords);
              localStorage.setItem("eg_last_known", JSON.stringify(coords));
            },
            () => {
              // fallback dummy coords when geo denied
              const coords = { lat: 48.8566, lng: 2.3522, at: new Date().toISOString(), fallback: true };
              setLastKnown(coords);
              localStorage.setItem("eg_last_known", JSON.stringify(coords));
            }
          );
        } else {
          const coords = { lat: 48.8566, lng: 2.3522, at: new Date().toISOString(), fallback: true };
          setLastKnown(coords);
          localStorage.setItem("eg_last_known", JSON.stringify(coords));
        }
      }
      return next;
    });
  };

  const clearLastKnown = () => {
    setLastKnown(null);
    localStorage.removeItem("eg_last_known");
  };

  return (
    <NetworkContext.Provider value={{ online, toggle, lastKnown, clearLastKnown }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);
