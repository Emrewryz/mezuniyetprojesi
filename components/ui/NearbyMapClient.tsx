'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

if (typeof window !== 'undefined' && !document.getElementById('leaflet-css')) {
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

const CATEGORY_COLORS: Record<string, string> = {
  music: '#f43f5e', tech: '#3b82f6', art: '#8b5cf6',
  business: '#f59e0b', social: '#10b981', sport: '#f97316', game: '#6366f1',
};

function buildIcon(category: string, active: boolean) {
  const color = CATEGORY_COLORS[category] || '#3b82f6';
  const s = active ? 48 : 34;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${s}px;height:${s}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 ${active ? 10 : 4}px ${active ? 28 : 12}px ${color}55;
      transition:all .3s cubic-bezier(.4,0,.2,1)">
      <div style="width:8px;height:8px;background:white;border-radius:50%;
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);opacity:.9"></div>
    </div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s],
  });
}

function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prev = useRef('');
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (prev.current === key) return;
    prev.current = key;
    map.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

interface MapEvent { id: string; category: string; lat: number; lng: number; }
interface Props {
  events: MapEvent[];
  activeIndex: number;
  onMarkerClick: (index: number) => void;
}

export default function NearbyMapClient({ events, activeIndex, onMarkerClick }: Props) {
  const active = events[activeIndex];
  return (
    <MapContainer
      center={[36.877, 30.695]}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap"
        maxZoom={19}
      />
      {active && <MapController lat={active.lat} lng={active.lng} />}
      {events.map((ev, i) => (
        <Marker
          key={ev.id}
          position={[ev.lat, ev.lng]}
          icon={buildIcon(ev.category, i === activeIndex)}
          zIndexOffset={i === activeIndex ? 1000 : 0}
          eventHandlers={{ click: () => onMarkerClick(i) }}
        />
      ))}
    </MapContainer>
  );
}