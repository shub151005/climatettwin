from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "rainfall"
    / "assam_rainfall_2025_clipped.nc"
)

OUTPUT_DIR = PROJECT_ROOT / "data" / "derived" / "assam"

DAILY_OUTPUT = OUTPUT_DIR / "assam_rainfall_daily_summary_2025_clipped.csv"
MONTHLY_OUTPUT = OUTPUT_DIR / "assam_rainfall_monthly_summary_2025_clipped.csv"


def summarize_daily(dataset: xr.Dataset) -> pd.DataFrame:
    rainfall = dataset["RAINFALL"]

    daily_mean = rainfall.mean(dim=["LATITUDE", "LONGITUDE"], skipna=True)
    daily_max = rainfall.max(dim=["LATITUDE", "LONGITUDE"], skipna=True)
    daily_min = rainfall.min(dim=["LATITUDE", "LONGITUDE"], skipna=True)
    valid_cell_count = rainfall.notnull().sum(dim=["LATITUDE", "LONGITUDE"])

    summary = pd.DataFrame(
        {
            "date": pd.to_datetime(dataset["TIME"].values),
            "rainfall_mean_mm": daily_mean.values,
            "rainfall_max_mm": daily_max.values,
            "rainfall_min_mm": daily_min.values,
            "valid_grid_cell_count": valid_cell_count.values,
        }
    )

    summary["month"] = summary["date"].dt.month
    summary["day_of_year"] = summary["date"].dt.dayofyear

    return summary


def summarize_monthly(daily_summary: pd.DataFrame) -> pd.DataFrame:
    monthly = (
        daily_summary.groupby("month")
        .agg(
            rainfall_mean_of_daily_mean_mm=("rainfall_mean_mm", "mean"),
            rainfall_total_mean_mm=("rainfall_mean_mm", "sum"),
            rainfall_max_mm=("rainfall_max_mm", "max"),
            valid_grid_cell_count_mean=("valid_grid_cell_count", "mean"),
            rainy_days=("rainfall_mean_mm", lambda x: int((x > 0.1).sum())),
            heavy_rain_days=("rainfall_mean_mm", lambda x: int((x >= 50).sum())),
        )
        .reset_index()
    )

    return monthly


def validate_summary(daily_summary: pd.DataFrame) -> None:
    print("\nVALIDATION")
    print("-" * 80)

    if daily_summary.empty:
        raise ValueError("Daily summary is empty.")

    if daily_summary["rainfall_mean_mm"].isna().all():
        raise ValueError("All daily rainfall mean values are missing.")

    if (daily_summary["rainfall_mean_mm"] < 0).any():
        raise ValueError("Negative rainfall found in daily summary.")

    print(f"Total days: {len(daily_summary)}")
    print(f"Date range: {daily_summary['date'].min()} to {daily_summary['date'].max()}")
    print(f"Mean daily rainfall: {daily_summary['rainfall_mean_mm'].mean():.2f} mm")
    print(f"Max daily regional mean rainfall: {daily_summary['rainfall_mean_mm'].max():.2f} mm")
    print(f"Max grid-cell rainfall: {daily_summary['rainfall_max_mm'].max():.2f} mm")
    print(f"Average valid grid cells per day: {daily_summary['valid_grid_cell_count'].mean():.2f}")

    monsoon = daily_summary[daily_summary["month"].isin([6, 7, 8, 9])]
    non_monsoon = daily_summary[~daily_summary["month"].isin([6, 7, 8, 9])]

    print(f"Monsoon mean daily rainfall: {monsoon['rainfall_mean_mm'].mean():.2f} mm")
    print(f"Non-monsoon mean daily rainfall: {non_monsoon['rainfall_mean_mm'].mean():.2f} mm")

    if monsoon["rainfall_mean_mm"].mean() <= non_monsoon["rainfall_mean_mm"].mean():
        print("WARNING: Monsoon rainfall mean is not higher than non-monsoon mean.")
    else:
        print("Seasonality check passed: monsoon rainfall is higher than non-monsoon rainfall.")


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_FILE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 80)
    print("Summarizing Assam rainfall subset")
    print("=" * 80)
    print(f"Input: {INPUT_FILE}")

    dataset = xr.open_dataset(INPUT_FILE)

    daily_summary = summarize_daily(dataset)
    monthly_summary = summarize_monthly(daily_summary)

    validate_summary(daily_summary)

    daily_summary.to_csv(DAILY_OUTPUT, index=False)
    monthly_summary.to_csv(MONTHLY_OUTPUT, index=False)

    print("\nOUTPUT")
    print("-" * 80)
    print(f"Saved daily summary to: {DAILY_OUTPUT}")
    print(f"Saved monthly summary to: {MONTHLY_OUTPUT}")

    print("\nMONTHLY SUMMARY")
    print("-" * 80)
    print(monthly_summary.to_string(index=False))

    dataset.close()


if __name__ == "__main__":
    main()