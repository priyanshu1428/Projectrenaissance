import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { createOfflineTileLayer } from "../lib/tiles";

const goldIcon = L.divIcon({
  className: "eg-gold-marker",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#C5A059;border:2px solid #FBF9F5;box-shadow:0 0 0 2px #C5A059,0 2px 8px rgba(0,0,0,0.35);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const rescueIcon = L.divIcon({
  className: "eg-rescue-marker",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#B94040;border:2px solid #FBF9F5;box-shadow:0 0 0 3px rgba(185,64,64,0.4),0 2px 10px rgba(0,0,0,0.4);animation:egPulse 1.6s ease-in-out infinite;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const dotIcon = (n) =>
  L.divIcon({
    className: "eg-track-dot",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:var(--card,#F5F0E6);border:1.5px solid #C5A059;color:#1B2A4A;font-size:9px;font-weight:600;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 5px rgba(0,0,0,0.3);">${n}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

export default function LeafletMap({ center, marker, rescuePin, track = [], followTrack }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRef = useRef(null);
  const rescueRef = useRef(null);
  const trackLayerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      tap: true,
    }).setView(center || [48.8566, 2.3522], 5);

    createOfflineTileLayer().addTo(map);
    trackLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const invalidate = () => map.invalidateSize();
    const t = setTimeout(invalidate, 250);
    window.addEventListener("resize", invalidate);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", invalidate);
      map.remove();
      mapRef.current = null;
      trackLayerRef.current = null;
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
    mapRef.current.flyTo([marker.lat, marker.lng], 9, { duration: 1.2 });
  }, [marker]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (rescuePin) {
      if (rescueRef.current) {
        rescueRef.current.setLatLng([rescuePin.lat, rescuePin.lng]);
      } else {
        rescueRef.current = L.marker([rescuePin.lat, rescuePin.lng], { icon: rescueIcon }).addTo(mapRef.current);
      }
      rescueRef.current.bindPopup(
        `<b>LAST KNOWN</b><br/>${rescuePin.lat.toFixed(5)}, ${rescuePin.lng.toFixed(5)}<br/>${new Date(rescuePin.at || Date.now()).toLocaleString()}`
      );
    } else if (rescueRef.current) {
      rescueRef.current.remove();
      rescueRef.current = null;
    }
  }, [rescuePin]);

  // GPS breadcrumb trail
  useEffect(() => {
    const layer = trackLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!track.length) return;

    const latlngs = track.map((p) => [p.lat, p.lng]);
    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: "#B94040", weight: 2.5, opacity: 0.75, dashArray: "6 5" }).addTo(layer);
    }
    track.forEach((p, i) => {
      const isLast = i === track.length - 1;
      L.marker([p.lat, p.lng], { icon: isLast ? rescueIcon : dotIcon(i + 1) })
        .addTo(layer)
        .bindPopup(
          `<b>${isLast ? "LAST KNOWN" : `Fix #${i + 1}`}</b><br/>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}<br/>${new Date(p.t).toLocaleString()}${p.acc ? `<br/>±${Math.round(p.acc)}m` : ""}`
        );
    });
    if (followTrack && mapRef.current) {
      const lastP = track[track.length - 1];
      mapRef.current.setView([lastP.lat, lastP.lng], Math.max(mapRef.current.getZoom(), 12));
    }
  }, [track, followTrack]);

  return (
    <div
      ref={containerRef}
      data-testid="leaflet-map-container"
      className="leaflet-map-antique w-full h-full"
      style={{ minHeight: 260 }}
    />
  );
}
