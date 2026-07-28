from pathlib import Path

import pandas as pd
import xarray as xr


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "temperature"
    / "assam_temperature_2025_clipped.nc"
)

DAILY_OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_temperature_daily_summary_2025_clipped.csv"
)

MONTHLY_OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "derived"
    / "assam"
    / "assam_temperature_monthly_summary_2025_clipped.csv"
)

VARIABLES = ["TMIN", "TMAX", "TMEAN", "DTR"]


def build_daily_summary(dataset: xr.Dataset) -> pd.DataFrame:
    records: list[dict] = []

    for time_value in dataset["TIME"].values:
        selected_day = dataset.sel(TIME=time_value)
        date_value = pd.to_datetime(str(time_value)).date()

        record = {
            "date": date_value.isoformat(),
            "month": date_value.month,
            "day_of_year": date_value.timetuple().tm_yday,
        }

        valid_grid_cell_counts = []

        for variable in VARIABLES:
            values = selected_day[variable]

            record[f"{variable.lower()}_mean_c"] = round(
                float(values.mean(skipna=True)),
                2,
            )
            record[f"{variable.lower()}_min_c"] = round(
                float(values.min(skipna=True)),
                2,
            )
            record[f"{variable.lower()}_max_c"] = round(
                float(values.max(skipna=True)),
                2,
            )

            valid_grid_cell_counts.append(int(values.notnull().sum()))

        record["valid_grid_cell_count"] = min(valid_grid_cell_counts)

        records.append(record)

    return pd.DataFrame(records)


def build_monthly_summary(daily_dataframe: pd.DataFrame) -> pd.DataFrame:
    monthly_summary = (
        daily_dataframe.groupby("month", as_index=False)
        .agg(
            tmin_mean_c=("tmin_mean_c", "mean"),
            tmin_min_c=("tmin_min_c", "min"),
            tmin_max_c=("tmin_max_c", "max"),
            tmax_mean_c=("tmax_mean_c", "mean"),
            tmax_min_c=("tmax_min_c", "min"),
            tmax_max_c=("tmax_max_c", "max"),
            tmean_mean_c=("tmean_mean_c", "mean"),
            tmean_min_c=("tmean_min_c", "min"),
            tmean_max_c=("tmean_max_c", "max"),
            dtr_mean_c=("dtr_mean_c", "mean"),
            dtr_min_c=("dtr_min_c", "min"),
            dtr_max_c=("dtr_max_c", "max"),
            valid_grid_cell_count_mean=("valid_grid_cell_count", "mean"),
            hot_days=("tmax_mean_c", lambda values: int((values >= 35).sum())),
            warm_nights=("tmin_mean_c", lambda values: int((values >= 25).sum())),
            cool_days=("tmax_mean_c", lambda values: int((values < 20).sum())),
        )
        .round(2)
    )

    return monthly_summary


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input temperature file not found: {INPUT_FILE}")

    print("=" * 80)
    print("Summarizing Assam temperature data")
    print("=" * 80)
    print(f"Input file: {INPUT_FILE}")

    dataset = xr.open_dataset(INPUT_FILE)

    daily_summary = build_daily_summary(dataset)
    monthly_summary = build_monthly_summary(daily_summary)

    DAILY_OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    daily_summary.to_csv(DAILY_OUTPUT_FILE, index=False)
    monthly_summary.to_csv(MONTHLY_OUTPUT_FILE, index=False)

    print()
    print("DAILY TEMPERATURE SUMMARY")
    print("-" * 80)
    print(daily_summary.head())

    print()
    print("MONTHLY TEMPERATURE SUMMARY")
    print("-" * 80)
    print(monthly_summary)

    print()
    print("TEMPERATURE INTELLIGENCE")
    print("-" * 80)
    print(f"Mean TMIN:  {daily_summary['tmin_mean_c'].mean():.2f} °C")
    print(f"Mean TMAX:  {daily_summary['tmax_mean_c'].mean():.2f} °C")
    print(f"Mean TMEAN: {daily_summary['tmean_mean_c'].mean():.2f} °C")
    print(f"Mean DTR:   {daily_summary['dtr_mean_c'].mean():.2f} °C")
    print(f"Hot days:   {int((daily_summary['tmax_mean_c'] >= 35).sum())}")
    print(f"Warm nights:{int((daily_summary['tmin_mean_c'] >= 25).sum())}")
    print(f"Cool days:  {int((daily_summary['tmax_mean_c'] < 20).sum())}")

    peak_tmax_day = daily_summary.loc[daily_summary["tmax_mean_c"].idxmax()]
    coldest_tmin_day = daily_summary.loc[daily_summary["tmin_mean_c"].idxmin()]

    print()
    print("EXTREME TEMPERATURE DAYS")
    print("-" * 80)
    print(
        f"Highest regional mean TMAX: {peak_tmax_day['date']} "
        f"({peak_tmax_day['tmax_mean_c']:.2f} °C)"
    )
    print(
        f"Lowest regional mean TMIN:  {coldest_tmin_day['date']} "
        f"({coldest_tmin_day['tmin_mean_c']:.2f} °C)"
    )

    print()
    print("=" * 80)
    print("Assam temperature summaries completed")
    print("=" * 80)
    print(f"Daily output:   {DAILY_OUTPUT_FILE}")
    print(f"Monthly output: {MONTHLY_OUTPUT_FILE}")


if __name__ == "__main__":
    main()