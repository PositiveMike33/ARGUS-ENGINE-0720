const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const catchStr = `        // Trigger telemetry log update
        fetchTelemetryLogs();
      }
    } catch (err) {
      console.warn('Failed to sync STM live status gracefully:', err);
    } finally {
      setIsFetchingStm(false);
    }
  };`;

const catchReplacementStr = `        // Trigger telemetry log update
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
