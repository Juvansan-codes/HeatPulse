import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import MapboxMap, { Source, Layer, NavigationControl, MapRef, MapMouseEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { WardRecord, SeverityLevel } from '../lib/types';
import { HeatLayerType } from './HeatLayerSelector';
import { WardHoverCard } from './WardHoverCard';
import { Navigation, AlertTriangle, Loader2 } from 'lucide-react';

interface ChennaiGisMapProps {
  wards: WardRecord[];
  activeLayer: HeatLayerType;
  selectedWardId: number;
  onSelectWard: (wardId: number) => void;
  selectedSeverity?: SeverityLevel | 'All';
  selectedZone?: number | 'all';
  searchQuery?: string;
  showEra5Grids?: boolean;
  className?: string;
}

// Compute color for a ward based on active heat layer
export function getWardLayerColor(ward: WardRecord, layer: HeatLayerType): { fill: string; stroke: string; text: string } {
  if (layer === 'htsi') {
    const val = ward.htsi;
    if (val >= 85) return { fill: '#7c3aed', stroke: '#a78bfa', text: '#ddd6fe' }; // Extreme
    if (val >= 75) return { fill: '#ef4444', stroke: '#f87171', text: '#fecaca' }; // Very High
    if (val >= 65) return { fill: '#f97316', stroke: '#fb923c', text: '#ffedd5' }; // High
    if (val >= 55) return { fill: '#f59e0b', stroke: '#fbbf24', text: '#fef3c7' }; // Moderate
    return { fill: '#10b981', stroke: '#34d399', text: '#d1fae5' }; // Normal
  }

  if (layer === 'utci') {
    const val = ward.utci;
    if (val >= 46) return { fill: '#7c3aed', stroke: '#a78bfa', text: '#ddd6fe' };
    if (val >= 42) return { fill: '#ef4444', stroke: '#f87171', text: '#fecaca' };
    if (val >= 38) return { fill: '#f97316', stroke: '#fb923c', text: '#ffedd5' };
    if (val >= 32) return { fill: '#f59e0b', stroke: '#fbbf24', text: '#fef3c7' };
    return { fill: '#10b981', stroke: '#34d399', text: '#d1fae5' };
  }

  if (layer === 'wbgt') {
    const val = ward.wbgt_outdoor;
    if (val >= 34.5) return { fill: '#7c3aed', stroke: '#a78bfa', text: '#ddd6fe' };
    if (val >= 32.0) return { fill: '#ef4444', stroke: '#f87171', text: '#fecaca' };
    if (val >= 30.0) return { fill: '#f97316', stroke: '#fb923c', text: '#ffedd5' };
    if (val >= 28.0) return { fill: '#f59e0b', stroke: '#fbbf24', text: '#fef3c7' };
    return { fill: '#10b981', stroke: '#34d399', text: '#d1fae5' };
  }

  if (layer === 'risk') {
    const val = ward.human_heat_risk;
    if (val >= 0.70) return { fill: '#7c3aed', stroke: '#a78bfa', text: '#ddd6fe' };
    if (val >= 0.50) return { fill: '#ef4444', stroke: '#f87171', text: '#fecaca' };
    if (val >= 0.35) return { fill: '#f97316', stroke: '#fb923c', text: '#ffedd5' };
    if (val >= 0.20) return { fill: '#f59e0b', stroke: '#fbbf24', text: '#fef3c7' };
    return { fill: '#10b981', stroke: '#34d399', text: '#d1fae5' };
  }

  if (layer === 'exposure') {
    const val = ward.exposure_density_norm;
    if (val >= 0.85) return { fill: '#7c3aed', stroke: '#a78bfa', text: '#ddd6fe' };
    if (val >= 0.70) return { fill: '#ef4444', stroke: '#f87171', text: '#fecaca' };
    if (val >= 0.50) return { fill: '#f97316', stroke: '#fb923c', text: '#ffedd5' };
    if (val >= 0.25) return { fill: '#f59e0b', stroke: '#fbbf24', text: '#fef3c7' };
    return { fill: '#10b981', stroke: '#34d399', text: '#d1fae5' };
  }

  // Vulnerability
  const val = ward.vulnerability;
  if (val >= 0.80) return { fill: '#7c3aed', stroke: '#a78bfa', text: '#ddd6fe' };
  if (val >= 0.65) return { fill: '#ef4444', stroke: '#f87171', text: '#fecaca' };
  if (val >= 0.50) return { fill: '#f97316', stroke: '#fb923c', text: '#ffedd5' };
  if (val >= 0.35) return { fill: '#f59e0b', stroke: '#fbbf24', text: '#fef3c7' };
  return { fill: '#10b981', stroke: '#34d399', text: '#d1fae5' };
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export const ChennaiGisMap: React.FC<ChennaiGisMapProps> = ({
  wards,
  activeLayer,
  selectedWardId,
  onSelectWard,
  selectedSeverity = 'All',
  selectedZone = 'all',
  searchQuery = '',
  className = ''
}) => {
  const mapRef = useRef<MapRef>(null);

  // GeoJSON Loading State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);
  const [geoStatus, setGeoStatus] = useState<'loading' | 'error' | 'success'>('loading');

  // Hover state
  const [hoverInfo, setHoverInfo] = useState<{ ward: WardRecord; x: number; y: number } | null>(null);

  // Fetch Official GCC GeoJSON
  useEffect(() => {
    setGeoStatus('loading');
    fetch('/data/gcc_wards.geojson')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.type !== 'FeatureCollection') throw new Error('Invalid GeoJSON format');
        setGeoData(data);
        setGeoStatus('success');
      })
      .catch(err => {
        console.error('[HeatPulse] Failed to load GCC GeoJSON:', err);
        setGeoStatus('error');
      });
  }, []);

  // Augment GeoJSON with fixture styling directly mapped by ward_id
  const augmentedGeoData = useMemo(() => {
    if (!geoData) return null;
    
    // Create a fast lookup map for our development fixtures
    const fixtureMap = new Map(wards.map(w => [w.ward_id.toString(), w]));

    const features = geoData.features.map((f: any) => {
      const wardIdStr = f.properties?.ward?.toString();
      const wardFix = wardIdStr ? fixtureMap.get(wardIdStr) : undefined;
      
      let fill = '#334155';
      let stroke = '#1e293b';
      let opacity = 0.92;

      if (wardFix) {
        const matchesZone = selectedZone === 'all' || wardFix.zone_id === selectedZone;
        const matchesSeverity = selectedSeverity === 'All' || wardFix.risk_level === selectedSeverity;
        const isMatch = matchesZone && matchesSeverity;

        const colors = getWardLayerColor(wardFix, activeLayer);
        fill = colors.fill;
        stroke = colors.stroke;
        if (!isMatch) opacity = 0.18;
      } else {
        opacity = 0.1; // Neutral state for missing fixtures
      }

      return {
        ...f,
        properties: {
          ...f.properties,
          fillColor: fill,
          strokeColor: stroke,
          baseOpacity: opacity,
        }
      };
    });

    return { ...geoData, features };
  }, [geoData, wards, activeLayer, selectedZone, selectedSeverity]);

  // Center on Selected Ward or Search Match
  useEffect(() => {
    if (!mapRef.current) return;
    let targetWardId: string | null = null;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const match = wards.find(w => w.ward_id.toString() === q || w.ward_name.toLowerCase() === q);
      if (match) {
        targetWardId = match.ward_id.toString();
      }
    } else if (selectedWardId) {
      targetWardId = selectedWardId.toString();
    }

    if (targetWardId && geoData) {
      const feature = geoData.features.find((f: any) => f.properties?.ward?.toString() === targetWardId);
      if (feature) {
        // Simple center based on first coordinate of polygon (approximation)
        const coords = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0][0][0];
        if (coords) {
          mapRef.current.flyTo({ center: [coords[0], coords[1]], zoom: 12.5, duration: 800 });
        }
      }
    }
  }, [searchQuery, selectedWardId, geoData, wards]);

  const onMouseMove = useCallback((e: MapMouseEvent) => {
    if (!e.features || e.features.length === 0) {
      setHoverInfo(null);
      return;
    }
    
    const feature = e.features[0];
    const wardIdStr = feature.properties?.ward?.toString();
    if (!wardIdStr) return;

    const ward = wards.find(w => w.ward_id.toString() === wardIdStr);
    if (ward) {
      setHoverInfo({ ward, x: e.point.x, y: e.point.y });
    } else {
      setHoverInfo(null);
    }
  }, [wards]);

  const onMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  const onClick = useCallback((e: MapMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const wardIdStr = e.features[0].properties?.ward?.toString();
      if (wardIdStr) {
        onSelectWard(parseInt(wardIdStr, 10));
      }
    }
  }, [onSelectWard]);

  // Mapbox Missing Token UI
  if (!MAPBOX_TOKEN) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-[#070B14] text-slate-400 p-6 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Map Configuration Required</h2>
        <p className="max-w-md">The geographic map requires a valid Mapbox token. Please set <code className="text-amber-400 bg-slate-800 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment.</p>
        <p className="max-w-md mt-4 text-xs">The dashboard will continue to function without the map.</p>
      </div>
    );
  }

  // GeoJSON Loading/Error UI
  if (geoStatus === 'loading') {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-[#070B14] text-slate-400 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p>Loading GCC Ward Boundaries...</p>
      </div>
    );
  }

  if (geoStatus === 'error') {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-[#070B14] text-slate-400 p-6 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Geographic Data Error</h2>
        <p className="max-w-md">Failed to load the GCC 2025 ward boundaries. Please verify <code className="text-red-400">/public/data/gcc_wards.geojson</code> exists and is valid GeoJSON.</p>
      </div>
    );
  }

  const hoverWardStr = hoverInfo?.ward.ward_id.toString() || '';
  const selectedWardStr = selectedWardId ? selectedWardId.toString() : '';

  return (
    <div className={`relative w-full h-full bg-[#070B14] overflow-hidden ${className}`}>
      <MapboxMap
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 80.20,
          latitude: 13.04,
          zoom: 10.5,
          pitch: 0,
          bearing: 0
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        interactiveLayerIds={['ward-fill']}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {augmentedGeoData && (
          <Source id="gcc-wards" type="geojson" data={augmentedGeoData}>
            {/* 1. Ward Fill Layer */}
            <Layer
              id="ward-fill"
              type="fill"
              paint={{
                'fill-color': ['get', 'fillColor'],
                'fill-opacity': [
                  'case',
                  ['==', ['get', 'ward'], hoverWardStr], 1.0,
                  ['==', ['get', 'ward'], selectedWardStr], 1.0,
                  ['get', 'baseOpacity']
                ]
              }}
            />
            {/* 2. Ward Outline Layer */}
            <Layer
              id="ward-outline"
              type="line"
              paint={{
                'line-color': [
                  'case',
                  ['==', ['get', 'ward'], selectedWardStr], '#38bdf8',
                  ['==', ['get', 'ward'], hoverWardStr], '#60a5fa',
                  ['get', 'strokeColor']
                ],
                'line-width': [
                  'case',
                  ['==', ['get', 'ward'], selectedWardStr], 3.5,
                  ['==', ['get', 'ward'], hoverWardStr], 2.5,
                  1.0
                ]
              }}
            />
            {/* 3. Optional Label Layer for large zoom */}
            <Layer
              id="ward-label"
              type="symbol"
              minzoom={12}
              layout={{
                'text-field': ['concat', 'W', ['get', 'ward']],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12,
              }}
              paint={{
                'text-color': '#ffffff',
                'text-halo-color': '#0f172a',
                'text-halo-width': 1
              }}
            />
          </Source>
        )}
      </MapboxMap>

      {/* Floating HUD: Compass Rose (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl text-center text-[10px] text-slate-300 flex flex-col items-center">
          <Navigation className="w-5 h-5 text-blue-400 mb-0.5" />
          <span className="font-mono font-bold text-white tracking-widest text-[11px]">N</span>
          <span className="text-[9px] text-slate-500 font-mono">GCC 2025</span>
        </div>
      </div>

      {/* Floating Ward Hover Card */}
      {hoverInfo && (
        <WardHoverCard
          ward={hoverInfo.ward}
          position={{ x: hoverInfo.x, y: hoverInfo.y }}
          onOpenDetails={() => onSelectWard(hoverInfo.ward.ward_id)}
          className="pointer-events-auto"
        />
      )}

      {/* Bottom Left Status Overlay */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-white">GCC Official Wards</span>
          <span className="text-slate-500 text-[11px] font-mono">
            • Mapbox GL • 2025 Baseline
          </span>
        </div>
      </div>
    </div>
  );
};
