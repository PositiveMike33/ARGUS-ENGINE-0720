const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [activeGeospatialTab, setActiveGeospatialTab] = useState<'map' | 'airspace' | 'cctv' | 'gtfs'>('map');",
  "const [activeGeospatialTab, setActiveGeospatialTab] = useState<'map' | 'google-map' | 'airspace' | 'cctv' | 'gtfs'>('map');"
);

const oldTabs = `                    <button
                      onClick={() => setActiveGeospatialTab('map')}
                      className={\`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 border cursor-pointer \${
                        activeGeospatialTab === 'map'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }\`}
                    >
                      🗺️ CARTOGRAPHIE DES INCIDENTS STM
                    </button>`;

const newTabs = `                    <button
                      onClick={() => setActiveGeospatialTab('map')}
                      className={\`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 border cursor-pointer \${
                        activeGeospatialTab === 'map'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }\`}
                    >
                      🗺️ CARTOGRAPHIE DES INCIDENTS STM
                    </button>
                    <button
                      onClick={() => setActiveGeospatialTab('google-map')}
                      className={\`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 border cursor-pointer \${
                        activeGeospatialTab === 'google-map'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }\`}
                    >
                      📍 GOOGLE MAPS INTELLIGENCE
                    </button>`;

code = code.replace(oldTabs, newTabs);

const oldViews = `                    <div className={\`lg:col-span-8 flex flex-col \${isGeospatialFullscreen ? 'flex-1 h-full min-h-[450px]' : 'h-[520px]'}\`}>
                      {activeGeospatialTab === 'map' ? (
                        <STMIncidentMap
                          feeds={filteredFeedsByTime}
                          selectedFeed={selectedFeed}
                          onSelectFeed={(feed) => setSelectedFeed(feed)}
                        />
                      ) : (`;

const newViews = `                    <div className={\`lg:col-span-8 flex flex-col \${isGeospatialFullscreen ? 'flex-1 h-full min-h-[450px]' : 'h-[520px]'}\`}>
                      {activeGeospatialTab === 'map' ? (
                        <STMIncidentMap
                          feeds={filteredFeedsByTime}
                          selectedFeed={selectedFeed}
                          onSelectFeed={(feed) => setSelectedFeed(feed)}
                        />
                      ) : activeGeospatialTab === 'google-map' ? (
                        <GoogleMapsIntegration
                          feeds={filteredFeedsByTime}
                          selectedFeed={selectedFeed}
                          onSelectFeed={(feed) => setSelectedFeed(feed)}
                        />
                      ) : (`;

code = code.replace(oldViews, newViews);

const importOld = `import { STMIncidentMap } from './components/STMIncidentMap';`;
const importNew = `import { STMIncidentMap } from './components/STMIncidentMap';\nimport { GoogleMapsIntegration } from './components/GoogleMapsIntegration';`;

if (!code.includes('GoogleMapsIntegration')) {
  code = code.replace(importOld, importNew);
}

fs.writeFileSync('src/App.tsx', code);
console.log('Geotabs patched');
