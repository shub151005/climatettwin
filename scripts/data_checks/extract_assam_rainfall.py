from pathlib import Path

import numpy as np
import xarray as xr


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "imd"
    / "rainfall"
    / "RF25_ind2025_rfp25.nc"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "rainfall"
)

OUTPUT_FILE = OUTPUT_DIR / "assam_rainfall_2025_bbox.nc"


ASSAM_LAT_MIN = 24.0
ASSAM_LAT_MAX = 28.5
ASSAM_LON_MIN = 89.5
ASSAM_LON_MAX = 97.5


def validate_assam_subset(dataset: xr.Dataset) -> None:
    rainfall = dataset["RAINFALL"]

    print("\nVALIDATION")
    print("-" * 80)

    print(f"Subset dimensions: {dict(dataset.sizes)}")

    lat_min = float(dataset["LATITUDE"].min())
    lat_max = float(dataset["LATITUDE"].max())
    lon_min = float(dataset["LONGITUDE"].min())
    lon_max = float(dataset["LONGITUDE"].max())

    print(f"Latitude range: {lat_min} to {lat_max}")
    print(f"Longitude range: {lon_min} to {lon_max}")

    rainfall_min = float(rainfall.min(skipna=True))
    rainfall_max = float(rainfall.max(skipna=True))
    rainfall_mean = float(rainfall.mean(skipna=True))

    print(f"Rainfall min: {rainfall_min:.2f} mm")
    print(f"Rainfall max: {rainfall_max:.2f} mm")
    print(f"Rainfall mean: {rainfall_mean:.2f} mm")

    total_values = rainfall.size
    missing_values = int(np.isnan(rainfall.values).sum())

    print(f"Total rainfall values: {total_values}")
    print(f"Missing rainfall values: {missing_values}")

    if rainfall_min < 0:
        raise ValueError("Invalid rainfall: negative values found.")

    if dataset.sizes["LATITUDE"] == 0 or dataset.sizes["LONGITUDE"] == 0:
        raise ValueError("No grid cells selected for Assam bounding box.")

    print("Validation passed.")


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_FILE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 80)
    print("Extracting Assam rainfall subset")
    print("=" * 80)
    print(f"Input: {INPUT_FILE}")

    dataset = xr.open_dataset(INPUT_FILE)

    assam_subset = dataset.sel(
        LATITUDE=slice(ASSAM_LAT_MIN, ASSAM_LAT_MAX),
        LONGITUDE=slice(ASSAM_LON_MIN, ASSAM_LON_MAX),
    )

    validate_assam_subset(assam_subset)

    assam_subset.attrs["region"] = "Assam bounding-box subset"
    assam_subset.attrs["subset_method"] = "latitude-longitude bounding box"
    assam_subset.attrs["lat_min"] = ASSAM_LAT_MIN
    assam_subset.attrs["lat_max"] = ASSAM_LAT_MAX
    assam_subset.attrs["lon_min"] = ASSAM_LON_MIN
    assam_subset.attrs["lon_max"] = ASSAM_LON_MAX

    assam_subset.to_netcdf(OUTPUT_FILE)

    print("\nOUTPUT")
    print("-" * 80)
    print(f"Saved Assam subset to: {OUTPUT_FILE}")

    dataset.close()
    assam_subset.close()


if __name__ == "__main__":
    main()