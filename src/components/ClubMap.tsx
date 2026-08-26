import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Club } from "@/lib/mock-db";

/**
 * Interactive Leaflet map with neon price-pill markers.
 * Client-only: rendered behind a mounted-guard + React.lazy in the route.
 */
export default function ClubMap({
  clubs,
  selectedId,
  onSelect,
}: {
  clubs: Club[];
  selectedId: string | null;
  onSelect: (clubId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [51.115, 71.43],
      zoom: 12,
      scrollWheelZoom: true,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const makeIcon = (club: Club, selected: boolean) =>
      L.divIcon({
        className: "hs-marker",
        html: `<div class="hs-pin${selected ? " hs-pin--active" : ""}"><span class="hs-pin-dot"></span>${club.pricePerHour} ₸</div>`,
      });

    // remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!clubs.some((c) => c.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    clubs.forEach((club) => {
      const icon = makeIcon(club, club.id === selectedId);
      const existing = markersRef.current.get(club.id);
      if (existing) {
        existing.setIcon(icon);
      } else {
        const marker = L.marker([club.lat, club.lng], { icon }).addTo(map);
        marker.on("click", () => onSelectRef.current(club.id));
        markersRef.current.set(club.id, marker);
      }
    });
  }, [clubs, selectedId]);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const club = clubs.find((c) => c.id === selectedId);
    if (club) mapRef.current.flyTo([club.lat, club.lng], 14, { duration: 0.6 });
  }, [selectedId, clubs]);

  return <div ref={containerRef} className="h-full w-full" />;
}
