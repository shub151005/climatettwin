from datetime import date

from pydantic import BaseModel


class DailyTemperatureSummary(BaseModel):
    date: date
    month: int
    day_of_year: int

    tmin_mean_c: float
    tmin_min_c: float
    tmin_max_c: float

    tmax_mean_c: float
    tmax_min_c: float
    tmax_max_c: float

    tmean_mean_c: float
    tmean_min_c: float
    tmean_max_c: float

    dtr_mean_c: float
    dtr_min_c: float
    dtr_max_c: float

    valid_grid_cell_count: int


class MonthlyTemperatureSummary(BaseModel):
    month: int

    tmin_mean_c: float
    tmin_min_c: float
    tmin_max_c: float

    tmax_mean_c: float
    tmax_min_c: float
    tmax_max_c: float

    tmean_mean_c: float
    tmean_min_c: float
    tmean_max_c: float

    dtr_mean_c: float
    dtr_min_c: float
    dtr_max_c: float

    valid_grid_cell_count_mean: float

    hot_days: int
    warm_nights: int
    cool_days: int


class TemperatureMetadataResponse(BaseModel):
    region: str
    variables: list[str]
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


class TemperatureSummaryResponse(BaseModel):
    region: str
    annual_tmin_mean_c: float
    annual_tmax_mean_c: float
    annual_tmean_mean_c: float
    annual_dtr_mean_c: float

    hot_days: int
    warm_nights: int
    cool_days: int

    peak_tmax_day: date
    peak_tmax_mean_c: float

    coldest_tmin_day: date
    coldest_tmin_mean_c: float

    warmest_night_day: date
    warmest_night_tmin_c: float