from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import xarray as xr
from fastapi import APIRouter, HTTPException, Query

from app.schemas.rainfall import (
    DailyRainfallSummary,
    MonthlyRainfallSummary,
    RainfallFieldCell,
    RainfallFieldResponse,
    RainfallFieldSequenceResponse,
)


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

MONTHLY_SUMMARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_rainfall_monthly_summary_2025.csv"
)

ASSAM_RAINFALL_NETCDF_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "rainfall"
    / "assam_rainfall_2025_clipped.nc"
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


@router.get(
    "/assam/monthly-summary",
    response_model=list[MonthlyRainfallSummary],
    summary="Get Assam monthly rainfall summary for 2025",
)
def get_assam_monthly_rainfall_summary() -> list[MonthlyRainfallSummary]:
    if not MONTHLY_SUMMARY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Monthly rainfall summary file not found: {MONTHLY_SUMMARY_FILE}",
        )

    dataframe = pd.read_csv(MONTHLY_SUMMARY_FILE)

    return [
        MonthlyRainfallSummary(
            month=int(row["month"]),
            rainfall_mean_of_daily_mean_mm=float(
                row["rainfall_mean_of_daily_mean_mm"]
            ),
            rainfall_total_mean_mm=float(row["rainfall_total_mean_mm"]),
            rainfall_max_mm=float(row["rainfall_max_mm"]),
            valid_grid_cell_count_mean=float(row["valid_grid_cell_count_mean"]),
            rainy_days=int(row["rainy_days"]),
            heavy_rain_days=int(row["heavy_rain_days"]),
        )
        for _, row in dataframe.iterrows()
    ]


def build_rainfall_field_response(
    dataset: xr.Dataset,
    selected_date: date,
) -> RainfallFieldResponse:
    try:
        rainfall_field = dataset["RAINFALL"].sel(TIME=str(selected_date))
    except KeyError as error:
        raise HTTPException(
            status_code=404,
            detail=f"No rainfall data found for date: {selected_date}",
        ) from error

    rainfall_dataframe = (
        rainfall_field
        .to_dataframe(name="rainfall_mm")
        .reset_index()
        .dropna(subset=["rainfall_mm"])
    )

    if rainfall_dataframe.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No valid rainfall cells found for date: {selected_date}",
        )

    cells = [
        RainfallFieldCell(
            latitude=float(row["LATITUDE"]),
            longitude=float(row["LONGITUDE"]),
            rainfall_mm=float(row["rainfall_mm"]),
        )
        for _, row in rainfall_dataframe.iterrows()
    ]

    return RainfallFieldResponse(
        region="assam",
        date=selected_date,
        variable="rainfall",
        unit="mm/day",
        cell_count=len(cells),
        rainfall_min_mm=float(rainfall_dataframe["rainfall_mm"].min()),
        rainfall_max_mm=float(rainfall_dataframe["rainfall_mm"].max()),
        rainfall_mean_mm=float(rainfall_dataframe["rainfall_mm"].mean()),
        cells=cells,
    )


@router.get(
    "/assam/field",
    response_model=RainfallFieldResponse,
    summary="Get Assam rainfall field for a selected date",
)
def get_assam_rainfall_field(
    selected_date: date = Query(
        default=date(2025, 5, 30),
        description="Date for rainfall field in YYYY-MM-DD format",
    )
) -> RainfallFieldResponse:
    if not ASSAM_RAINFALL_NETCDF_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Rainfall NetCDF file not found: {ASSAM_RAINFALL_NETCDF_FILE}",
        )

    dataset = xr.open_dataset(ASSAM_RAINFALL_NETCDF_FILE)

    try:
        response = build_rainfall_field_response(dataset, selected_date)
    finally:
        dataset.close()

    return response


@router.get(
    "/assam/field-sequence",
    response_model=RainfallFieldSequenceResponse,
    summary="Get Assam rainfall field sequence for animation",
)
def get_assam_rainfall_field_sequence(
    start_date: date = Query(
        default=date(2025, 5, 24),
        description="Start date in YYYY-MM-DD format",
    ),
    end_date: date = Query(
        default=date(2025, 6, 7),
        description="End date in YYYY-MM-DD format",
    ),
) -> RainfallFieldSequenceResponse:
    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date cannot be after end_date.",
        )

    day_count = (end_date - start_date).days + 1

    if day_count > 31:
        raise HTTPException(
            status_code=400,
            detail="Maximum supported sequence length is 31 days.",
        )

    if not ASSAM_RAINFALL_NETCDF_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Rainfall NetCDF file not found: {ASSAM_RAINFALL_NETCDF_FILE}",
        )

    dataset = xr.open_dataset(ASSAM_RAINFALL_NETCDF_FILE)

    try:
        fields: list[RainfallFieldResponse] = []

        for day_index in range(day_count):
            current_date = start_date + timedelta(days=day_index)
            field_response = build_rainfall_field_response(
                dataset=dataset,
                selected_date=current_date,
            )
            fields.append(field_response)
    finally:
        dataset.close()

    return RainfallFieldSequenceResponse(
        region="assam",
        start_date=start_date,
        end_date=end_date,
        variable="rainfall",
        unit="mm/day",
        day_count=len(fields),
        fields=fields,
    )