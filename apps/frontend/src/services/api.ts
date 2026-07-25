const API_BASE_URL = "http://127.0.0.1:8000";


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


export interface MonthlyRainfallSummary {
  month: number;
  rainfall_mean_of_daily_mean_mm: number;
  rainfall_total_mean_mm: number;
  rainfall_max_mm: number;
  valid_grid_cell_count_mean: number;
  rainy_days: number;
  heavy_rain_days: number;
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


export interface RainfallMetadataResponse {
  region: string;
  variable: string;
  unit: string;
  start_date: string;
  end_date: string;
  day_count: number;
  latitude_count: number;
  longitude_count: number;
  total_grid_cells: number;
  average_valid_grid_cells_per_day: number;
  processing_level: string;
  source_file: string;
}

export interface DailyRainfallAnomaly {
  date: string;
  month: number;
  day_of_year: number;
  season: string;
  rainfall_mean_mm: number;
  rainfall_max_mm: number;
  rainfall_min_mm: number;
  valid_grid_cell_count: number;
  rainfall_anomaly_from_annual_mean_mm: number;
  rainfall_z_score: number;
  rainfall_percentile: number;
  rainfall_intensity_class: string;
  is_dry_day: boolean;
  is_wet_day: boolean;
  is_extreme_day: boolean;
}

export interface RainfallAnomalySummaryResponse {
  region: string;
  baseline: string;
  annual_mean_rainfall_mm: number;
  annual_std_rainfall_mm: number;
  dry_days: number;
  wet_days: number;
  extreme_days: number;
  peak_day: string;
  peak_day_rainfall_mean_mm: number;
  peak_day_rainfall_max_mm: number;
  peak_day_anomaly_mm: number;
  peak_day_percentile: number;
  peak_day_intensity_class: string;
  peak_day_season: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status}: ${url}`
    );
  }

  return response.json() as Promise<T>;
}


export async function getHealthStatus(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>(`${API_BASE_URL}/api/v1/health`);
}


export async function getAssamRainfallMetadata(): Promise<RainfallMetadataResponse> {
  return fetchJson<RainfallMetadataResponse>(
    `${API_BASE_URL}/api/v1/rainfall/assam/metadata`
  );
}


export async function getAssamDailyRainfallSummary(): Promise<
  DailyRainfallSummary[]
> {
  return fetchJson<DailyRainfallSummary[]>(
    `${API_BASE_URL}/api/v1/rainfall/assam/daily-summary`
  );
}


export async function getAssamMonthlyRainfallSummary(): Promise<
  MonthlyRainfallSummary[]
> {
  return fetchJson<MonthlyRainfallSummary[]>(
    `${API_BASE_URL}/api/v1/rainfall/assam/monthly-summary`
  );
}


export async function getAssamRainfallField(
  selectedDate = "2025-05-30"
): Promise<RainfallFieldResponse> {
  const searchParams = new URLSearchParams({
    selected_date: selectedDate,
  });

  return fetchJson<RainfallFieldResponse>(
    `${API_BASE_URL}/api/v1/rainfall/assam/field?${searchParams.toString()}`
  );
}


export async function getAssamRainfallFieldSequence(
  startDate = "2025-05-24",
  endDate = "2025-06-07"
): Promise<RainfallFieldSequenceResponse> {
  const searchParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  return fetchJson<RainfallFieldSequenceResponse>(
    `${API_BASE_URL}/api/v1/rainfall/assam/field-sequence?${searchParams.toString()}`
  );
}

export async function getAssamDailyRainfallAnomalies(): Promise<
  DailyRainfallAnomaly[]
> {
  return fetchJson<DailyRainfallAnomaly[]>(
    `${API_BASE_URL}/api/v1/rainfall/assam/daily-anomalies`
  );
}

export async function getAssamRainfallAnomalySummary(): Promise<RainfallAnomalySummaryResponse> {
  return fetchJson<RainfallAnomalySummaryResponse>(
    `${API_BASE_URL}/api/v1/rainfall/assam/anomaly-summary`
  );
}