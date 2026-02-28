'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore } from '@/lib/store';
import { getNDVILabel } from '@/lib/api/ndvi';
import { fetchPointInfo, fetchRecommendations } from '@/lib/apiClient';

interface MapCanvasProps {
    onPolygonComplete?: (polygon: GeoJSON.Feature, acreage: number, centroid: { lat: number; lng: number }) => void;
}

export default function MapCanvas({ onPolygonComplete }: MapCanvasProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const coordinates = useAppStore((s) => s.coordinates);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
    const [popup, setPopup] = useState<{
        lat: number; lng: number; x: number; y: number;
        soil?: string; ph?: number; drainage?: string;
        elevation?: number; ndvi?: number; ndviLabel?: string; ndviColor?: string;
    } | null>(null);
    const [recoPopup, setRecoPopup] = useState<{
        x: number; y: number;
        name: string; yieldScore: number; soilMatch: number; acreage: number;
    } | null>(null);
    const popupRef = useRef<maplibregl.Popup | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
        const style = maptilerKey
            ? `https://api.maptiler.com/maps/hybrid/style.json?key=${maptilerKey}`
            : {
                version: 8 as const,
                sources: {
                    osm: {
                        type: 'raster' as const,
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '&copy; OpenStreetMap contributors',
                    },
                },
                layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
            };

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style,
            center: [coordinates?.lng || -77.86, coordinates?.lat || 40.79],
            zoom: 14,
            pitch: 45,
            bearing: -15,
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
            if (!map.current || !coordinates) return;

            // Fly to coordinates
            map.current.flyTo({
                center: [coordinates.lng, coordinates.lat],
                zoom: 17,
                pitch: 50,
                duration: 2000,
                essential: true,
            });

            // Add pulsing marker
            const markerEl = document.createElement('div');
            markerEl.style.cssText = `
        width: 14px; height: 14px;
        background: #4ade80;
        border-radius: 50%;
        border: 3px solid #0a0d0a;
        box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
        position: relative;
      `;
            const pulseRing = document.createElement('div');
            pulseRing.style.cssText = `
        position: absolute; inset: -6px;
        border: 2px solid #4ade80;
        border-radius: 50%;
        animation: pulse-ring 1.5s ease-out infinite;
      `;
            markerEl.appendChild(pulseRing);

            new maplibregl.Marker({ element: markerEl })
                .setLngLat([coordinates.lng, coordinates.lat])
                .addTo(map.current);

            // Add sources for polygon drawing
            map.current.addSource('draw-polygon', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.current.addLayer({
                id: 'draw-fill',
                type: 'fill',
                source: 'draw-polygon',
                paint: { 'fill-color': '#4ade80', 'fill-opacity': 0.12 },
            });
            map.current.addLayer({
                id: 'draw-stroke',
                type: 'line',
                source: 'draw-polygon',
                paint: { 'line-color': '#4ade80', 'line-width': 2, 'line-dasharray': [4, 2] },
            });

            // Point markers source
            map.current.addSource('draw-points', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.current.addLayer({
                id: 'draw-vertices',
                type: 'circle',
                source: 'draw-points',
                paint: {
                    'circle-color': '#4ade80',
                    'circle-radius': 5,
                    'circle-stroke-color': '#0a0d0a',
                    'circle-stroke-width': 2,
                },
            });

            // ── Recommendation parcels ─────────────────────────────────────
            map.current.addSource('reco-parcels', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.current.addLayer({
                id: 'reco-fill',
                type: 'fill',
                source: 'reco-parcels',
                paint: { 'fill-color': '#fb923c', 'fill-opacity': 0.2 },
            });
            map.current.addLayer({
                id: 'reco-stroke',
                type: 'line',
                source: 'reco-parcels',
                paint: { 'line-color': '#fb923c', 'line-width': 2, 'line-opacity': 0.8 },
            });
            map.current.addLayer({
                id: 'reco-glow',
                type: 'line',
                source: 'reco-parcels',
                paint: { 'line-color': '#fb923c', 'line-width': 6, 'line-opacity': 0.15, 'line-blur': 4 },
            });

            // Fetch recommendations
            if (coordinates) {
                fetchRecommendations(coordinates.lat, coordinates.lng)
                    .then(geojson => {
                        if (map.current?.getSource('reco-parcels')) {
                            (map.current.getSource('reco-parcels') as maplibregl.GeoJSONSource).setData(geojson);
                        }
                    })
                    .catch(err => console.error('Recommendations error:', err));
            }

            // Click handler for recommendation parcels
            map.current.on('click', 'reco-fill', (e) => {
                if (!e.features?.length) return;
                const props = e.features[0].properties;
                setRecoPopup({
                    x: e.point.x,
                    y: e.point.y,
                    name: props?.name || 'Recommended Parcel',
                    yieldScore: props?.projected_yield || 0,
                    soilMatch: props?.soil_match_score || 0,
                    acreage: props?.acreage || 0,
                });
                e.originalEvent.stopPropagation();
            });

            // Cursor change on hover
            map.current.on('mouseenter', 'reco-fill', () => {
                if (map.current) map.current.getCanvas().style.cursor = 'pointer';
            });
            map.current.on('mouseleave', 'reco-fill', () => {
                if (map.current && !isDrawing) map.current.getCanvas().style.cursor = '';
            });
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle map click for popup
    const handleMapClick = useCallback(async (e: maplibregl.MapMouseEvent) => {
        if (isDrawing) return;

        const { lng, lat } = e.lngLat;
        const point = e.point;

        // Close existing popup
        if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
        }

        setPopup({ lat, lng, x: point.x, y: point.y });

        // Fetch data for popup from backend
        try {
            const info = await fetchPointInfo(lat, lng);

            // Parse soil name: strip the ", pH X.X" suffix the backend appends
            const soilName = info.soil_type.split(', pH')[0].trim();
            const phMatch  = info.soil_type.match(/pH\s*(\d+\.?\d*)/);
            const ph       = phMatch ? parseFloat(phMatch[1]) : undefined;

            const ndviInfo = getNDVILabel(info.ndvi);

            setPopup({
                lat, lng, x: point.x, y: point.y,
                soil: soilName,
                ph,
                // drainage is not returned by /api/point-info
                elevation: info.elevation !== null ? Math.round(info.elevation) : undefined,
                ndvi:      Math.round(info.ndvi * 100) / 100,
                ndviLabel: ndviInfo.label,
                ndviColor: ndviInfo.color,
            });
        } catch (err) {
            console.error('Point info error:', err);
        }
    }, [isDrawing]);

    useEffect(() => {
        if (!map.current) return;
        map.current.on('click', handleMapClick);
        return () => { map.current?.off('click', handleMapClick); };
    }, [handleMapClick]);

    // Drawing mode click handler
    const handleDrawClick = useCallback((e: maplibregl.MapMouseEvent) => {
        if (!map.current) return;
        const { lng, lat } = e.lngLat;
        setDrawPoints(prev => {
            const newPoints = [...prev, [lng, lat] as [number, number]];

            // Update point markers
            const pointFeatures = newPoints.map(p => ({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: p },
                properties: {},
            }));
            (map.current!.getSource('draw-points') as maplibregl.GeoJSONSource)?.setData({
                type: 'FeatureCollection',
                features: pointFeatures,
            });

            // Update polygon preview (need at least 3 points)
            if (newPoints.length >= 3) {
                const ring = [...newPoints, newPoints[0]];
                (map.current!.getSource('draw-polygon') as maplibregl.GeoJSONSource)?.setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: { type: 'Polygon', coordinates: [ring] },
                        properties: {},
                    }],
                });
            }

            return newPoints;
        });
    }, []);

    // Toggle drawing mode
    const startDrawing = useCallback(() => {
        if (!map.current) return;
        setIsDrawing(true);
        setDrawPoints([]);
        setPopup(null);
        map.current.getCanvas().style.cursor = 'crosshair';
        map.current.off('click', handleMapClick);
        map.current.on('click', handleDrawClick);
    }, [handleMapClick, handleDrawClick]);

    const completeDrawing = useCallback(() => {
        if (!map.current || drawPoints.length < 3) return;
        setIsDrawing(false);
        map.current.getCanvas().style.cursor = '';
        map.current.off('click', handleDrawClick);
        map.current.on('click', handleMapClick);

        // Create closed polygon
        const ring = [...drawPoints, drawPoints[0]];
        const polygon: GeoJSON.Feature = {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [ring] },
            properties: {},
        };

        // Calculate area (approximate)
        const area = calculatePolygonArea(ring);
        const areaAcres = Math.round(area * 100) / 100;

        // Calculate centroid
        const centroid = {
            lat: drawPoints.reduce((s, p) => s + p[1], 0) / drawPoints.length,
            lng: drawPoints.reduce((s, p) => s + p[0], 0) / drawPoints.length,
        };

        // Update display
        (map.current.getSource('draw-polygon') as maplibregl.GeoJSONSource)?.setData({
            type: 'FeatureCollection',
            features: [polygon],
        });

        onPolygonComplete?.(polygon, areaAcres, centroid);
    }, [drawPoints, handleDrawClick, handleMapClick, onPolygonComplete]);

    const clearDrawing = useCallback(() => {
        if (!map.current) return;
        setIsDrawing(false);
        setDrawPoints([]);
        map.current.getCanvas().style.cursor = '';
        map.current.off('click', handleDrawClick);
        map.current.on('click', handleMapClick);

        (map.current.getSource('draw-polygon') as maplibregl.GeoJSONSource)?.setData({
            type: 'FeatureCollection', features: [],
        });
        (map.current.getSource('draw-points') as maplibregl.GeoJSONSource)?.setData({
            type: 'FeatureCollection', features: [],
        });
    }, [handleDrawClick, handleMapClick]);

    // Convert decimal degrees to DMS
    const toDMS = (deg: number, isLat: boolean) => {
        const d = Math.abs(deg);
        const degrees = Math.floor(d);
        const minutes = Math.floor((d - degrees) * 60);
        const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
        return `${degrees}\u00B0${minutes}'${dir}`;
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Drawing instruction toast */}
            {isDrawing && (
                <div
                    className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-20"
                    style={{
                        background: 'rgba(17, 22, 18, 0.9)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                    }}
                >
                    Click to place boundary points.
                    {drawPoints.length >= 3 && (
                        <button
                            onClick={completeDrawing}
                            className="ml-3 px-4 py-1 rounded-full text-xs font-medium"
                            style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                        >
                            Complete ({drawPoints.length} points)
                        </button>
                    )}
                </div>
            )}

            {/* Bottom toolbar */}
            <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 px-4 py-2 rounded-xl"
                style={{
                    background: 'rgba(17, 22, 18, 0.9)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--color-border)',
                }}
            >
                <button
                    onClick={isDrawing ? completeDrawing : startDrawing}
                    className="px-5 py-2.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
                    style={{
                        background: isDrawing ? 'var(--color-primary-dim)' : 'var(--color-primary)',
                        color: 'var(--color-bg)',
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    {isDrawing ? 'Complete Drawing' : 'Draw Property'}
                </button>
                <button
                    onClick={clearDrawing}
                    className="px-5 py-2.5 rounded-lg text-xs transition-all hover:bg-white/5"
                    style={{
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    Clear
                </button>
            </div>

            {/* Click Popup */}
            {popup && !isDrawing && (
                <div
                    className="absolute z-30 w-[280px] rounded-xl overflow-hidden"
                    style={{
                        left: Math.min(popup.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 300),
                        top: popup.y - 10,
                        transform: 'translate(-50%, -100%)',
                        background: 'rgba(17, 22, 18, 0.92)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--color-border)',
                        animation: 'popupIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {/* Coordinates + Elevation */}
                    <div className="flex justify-between items-center px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {toDMS(popup.lat, true)} {toDMS(popup.lng, false)}
                        </span>
                        {popup.elevation !== undefined && (
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {popup.elevation}m
                            </span>
                        )}
                    </div>

                    {/* Soil */}
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Soil</div>
                        {popup.soil ? (
                            <>
                                <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{popup.soil}</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    {popup.ph !== undefined ? `pH ${popup.ph.toFixed(1)}` : ''}
                                    {popup.ph !== undefined && popup.drainage ? ' · ' : ''}
                                    {popup.drainage ?? ''}
                                </div>
                            </>
                        ) : (
                            <div className="skeleton" style={{ width: '80%', height: '16px' }} />
                        )}
                    </div>

                    {/* NDVI */}
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Vegetation Health</div>
                        {popup.ndvi !== undefined ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${popup.ndvi * 100}%`, background: popup.ndviColor }}
                                        />
                                    </div>
                                    <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                                        {popup.ndvi.toFixed(2)}
                                    </span>
                                </div>
                                <div className="text-xs mt-1" style={{ color: popup.ndviColor }}>{popup.ndviLabel}</div>
                            </>
                        ) : (
                            <div className="skeleton" style={{ width: '100%', height: '16px' }} />
                        )}
                    </div>

                    {/* Close / Action */}
                    <div className="px-4 py-2 flex justify-between items-center">
                        <button
                            onClick={() => setPopup(null)}
                            className="text-xs hover:underline"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Recommendation Popup */}
            {recoPopup && (
                <div
                    className="absolute z-30 w-[260px] rounded-xl overflow-hidden"
                    style={{
                        left: Math.min(recoPopup.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 280),
                        top: recoPopup.y - 10,
                        transform: 'translate(-50%, -100%)',
                        background: 'rgba(17, 22, 18, 0.92)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(251, 146, 60, 0.4)',
                        animation: 'popupIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(251, 146, 60, 0.2)' }}>
                        <div className="text-xs mb-1" style={{ color: '#fb923c' }}>✨ AI Recommended Parcel</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{recoPopup.name}</div>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Yield Match</div>
                            <div className="text-lg font-medium" style={{ fontFamily: 'var(--font-mono)', color: '#fb923c' }}>{recoPopup.yieldScore}%</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Soil Match</div>
                            <div className="text-lg font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{recoPopup.soilMatch}%</div>
                        </div>
                    </div>
                    <div className="px-4 py-2 flex justify-between items-center" style={{ borderTop: '1px solid rgba(251, 146, 60, 0.2)' }}>
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{recoPopup.acreage} acres</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRecoPopup(null)}
                                className="text-[10px] hover:underline"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Close
                            </button>
                            <button
                                className="text-[10px] px-3 py-1 rounded-full font-medium"
                                style={{ background: '#fb923c', color: '#0a0d0a' }}
                            >
                                Run Full Analysis
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        @keyframes popupIn {
          from { opacity: 0; transform: translate(-50%, -100%) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
      `}</style>
        </div>
    );
}

// Calculate polygon area in acres using the Shoelace formula
function calculatePolygonArea(ring: [number, number][]): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        const [lng1, lat1] = ring[i];
        const [lng2, lat2] = ring[i + 1];
        area += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
    }
    area = Math.abs((area * R * R) / 2);
    return area / 4046.86; // Convert m² to acres
}
