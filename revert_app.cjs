const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`    if (hasChanged && JSON.stringify(feeds) !== JSON.stringify(uniqueFeeds)) {
      setFeeds(uniqueFeeds);
      localStorage.setItem('argus_cached_feeds', JSON.stringify(uniqueFeeds));
    }`,
`    if (hasChanged) {
      setFeeds(uniqueFeeds);
      localStorage.setItem('argus_cached_feeds', JSON.stringify(uniqueFeeds));
    }`
);

code = code.replace(
`    if (hasLogDuplicates && JSON.stringify(apiLogs) !== JSON.stringify(uniqueLogs)) {
      setApiLogs(uniqueLogs);
    }`,
`    if (hasLogDuplicates) {
      setApiLogs(uniqueLogs);
    }`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Reverted JSON.stringify from App.tsx');
