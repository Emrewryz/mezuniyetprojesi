'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface StaticMapProps {
  lat: number;
  lng: number;
  label?: string;
}

export default function StaticMap({ lat, lng, label }: StaticMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const initRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || mapRef.current || initRef.current) return;
    initRef.current = true;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) {
        initRef.current = false;
        return;
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(37,99,235,0.4)"></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      L.marker([lat, lng], { icon }).addTo(map);
      mapRef.current = map;
      initRef.current = false;
      setReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initRef.current = false;
        setReady(false);
      }
    };
  }, [lat, lng]);

  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 size={18} className="animate-spin text-slate-400" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      {label && ready && (
        <div className="absolute bottom-2 left-2 right-2 z-[400]">
          <p className="text-[11px] text-slate-700 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm truncate font-medium">
            {label}
          </p>
        </div>
      )}
    </div>
  );
}