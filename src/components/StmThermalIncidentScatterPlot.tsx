/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Cell
} from 'recharts';
import {
  Activity,
  Flame,
  AlertTriangle,
  Info,
  TrendingUp,
  Sliders,
  Sparkles,
  Layers,
  Thermometer,
  Zap
} from 'lucide-react';
import { FeedItem } from '../types';

interface StationScatterPoint {
  id: string;
  name: string;
  line: 'verte' | 'orange' | 'bleue' | 'jaune';
  lineLabel: string;
  incidentsCount: number; // X value
  totalDelayMinutes: number; // Alt X
  tempCurrent: number; // Y value
  tempDelta: number; // Alt Y
  thermalLoadPercent: number; // Z value (Bubble size)
  status: 'normal' | 'warning' | 'critical';
}

interface StmThermalIncidentScatterPlotProps {
  feeds?: FeedItem[];
  stmLiveStatus?: any;
}

const LINE_COLORS: Record<string, string> = {
  verte: '#10b981',
  orange: '#f97316',
  bleue: '#3b82f6',
  jaune: '#eab308'
};

const BASE_STATIONS: Omit<StationScatterPoint, 'incidentsCount' | 'totalDelayMinutes' | 'tempCurrent' | 'tempDelta' | 'thermalLoadPercent' | 'status'>[] = [
  { id: 'berri', name: 'Berri-UQAM', line: 'verte', lineLabel: 'Verte / Orange / Jaune' },
  { id: 'mcgill', name: 'McGill', line: 'verte', lineLabel: 'Ligne Verte' },
  { id: 'guy_concordia', name: 'Guy-Concordia', line: 'verte', lineLabel: 'Ligne Verte' },
  { id: 'lionel_groulx', name: 'Lionel-Groulx', line: 'orange', lineLabel: 'Verte / Orange' },
  { id: 'jean_talon', name: 'Jean-Talon', line: 'orange', lineLabel: 'Orange / Bleue' },
  { id: 'henri_bourassa', name: 'Henri-Bourassa', line: 'orange', lineLabel: 'Ligne Orange' },
  { id: 'snowdon', name: 'Snowdon', line: 'bleue', lineLabel: 'Orange / Bleue' },
  { id: 'st_michel', name: 'Saint-Michel', line: 'bleue', lineLabel: 'Ligne Bleue' },
  { id: 'longueuil', name: 'Longueuil', line: 'jaune', lineLabel: 'Ligne Jaune' },
  { id: 'jolicoeur', name: 'Jolicoeur', line: 'verte', lineLabel: 'Ligne Verte' },
  { id: 'rosemont', name: 'Rosemont', line: 'orange', lineLabel: 'Ligne Orange' },
  { id: 'place_des_arts', name: 'Place-des-Arts', line: 'verte', lineLabel: 'Ligne Verte' },
];

export const StmThermalIncidentScatterPlot: React.FC<StmThermalIncidentScatterPlotProps> = ({
  feeds = [],
  stmLiveStatus
}) => {
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('all');
  const [xAxisMetric, setXAxisMetric] = useState<'incidents' | 'delays'>('incidents');
  const [yAxisMetric, setYAxisMetric] = useState<'temp' | 'delta'>('temp');
  const [showQuadrants, setShowQuadrants] = useState<boolean>(true);

  // Derive real-time correlated station points based on feeds and stmLiveStatus
  const scatterData = useMemo<StationScatterPoint[]>(() => {
    return BASE_STATIONS.map((st) => {
      // Find matching feeds for this station
      const matchingFeeds = feeds.filter((f) => {
        const text = (f.title + ' ' + f.details).toLowerCase();
        const stNameLower = st.name.toLowerCase().replace('-', ' ');
        return text.includes(stNameLower) || (st.id === 'berri' && (text.includes('berri') || text.includes('uqam')));
      });

      const incidentsCount = matchingFeeds.length;
      
      // Calculate delay minutes estimated from feeds or station line status
      let totalDelayMinutes = incidentsCount * 12;
      const lineStatus = stmLiveStatus?.lines?.[st.line]?.status;
      if (lineStatus === 'delay') totalDelayMinutes += 15;
      if (lineStatus === 'interruption') totalDelayMinutes += 35;

      // Base thermal calculations + heat correlation with delays/incidents
      const thermalBase = st.id === 'berri' ? 23.8 : st.id === 'mcgill' ? 22.9 : st.id === 'guy_concordia' ? 22.5 : 21.2;
      const thermalInc = (incidentsCount * 0.8) + (totalDelayMinutes * 0.05);
      const tempCurrent = Number((thermalBase + thermalInc).toFixed(1));
      const tempDelta = Number((thermalInc + (st.id === 'berri' ? 1.2 : 0.5)).toFixed(1));
      const thermalLoadPercent = Math.min(100, Math.round(50 + tempDelta * 12 + incidentsCount * 10));

      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (tempCurrent >= 24.5 || totalDelayMinutes >= 25) {
        status = 'critical';
      } else if (tempCurrent >= 23.0 || totalDelayMinutes >= 10 || incidentsCount >= 1) {
        status = 'warning';
      }

      return {
        ...st,
        incidentsCount,
        totalDelayMinutes,
        tempCurrent,
        tempDelta,
        thermalLoadPercent,
        status
      };
    });
  }, [feeds, stmLiveStatus]);

  // Filtered dataset according to line selection
  const filteredData = useMemo(() => {
    if (selectedLineFilter === 'all') return scatterData;
    return scatterData.filter((d) => d.line === selectedLineFilter);
  }, [scatterData, selectedLineFilter]);

  // Pearson Correlation Coefficient calculation r
  const pearsonCorrelation = useMemo(() => {
    const n = filteredData.length;
    if (n < 2) return 0;

    const xVals = filteredData.map((d) => (xAxisMetric === 'incidents' ? d.incidentsCount : d.totalDelayMinutes));
    const yVals = filteredData.map((d) => (yAxisMetric === 'temp' ? d.tempCurrent : d.tempDelta));

    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = yVals.reduce((a, b) => a + b, 0);
    const sumXY = xVals.reduce((sum, x, i) => sum + x * yVals[i], 0);
    const sumX2 = xVals.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = yVals.reduce((sum, y) => sum + y * y, 0);

    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (den === 0) return 0;
    return Number((num / den).toFixed(3));
  }, [filteredData, xAxisMetric, yAxisMetric]);

  // Custom Scatter Tooltip
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: StationScatterPoint = payload[0].payload;
      const xVal = xAxisMetric === 'incidents' ? `${data.incidentsCount} incident(s)` : `${data.totalDelayMinutes} min retards`;
      const yVal = yAxisMetric === 'temp' ? `${data.tempCurrent}°C` : `+${data.tempDelta}°C Écart`;

      return (
        <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-lg shadow-2xl backdrop-blur-md font-mono text-[11px] space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LINE_COLORS[data.line] }} />
              {data.name}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
              data.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' :
              data.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {data.status}
            </span>
          </div>

          <div className="text-slate-300 space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Affiliation :</span>
              <span className="text-slate-300 font-semibold">{data.lineLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{xAxisMetric === 'incidents' ? 'Incidents' : 'Retard estimé'} :</span>
              <span className="text-indigo-400 font-bold">{xVal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{yAxisMetric === 'temp' ? 'Température' : 'Variation ΔT'} :</span>
              <span className="text-amber-400 font-bold">{yVal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Charge thermique HVAC :</span>
              <span className="text-emerald-400 font-bold">{data.thermalLoadPercent}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="bg-slate-950 rounded-xl border border-slate-900 p-4 shadow-xl space-y-4 font-mono"
      id="stm-thermal-incident-scatter-container"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-xs text-slate-100 uppercase tracking-wider">
                Corrélation Télémétrique (Incidents vs Charge Thermique)
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                SCATTER PLOT REALTIME
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              Analyse bidimensionnelle de l'impact des anomalies de transit sur l'accumulation de chaleur dans les stations.
            </p>
          </div>
        </div>

        {/* Correlation Metric Display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px]">
            <TrendingUp className={`w-3.5 h-3.5 ${pearsonCorrelation >= 0.5 ? 'text-amber-400' : 'text-indigo-400'}`} />
            <span className="text-slate-400">Coeff. Pearson (r) :</span>
            <span className={`font-bold text-xs ${
              pearsonCorrelation >= 0.7 ? 'text-red-400' :
              pearsonCorrelation >= 0.4 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {pearsonCorrelation > 0 ? `+${pearsonCorrelation}` : pearsonCorrelation}
            </span>
            <span className="text-[8px] text-slate-500 border-l border-slate-800 pl-1.5">
              {pearsonCorrelation >= 0.6 ? 'FORTE CORRÉLATION' : pearsonCorrelation >= 0.3 ? 'CORRÉLATION MODÉRÉE' : 'FAIBLE DÉPENDANCE'}
            </span>
          </div>
        </div>
      </div>

      {/* Axis & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
        {/* Line selection tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setSelectedLineFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${selectedLineFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Toutes les lignes
          </button>
          <button
            onClick={() => setSelectedLineFilter('verte')}
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${selectedLineFilter === 'verte' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Verte
          </button>
          <button
            onClick={() => setSelectedLineFilter('orange')}
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${selectedLineFilter === 'orange' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Orange
          </button>
          <button
            onClick={() => setSelectedLineFilter('bleue')}
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${selectedLineFilter === 'bleue' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Bleue
          </button>
          <button
            onClick={() => setSelectedLineFilter('jaune')}
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${selectedLineFilter === 'jaune' ? 'bg-yellow-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            Jaune
          </button>
        </div>

        {/* Axis Metrics Switchers */}
        <div className="flex items-center gap-2">
          {/* X Metric */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            <span className="px-1.5 text-slate-500 font-bold text-[9px]">Axe X :</span>
            <button
              onClick={() => setXAxisMetric('incidents')}
              className={`px-2 py-0.5 rounded transition-colors ${xAxisMetric === 'incidents' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400'}`}
            >
              Incidents
            </button>
            <button
              onClick={() => setXAxisMetric('delays')}
              className={`px-2 py-0.5 rounded transition-colors ${xAxisMetric === 'delays' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400'}`}
            >
              Retards (min)
            </button>
          </div>

          {/* Y Metric */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            <span className="px-1.5 text-slate-500 font-bold text-[9px]">Axe Y :</span>
            <button
              onClick={() => setYAxisMetric('temp')}
              className={`px-2 py-0.5 rounded transition-colors ${yAxisMetric === 'temp' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400'}`}
            >
              Temp (°C)
            </button>
            <button
              onClick={() => setYAxisMetric('delta')}
              className={`px-2 py-0.5 rounded transition-colors ${yAxisMetric === 'delta' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400'}`}
            >
              Écart ΔT
            </button>
          </div>

          {/* Quadrants Toggle */}
          <button
            onClick={() => setShowQuadrants(!showQuadrants)}
            className={`px-2 py-1 rounded border text-[9px] transition-colors cursor-pointer ${
              showQuadrants ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Zones d'Alerte
          </button>
        </div>
      </div>

      {/* Recharts Scatter Plot Canvas */}
      <div className="w-full h-[320px] bg-slate-950/80 rounded-lg p-2 border border-slate-900/80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

            <XAxis
              type="number"
              dataKey={xAxisMetric === 'incidents' ? 'incidentsCount' : 'totalDelayMinutes'}
              name={xAxisMetric === 'incidents' ? 'Nombre d\'incidents' : 'Retards Cumulés'}
              unit={xAxisMetric === 'incidents' ? ' inc' : ' min'}
              stroke="#64748b"
              fontSize={10}
              tickLine={{ stroke: '#334155' }}
              domain={[0, 'dataMax + 2']}
            />

            <YAxis
              type="number"
              dataKey={yAxisMetric === 'temp' ? 'tempCurrent' : 'tempDelta'}
              name={yAxisMetric === 'temp' ? 'Température Station' : 'Écart Thermique'}
              unit="°C"
              stroke="#64748b"
              fontSize={10}
              tickLine={{ stroke: '#334155' }}
              domain={yAxisMetric === 'temp' ? [19, 26] : [0, 4]}
            />

            <ZAxis
              type="number"
              dataKey="thermalLoadPercent"
              range={[60, 240]}
              name="Charge HVAC"
              unit="%"
            />

            {/* Critical Thermal / Delay Quadrant Highlight */}
            {showQuadrants && (
              <ReferenceArea
                x1={xAxisMetric === 'incidents' ? 1 : 15}
                y1={yAxisMetric === 'temp' ? 23.5 : 1.5}
                x2={xAxisMetric === 'incidents' ? 5 : 60}
                y2={yAxisMetric === 'temp' ? 26 : 4}
                fill="#ef4444"
                fillOpacity={0.08}
                stroke="#ef4444"
                strokeOpacity={0.2}
                strokeDasharray="2 2"
              />
            )}

            {/* Threshold reference lines */}
            <ReferenceLine
              y={yAxisMetric === 'temp' ? 23.5 : 1.5}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: 'Seuil Ventilation Intensive', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }}
            />

            <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} />

            <Scatter name="Stations STM" data={filteredData}>
              {filteredData.map((entry, index) => {
                const color = LINE_COLORS[entry.line] || '#3b82f6';
                const isCritical = entry.status === 'critical';
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    stroke={isCritical ? '#ef4444' : '#020617'}
                    strokeWidth={isCritical ? 2 : 1}
                    style={{
                      filter: isCritical ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))' : 'none'
                    }}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Footer Quadrants & Legend Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9px] pt-1">
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/50 shrink-0" />
          <span className="text-slate-300">
            <strong>Zone Nominale :</strong> Faible fréquence d'incidents et régulation thermique optimale.
          </span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/50 shrink-0" />
          <span className="text-slate-300">
            <strong>Zone de Vigilance :</strong> Accumulation thermique moderate liée aux retards de transit.
          </span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/50 shrink-0" />
          <span className="text-slate-300">
            <strong>Zone de Surchauffe Critique :</strong> Incidents majeurs corrélés à des pic thermiques HVAC.
          </span>
        </div>
      </div>
    </div>
  );
};
