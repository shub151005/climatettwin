import { useEffect, useState } from "react";

import {
  getHealthStatus,
  type HealthResponse,
} from "./services/api";


function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function checkBackend(): Promise<void> {
      try {
        const result = await getHealthStatus();
        setHealth(result);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unknown API error"
        );
      }
    }

    void checkBackend();
  }, []);


  return (
    <main>
      <h1>ClimateTwin India</h1>

      <p>
        Regional Climate Digital Twin Proof of Concept
      </p>

      <section>
        <h2>System Status</h2>

        {health && (
          <>
            <p>API: {health.status}</p>
            <p>Version: {health.version}</p>
            <p>Environment: {health.environment}</p>
          </>
        )}

        {error && (
          <p>Backend connection failed: {error}</p>
        )}

        {!health && !error && (
          <p>Checking backend...</p>
        )}
      </section>
    </main>
  );
}


export default App;