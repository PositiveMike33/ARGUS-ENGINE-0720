const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'History\n} from \'lucide-react\';',
  'History,\n  CheckSquare\n} from \'lucide-react\';'
);

code = code.replace(
  "import { STMIncidentMap } from './components/STMIncidentMap';",
  "import { STMIncidentMap } from './components/STMIncidentMap';\nimport { GoogleMapsIntegration } from './components/GoogleMapsIntegration';"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed App.tsx imports');
