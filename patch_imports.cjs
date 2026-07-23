const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldImports = `import { GoogleFormsIntegration } from './components/GoogleFormsIntegration';`;
const newImports = `import { GoogleFormsIntegration } from './components/GoogleFormsIntegration';
import { GoogleTasksIntegration } from './components/GoogleTasksIntegration';
import { GoogleSlidesIntegration } from './components/GoogleSlidesIntegration';
import { GoogleDocsIntegration } from './components/GoogleDocsIntegration';`;

if (!code.includes('import { GoogleTasksIntegration }')) {
  code = code.replace(oldImports, newImports);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Imports added');
}
