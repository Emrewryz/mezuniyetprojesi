'use client';

import { useEffect, useRef } from 'react';

interface StaticMapProps {
  lat: number;
  lng: number;
  title?: string;
}

export default function StaticMap({ lat, lng, title }: StaticMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || mapRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng], zoom: 15,
        zoomControl: false, dragging: false,
        scrollWheelZoom: false, doubleClickZoom: false,
        touchZoom: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO', maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(37,99,235,0.4)"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:8px;height:8px;background:white;border-radius:50%;opacity:.9"></div></div>`,
        iconSize: [32, 32], iconAnchor: [16, 32],
      });

      L.marker([lat, lng], { icon }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lng]);

  return <div ref={containerRef} className="w-full h-full" />;
}