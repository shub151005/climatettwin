from datetime import date

from pydantic import BaseModel


class DailyRainfallSummary(BaseModel):
    date: date
    rainfall_mean_mm: float
    rainfall_max_mm: float
    rainfall_min_mm: float
    valid_grid_cell_count: int
    month: int
    day_of_year: int


class MonthlyRainfallSummary(BaseModel):
    month: int
    rainfall_mean_of_daily_mean_mm: float
    rainfall_total_mean_mm: float
    rainfall_max_mm: float
    valid_grid_cell_count_mean: float
    rainy_days: int
    heavy_rain_days: int


class RainfallFieldCell(BaseModel):
    latitude: float
    longitude: float
    rainfall_mm: float


class RainfallFieldResponse(BaseModel):
    region: str
    date: date
    variable: str
    unit: str
    cell_count: int
    rainfall_min_mm: float
    rainfall_max_mm: float
    rainfall_mean_mm: float
    cells: list[RainfallFieldCell]


class RainfallFieldSequenceResponse(BaseModel):
    region: str
    start_date: date
    end_date: date
    variable: str
    unit: str
    day_count: int
    fields: list[RainfallFieldResponse]

class RainfallMetadataResponse(BaseModel):
    region: str
    variable: str
    unit: str
    start_date: date
    end_date: date
    day_count: int
    latitude_count: int
    longitude_count: int
    total_grid_cells: int
    average_valid_grid_cells_per_day: float
    processing_level: str
    source_file: str

class DailyRainfallAnomaly(BaseModel):
    date: date
    month: int
    day_of_year: int
    season: str
    rainfall_mean_mm: float
    rainfall_max_mm: float
    rainfall_min_mm: float
    valid_grid_cell_count: int
    rainfall_anomaly_from_annual_mean_mm: float
    rainfall_z_score: float
    rainfall_percentile: float
    rainfall_intensity_class: str
    is_dry_day: bool
    is_wet_day: bool
    is_extreme_day: bool

class RainfallAnomalySummaryResponse(BaseModel):
    region: str
    baseline: str
    annual_mean_rainfall_mm: float
    annual_std_rainfall_mm: float
    dry_days: int
    wet_days: int
    extreme_days: int
    peak_day: date
    peak_day_rainfall_mean_mm: float
    peak_day_rainfall_max_mm: float
    peak_day_anomaly_mm: float
    peak_day_percentile: float
    peak_day_intensity_class: str
    peak_day_season: str

