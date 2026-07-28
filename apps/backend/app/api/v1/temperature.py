from datetime import date
from pathlib import Path

import pandas as pd
import xarray as xr
from fastapi import APIRouter, HTTPException, Query

from app.schemas.temperature import (
    DailyTemperatureSummary,
    MonthlyTemperatureSummary,
    TemperatureFieldCell,
    TemperatureFieldResponse,
    TemperatureMetadataResponse,
    TemperatureSummaryResponse,
)


router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[5]

DAILY_SUMMARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_temperature_daily_summary_2025_clipped.csv"
)

MONTHLY_SUMMARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_temperature_monthly_summary_2025_clipped.csv"
)

ASSAM_TEMPERATURE_NETCDF_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "temperature"
    / "assam_temperature_2025_clipped.nc"
)

ALLOWED_TEMPERATURE_VARIABLES = {"TMIN", "TMAX", "TMEAN", "DTR"}


@router.get(
    "/temperature/assam/metadata",
    response_model=TemperatureMetadataResponse,
)
def get_assam_temperature_metadata() -> TemperatureMetadataResponse:
    if not ASSAM_TEMPERATURE_NETCDF_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Temperature NetCDF file not found: {ASSAM_TEMPERATURE_NETCDF_FILE}",
        )

    dataset = xr.open_dataset(ASSAM_TEMPERATURE_NETCDF_FILE)

    start_date = pd.to_datetime(str(dataset["TIME"].values[0])).date()
    end_date = pd.to_datetime(str(dataset["TIME"].values[-1])).date()

    valid_counts = dataset["TMEAN"].notnull().sum(dim=["LATITUDE", "LONGITUDE"])
    average_valid_grid_cells = float(valid_counts.mean())

    return TemperatureMetadataResponse(
        region="Assam",
        variables=["TMIN", "TMAX", "TMEAN", "DTR"],
        unit="degree Celsius",
        start_date=start_date,
        end_date=end_date,
        day_count=int(dataset.sizes["TIME"]),
        latitude_count=int(dataset.sizes["LATITUDE"]),
        longitude_count=int(dataset.sizes["LONGITUDE"]),
        total_grid_cells=int(dataset.sizes["LATITUDE"] * dataset.sizes["LONGITUDE"]),
        average_valid_grid_cells_per_day=round(average_valid_grid_cells, 2),
        processing_level=str(dataset.attrs.get("processing_level", "unknown")),
        source_file=ASSAM_TEMPERATURE_NETCDF_FILE.name,
    )


@router.get(
    "/temperature/assam/daily-summary",
    response_model=list[DailyTemperatureSummary],
)
def get_assam_daily_temperature_summary() -> list[DailyTemperatureSummary]:
    if not DAILY_SUMMARY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Daily temperature summary file not found: {DAILY_SUMMARY_FILE}",
        )

    dataframe = pd.read_csv(DAILY_SUMMARY_FILE)

    return [
        DailyTemperatureSummary(**record)
        for record in dataframe.to_dict(orient="records")
    ]


@router.get(
    "/temperature/assam/monthly-summary",
    response_model=list[MonthlyTemperatureSummary],
)
def get_assam_monthly_temperature_summary() -> list[MonthlyTemperatureSummary]:
    if not MONTHLY_SUMMARY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Monthly temperature summary file not found: {MONTHLY_SUMMARY_FILE}",
        )

    dataframe = pd.read_csv(MONTHLY_SUMMARY_FILE)

    return [
        MonthlyTemperatureSummary(**record)
        for record in dataframe.to_dict(orient="records")
    ]


@router.get(
    "/temperature/assam/summary",
    response_model=TemperatureSummaryResponse,
)
def get_assam_temperature_summary() -> TemperatureSummaryResponse:
    if not DAILY_SUMMARY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Daily temperature summary file not found: {DAILY_SUMMARY_FILE}",
        )

    dataframe = pd.read_csv(DAILY_SUMMARY_FILE)

    if dataframe.empty:
        raise HTTPException(
            status_code=404,
            detail="Daily temperature summary file is empty.",
        )

    peak_tmax_day = dataframe.loc[dataframe["tmax_mean_c"].idxmax()]
    coldest_tmin_day = dataframe.loc[dataframe["tmin_mean_c"].idxmin()]
    warmest_night_day = dataframe.loc[dataframe["tmin_mean_c"].idxmax()]

    return TemperatureSummaryResponse(
        region="Assam",
        annual_tmin_mean_c=round(float(dataframe["tmin_mean_c"].mean()), 2),
        annual_tmax_mean_c=round(float(dataframe["tmax_mean_c"].mean()), 2),
        annual_tmean_mean_c=round(float(dataframe["tmean_mean_c"].mean()), 2),
        annual_dtr_mean_c=round(float(dataframe["dtr_mean_c"].mean()), 2),
        hot_days=int((dataframe["tmax_mean_c"] >= 35).sum()),
        warm_nights=int((dataframe["tmin_mean_c"] >= 25).sum()),
        cool_days=int((dataframe["tmax_mean_c"] < 20).sum()),
        peak_tmax_day=pd.to_datetime(peak_tmax_day["date"]).date(),
        peak_tmax_mean_c=round(float(peak_tmax_day["tmax_mean_c"]), 2),
        coldest_tmin_day=pd.to_datetime(coldest_tmin_day["date"]).date(),
        coldest_tmin_mean_c=round(float(coldest_tmin_day["tmin_mean_c"]), 2),
        warmest_night_day=pd.to_datetime(warmest_night_day["date"]).date(),
        warmest_night_tmin_c=round(float(warmest_night_day["tmin_mean_c"]), 2),
    )


@router.get(
    "/temperature/assam/field",
    response_model=TemperatureFieldResponse,
)
def get_assam_temperature_field(
    selected_date: date = Query(
        default=date(2025, 7, 24),
        description="Date to extract temperature field for.",
    ),
    variable: str = Query(
        default="TMEAN",
        description="Temperature variable: TMIN, TMAX, TMEAN, or DTR.",
    ),
) -> TemperatureFieldResponse:
    if not ASSAM_TEMPERATURE_NETCDF_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Temperature NetCDF file not found: {ASSAM_TEMPERATURE_NETCDF_FILE}",
        )

    selected_variable = variable.upper()

    if selected_variable not in ALLOWED_TEMPERATURE_VARIABLES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid temperature variable. "
                "Use one of: TMIN, TMAX, TMEAN, DTR."
            ),
        )

    dataset = xr.open_dataset(ASSAM_TEMPERATURE_NETCDF_FILE)

    available_dates = pd.to_datetime(dataset["TIME"].values).date

    if selected_date not in available_dates:
        raise HTTPException(
            status_code=404,
            detail=f"Selected date not available in temperature dataset: {selected_date}",
        )

    selected_field = dataset[selected_variable].sel(TIME=str(selected_date))
    selected_dataframe = selected_field.to_dataframe(name="temperature_c").reset_index()
    selected_dataframe = selected_dataframe.dropna(subset=["temperature_c"])

    if selected_dataframe.empty:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No valid {selected_variable} temperature cells found for "
                f"{selected_date}."
            ),
        )

    cells = [
        TemperatureFieldCell(
            latitude=round(float(record["LATITUDE"]), 4),
            longitude=round(float(record["LONGITUDE"]), 4),
            temperature_c=round(float(record["temperature_c"]), 2),
        )
        for record in selected_dataframe.to_dict(orient="records")
    ]

    return TemperatureFieldResponse(
        region="Assam",
        date=selected_date,
        variable=selected_variable,
        unit="degree Celsius",
        cell_count=len(cells),
        temperature_min_c=round(float(selected_dataframe["temperature_c"].min()), 2),
        temperature_max_c=round(float(selected_dataframe["temperature_c"].max()), 2),
        temperature_mean_c=round(float(selected_dataframe["temperature_c"].mean()), 2),
        cells=cells,
    )