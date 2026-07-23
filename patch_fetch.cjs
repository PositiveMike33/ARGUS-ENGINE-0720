const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const fetchStmLive = async () => {
    setIsFetchingStm(true);
    try {
      const res = await fetchWithAuth('/api/stm/realtime');
      
      if (!res.ok) {
        console.warn('STM live status sync returned non-OK status:', res.status);
        setIsFetchingStm(false);
        return;
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('STM live status sync returned non-JSON content-type:', contentType);
        setIsFetchingStm(false);
        return;
      }

      const result = await res.json();`;

const replacementStr = `  const fetchStmLive = async () => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      if (retryCount === 0) setIsFetchingStm(true);
      try {
        const res = await fetchWithAuth('/api/stm/realtime');
        
        if (!res.ok) {
          if (res.status >= 500 && retryCount < maxRetries) {
            console.warn(\`STM live status sync failed (5xx). Retrying in \${Math.pow(2, retryCount) * 1000}ms...\`);
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            retryCount++;
            continue;
          }
          console.warn('STM live status sync returned non-OK status:', res.status);
          setIsFetchingStm(false);
          return;
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          if (retryCount < maxRetries) {
            console.warn(\`STM live status sync returned non-JSON content-type: \${contentType}. Retrying in \${Math.pow(2, retryCount) * 1000}ms...\`);
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            retryCount++;
            continue;
          }
          console.warn('STM live status sync returned non-JSON content-type:', contentType);
          setIsFetchingStm(false);
          return;
        }

        const result = await res.json();`;

code = code.replace(targetStr, replacementStr);

const catchStr = `          // Trigger telemetry log update
          fetchTelemetryLogs();
        }
      } catch (err) {
        console.warn('Failed to sync STM live status gracefully:', err);
      } finally {
        setIsFetchingStm(false);
      }
    };`;

const catchReplacementStr = `          // Trigger telemetry log update
          fetchTelemetryLogs();
        }
        setIsFetchingStm(false);
        return;
      } catch (err) {
        if (retryCount < maxRetries) {
          console.warn(\`Failed to sync STM live status gracefully: \${err}. Retrying in \${Math.pow(2, retryCount) * 1000}ms...\`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          retryCount++;
          continue;
        }
        console.warn('Failed to sync STM live status gracefully:', err);
        setIsFetchingStm(false);
        return;
      }
    }
  };`;

code = code.replace(catchStr, catchReplacementStr);

fs.writeFileSync('src/App.tsx', code);
console.log('Done replacement');
