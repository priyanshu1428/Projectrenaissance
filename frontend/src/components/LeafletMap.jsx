import React, { useEffect, useRef } from "react";
import L from "leaflet";

// Fix marker icons that break with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const goldIcon = L.divIcon({
  className: "eg-gold-marker",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#C5A059;border:2px solid #FBF9F5;box-shadow:0 0 0 2px #C5A059,0 2px 8px rgba(0,0,0,0.35);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const rescueIcon = L.divIcon({
  className: "eg-rescue-marker",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#B94040;border:2px solid #FBF9F5;box-shadow:0 0 0 3px rgba(185,64,64,0.4),0 2px 10px rgba(0,0,0,0.4);animation:egPulse 1.6s ease-in-out infinite;"></div><style>@keyframes egPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:0.6}}</style>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function LeafletMap({ center, marker, rescuePin }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRef = useRef(null);
  const rescueRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(center || [48.8566, 2.3522], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !marker) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([marker.lat, marker.lng]);
    } else {
      markerRef.current = L.marker([marker.lat, marker.lng], { icon: goldIcon })
        .addTo(mapRef.current)
        .bindPopup(marker.label || "Destination");
    }
    mapRef.current.flyTo([marker.lat, marker.lng], 8, { duration: 1.2 });
  }, [marker]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (rescuePin) {
      if (rescueRef.current) {
        rescueRef.current.setLatLng([rescuePin.lat, rescuePin.lng]);
      } else {
        rescueRef.current = L.marker([rescuePin.lat, rescuePin.lng], {
          icon: rescueIcon,
        })
          .addTo(mapRef.current)
          .bindPopup(
            `<b>Last known coordinates</b><br/>${new Date(rescuePin.at).toLocaleString()}`
          );
      }
    } else if (rescueRef.current) {
      rescueRef.current.remove();
      rescueRef.current = null;
    }
  }, [rescuePin]);

  return (
    <div
      ref={containerRef}
      data-testid="leaflet-map-container"
      className="leaflet-map-antique w-full h-full rounded"
      style={{ minHeight: 380 }}
    />
  );
}
