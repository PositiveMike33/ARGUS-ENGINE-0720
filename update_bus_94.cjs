const fs = require('fs');
let code = fs.readFileSync('src/components/STMIncidentMap.tsx', 'utf8');

const newRoute = `const BUS_94_ROUTE: SimRouteNode[] = [
  // Direction NORD: Rue Frontenac
  { lat: 45.5273, lng: -73.5432 }, // Métro Frontenac
  { lat: 45.5292, lng: -73.5455 }, // Frontenac / Hochelaga
  { lat: 45.5353, lng: -73.5530 }, // Frontenac / Sherbrooke
  { lat: 45.5423, lng: -73.5620 }, // Frontenac / Mont-Royal
  { lat: 45.5493, lng: -73.5710 }, // Frontenac / Rosemont
  { lat: 45.5573, lng: -73.5820 }, // Frontenac / Jean-Talon
  { lat: 45.5713, lng: -73.6010 }, // Frontenac / Jarry
  { lat: 45.5663, lng: -73.5940 }, // Frontenac / Crémazie
  { lat: 45.5583, lng: -73.6007 }, // Émile-Journault / Cirque du Soleil
  
  // Direction SUD: Rue d'Iberville
  { lat: 45.5660, lng: -73.5945 }, // Iberville / Crémazie
  { lat: 45.5710, lng: -73.6015 }, // Iberville / Jarry
  { lat: 45.5570, lng: -73.5825 }, // Iberville / Jean-Talon
  { lat: 45.5490, lng: -73.5715 }, // Iberville / Rosemont
  { lat: 45.5420, lng: -73.5625 }, // Iberville / Mont-Royal
  { lat: 45.5350, lng: -73.5535 }, // Iberville / Sherbrooke
  { lat: 45.5289, lng: -73.5460 }, // Iberville / Hochelaga
  { lat: 45.5273, lng: -73.5432 }  // Métro Frontenac
];`;

code = code.replace(/const BUS_94_ROUTE: SimRouteNode\[\] = \[\s*\{ lat: 45\.5273, lng: -73\.5432 \},[^\]]+\];/, newRoute);

// Add isLoop to interface
code = code.replace(/speedKmh: number;\n}/, "speedKmh: number;\n  isLoop?: boolean;\n}");

// Update buses
code = code.replace(
  /{ id: 'B-94N', routeId: '94', routeName: '94 d\\'Iberville Nord \\(Frontenac ⇄ Cirque du Soleil\\)', points: BUS_94_ROUTE, currentIdx: 1, dir: 1, progress: 0, speed: 0.05, occupancy: 48, speedKmh: 34 },/,
  `{ id: 'B-94N', routeId: '94', routeName: '94 d\\'Iberville Nord (Frontenac ⇄ Cirque du Soleil)', points: BUS_94_ROUTE, currentIdx: 1, dir: 1, progress: 0, speed: 0.05, occupancy: 48, speedKmh: 34, isLoop: true },`
);
code = code.replace(
  /{ id: 'B-94S', routeId: '94', routeName: '94 d\\'Iberville Sud \\(Cirque du Soleil ⇄ Frontenac\\)', points: BUS_94_ROUTE, currentIdx: 3, dir: -1, progress: 0, speed: 0.04, occupancy: 61, speedKmh: 29 },/,
  `{ id: 'B-94S', routeId: '94', routeName: '94 d\\'Iberville Sud (Cirque du Soleil ⇄ Frontenac)', points: BUS_94_ROUTE, currentIdx: 11, dir: 1, progress: 0, speed: 0.04, occupancy: 61, speedKmh: 29, isLoop: true },`
);

// Update loop logic
code = code.replace(
`          if (nextIdx < 0 || nextIdx >= bus.points.length - 1) {
            return {
              ...bus,
              currentIdx: nextIdx < 0 ? 0 : bus.points.length - 2,
              dir: (bus.dir === 1 ? -1 : 1) as 1 | -1,
              progress: 0,
              speedKmh: Math.floor(25 + Math.random() * 20)
            };
          } else {`,
`          if (nextIdx < 0 || nextIdx >= bus.points.length - 1) {
            if (bus.isLoop) {
              return {
                ...bus,
                currentIdx: 0,
                progress: 0,
                speedKmh: Math.floor(25 + Math.random() * 20)
              };
            }
            return {
              ...bus,
              currentIdx: nextIdx < 0 ? 0 : bus.points.length - 2,
              dir: (bus.dir === 1 ? -1 : 1) as 1 | -1,
              progress: 0,
              speedKmh: Math.floor(25 + Math.random() * 20)
            };
          } else {`
);

fs.writeFileSync('src/components/STMIncidentMap.tsx', code);
console.log('Updated STMIncidentMap route 94');
