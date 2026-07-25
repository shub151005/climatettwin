from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_DAILY_SUMMARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_rainfall_daily_summary_2025_clipped.csv"
)

OUTPUT_DAILY_ANOMALY_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_rainfall_daily_anomalies_2025_clipped.csv"
)


def get_season(month: int) -> str:
    if month in {6, 7, 8, 9}:
        return "monsoon"

    if month in {10, 11}:
        return "post_monsoon"

    if month in {12, 1, 2}:
        return "winter"

    return "pre_monsoon"


def classify_rainfall_intensity(rainfall_mean_mm: float) -> str:
    if rainfall_mean_mm <= 0.1:
        return "dry_or_trace"

    if rainfall_mean_mm < 2.5:
        return "very_light"

    if rainfall_mean_mm < 7.5:
        return "light"

    if rainfall_mean_mm < 35.5:
        return "moderate"

    if rainfall_mean_mm < 64.5:
        return "heavy"

    if rainfall_mean_mm < 115.5:
        return "very_heavy"

    return "extreme"


def main() -> None:
    if not INPUT_DAILY_SUMMARY_FILE.exists():
        raise FileNotFoundError(
            f"Daily summary file not found: {INPUT_DAILY_SUMMARY_FILE}"
        )

    dataframe = pd.read_csv(INPUT_DAILY_SUMMARY_FILE)
    dataframe["date"] = pd.to_datetime(dataframe["date"])

    if "rainfall_mean_mm" not in dataframe.columns:
        raise ValueError("Expected column rainfall_mean_mm in daily summary CSV.")

    annual_mean = float(dataframe["rainfall_mean_mm"].mean())
    annual_std = float(dataframe["rainfall_mean_mm"].std())

    dataframe["rainfall_anomaly_from_annual_mean_mm"] = (
        dataframe["rainfall_mean_mm"] - annual_mean
    )

    if annual_std > 0:
        dataframe["rainfall_z_score"] = (
            dataframe["rainfall_mean_mm"] - annual_mean
        ) / annual_std
    else:
        dataframe["rainfall_z_score"] = 0.0

    dataframe["rainfall_percentile"] = (
        dataframe["rainfall_mean_mm"].rank(pct=True) * 100
    )

    dataframe["rainfall_intensity_class"] = dataframe["rainfall_mean_mm"].apply(
        classify_rainfall_intensity
    )

    dataframe["is_dry_day"] = dataframe["rainfall_mean_mm"] <= 0.1
    dataframe["is_wet_day"] = dataframe["rainfall_mean_mm"] > 1.0
    dataframe["is_extreme_day"] = dataframe["rainfall_percentile"] >= 95.0

    dataframe["season"] = dataframe["month"].apply(get_season)

    output_columns = [
        "date",
        "month",
        "day_of_year",
        "season",
        "rainfall_mean_mm",
        "rainfall_max_mm",
        "rainfall_min_mm",
        "valid_grid_cell_count",
        "rainfall_anomaly_from_annual_mean_mm",
        "rainfall_z_score",
        "rainfall_percentile",
        "rainfall_intensity_class",
        "is_dry_day",
        "is_wet_day",
        "is_extreme_day",
    ]

    anomaly_dataframe = dataframe[output_columns].copy()

    anomaly_dataframe["date"] = anomaly_dataframe["date"].dt.date

    OUTPUT_DAILY_ANOMALY_FILE.parent.mkdir(parents=True, exist_ok=True)
    anomaly_dataframe.to_csv(OUTPUT_DAILY_ANOMALY_FILE, index=False)

    peak_day = anomaly_dataframe.sort_values(
        "rainfall_mean_mm",
        ascending=False,
    ).iloc[0]

    extreme_days = int(anomaly_dataframe["is_extreme_day"].sum())
    dry_days = int(anomaly_dataframe["is_dry_day"].sum())
    wet_days = int(anomaly_dataframe["is_wet_day"].sum())

    print("=" * 80)
    print("Assam rainfall anomaly build completed")
    print("=" * 80)
    print(f"Input:  {INPUT_DAILY_SUMMARY_FILE}")
    print(f"Output: {OUTPUT_DAILY_ANOMALY_FILE}")
    print()
    print("BASELINE")
    print("-" * 80)
    print(f"Annual mean rainfall: {annual_mean:.2f} mm/day")
    print(f"Annual rainfall std:  {annual_std:.2f} mm/day")
    print()
    print("DAY CLASSIFICATION")
    print("-" * 80)
    print(f"Dry/trace days: {dry_days}")
    print(f"Wet days:       {wet_days}")
    print(f"Extreme days:   {extreme_days}")
    print()
    print("PEAK DAY")
    print("-" * 80)
    print(f"Date:          {peak_day['date']}")
    print(f"Mean rainfall: {peak_day['rainfall_mean_mm']:.2f} mm/day")
    print(f"Max rainfall:  {peak_day['rainfall_max_mm']:.2f} mm/day")
    print(f"Anomaly:       {peak_day['rainfall_anomaly_from_annual_mean_mm']:.2f} mm")
    print(f"Percentile:    {peak_day['rainfall_percentile']:.2f}")
    print(f"Class:         {peak_day['rainfall_intensity_class']}")
    print(f"Season:        {peak_day['season']}")


if __name__ == "__main__":
    main()