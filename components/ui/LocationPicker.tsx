'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, X, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  initialAddress?: string;
}

export default function LocationPicker({ onLocationSelect, initialAddress }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initRef = useRef(false);

  const [query, setQuery] = useState(initialAddress || '');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const placeMarker = useCallback((L: any, lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(37,99,235,0.4)"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:8px;height:8px;background:white;border-radius:50%;opacity:.9"></div></div>`,
      iconSize: [32, 32], iconAnchor: [16, 32],
    });
    markerRef.current = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
    mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current || initRef.current) return;
    initRef.current = true;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (!mapContainerRef.current || (mapContainerRef.current as any)._leaflet_id) {
        initRef.current = false; return;
      }
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapContainerRef.current!, { center: [41.0082, 28.9784], zoom: 12, zoomControl: false });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO', maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        placeMarker(L, lat, lng);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setQuery(address);
          onLocationSelect(address, lat, lng);
        } catch {
          const address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setQuery(address);
          onLocationSelect(address, lat, lng);
        }
      });

      mapInstanceRef.current = map;
      initRef.current = false;
      setMapReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        initRef.current = false;
        setMapReady(false);
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setResults([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
      setResults(await res.json());
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const handleSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;
    setQuery(address); setResults([]);
    onLocationSelect(address, lat, lng);
    if (mapInstanceRef.current) import('leaflet').then((L) => placeMarker(L, lat, lng));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder="Mekan adı veya adres..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-9 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all shadow-sm" />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
          <button type="button" onClick={handleSearch} disabled={searching || !query.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm shrink-0">
            {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} Ara
          </button>
        </div>

        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-[9999] overflow-hidden max-h-60 overflow-y-auto">
            {results.map((r, i) => (
              <button key={i} type="button" onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-100 last:border-0 flex items-start gap-2.5">
                <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                <span className="line-clamp-2 leading-snug">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative w-full h-[300px] rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 size={18} className="animate-spin text-slate-400" />
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 0 }} />
        {mapReady && (
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full whitespace-nowrap z-[400] shadow-sm">
            Haritaya tıklayarak konum seçebilirsiniz
          </p>
        )}
      </div>
    </div>
  );
}