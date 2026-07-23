const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase-admin.ts', 'utf8');
code = code.replace(
  "export const adminDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);",
  "export const adminDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);"
);
fs.writeFileSync('src/lib/firebase-admin.ts', code);
