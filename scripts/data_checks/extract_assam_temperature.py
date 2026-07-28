from pathlib import Path

import xarray as xr


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "temperature"
    / "india_temperature_2025.nc"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "temperature"
    / "assam_temperature_2025_bbox.nc"
)

ASSAM_LAT_MIN = 24.0
ASSAM_LAT_MAX = 28.5
ASSAM_LON_MIN = 89.5
ASSAM_LON_MAX = 97.5


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input temperature NetCDF not found: {INPUT_FILE}")

    print("=" * 80)
    print("Extracting Assam temperature subset")
    print("=" * 80)
    print(f"Input file:  {INPUT_FILE}")

    dataset = xr.open_dataset(INPUT_FILE)

    assam_subset = dataset.sel(
        LATITUDE=slice(ASSAM_LAT_MIN, ASSAM_LAT_MAX),
        LONGITUDE=slice(ASSAM_LON_MIN, ASSAM_LON_MAX),
    )

    if assam_subset.sizes["LATITUDE"] == 0 or assam_subset.sizes["LONGITUDE"] == 0:
        raise ValueError("Assam subset is empty. Check latitude/longitude bounds.")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    assam_subset.to_netcdf(OUTPUT_FILE)

    print()
    print("ASSAM TEMPERATURE SUBSET")
    print("-" * 80)
    print(assam_subset)

    for variable in ["TMIN", "TMAX", "TMEAN", "DTR"]:
        values = assam_subset[variable]
        print()
        print(f"{variable} STATS")
        print("-" * 80)
        print(f"Min:  {float(values.min(skipna=True)):.2f} °C")
        print(f"Max:  {float(values.max(skipna=True)):.2f} °C")
        print(f"Mean: {float(values.mean(skipna=True)):.2f} °C")
        print(f"Missing values: {int(values.isnull().sum())}")

    print()
    print("=" * 80)
    print("Assam temperature extraction completed")
    print("=" * 80)
    print(f"Output file: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()