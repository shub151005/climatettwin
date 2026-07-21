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