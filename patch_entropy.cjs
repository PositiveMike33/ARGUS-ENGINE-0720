const fs = require('fs');
let code = fs.readFileSync('src/components/EntropyTrendVisualizer.tsx', 'utf8');

code = code.replace(
`      setDimensions({ 
        width: width || 300, 
        height: height || 180 
      });`,
`      setDimensions(prev => {
        const newWidth = width || 300;
        const newHeight = height || 180;
        if (prev.width === newWidth && prev.height === newHeight) return prev;
        return { width: newWidth, height: newHeight };
      });`
);

fs.writeFileSync('src/components/EntropyTrendVisualizer.tsx', code);
console.log('Patched EntropyTrendVisualizer');
