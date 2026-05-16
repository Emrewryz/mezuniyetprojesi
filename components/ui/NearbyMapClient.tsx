'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

const SITE_BLUE = '#3b82f6';
const SITE_BLUE_DARK = '#2563eb';

function buildPin(active: boolean) {
  const size = active ? 44 : 32;
  const glow = active
    ? `0 6px 20px ${SITE_BLUE}60, 0 0 0 4px ${SITE_BLUE}20`
    : '0 3px 8px rgba(0,0,0,0.18)';

  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:${size}px;height:${size}px;
          background:linear-gradient(135deg,${SITE_BLUE},${SITE_BLUE_DARK});
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:${glow};
          position:relative;
        ">
          <div style="
            position:absolute;top:50%;left:50%;
            transform:translate(-50%,-50%) rotate(45deg);
            width:${active ? 10 : 7}px;height:${active ? 10 : 7}px;
            background:white;border-radius:50%;opacity:0.9;
          "></div>
        </div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prev = useRef('');
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (prev.current === key) return;
    prev.current = key;
    map.flyTo([lat, lng], 15, { animate: true, duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

interface MapEvent { id: string; title: string; category: string; lat: number; lng: number; }
interface Props { events: MapEvent[]; activeIndex: number; onMarkerClick: (index: number) => void; }

export default function NearbyMapClient({ events, activeIndex, onMarkerClick }: Props) {
  useEffect(() => {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);

  const active = events[activeIndex];

  return (
    <MapContainer
      center={[36.877, 30.695]}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />
      {active && <MapController lat={active.lat} lng={active.lng} />}
      {events.map((ev, i) => (
        <Marker
          key={ev.id}
          position={[ev.lat, ev.lng]}
          icon={buildPin(i === activeIndex)}
          zIndexOffset={i === activeIndex ? 1000 : 0}
          eventHandlers={{ click: () => onMarkerClick(i) }}
        />
      ))}
    </MapContainer>
  );
} 