const fs = require('fs');
let code = fs.readFileSync('src/components/D3TransitMap.tsx', 'utf8');

code = code.replace(
/  useEffect\(\(\) => \{\n    const timer = setTimeout\(\(\) => \{\n      captureMapAsPng\(false\)\.catch\(\(\) => \{\}\);\n    \}, 1500\);\n    return \(\) => clearTimeout\(timer\);\n  \}, \[dimensions, activePathNodes, activeAlertsByNode, activeLayer, origin, destination\]\);\n/,
""
);

fs.writeFileSync('src/components/D3TransitMap.tsx', code);
console.log('Removed auto capture in D3TransitMap');
