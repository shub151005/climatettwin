from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import xarray as xr


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "rainfall"
    / "assam_rainfall_2025_bbox.nc"
)

OUTPUT_DIR = PROJECT_ROOT / "data" / "derived" / "assam" / "figures"

# Pick a strong rainfall date from monsoon / pre-monsoon.
# You can change this date later.
TARGET_DATE = "2025-05-30"


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_FILE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    dataset = xr.open_dataset(INPUT_FILE)

    rainfall = dataset["RAINFALL"].sel(TIME=TARGET_DATE)

    selected_date = pd.to_datetime(str(rainfall["TIME"].values)).date()

    rainfall_min = float(rainfall.min(skipna=True))
    rainfall_max = float(rainfall.max(skipna=True))
    rainfall_mean = float(rainfall.mean(skipna=True))

    print("=" * 80)
    print("Plotting Assam rainfall field")
    print("=" * 80)
    print(f"Date: {selected_date}")
    print(f"Rainfall min: {rainfall_min:.2f} mm")
    print(f"Rainfall max: {rainfall_max:.2f} mm")
    print(f"Rainfall mean: {rainfall_mean:.2f} mm")

    plt.figure(figsize=(10, 6))

    rainfall.plot(
        x="LONGITUDE",
        y="LATITUDE",
        cmap="Blues",
        cbar_kwargs={"label": "Rainfall (mm/day)"},
    )

    plt.title(f"Assam Bounding-Box Rainfall Field — {selected_date}")
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.tight_layout()

    output_file = OUTPUT_DIR / f"assam_rainfall_field_{TARGET_DATE}.png"

    plt.savefig(output_file, dpi=200)
    plt.close()

    dataset.close()

    print("\nOUTPUT")
    print("-" * 80)
    print(f"Saved rainfall field image to: {output_file}")


if __name__ == "__main__":
    main()