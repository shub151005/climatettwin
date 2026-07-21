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