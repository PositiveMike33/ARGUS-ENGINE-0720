/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import { FeedItem } from '../types';
import { 
  Layers, 
  Info, 
  X, 
  Search, 
  Compass, 
  Crosshair, 
  AlertTriangle, 
  MapPin, 
  Key, 
  ExternalLink,
  Activity,
  Filter,
  Train,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GoogleMapsIntegrationProps {
  feeds: FeedItem[];
  selectedFeed: FeedItem | null;
  onSelectFeed?: (feed: FeedItem | null) => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.length > 10;

// Coordinate resolver for Montreal incidents
const resolveIncidentCoordinates = (item: FeedItem) => {
  const text = (item.title + ' ' + item.details).toLowerCase();
  
  let lat = 45.5088;
  let lng = -73.5540;
  let stationName = 'Centre-ville Montréal';

  if (text.includes('berri') || text.includes('uqam')) {
    lat = 45.5155;
    lng = -73.5606;
    stationName = 'Station Berri-UQAM';
  } else if (text.includes('saint-laurent') || text.includes('st-laurent')) {
    lat = 45.5124;
    lng = -73.5700;
    stationName = 'Boulevard Saint-Laurent';
  } else if (text.includes('jolicoeur')) {
    lat = 45.4568;
    lng = -73.5822;
    stationName = 'Station Jolicoeur';
  } else if (text.includes('rosemont')) {
    lat = 45.5313;
    lng = -73.5976;
    stationName = 'Station Rosemont';
  } else if (text.includes('snowdon')) {
    lat = 45.4855;
    lng = -73.6277;
    stationName = 'Station Snowdon';
  } else if (text.includes('saint-michel')) {
    lat = 45.5597;
    lng = -73.5997;
    stationName = 'Station Saint-Michel';
  } else if (text.includes('longueuil')) {
    lat = 45.5250;
    lng = -73.5218;
    stationName = 'Station Longueuil';
  } else if (text.includes('747') || text.includes('aéroport') || text.includes('dorval') || text.includes('yul')) {
    lat = 45.4700;
    lng = -73.7400;
    stationName = 'Aéroport YUL Trudeau';
  } else if (text.includes('sherbrooke')) {
    lat = 45.5188;
    lng = -73.5682;
    stationName = 'Rue Sherbrooke';
  } else if (text.includes('papineau') || text.includes('rené-lévesque')) {
    lat = 45.5204;
    lng = -73.5518;
    stationName = 'Avenue Papineau';
  } else {
    const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetLat = ((hash % 100) - 50) / 1500;
    const offsetLng = (((hash * 13) % 100) - 50) / 1500;
    lat = 45.5088 + offsetLat;
    lng = -73.5540 + offsetLng;
    stationName = 'Secteur Métropolitain';
  }
  return { lat, lng, stationName };
};

const getMarkerColor = (severity: string) => {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    default: return '#3b82f6';
  }
};

// Montreal Metro line polylines for vector GIS overlay
const METRO_LINES_COORDS = {
  verte: [
    [45.4462, -73.6033], // Angrignon
    [45.4568, -73.5822], // Jolicoeur
    [45.4788, -73.5828], // Atwater
    [45.4952, -73.5786], // Guy-Concordia
    [45.5042, -73.5714], // McGill
    [45.5155, -73.5606], // Berri-UQAM
    [45.5250, -73.5525], // Beaudry
    [45.5417, -73.5414], // Pie-IX
    [45.5960, -73.5350], // Honoré-Beaugrand
  ] as [number, number][],
  orange: [
    [45.5140, -73.6828], // Côte-Vertu
    [45.4855, -73.6277], // Snowdon
    [45.4883, -73.5862], // Lionel-Groulx
    [45.5155, -73.5606], // Berri-UQAM
    [45.5313, -73.5976], // Rosemont
    [45.5468, -73.6133], // Jean-Talon
    [45.5475, -73.6631], // Henri-Bourassa
  ] as [number, number][],
  bleue: [
    [45.4855, -73.6277], // Snowdon
    [45.5108, -73.6190], // Université-de-Montréal
    [45.5468, -73.6133], // Jean-Talon
    [45.5597, -73.5997], // Saint-Michel
  ] as [number, number][],
  jaune: [
    [45.5155, -73.5606], // Berri-UQAM
    [45.5200, -73.5350], // Jean-Drapeau
    [45.5250, -73.5218], // Longueuil
  ] as [number, number][]
};

export function GoogleMapsIntegration({ feeds, selectedFeed, onSelectFeed }: GoogleMapsIntegrationProps) {
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [legendOpacity, setLegendOpacity] = useState(0.95);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high'>('all');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKey, setCustomKey] = useState('');

  // Leaflet fallback map ref
  const leafletContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const incidents = feeds.map(feed => ({
    ...feed,
    ...resolveIncidentCoordinates(feed)
  })).filter(inc => {
    if (severityFilter === 'all') return true;
    if (severityFilter === 'critical') return inc.severity === 'critical';
    if (severityFilter === 'high') return inc.severity === 'high' || inc.severity === 'critical';
    return true;
  });

  // Initialize Leaflet Map when no Google Key is provided or as interactive GIS engine
  useEffect(() => {
    if (hasValidKey) return; // Google Maps SDK handles rendering if key is valid

    if (!leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [45.5088, -73.5540],
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Dark Matter tile layer for Google Maps Dark Intelligence aesthetic
      const tileUrl = mapTypeId === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd'
      });
      tileLayer.addTo(map);

      // Add Metro polylines
      L.polyline(METRO_LINES_COORDS.verte, { color: '#10b981', weight: 4, opacity: 0.8 }).addTo(map);
      L.polyline(METRO_LINES_COORDS.orange, { color: '#f97316', weight: 4, opacity: 0.8 }).addTo(map);
      L.polyline(METRO_LINES_COORDS.bleue, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);
      L.polyline(METRO_LINES_COORDS.jaune, { color: '#eab308', weight: 4, opacity: 0.8 }).addTo(map);

      leafletMapRef.current = map;
    } else {
      // Update tile layer if mapTypeId changed
      const map = leafletMapRef.current;
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });
      const tileUrl = mapTypeId === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
    }

    // Invalidate map size to prevent incomplete container rendering
    setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 150);

  }, [hasValidKey, mapTypeId]);

  // Update Leaflet incident markers when incidents change
  useEffect(() => {
    if (hasValidKey || !leafletMapRef.current) return;

    const map = leafletMapRef.current;

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    incidents.forEach(inc => {
      const isSelected = selectedFeed?.id === inc.id;
      const color = getMarkerColor(inc.severity);

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: ${isSelected ? '24px' : '16px'}; 
              height: ${isSelected ? '24px' : '16px'}; 
              background-color: ${color}; 
              border: 2px solid ${isSelected ? '#ffffff' : '#020617'}; 
              border-radius: 50%; 
              box-shadow: 0 0 ${isSelected ? '16px' : '8px'} ${color};
              transition: all 0.2s ease;
            "></div>
            ${isSelected ? `<div style="position: absolute; width: 36px; height: 36px; border: 2px solid ${color}; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.7;"></div>` : ''}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        onSelectFeed?.(inc);
      });

      marker.bindTooltip(`
        <div style="font-family: monospace; font-size: 11px; padding: 2px 4px; background: #020617; color: #f8fafc; border-radius: 4px; border: 1px solid #1e293b;">
          <strong>${inc.stationName}</strong><br/>
          <span style="color: ${color}">${inc.title}</span>
        </div>
      `, { direction: 'top', offset: [0, -10] });

      markersRef.current.push(marker);
    });

    if (selectedFeed) {
      const selCoords = resolveIncidentCoordinates(selectedFeed);
      map.setView([selCoords.lat, selCoords.lng], 14, { animate: true });
    }
  }, [incidents, selectedFeed, hasValidKey, onSelectFeed]);

  // Handle Search station fly-to
  const handleSearchStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const term = searchQuery.toLowerCase();
    const matched = incidents.find(inc => 
      inc.stationName.toLowerCase().includes(term) || 
      inc.title.toLowerCase().includes(term) ||
      inc.details.toLowerCase().includes(term)
    );

    if (matched) {
      onSelectFeed?.(matched);
      if (leafletMapRef.current) {
        leafletMapRef.current.setView([matched.lat, matched.lng], 14, { animate: true });
      }
    }
  };

  return (
    <div 
      className="relative w-full h-full min-h-[480px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono"
      id="google-maps-intelligence-container"
    >
      {/* Top Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-xs text-slate-100 uppercase tracking-wider">
                Google Maps Intelligence (SIG STM)
              </h3>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                hasValidKey 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}>
                {hasValidKey ? 'API GOOGLE CLOUD NATIVE' : 'MOTEUR VECTORIEL INTEL'}
              </span>
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchStation} className="flex-1 max-w-xs relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une station (Berri, McGill, YUL)..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] pl-8 pr-3 py-1 rounded focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
          />
        </form>

        {/* Map Type & Filter Controls */}
        <div className="flex items-center gap-1.5 text-[10px]">
          {/* Severity filter pill */}
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors ${severityFilter === 'all' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400'}`}
            >
              Tous ({feeds.length})
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-2 py-0.5 rounded transition-colors ${severityFilter === 'critical' ? 'bg-red-500/20 text-red-400 font-bold' : 'text-slate-400'}`}
            >
              Critiques
            </button>
          </div>

          <button
            onClick={() => setMapTypeId(prev => prev === 'roadmap' ? 'satellite' : 'roadmap')}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-2.5 py-1 rounded border border-slate-700 transition-all flex items-center gap-1 cursor-pointer font-bold"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{mapTypeId === 'roadmap' ? 'Satellite' : 'Carte'}</span>
          </button>

          <button
            onClick={() => setShowKeyModal(true)}
            className="bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 px-2 py-1 rounded text-[9px] flex items-center gap-1 cursor-pointer"
            title="Configurer la Clé API Google Maps Platform"
          >
            <Key className="w-3 h-3 text-indigo-400" />
            <span>Clé API</span>
          </button>
        </div>
      </div>

      {/* Main Map Canvas Section */}
      <div className="relative flex-1 w-full h-full min-h-[400px]">
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <GoogleMap
              defaultCenter={{ lat: 45.5088, lng: -73.5540 }}
              defaultZoom={12}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              mapTypeId={mapTypeId}
              disableDefaultUI={true}
            >
              {incidents.map((incident) => {
                const isSelected = selectedFeed?.id === incident.id;
                const color = getMarkerColor(incident.severity);

                return (
                  <AdvancedMarker 
                    key={incident.id} 
                    position={{ lat: incident.lat, lng: incident.lng }}
                    onClick={() => onSelectFeed?.(incident)}
                    zIndex={isSelected ? 1000 : 1}
                  >
                    <Pin 
                      background={color} 
                      borderColor={isSelected ? '#ffffff' : color} 
                      glyphColor="#ffffff" 
                      scale={isSelected ? 1.3 : 1}
                    />
                  </AdvancedMarker>
                );
              })}
            </GoogleMap>
          </APIProvider>
        ) : (
          <div ref={leafletContainerRef} className="w-full h-full z-0" id="google-maps-leaflet-fallback-canvas" />
        )}

        {/* Floating Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-10 flex items-end gap-2 pointer-events-none">
          <AnimatePresence>
            {isLegendOpen && (
              <motion.div
                id="google-map-legend"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: legendOpacity, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.15 }}
                className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3 rounded-lg shadow-2xl pointer-events-auto flex flex-col gap-2.5 text-[10px] min-w-[160px]"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-slate-200 uppercase tracking-wider">Légende Télémétrie</span>
                  <span className="text-[8px] text-emerald-400 font-bold">LIGNES STM</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Pincement Critique</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Surchauffe / Retard</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Perturbation Moyenne</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.8)]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Opérationnel</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-[9px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded bg-emerald-500" />
                    <span className="text-slate-300">Ligne Verte</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded bg-orange-500" />
                    <span className="text-slate-300">Ligne Orange</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded bg-blue-500" />
                    <span className="text-slate-300">Ligne Bleue</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 p-2 rounded-lg border border-slate-800 shadow-lg backdrop-blur-md transition-all flex items-center justify-center cursor-pointer pointer-events-auto h-8 w-8"
            title={isLegendOpen ? "Masquer la légende" : "Afficher la légende"}
          >
            {isLegendOpen ? <X className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Selected Incident Drawer HUD */}
        {selectedFeed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-sm z-10 bg-slate-950/95 border border-indigo-500/40 p-3 rounded-lg shadow-2xl backdrop-blur-md font-mono text-[10px] space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-bold text-slate-100">{selectedFeed.title}</span>
              </div>
              <button
                onClick={() => onSelectFeed?.(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-300 leading-normal">{selectedFeed.details}</p>
            <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-800 text-slate-400">
              <span>Source : {selectedFeed.source}</span>
              <span className={`font-bold uppercase ${
                selectedFeed.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
              }`}>
                {selectedFeed.severity}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* API Key Modal Configuration */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Key className="w-4 h-4" />
                <h3 className="font-bold text-slate-100">Configuration Google Maps API Key</h3>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Pour utiliser le moteur natif Google Maps JS SDK (APIProvider), vous pouvez renseigner le secret <code className="text-indigo-400 bg-slate-950 px-1 py-0.5 rounded">GOOGLE_MAPS_PLATFORM_KEY</code> dans les paramètres du projet.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Statut actuel :</span>
              {hasValidKey ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clé API Détectée et Valide</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Mode Moteur Cartographique Vectoriel de Secours Actif</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
