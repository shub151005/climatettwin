const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";


export interface HealthResponse {
  status: "healthy";
  application: string;
  version: string;
  environment: string;
}


export async function getHealthStatus(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(
      `Health request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<HealthResponse>;
}