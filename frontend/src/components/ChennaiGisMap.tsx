import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { WardRecord, SeverityLevel } from '../lib/types';
import { HeatLayerType } from './HeatLayerSelector';
import { WardHoverCard } from './WardHoverCard';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Compass,
  Crosshair,
  Maximize2
} from 'lucide-react';

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

// Coordinate bounds of Chennai Corporation (lat 12.83 to 13.23, lon 80.12 to 80.32)
const LAT_MIN = 12.83;
const LAT_MAX = 13.235;
const LON_MIN = 80.12;
const LON_MAX = 80.32;

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 1300;
const PADDING = 70;

// Convert geographic (lat, lon) to SVG canvas (x, y)
function geoToSvg(lat: number, lon: number): [number, number] {
  const normX = (lon - LON_MIN) / (LON_MAX - LON_MIN);
  const normY = 1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);
  const x = PADDING + normX * (SVG_WIDTH - 2 * PADDING);
  const y = PADDING + normY * (SVG_HEIGHT - 2 * PADDING);
  return [x, y];
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

// Sutherland-Hodgman convex polygon clipper by half-plane
function clipPolygonWithBisector(
  polygon: [number, number][],
  pA: [number, number],
  pB: [number, number]
): [number, number][] {
  // Midpoint between pA and pB
  const mx = (pA[0] + pB[0]) / 2;
  const my = (pA[1] + pB[1]) / 2;
  // Normal vector pointing from pB towards pA
  const nx = pA[0] - pB[0];
  const ny = pA[1] - pB[1];

  const isInside = (p: [number, number]) => (p[0] - mx) * nx + (p[1] - my) * ny >= 0;

  const out: [number, number][] = [];
  if (polygon.length === 0) return out;

  let s = polygon[polygon.length - 1];
  for (let i = 0; i < polygon.length; i++) {
    const e = polygon[i];
    if (isInside(e)) {
      if (isInside(s)) {
        out.push(e);
      } else {
        // Compute line segment intersection
        const dx = e[0] - s[0];
        const dy = e[1] - s[1];
        const denom = dx * nx + dy * ny;
        if (denom !== 0) {
          const t = ((mx - s[0]) * nx + (my - s[1]) * ny) / denom;
          out.push([s[0] + t * dx, s[1] + t * dy]);
        }
        out.push(e);
      }
    } else if (isInside(s)) {
      const dx = e[0] - s[0];
      const dy = e[1] - s[1];
      const denom = dx * nx + dy * ny;
      if (denom !== 0) {
        const t = ((mx - s[0]) * nx + (my - s[1]) * ny) / denom;
        out.push([s[0] + t * dx, s[1] + t * dy]);
      }
    }
    s = e;
  }
  return out;
}

interface WardGeometry {
  ward: WardRecord;
  cx: number;
  cy: number;
  pathD: string;
}

export const ChennaiGisMap: React.FC<ChennaiGisMapProps> = ({
  wards,
  activeLayer,
  selectedWardId,
  onSelectWard,
  selectedSeverity = 'All',
  selectedZone = 'all',
  searchQuery = '',
  showEra5Grids = true,
  className = ''
}) => {
  // Map pan and zoom state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover state
  const [hoveredWard, setHoveredWard] = useState<WardRecord | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute realistic spatial polygons for all 200 wards
  const wardGeometries = useMemo<WardGeometry[]>(() => {
    // 1. Compute canvas centroids for all wards
    const points: { ward: WardRecord; pt: [number, number] }[] = wards.map((w) => ({
      ward: w,
      pt: geoToSvg(w.grid_lat, w.grid_lon)
    }));

    // 2. Generate tessellated polygons using neighboring bisectors
    return points.map(({ ward, pt }) => {
      // Find nearest neighbors to form tight, clean administrative boundaries
      const sortedNeighbors = points
        .filter((other) => other.ward.ward_id !== ward.ward_id)
        .map((other) => {
          const dx = other.pt[0] - pt[0];
          const dy = other.pt[1] - pt[1];
          return { other, distSq: dx * dx + dy * dy };
        })
        .sort((a, b) => a.distSq - b.distSq)
        .slice(0, 14);

      // Initial bounding polygon around centroid
      // Adjust box radius based on zone density: city core is tighter, suburbs are wider
      const isCore = ward.zone_id >= 4 && ward.zone_id <= 10;
      const r = isCore ? 38 : 56;
      let poly: [number, number][] = [
        [pt[0] - r, pt[1] - r],
        [pt[0] + r, pt[1] - r],
        [pt[0] + r, pt[1] + r],
        [pt[0] - r, pt[1] + r]
      ];

      // Clip with bisectors of closest neighbors
      for (const { other } of sortedNeighbors) {
        poly = clipPolygonWithBisector(poly, pt, other.pt);
        if (poly.length < 3) break;
      }

      // If clipping collapsed, fallback to a neat regular hexagon
      if (poly.length < 3) {
        poly = [];
        const hexR = isCore ? 16 : 24;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          poly.push([pt[0] + hexR * Math.cos(angle), pt[1] + hexR * Math.sin(angle)]);
        }
      }

      // Convert vertices to SVG path string
      const pathD =
        `M ${poly[0][0].toFixed(1)} ${poly[0][1].toFixed(1)} ` +
        poly
          .slice(1)
          .map((p) => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
          .join(' ') +
        ' Z';

      return {
        ward,
        cx: pt[0],
        cy: pt[1],
        pathD
      };
    });
  }, [wards]);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.25, 3.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev * 0.8, 0.65));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Center on selected ward
  const centerOnWard = useCallback(
    (wardId: number) => {
      const geom = wardGeometries.find((g) => g.ward.ward_id === wardId);
      if (!geom || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const targetX = rect.width / 2 - geom.cx * zoom;
      const targetY = rect.height / 2 - geom.cy * zoom;
      setPan({ x: targetX, y: targetY });
    },
    [wardGeometries, zoom]
  );

  // Auto-center when search query picks a specific ward
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const match = wards.find(
        (w) => w.ward_id.toString() === q || w.ward_name.toLowerCase() === q
      );
      if (match) {
        centerOnWard(match.ward_id);
      }
    }
  }, [searchQuery, wards, centerOnWard]);

  // Mouse drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary button
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }

    // Track mouse position for floating hover card
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setHoverPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.65), 3.8));
  };

  // Touch support for mobile panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y
      });
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  // ERA5 5 Land Grid cells
  const era5Grids = [
    { id: 'grid_13.2_80.2', lat: 13.2, lon: 80.2, label: 'North Suburbs (Thiruvottiyur)' },
    { id: 'grid_13.1_80.2', lat: 13.1, lon: 80.2, label: 'North Urban Core (Royapuram/Tondiarpet)' },
    { id: 'grid_13.0_80.2', lat: 13.0, lon: 80.2, label: 'Central Urban Core (Anna Nagar/Teynampet)' },
    { id: 'grid_12.9_80.2', lat: 12.9, lon: 80.2, label: 'South Urban (Adyar/Alandur)' },
    { id: 'grid_12.8_80.2', lat: 12.8, lon: 80.2, label: 'South Coastal (Sholinganallur/OMR)' }
  ];

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setHoveredWard(null);
      }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full bg-[#070B14] overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* Subtle Coordinate Grid Pattern Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Floating HUD: Compass Rose (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl text-center text-[10px] text-slate-300 flex flex-col items-center">
          <Navigation className="w-5 h-5 text-blue-400 mb-0.5" />
          <span className="font-mono font-bold text-white tracking-widest text-[11px]">N</span>
          <span className="text-[9px] text-slate-500 font-mono">GCC GIS</span>
        </div>
      </div>

      {/* Floating Map Zoom / Pan Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-xl flex flex-col gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-800 my-0.5" />
          <button
            type="button"
            onClick={handleReset}
            title="Reset Map Bounds"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => centerOnWard(selectedWardId)}
            title="Center on Selected Ward"
            className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-400">
          Zoom: <span className="text-white font-bold">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%'
        }}
      >
        <defs>
          {/* Oceanic gradient for Bay of Bengal */}
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.0" />
            <stop offset="40%" stopColor="#0369a1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.55" />
          </linearGradient>

          {/* Glow filter for active/hovered ward */}
          <filter id="wardGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#38bdf8" floodOpacity="0.8" />
          </filter>

          <filter id="activeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#60a5fa" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* Coastal Ocean Fill (Bay of Bengal) */}
        <path
          d={`M 760 0 C 740 300, 710 650, 700 950 C 695 1100, 680 1200, 670 ${SVG_HEIGHT} L ${SVG_WIDTH} ${SVG_HEIGHT} L ${SVG_WIDTH} 0 Z`}
          fill="url(#oceanGradient)"
          className="pointer-events-none"
        />

        {/* Coastline Wave Outline */}
        <path
          d={`M 760 0 C 740 300, 710 650, 700 950 C 695 1100, 680 1200, 670 ${SVG_HEIGHT}`}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="6 3"
          strokeOpacity="0.6"
          className="pointer-events-none animate-pulse"
        />

        {/* Bay of Bengal Text */}
        <text
          x="880"
          y="650"
          transform="rotate(90 880 650)"
          fill="#38bdf8"
          fillOpacity="0.4"
          fontSize="14"
          fontWeight="bold"
          letterSpacing="8"
          fontFamily="monospace"
          textAnchor="middle"
          className="pointer-events-none uppercase select-none"
        >
          Bay of Bengal Coastal Boundary
        </text>

        {/* River Waterways */}
        {/* Cooum River Corridor */}
        <g className="pointer-events-none">
          <path
            d="M 120 620 Q 300 640 450 625 T 620 660 T 730 670"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3.5"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />
          <text x="320" y="615" fill="#22d3ee" fillOpacity="0.6" fontSize="9" fontFamily="monospace">
            ~ ~ Cooum River Corridor ~ ~
          </text>
        </g>

        {/* Adyar River Basin */}
        <g className="pointer-events-none">
          <path
            d="M 180 840 Q 360 860 520 870 T 670 890 T 725 900"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3.5"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />
          <text x="360" y="890" fill="#22d3ee" fillOpacity="0.6" fontSize="9" fontFamily="monospace">
            ~ ~ Adyar River Estuary ~ ~
          </text>
        </g>

        {/* ERA5 Grids Overlay Bounding Boxes */}
        {showEra5Grids && (
          <g className="pointer-events-none">
            {era5Grids.map((g) => {
              const [, gy] = geoToSvg(g.lat, g.lon);
              return (
                <g key={g.id}>
                  <line
                    x1="60"
                    y1={gy}
                    x2="780"
                    y2={gy}
                    stroke="#3b82f6"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    strokeOpacity="0.35"
                  />
                  <rect
                    x="65"
                    y={gy - 18}
                    width="190"
                    height="16"
                    rx="3"
                    fill="#0f172a"
                    fillOpacity="0.8"
                    stroke="#3b82f6"
                    strokeWidth="0.8"
                    strokeOpacity="0.4"
                  />
                  <text
                    x="70"
                    y={gy - 6}
                    fill="#93c5fd"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ERA5 {g.lat.toFixed(1)}°N, {g.lon.toFixed(1)}°E
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 200 GCC WARD POLYGONS */}
        <g id="ward-polygons">
          {wardGeometries.map(({ ward, cx, cy, pathD }) => {
            const isSelected = selectedWardId === ward.ward_id;
            const isHovered = hoveredWard?.ward_id === ward.ward_id;

            // Check filters
            const matchesZone = selectedZone === 'all' || ward.zone_id === selectedZone;
            const matchesSeverity = selectedSeverity === 'All' || ward.risk_level === selectedSeverity;
            const isMatch = matchesZone && matchesSeverity;

            const { fill, stroke } = getWardLayerColor(ward, activeLayer);

            // Opacity for filtering
            let opacity = 0.92;
            if (!isMatch) opacity = 0.18;
            if (isHovered) opacity = 1.0;

            // Stroke styling
            let strokeColor = isMatch ? stroke : '#334155';
            const strokeWidth = isSelected ? 3.5 : isHovered ? 2.5 : 1.0;

            if (isSelected) {
              strokeColor = '#38bdf8';
            }

            return (
              <g
                key={ward.ward_id}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredWard(ward)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWard(ward.ward_id);
                }}
              >
                {/* Ward Polygon Shape */}
                <path
                  d={pathD}
                  fill={fill}
                  fillOpacity={opacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  filter={isSelected ? 'url(#activeGlow)' : isHovered ? 'url(#wardGlow)' : undefined}
                  className="transition-colors duration-150"
                />

                {/* Centroid Ward Number Label (Adaptive for high zoom or important wards) */}
                {(zoom >= 1.2 || isSelected || isHovered || ward.ward_id === 86 || ward.ward_id === 114) && (
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fill={isSelected || isHovered ? '#ffffff' : '#0f172a'}
                    fontSize={isSelected || isHovered ? '11' : '8.5'}
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="pointer-events-none select-none drop-shadow-sm"
                  >
                    W{ward.ward_id}
                  </text>
                )}

                {/* Extra halo ring for active selected ward */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-ping pointer-events-none opacity-40"
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Ward Hover Card (Exact Format from User Specification) */}
      {hoveredWard && hoverPos && (
        <WardHoverCard
          ward={hoveredWard}
          position={hoverPos}
          onOpenDetails={() => onSelectWard(hoveredWard.ward_id)}
          className="pointer-events-auto"
        />
      )}

      {/* Bottom Left Status Overlay */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-white">200 Current GCC Wards</span>
          <span className="text-slate-500 text-[11px] font-mono">
            • 15 Zones • WorldPop R2025A
          </span>
        </div>
      </div>
    </div>
  );
};
