const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "let parsed;try { parsed = JSON.parse(jsonText.trim()); } catch (e) { const c = jsonText.replace(/^$/, '').trim(); parsed = JSON.parse(c); }",
  "let parsed; try { parsed = JSON.parse(jsonText.trim()); } catch (e) { const c = jsonText.replace(/^\\s*\`\`\`json/i, '').replace(/\`\`\`\\s*$/i, '').trim(); try { parsed = JSON.parse(c); } catch(e2) { parsed = { lines: {}, majorAlerts: [] }; } }"
);

fs.writeFileSync('server.ts', code);
console.log('Done replacement');
