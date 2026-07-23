const fs = require('fs');
let code = fs.readFileSync('src/components/D3TransitMap.tsx', 'utf8');

code = code.replace(
`        setDimensions({
          width: Math.max(300, width),
          height: 380
        });`,
`        setDimensions(prev => {
          const newWidth = Math.max(300, width);
          if (prev.width === newWidth && prev.height === 380) return prev;
          return { width: newWidth, height: 380 };
        });`
);

fs.writeFileSync('src/components/D3TransitMap.tsx', code);
console.log('Patched D3TransitMap');
