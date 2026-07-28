from pathlib import Path

import numpy as np
import xarray as xr


PROJECT_ROOT = Path(__file__).resolve().parents[2]

RAW_TEMPERATURE_DIR = PROJECT_ROOT / "data" / "raw" / "imd" / "temperature"

TMIN_FILE = RAW_TEMPERATURE_DIR / "tmin_2025.grd"
TMAX_FILE = RAW_TEMPERATURE_DIR / "tmax_2025.grd"

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "temperature"
    / "india_temperature_2025.nc"
)

YEAR = 2025
DAYS = 365
LATITUDE_COUNT = 31
LONGITUDE_COUNT = 31

# IMD 1° × 1° temperature grid.
# In this 2025 file, shape is confirmed as:
# TIME = 365, LATITUDE = 31, LONGITUDE = 31
LATITUDE_START = 7.5
LATITUDE_END = 37.5
LONGITUDE_START = 67.5
LONGITUDE_END = 97.5

EXPECTED_VALUE_COUNT = DAYS * LATITUDE_COUNT * LONGITUDE_COUNT


def read_temperature_grd(file_path: Path, variable_name: str) -> np.ndarray:
    if not file_path.exists():
        raise FileNotFoundError(f"{variable_name} file not found: {file_path}")

    raw_values = np.fromfile(file_path, dtype=np.float32)

    print(f"{variable_name} file: {file_path}")
    print(f"{variable_name} raw value count: {raw_values.size}")
    print(f"{variable_name} file size: {file_path.stat().st_size:,} bytes")

    if raw_values.size != EXPECTED_VALUE_COUNT:
        raise ValueError(
            f"{variable_name} unexpected value count. "
            f"Expected {EXPECTED_VALUE_COUNT}, got {raw_values.size}."
        )

    return raw_values.reshape((DAYS, LATITUDE_COUNT, LONGITUDE_COUNT))


def clean_temperature_values(data: np.ndarray) -> np.ndarray:
    cleaned = data.astype(np.float32).copy()

    # IMD temperature GRD files commonly use 99.9 as a missing-value marker.
    cleaned[np.isclose(cleaned, 99.9, atol=0.01)] = np.nan

    # Remove physically unrealistic values for Indian daily near-surface temperature.
    cleaned[(cleaned < -50) | (cleaned > 60)] = np.nan

    return cleaned


def calculate_tmean(tmin: np.ndarray, tmax: np.ndarray) -> np.ndarray:
    return np.where(
        np.isnan(tmin) | np.isnan(tmax),
        np.nan,
        (tmin + tmax) / 2,
    ).astype(np.float32)


def calculate_dtr(tmin: np.ndarray, tmax: np.ndarray) -> np.ndarray:
    return np.where(
        np.isnan(tmin) | np.isnan(tmax),
        np.nan,
        tmax - tmin,
    ).astype(np.float32)


def print_stats(name: str, data: np.ndarray) -> None:
    valid_values = data[~np.isnan(data)]

    print()
    print(f"{name} STATS")
    print("-" * 80)
    print(f"Valid values: {valid_values.size:,}")
    print(f"Missing values: {np.isnan(data).sum():,}")

    if valid_values.size == 0:
        print("No valid values found.")
        return

    print(f"Min:  {float(np.nanmin(data)):.2f} °C")
    print(f"Max:  {float(np.nanmax(data)):.2f} °C")
    print(f"Mean: {float(np.nanmean(data)):.2f} °C")


def validate_temperature_relationships(
    tmin: np.ndarray,
    tmax: np.ndarray,
    dtr: np.ndarray,
) -> None:
    valid_pair_mask = ~np.isnan(tmin) & ~np.isnan(tmax)

    if not valid_pair_mask.any():
        print()
        print("TEMPERATURE RELATIONSHIP CHECK")
        print("-" * 80)
        print("No valid paired TMIN/TMAX cells available.")
        return

    invalid_order_count = int((tmax[valid_pair_mask] < tmin[valid_pair_mask]).sum())
    negative_dtr_count = int((dtr[~np.isnan(dtr)] < 0).sum())

    print()
    print("TEMPERATURE RELATIONSHIP CHECK")
    print("-" * 80)
    print(f"Valid paired TMIN/TMAX values: {int(valid_pair_mask.sum()):,}")
    print(f"Cases where TMAX < TMIN:       {invalid_order_count:,}")
    print(f"Negative DTR values:           {negative_dtr_count:,}")

    if invalid_order_count > 0:
        print(
            "Warning: Some TMAX values are lower than TMIN. "
            "This may indicate data quality issues or grid/date ordering problems."
        )
    else:
        print("Validation passed: TMAX is greater than or equal to TMIN for all valid pairs.")


def main() -> None:
    print("=" * 80)
    print("Inspecting IMD temperature GRD files")
    print("=" * 80)

    tmin_raw = read_temperature_grd(TMIN_FILE, "TMIN")
    tmax_raw = read_temperature_grd(TMAX_FILE, "TMAX")

    tmin = clean_temperature_values(tmin_raw)
    tmax = clean_temperature_values(tmax_raw)

    tmean = calculate_tmean(tmin, tmax)
    dtr = calculate_dtr(tmin, tmax)

    dates = np.arange(
        np.datetime64(f"{YEAR}-01-01"),
        np.datetime64(f"{YEAR + 1}-01-01"),
        dtype="datetime64[D]",
    )

    latitudes = np.linspace(
        LATITUDE_START,
        LATITUDE_END,
        LATITUDE_COUNT,
        dtype=np.float32,
    )

    longitudes = np.linspace(
        LONGITUDE_START,
        LONGITUDE_END,
        LONGITUDE_COUNT,
        dtype=np.float32,
    )

    dataset = xr.Dataset(
        data_vars={
            "TMIN": (
                ("TIME", "LATITUDE", "LONGITUDE"),
                tmin,
                {
                    "long_name": "Daily minimum temperature",
                    "units": "degree Celsius",
                    "missing_value_marker": "99.9 treated as NaN",
                },
            ),
            "TMAX": (
                ("TIME", "LATITUDE", "LONGITUDE"),
                tmax,
                {
                    "long_name": "Daily maximum temperature",
                    "units": "degree Celsius",
                    "missing_value_marker": "99.9 treated as NaN",
                },
            ),
            "TMEAN": (
                ("TIME", "LATITUDE", "LONGITUDE"),
                tmean,
                {
                    "long_name": "Daily mean temperature derived from TMIN and TMAX",
                    "units": "degree Celsius",
                    "formula": "(TMAX + TMIN) / 2",
                },
            ),
            "DTR": (
                ("TIME", "LATITUDE", "LONGITUDE"),
                dtr,
                {
                    "long_name": "Daily diurnal temperature range",
                    "units": "degree Celsius",
                    "formula": "TMAX - TMIN",
                },
            ),
        },
        coords={
            "TIME": dates,
            "LATITUDE": latitudes,
            "LONGITUDE": longitudes,
        },
        attrs={
            "title": "IMD India Daily Temperature 2025",
            "source": "IMD gridded temperature GRD files",
            "processing_level": "raw_grd_converted_to_netcdf",
            "grid_resolution": "1.0 degree x 1.0 degree",
            "latitude_range": f"{LATITUDE_START} to {LATITUDE_END}",
            "longitude_range": f"{LONGITUDE_START} to {LONGITUDE_END}",
            "missing_value_handling": "Values equal to 99.9 and unrealistic values outside -50 to 60 °C converted to NaN.",
            "notes": (
                "TMEAN and DTR are derived variables. "
                "This file is prepared for ClimateTwin India temperature processing."
            ),
        },
    )

    print()
    print("DATASET")
    print("-" * 80)
    print(dataset)

    print_stats("TMIN", tmin)
    print_stats("TMAX", tmax)
    print_stats("TMEAN", tmean)
    print_stats("DTR", dtr)

    validate_temperature_relationships(tmin, tmax, dtr)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_netcdf(OUTPUT_FILE)

    print()
    print("=" * 80)
    print("Temperature GRD inspection and conversion completed")
    print("=" * 80)
    print(f"Output NetCDF: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()