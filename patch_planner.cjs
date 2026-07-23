const fs = require('fs');
let code = fs.readFileSync('src/components/ItineraryPlanner.tsx', 'utf8');
code = code.replace(
`      // Force synchronization with the user's real geolocation before every calculation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGpsLatitude(position.coords.latitude);
            setGpsLongitude(position.coords.longitude);
            setIsGpsActive(true);
            setIsManualActive(false);
          },
          (err) => {
            console.warn("Forced GPS auto-synchronization failed. Utilizing default coordinates.", err);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      }`,
`      // GPS syncing is moved to a separate watchPosition or done manually to prevent UI freezing`
);
fs.writeFileSync('src/components/ItineraryPlanner.tsx', code);
console.log('Patched ItineraryPlanner');
