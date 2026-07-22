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

export interface RainfallFieldCell {
  latitude: number;
  longitude: number;
  rainfall_mm: number;
}


export interface RainfallFieldResponse {
  region: string;
  date: string;
  variable: string;
  unit: string;
  cell_count: number;
  rainfall_min_mm: number;
  rainfall_max_mm: number;
  rainfall_mean_mm: number;
  cells: RainfallFieldCell[];
}

export interface RainfallFieldSequenceResponse {
  region: string;
  start_date: string;
  end_date: string;
  variable: string;
  unit: string;
  day_count: number;
  fields: RainfallFieldResponse[];
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

export async function getAssamRainfallField(
  selectedDate = "2025-05-30"
): Promise<RainfallFieldResponse> {
  const response = await fetch(
    `${API_BASE_URL}/rainfall/assam/field?selected_date=${selectedDate}`
  );

  if (!response.ok) {
    throw new Error(
      `Rainfall field request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<RainfallFieldResponse>;
}

export async function getAssamRainfallFieldSequence(
  startDate = "2025-05-24",
  endDate = "2025-06-07"
): Promise<RainfallFieldSequenceResponse> {
  const response = await fetch(
    `${API_BASE_URL}/rainfall/assam/field-sequence?start_date=${startDate}&end_date=${endDate}`
  );

  if (!response.ok) {
    throw new Error(
      `Rainfall field sequence request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<RainfallFieldSequenceResponse>;
}