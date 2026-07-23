const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`    if (hasChanged) {
      setFeeds(uniqueFeeds);
      localStorage.setItem('argus_cached_feeds', JSON.stringify(uniqueFeeds));
    }`,
`    if (hasChanged && JSON.stringify(feeds) !== JSON.stringify(uniqueFeeds)) {
      setFeeds(uniqueFeeds);
      localStorage.setItem('argus_cached_feeds', JSON.stringify(uniqueFeeds));
    }`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx feeds logic');
