const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";


export interface HealthResponse {
  status: "healthy";
  application: string;
  version: string;
  environment: string;
}


export interface DailyRainfallSummary {
  date: string;
  rainfall_mean_mm: number;
  rainfall_max_mm: number;
  rainfall_min_mm: number;
  valid_grid_cell_count: number;
  month: number;
  day_of_year: number;
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


export async function getAssamDailyRainfallSummary(): Promise<
  DailyRainfallSummary[]
> {
  const response = await fetch(
    `${API_BASE_URL}/rainfall/assam/daily-summary`
  );

  if (!response.ok) {
    throw new Error(
      `Rainfall summary request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<DailyRainfallSummary[]>;
}

export interface MonthlyRainfallSummary {
  month: number;
  rainfall_mean_of_daily_mean_mm: number;
  rainfall_total_mean_mm: number;
  rainfall_max_mm: number;
  valid_grid_cell_count_mean: number;
  rainy_days: number;
  heavy_rain_days: number;
}

export async function getAssamMonthlyRainfallSummary(): Promise<
  MonthlyRainfallSummary[]
> {
  const response = await fetch(
    `${API_BASE_URL}/rainfall/assam/monthly-summary`
  );

  if (!response.ok) {
    throw new Error(
      `Monthly rainfall summary request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<MonthlyRainfallSummary[]>;
}

