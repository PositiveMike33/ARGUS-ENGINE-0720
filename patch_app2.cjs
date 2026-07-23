const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`    if (hasLogDuplicates) {
      setApiLogs(uniqueLogs);
    }`,
`    if (hasLogDuplicates && JSON.stringify(apiLogs) !== JSON.stringify(uniqueLogs)) {
      setApiLogs(uniqueLogs);
    }`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx logs logic');
