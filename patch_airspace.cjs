const fs = require('fs');
let code = fs.readFileSync('src/components/AirspaceOverview.tsx', 'utf8');

code = code.replace(
`        setDimensions({
          width: Math.max(width, 400),
          height: Math.max(height, 420)
        });`,
`        setDimensions(prev => {
          const newWidth = Math.max(width, 400);
          const newHeight = Math.max(height, 420);
          if (prev.width === newWidth && prev.height === newHeight) return prev;
          return { width: newWidth, height: newHeight };
        });`
);

fs.writeFileSync('src/components/AirspaceOverview.tsx', code);
console.log('Patched AirspaceOverview');
