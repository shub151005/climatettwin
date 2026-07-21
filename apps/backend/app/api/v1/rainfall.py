from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.schemas.rainfall import DailyRainfallSummary


router = APIRouter(
    prefix="/rainfall",
    tags=["Rainfall"],
)


PROJECT_ROOT = Path(__file__).resolve().parents[5]

DAILY_SUMMARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_rainfall_daily_summary_2025.csv"
)


@router.get(
    "/assam/daily-summary",
    response_model=list[DailyRainfallSummary],
    summary="Get Assam daily rainfall summary for 2025",
)
def get_assam_daily_rainfall_summary() -> list[DailyRainfallSummary]:
    if not DAILY_SUMMARY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Daily rainfall summary file not found: {DAILY_SUMMARY_FILE}",
        )

    dataframe = pd.read_csv(DAILY_SUMMARY_FILE)

    return [
        DailyRainfallSummary(
            date=row["date"],
            rainfall_mean_mm=float(row["rainfall_mean_mm"]),
            rainfall_max_mm=float(row["rainfall_max_mm"]),
            rainfall_min_mm=float(row["rainfall_min_mm"]),
            valid_grid_cell_count=int(row["valid_grid_cell_count"]),
            month=int(row["month"]),
            day_of_year=int(row["day_of_year"]),
        )
        for _, row in dataframe.iterrows()
    ]