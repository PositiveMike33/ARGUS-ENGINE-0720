/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import { Thermometer, Flame, Fan, AlertTriangle, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

export interface StationThermalDataPoint {
  time: string;
  timestamp: string;
  berri: number;
  mcgill: number;
  guy_concordia: number;
  lionel_groulx: number;
  jean_talon: number;
  henri_bourassa: number;
  moyenne: number;
}

const STATIONS_CONFIG = [
  { id: 'berri', name: 'Berri-UQAM', color: '#10b981', line: 'Verte/Orange/Jaune' },
  { id: 'mcgill', name: 'McGill', color: '#3b82f6', line: 'Ligne Verte' },
  { id: 'guy_concordia', name: 'Guy-Concordia', color: '#f59e0b', line: 'Ligne Verte' },
  { id: 'lionel_groulx', name: 'Lionel-Groulx', color: '#8b5cf6', line: 'Verte/Orange' },
  { id: 'jean_talon', name: 'Jean-Talon', color: '#ec4899', line: 'Orange/Bleue' },
  { id: 'henri_bourassa', name: 'Henri-Bourassa', color: '#06b6d4', line: 'Ligne Orange' },
];

export const StmStationThermalChart: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [showThresholds, setShowThresholds] = useState<boolean>(true);

  // Generate 60-minute historical thermal data
  const chartData = useMemo<StationThermalDataPoint[]>(() => {
    const now = new Date();
    const intervals = [60, 50, 40, 30, 20, 10, 0];
    
    return intervals.map((minsAgo) => {
      const d = new Date(now.getTime() - minsAgo * 60 * 1000);
      const timeStr = minsAgo === 0 ? 'Maintenant' : `-${minsAgo}m`;
      const timeClock = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Base thermal simulation with realistic station load heat accumulation
      const timeFactor = Math.sin((60 - minsAgo) / 10) * 0.4;
      const berri = Number((22.4 + timeFactor + (60 - minsAgo) * 0.02).toFixed(1));
      const mcgill = Number((21.8 + timeFactor * 0.8 + (60 - minsAgo) * 0.015).toFixed(1));
      const guy_concordia = Number((22.1 + timeFactor * 0.9 + (60 - minsAgo) * 0.018).toFixed(1));
      const lionel_groulx = Number((21.2 + timeFactor * 0.7 + (60 - minsAgo) * 0.012).toFixed(1));
      const jean_talon = Number((20.9 + timeFactor * 0.6 + (60 - minsAgo) * 0.010).toFixed(1));
      const henri_bourassa = Number((20.5 + timeFactor * 0.5 + (60 - minsAgo) * 0.008).toFixed(1));

      const avg = Number(
        ((berri + mcgill + guy_concordia + lionel_groulx + jean_talon + henri_bourassa) / 6).toFixed(1)
      );

      return {
        time: timeStr,
        timestamp: timeClock,
        berri,
        mcgill,
        guy_concordia,
        lionel_groulx,
        jean_talon,
        henri_bourassa,
        moyenne: avg
      };
    });
  }, []);

  const latestPoint = chartData[chartData.length - 1];

  // Calculate current station stats
  const maxTempStation = useMemo(() => {
    let maxVal = -1;
    let stationName = 'Berri-UQAM';
    STATIONS_CONFIG.forEach((st) => {
      const val = (latestPoint as any)[st.id] || 0;
      if (val > maxVal) {
        maxVal = val;
        stationName = st.name;
      }
    });
    return { name: stationName, temp: maxVal };
  }, [latestPoint]);

  const hvacStatus = useMemo(() => {
    if (maxTempStation.temp >= 24.5) return { label: 'SURCHAUFFE DÉTECTÉE', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (maxTempStation.temp >= 23.0) return { label: 'VENTILATION INTENSIVE (HVAC 92%)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'RÉGIME OPTIMAL (HVAC 100%)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  }, [maxTempStation]);

  // Custom recharts tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataObj = payload[0]?.payload;

    return (
      <div className="bg-slate-950/95 border border-slate-800 p-2.5 rounded-lg shadow-2xl font-mono text-[10px] space-y-1.5 min-w-[170px] z-50 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 text-slate-400">
          <span className="font-bold text-slate-200">{label} ({dataObj?.timestamp})</span>
          <span className="text-[9px] text-emerald-400 font-bold">Moy: {dataObj?.moyenne}°C</span>
        </div>
        <div className="space-y-1">
          {payload.map((entry: any) => {
            if (selectedStation !== 'all' && entry.dataKey !== selectedStation) return null;
            const stInfo = STATIONS_CONFIG.find(s => s.id === entry.dataKey);
            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300 font-medium">{stInfo?.name || entry.name} :</span>
                </div>
                <span className={`font-bold ${entry.value >= 23.5 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {entry.value.toFixed(1)}°C
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-950/90 rounded-xl border border-slate-800/80 p-3.5 space-y-3 font-sans text-slate-200 shadow-lg" id="stm-station-thermal-chart-container">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Thermometer className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-xs text-slate-100 uppercase tracking-wider">
                Profil Thermique des Stations STM (-60 Min)
              </h4>
              <span className={`px-2 py-0.5 rounded border text-[8px] font-mono font-bold uppercase ${hvacStatus.color}`}>
                {hvacStatus.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Suivi télémétrique des capteurs HVAC et de la température ambiante dans les quais
            </p>
          </div>
        </div>

        {/* Quick Station Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 font-mono text-[9px]">
          <button
            onClick={() => setSelectedStation('all')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              selectedStation === 'all'
                ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/40'
            }`}
          >
            Toutes ({STATIONS_CONFIG.length})
          </button>
          {STATIONS_CONFIG.slice(0, 4).map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStation(st.id)}
              className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                selectedStation === st.id
                  ? 'bg-slate-800 font-bold border border-slate-700'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/40'
              }`}
              style={{ color: selectedStation === st.id ? st.color : undefined }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
              <span>{st.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
        <div className="bg-slate-900/60 border border-slate-800/60 p-2 rounded-lg flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-slate-500 block text-[8px] uppercase">Moyenne Réseau</span>
            <span className="font-bold text-emerald-400 text-xs">{latestPoint?.moyenne}°C</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/60 p-2 rounded-lg flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-slate-500 block text-[8px] uppercase">Pic de Chaleur</span>
            <span className="font-bold text-amber-400 text-xs">{maxTempStation.name} ({maxTempStation.temp}°C)</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/60 p-2 rounded-lg flex items-center gap-2">
          <Fan className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-slate-500 block text-[8px] uppercase">Ventilation HVAC</span>
            <span className="font-bold text-cyan-400 text-xs">98.2% Nominal</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/60 p-2 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[8px] uppercase">Seuil Confort</span>
              <span className="font-bold text-indigo-300 text-xs">21.0°C - 24.5°C</span>
            </div>
          </div>
          <button
            onClick={() => setShowThresholds(prev => !prev)}
            className={`text-[8px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
              showThresholds ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            Seuils
          </button>
        </div>
      </div>

      {/* Main Recharts Chart */}
      <div className="h-[180px] w-full pt-1" id="stm-stations-thermal-recharts-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
              domain={[19, 26]}
              tickFormatter={(val) => `${val}°C`}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip content={<CustomTooltip />} />

            {showThresholds && (
              <>
                <ReferenceLine
                  y={24.5}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Seuil Alerte (24.5°C)', fill: '#ef4444', fontSize: 8, position: 'top' }}
                />
                <ReferenceLine
                  y={21.0}
                  stroke="#06b6d4"
                  strokeDasharray="2 2"
                  label={{ value: 'Cible Nominale (21°C)', fill: '#06b6d4', fontSize: 8, position: 'bottom' }}
                />
              </>
            )}

            {STATIONS_CONFIG.map((st) => {
              if (selectedStation !== 'all' && selectedStation !== st.id) return null;
              return (
                <Line
                  key={st.id}
                  type="monotone"
                  dataKey={st.id}
                  name={st.name}
                  stroke={st.color}
                  strokeWidth={selectedStation === st.id ? 2.5 : 1.5}
                  dot={{ r: 2.5, fill: st.color }}
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1.5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
