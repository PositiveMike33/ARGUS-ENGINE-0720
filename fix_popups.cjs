const fs = require('fs');
const files = [
  'src/App.tsx',
  'src/components/GmailIntegration.tsx',
  'src/components/GoogleCalendarIntegration.tsx',
  'src/components/GoogleDriveIntegration.tsx',
  'src/components/GoogleSheetsIntegration.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(
    "if (err.code === 'auth/cancelled-popup-request' || err.message?.includes('cancelled-popup-request') || err.message === 'auth/cancelled-popup-request') { \\n        // Ignorer l'annulation \\n      } else if (err.code === 'auth/popup-blocked'",
    "if (err.code === 'auth/cancelled-popup-request' || err.message?.includes('cancelled-popup-request') || err.message === 'auth/cancelled-popup-request') {\n        // Ignorer l'annulation\n      } else if (err.code === 'auth/popup-blocked'"
  );
  fs.writeFileSync(file, code);
}
console.log('Fixed popups formatting in components');
