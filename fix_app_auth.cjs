const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "onAuthRequest={() => setActiveMainTab('workspace')}",
  "onAuthRequest={handleAppLogin}"
);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed auth request in App.tsx');
