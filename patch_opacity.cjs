const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleMapsIntegration.tsx', 'utf8');

const stateOld = `  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isLegendOpen, setIsLegendOpen] = useState(true);`;
const stateNew = `  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [legendOpacity, setLegendOpacity] = useState(0.9);`;

code = code.replace(stateOld, stateNew);

const legendOld = `            <motion.div
              id="google-map-legend"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-lg pointer-events-auto"
            >
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Séverité des incidents</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-xs text-slate-200">Critique</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                  <span className="text-xs text-slate-200">Élevée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                  <span className="text-xs text-slate-200">Moyenne</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <span className="text-xs text-slate-200">Faible</span>
                </div>
              </div>
            </motion.div>`;

const legendNew = `            <motion.div
              id="google-map-legend"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: legendOpacity, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-lg pointer-events-auto flex flex-col gap-3"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Séverité des incidents</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    <span className="text-xs text-slate-200">Critique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                    <span className="text-xs text-slate-200">Élevée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                    <span className="text-xs text-slate-200">Moyenne</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-xs text-slate-200">Faible</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700/50">
                <label className="text-[10px] text-slate-400 font-medium mb-1 block">Opacité de la légende</label>
                <input 
                  type="range" 
                  min="0.2" 
                  max="1" 
                  step="0.05" 
                  value={legendOpacity}
                  onChange={(e) => setLegendOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </motion.div>`;

code = code.replace(legendOld, legendNew);

fs.writeFileSync('src/components/GoogleMapsIntegration.tsx', code);
console.log('Opacity patched');
