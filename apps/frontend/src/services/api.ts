const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

async function requestJson<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options?.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const errorBody = (await response.json()) as {
        detail?: string;
        message?: string;
      };

      message =
        errorBody.detail ??
        errorBody.message ??
        message;
    } catch {
      // Preserve the fallback message for non-JSON errors.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

/* =========================================================
   Health
   ========================================================= */

export interface HealthResponse {
  status: string;
  application: string;
  version: string;
  environment?: string;
}

export async function getHealthStatus(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/api/v1/health");
}

/* =========================================================
   Rainfall types
   ========================================================= */

export interface DailyRainfallSummary {
  date: string;
  rainfall_mean_mm: number;
  rainfall_min_mm: number;
  rainfall_max_mm: number;
  valid_grid_cells: number;
}

export interface MonthlyRainfallSummary {
  month: number;
  month_name: string;
  rainfall_total_mean_mm: number;
  rainfall_mean_mm: number;
  rainfall_max_mm: number;
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
  frame_count: number;
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
  rainfall_mean_mm: number;
  rainfall_anomaly_from_annual_mean_mm: number;
  rainfall_z_score: number;
  rainfall_percentile: number;
  rainfall_intensity_class: string;
  season: string;
  is_dry_day: boolean;
  is_wet_day: boolean;
  is_extreme_day: boolean;
}

export interface RainfallAnomalySummaryResponse {
  region: string;
  annual_mean_rainfall_mm: number;
  annual_rainfall_std_mm: number;
  dry_days: number;
  wet_days: number;
  extreme_days: number;

  peak_day: string;
  peak_day_rainfall_mean_mm: number;
  peak_day_rainfall_max_mm: number;
  peak_day_anomaly_mm: number;
  peak_day_percentile: number;
  peak_day_rainfall_intensity_class: string;
  peak_day_season: string;

  baseline_description?: string;
}

export interface SeasonalRainfallSummary {
  season: string;
  day_count: number;
  total_rainfall_mm: number;
  mean_rainfall_mm: number;
  max_daily_rainfall_mm: number;
  wet_days: number;
  dry_days: number;
  extreme_days: number;
  season_share_of_annual_rainfall_percent: number;
}

/* =========================================================
   Rainfall API
   ========================================================= */

export async function getAssamRainfallMetadata():
  Promise<RainfallMetadataResponse> {
  return requestJson<RainfallMetadataResponse>(
    "/api/v1/rainfall/assam/metadata",
  );
}

export async function getAssamDailyRainfallSummary():
  Promise<DailyRainfallSummary[]> {
  return requestJson<DailyRainfallSummary[]>(
    "/api/v1/rainfall/assam/daily-summary",
  );
}

export async function getAssamMonthlyRainfallSummary():
  Promise<MonthlyRainfallSummary[]> {
  return requestJson<MonthlyRainfallSummary[]>(
    "/api/v1/rainfall/assam/monthly-summary",
  );
}

export async function getAssamDailyRainfallAnomalies():
  Promise<DailyRainfallAnomaly[]> {
  return requestJson<DailyRainfallAnomaly[]>(
    "/api/v1/rainfall/assam/daily-anomalies",
  );
}

export async function getAssamRainfallAnomalySummary():
  Promise<RainfallAnomalySummaryResponse> {
  return requestJson<RainfallAnomalySummaryResponse>(
    "/api/v1/rainfall/assam/anomaly-summary",
  );
}

export async function getAssamSeasonalRainfallSummary():
  Promise<SeasonalRainfallSummary[]> {
  return requestJson<SeasonalRainfallSummary[]>(
    "/api/v1/rainfall/assam/seasonal-summary",
  );
}

export async function getAssamRainfallField(
  selectedDate: string,
): Promise<RainfallFieldResponse> {
  const params = new URLSearchParams({
    selected_date: selectedDate,
  });

  return requestJson<RainfallFieldResponse>(
    `/api/v1/rainfall/assam/field?${params.toString()}`,
  );
}

export async function getAssamRainfallFieldSequence(
  startDate: string,
  endDate: string,
): Promise<RainfallFieldSequenceResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  return requestJson<RainfallFieldSequenceResponse>(
    `/api/v1/rainfall/assam/field-sequence?${params.toString()}`,
  );
}

/* =========================================================
   Temperature types
   ========================================================= */

export type TemperatureVariable =
  | "TMIN"
  | "TMAX"
  | "TMEAN"
  | "DTR";

export interface TemperatureMetadataResponse {
  region: string;
  variables: TemperatureVariable[];
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

export interface TemperatureSummaryResponse {
  region: string;
  annual_tmin_mean_c: number;
  annual_tmax_mean_c: number;
  annual_tmean_mean_c: number;
  annual_dtr_mean_c: number;
  hot_days: number;
  warm_nights: number;
  cool_days: number;
  peak_tmax_day: string;
  peak_tmax_mean_c: number;
  coldest_tmin_day: string;
  coldest_tmin_mean_c: number;
  warmest_night_day: string;
  warmest_night_tmin_c: number;
}

export interface MonthlyTemperatureSummary {
  month: number;
  month_name: string;
  tmin_mean_c: number;
  tmax_mean_c: number;
  tmean_mean_c: number;
  dtr_mean_c: number;
  hot_days: number;
  warm_nights: number;
  cool_days: number;
}

export interface TemperatureFieldCell {
  latitude: number;
  longitude: number;
  temperature_c: number;
}

export interface TemperatureFieldResponse {
  region: string;
  date: string;
  variable: TemperatureVariable;
  unit: string;
  cell_count: number;
  temperature_min_c: number;
  temperature_max_c: number;
  temperature_mean_c: number;
  cells: TemperatureFieldCell[];
}

/* =========================================================
   Temperature API
   ========================================================= */

export async function getAssamTemperatureMetadata():
  Promise<TemperatureMetadataResponse> {
  return requestJson<TemperatureMetadataResponse>(
    "/api/v1/temperature/assam/metadata",
  );
}

export async function getAssamTemperatureSummary():
  Promise<TemperatureSummaryResponse> {
  return requestJson<TemperatureSummaryResponse>(
    "/api/v1/temperature/assam/summary",
  );
}

export async function getAssamMonthlyTemperatureSummary():
  Promise<MonthlyTemperatureSummary[]> {
  return requestJson<MonthlyTemperatureSummary[]>(
    "/api/v1/temperature/assam/monthly-summary",
  );
}

export async function getAssamTemperatureField(
  selectedDate: string,
  variable: TemperatureVariable,
): Promise<TemperatureFieldResponse> {
  const params = new URLSearchParams({
    selected_date: selectedDate,
    variable,
  });

  return requestJson<TemperatureFieldResponse>(
    `/api/v1/temperature/assam/field?${params.toString()}`,
  );
}

/* =========================================================
   V2 simulation types
   ========================================================= */

export type RainfallIntensityClass =
  | "trace"
  | "light"
  | "moderate"
  | "heavy"
  | "very_heavy"
  | "extreme";

export type ClimateStressClass =
  | "low"
  | "moderate"
  | "high"
  | "severe";

export type ScenarioComparisonMode =
  | "original"
  | "simulated"
  | "difference";

export interface RainfallScenarioRequest {
  selected_date: string;
  rainfall_change_percent: number;
}

export interface RainfallScenarioCell {
  latitude: number;
  longitude: number;
  original_rainfall_mm: number;
  simulated_rainfall_mm: number;
  rainfall_difference_mm: number;
  original_intensity: RainfallIntensityClass;
  simulated_intensity: RainfallIntensityClass;
  intensity_changed: boolean;
}

export interface RainfallScenarioStatistics {
  original_mean_mm: number;
  simulated_mean_mm: number;
  mean_difference_mm: number;
  original_min_mm: number;
  simulated_min_mm: number;
  original_max_mm: number;
  simulated_max_mm: number;
  affected_cell_count: number;
  intensity_changed_cell_count: number;
  original_extreme_cell_count: number;
  simulated_extreme_cell_count: number;
}

export interface ClimateStressResult {
  score: number;
  classification: ClimateStressClass;
  rainfall_intensity_component: number;
  rainfall_change_component: number;
  extreme_cell_component: number;
  explanation: string;
}

export interface RainfallScenarioResponse {
  region: string;
  selected_date: string;
  scenario_type: string;
  rainfall_change_percent: number;
  unit: string;
  statistics: RainfallScenarioStatistics;
  stress: ClimateStressResult;
  cells: RainfallScenarioCell[];
}

/* =========================================================
   V2 simulation API
   ========================================================= */

export async function runAssamRainfallScenario(
  payload: RainfallScenarioRequest,
): Promise<RainfallScenarioResponse> {
  return requestJson<RainfallScenarioResponse>(
    "/api/v1/simulation/assam/rainfall-scenario",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}