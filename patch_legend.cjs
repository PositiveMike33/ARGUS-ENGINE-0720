const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleMapsIntegration.tsx', 'utf8');

const importOld = `import { Layers } from 'lucide-react';`;
const importNew = `import { Layers, Info, X } from 'lucide-react';\nimport { motion, AnimatePresence } from 'motion/react';`;

code = code.replace(importOld, importNew);

const stateOld = `  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');`;
const stateNew = `  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');\n  const [isLegendOpen, setIsLegendOpen] = useState(true);`;

code = code.replace(stateOld, stateNew);

const legendOld = `      {/* Interactive Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-lg">
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
      </div>`;

const legendNew = `      {/* Interactive Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 flex items-end gap-2 pointer-events-none">
        <AnimatePresence>
          {isLegendOpen && (
            <motion.div
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
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 p-2 rounded-lg border border-slate-700 shadow-lg backdrop-blur-md transition-all flex items-center justify-center cursor-pointer pointer-events-auto h-9 w-9"
          title={isLegendOpen ? "Masquer la légende" : "Afficher la légende"}
        >
          {isLegendOpen ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
        </button>
      </div>`;

code = code.replace(legendOld, legendNew);

fs.writeFileSync('src/components/GoogleMapsIntegration.tsx', code);
console.log('Legend patched');
