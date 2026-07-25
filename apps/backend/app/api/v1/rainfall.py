from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import xarray as xr
from fastapi import APIRouter, HTTPException, Query

from app.schemas.rainfall import (
    DailyRainfallSummary,
    MonthlyRainfallSummary,
    RainfallFieldResponse,
    RainfallFieldSequenceResponse,
    RainfallMetadataResponse,
    SeasonalRainfallSummary,
    RainfallAnomalySummaryResponse,
    DailyRainfallAnomaly
)


router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[5]

DAILY_SUMMARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_rainfall_daily_summary_2025_clipped.csv"
)

MONTHLY_SUMMARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_rainfall_monthly_summary_2025_clipped.csv"
)

DAILY_ANOMALY_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_rainfall_daily_anomalies_2025_clipped.csv"
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
    "/rainfall/assam/anomaly-summary",
    response_model=RainfallAnomalySummaryResponse,
)
def get_assam_rainfall_anomaly_summary() -> RainfallAnomalySummaryResponse:
    if not DAILY_ANOMALY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Daily anomaly file not found: {DAILY_ANOMALY_FILE}",
        )

    dataframe = pd.read_csv(DAILY_ANOMALY_FILE)
    dataframe["date"] = pd.to_datetime(dataframe["date"]).dt.date

    if dataframe.empty:
        raise HTTPException(
            status_code=404,
            detail="Daily anomaly file is empty.",
        )

    annual_mean = float(dataframe["rainfall_mean_mm"].mean())
    annual_std = float(dataframe["rainfall_mean_mm"].std())

    dry_days = int(dataframe["is_dry_day"].sum())
    wet_days = int(dataframe["is_wet_day"].sum())
    extreme_days = int(dataframe["is_extreme_day"].sum())

    peak_day_record = dataframe.sort_values(
        "rainfall_mean_mm",
        ascending=False,
    ).iloc[0]

    return RainfallAnomalySummaryResponse(
        region="Assam",
        baseline="2025_internal_distribution",
        annual_mean_rainfall_mm=round(annual_mean, 2),
        annual_std_rainfall_mm=round(annual_std, 2),
        dry_days=dry_days,
        wet_days=wet_days,
        extreme_days=extreme_days,
        peak_day=peak_day_record["date"],
        peak_day_rainfall_mean_mm=round(
            float(peak_day_record["rainfall_mean_mm"]),
            2,
        ),
        peak_day_rainfall_max_mm=round(
            float(peak_day_record["rainfall_max_mm"]),
            2,
        ),
        peak_day_anomaly_mm=round(
            float(peak_day_record["rainfall_anomaly_from_annual_mean_mm"]),
            2,
        ),
        peak_day_percentile=round(
            float(peak_day_record["rainfall_percentile"]),
            2,
        ),
        peak_day_intensity_class=str(
            peak_day_record["rainfall_intensity_class"]
        ),
        peak_day_season=str(peak_day_record["season"]),
    )

@router.get(
    "/rainfall/assam/seasonal-summary",
    response_model=list[SeasonalRainfallSummary],
)
def get_assam_seasonal_rainfall_summary() -> list[SeasonalRainfallSummary]:
    if not DAILY_ANOMALY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Daily anomaly file not found: {DAILY_ANOMALY_FILE}",
        )

    dataframe = pd.read_csv(DAILY_ANOMALY_FILE)

    if dataframe.empty:
        raise HTTPException(
            status_code=404,
            detail="Daily anomaly file is empty.",
        )

    annual_total = float(dataframe["rainfall_mean_mm"].sum())

    season_order = {
        "winter": 1,
        "pre_monsoon": 2,
        "monsoon": 3,
        "post_monsoon": 4,
    }

    grouped = dataframe.groupby("season", as_index=False).agg(
        day_count=("date", "count"),
        total_rainfall_mm=("rainfall_mean_mm", "sum"),
        mean_rainfall_mm=("rainfall_mean_mm", "mean"),
        max_daily_rainfall_mm=("rainfall_mean_mm", "max"),
        wet_days=("is_wet_day", "sum"),
        dry_days=("is_dry_day", "sum"),
        extreme_days=("is_extreme_day", "sum"),
    )

    grouped["season_share_of_annual_rainfall_percent"] = grouped[
        "total_rainfall_mm"
    ].apply(
        lambda value: (float(value) / annual_total * 100)
        if annual_total > 0
        else 0.0
    )

    grouped["season_order"] = grouped["season"].map(season_order)
    grouped = grouped.sort_values("season_order")

    summaries: list[SeasonalRainfallSummary] = []

    for record in grouped.to_dict(orient="records"):
        summaries.append(
            SeasonalRainfallSummary(
                season=str(record["season"]),
                day_count=int(record["day_count"]),
                total_rainfall_mm=round(float(record["total_rainfall_mm"]), 2),
                mean_rainfall_mm=round(float(record["mean_rainfall_mm"]), 2),
                max_daily_rainfall_mm=round(
                    float(record["max_daily_rainfall_mm"]),
                    2,
                ),
                wet_days=int(record["wet_days"]),
                dry_days=int(record["dry_days"]),
                extreme_days=int(record["extreme_days"]),
                season_share_of_annual_rainfall_percent=round(
                    float(record["season_share_of_annual_rainfall_percent"]),
                    2,
                ),
            )
        )

    return summaries


@router.get(
    "/rainfall/assam/metadata",
    response_model=RainfallMetadataResponse,
)
def get_assam_rainfall_metadata() -> RainfallMetadataResponse:
    if not ASSAM_RAINFALL_NETCDF_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Rainfall NetCDF file not found: {ASSAM_RAINFALL_NETCDF_FILE}",
        )

    dataset = xr.open_dataset(ASSAM_RAINFALL_NETCDF_FILE)

    try:
        if "RAINFALL" not in dataset:
            raise HTTPException(
                status_code=500,
                detail="Variable RAINFALL not found in NetCDF file.",
            )

        rainfall = dataset["RAINFALL"]

        start_date = pd.to_datetime(dataset["TIME"].values[0]).date()
        end_date = pd.to_datetime(dataset["TIME"].values[-1]).date()

        day_count = int(dataset.sizes["TIME"])
        latitude_count = int(dataset.sizes["LATITUDE"])
        longitude_count = int(dataset.sizes["LONGITUDE"])
        total_grid_cells = latitude_count * longitude_count

        valid_cells_per_day = rainfall.count(dim=("LATITUDE", "LONGITUDE"))
        average_valid_grid_cells_per_day = float(valid_cells_per_day.mean().item())

        return RainfallMetadataResponse(
            region="Assam",
            variable="RAINFALL",
            unit="mm/day",
            start_date=start_date,
            end_date=end_date,
            day_count=day_count,
            latitude_count=latitude_count,
            longitude_count=longitude_count,
            total_grid_cells=total_grid_cells,
            average_valid_grid_cells_per_day=round(
                average_valid_grid_cells_per_day,
                2,
            ),
            processing_level="boundary_clipped",
            source_file=ASSAM_RAINFALL_NETCDF_FILE.name,
        )
    finally:
        dataset.close()


@router.get(
    "/rainfall/assam/daily-summary",
    response_model=list[DailyRainfallSummary],
)
def get_assam_daily_rainfall_summary() -> list[DailyRainfallSummary]:
    if not DAILY_SUMMARY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Daily summary file not found: {DAILY_SUMMARY_FILE}",
        )

    dataframe = pd.read_csv(DAILY_SUMMARY_FILE)
    dataframe["date"] = pd.to_datetime(dataframe["date"]).dt.date

    return [
        DailyRainfallSummary(**record)
        for record in dataframe.to_dict(orient="records")
    ]

@router.get(
    "/rainfall/assam/daily-anomalies",
    response_model=list[DailyRainfallAnomaly],
)
def get_assam_daily_rainfall_anomalies() -> list[DailyRainfallAnomaly]:
    if not DAILY_ANOMALY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Daily anomaly file not found: {DAILY_ANOMALY_FILE}",
        )

    dataframe = pd.read_csv(DAILY_ANOMALY_FILE)
    dataframe["date"] = pd.to_datetime(dataframe["date"]).dt.date

    return [
        DailyRainfallAnomaly(**record)
        for record in dataframe.to_dict(orient="records")
    ]


@router.get(
    "/rainfall/assam/monthly-summary",
    response_model=list[MonthlyRainfallSummary],
)
def get_assam_monthly_rainfall_summary() -> list[MonthlyRainfallSummary]:
    if not MONTHLY_SUMMARY_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Monthly summary file not found: {MONTHLY_SUMMARY_FILE}",
        )

    dataframe = pd.read_csv(MONTHLY_SUMMARY_FILE)

    return [
        MonthlyRainfallSummary(**record)
        for record in dataframe.to_dict(orient="records")
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

    dataframe = rainfall_field.to_dataframe().reset_index()
    dataframe = dataframe.dropna(subset=["RAINFALL"])

    if dataframe.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No valid rainfall grid cells found for date: {selected_date}",
        )

    cells = [
        {
            "latitude": float(row["LATITUDE"]),
            "longitude": float(row["LONGITUDE"]),
            "rainfall_mm": float(row["RAINFALL"]),
        }
        for _, row in dataframe.iterrows()
    ]

    rainfall_values = dataframe["RAINFALL"]

    return RainfallFieldResponse(
        region="Assam",
        date=selected_date,
        variable="RAINFALL",
        unit="mm/day",
        cell_count=len(cells),
        rainfall_min_mm=float(rainfall_values.min()),
        rainfall_max_mm=float(rainfall_values.max()),
        rainfall_mean_mm=float(rainfall_values.mean()),
        cells=cells,
    )


@router.get(
    "/rainfall/assam/field",
    response_model=RainfallFieldResponse,
)
def get_assam_rainfall_field(
    selected_date: date = Query(
        default=date(2025, 5, 30),
        description="Date for rainfall field in YYYY-MM-DD format.",
    ),
) -> RainfallFieldResponse:
    if not ASSAM_RAINFALL_NETCDF_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Rainfall NetCDF file not found: {ASSAM_RAINFALL_NETCDF_FILE}",
        )

    dataset = xr.open_dataset(ASSAM_RAINFALL_NETCDF_FILE)

    try:
        return build_rainfall_field_response(dataset, selected_date)
    finally:
        dataset.close()


@router.get(
    "/rainfall/assam/field-sequence",
    response_model=RainfallFieldSequenceResponse,
)
def get_assam_rainfall_field_sequence(
    start_date: date = Query(
        default=date(2025, 5, 24),
        description="Start date for rainfall animation sequence.",
    ),
    end_date: date = Query(
        default=date(2025, 6, 7),
        description="End date for rainfall animation sequence.",
    ),
) -> RainfallFieldSequenceResponse:
    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date.",
        )

    day_count = (end_date - start_date).days + 1

    if day_count > 31:
        raise HTTPException(
            status_code=400,
            detail="Maximum allowed field sequence length is 31 days.",
        )

    if not ASSAM_RAINFALL_NETCDF_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Rainfall NetCDF file not found: {ASSAM_RAINFALL_NETCDF_FILE}",
        )

    dataset = xr.open_dataset(ASSAM_RAINFALL_NETCDF_FILE)

    try:
        fields: list[RainfallFieldResponse] = []

        for day_offset in range(day_count):
            current_date = start_date + timedelta(days=day_offset)
            fields.append(
                build_rainfall_field_response(
                    dataset=dataset,
                    selected_date=current_date,
                )
            )

        return RainfallFieldSequenceResponse(
            region="Assam",
            start_date=start_date,
            end_date=end_date,
            variable="RAINFALL",
            unit="mm/day",
            day_count=len(fields),
            fields=fields,
        )
    finally:
        dataset.close()