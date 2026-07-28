from pathlib import Path

import numpy as np
import xarray as xr
from shapely.geometry import Point, shape
from shapely.ops import unary_union
import json


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "temperature"
    / "assam_temperature_2025_bbox.nc"
)

BOUNDARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "boundaries"
    / "assam_outer_boundary.geojson"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "temperature"
    / "assam_temperature_2025_clipped.nc"
)

VARIABLES = ["TMIN", "TMAX", "TMEAN", "DTR"]


def load_assam_boundary():
    if not BOUNDARY_FILE.exists():
        raise FileNotFoundError(f"Assam boundary file not found: {BOUNDARY_FILE}")

    with BOUNDARY_FILE.open("r", encoding="utf-8") as file:
        geojson_data = json.load(file)

    geometries = [
        shape(feature["geometry"])
        for feature in geojson_data["features"]
        if feature.get("geometry") is not None
    ]

    if not geometries:
        raise ValueError("No valid geometries found in Assam boundary file.")

    return unary_union(geometries)


def build_inside_boundary_mask(dataset: xr.Dataset, assam_boundary) -> xr.DataArray:
    latitudes = dataset["LATITUDE"].values
    longitudes = dataset["LONGITUDE"].values

    mask = np.zeros((len(latitudes), len(longitudes)), dtype=bool)

    for lat_index, latitude in enumerate(latitudes):
        for lon_index, longitude in enumerate(longitudes):
            point = Point(float(longitude), float(latitude))
            mask[lat_index, lon_index] = assam_boundary.covers(point)

    return xr.DataArray(
        mask,
        coords={
            "LATITUDE": dataset["LATITUDE"],
            "LONGITUDE": dataset["LONGITUDE"],
        },
        dims=("LATITUDE", "LONGITUDE"),
    )


def print_variable_stats(dataset: xr.Dataset, variable: str) -> None:
    values = dataset[variable]

    print()
    print(f"{variable} CLIPPED STATS")
    print("-" * 80)
    print(f"Min:  {float(values.min(skipna=True)):.2f} °C")
    print(f"Max:  {float(values.max(skipna=True)):.2f} °C")
    print(f"Mean: {float(values.mean(skipna=True)):.2f} °C")
    print(f"Missing values: {int(values.isnull().sum())}")


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input temperature file not found: {INPUT_FILE}")

    print("=" * 80)
    print("Clipping Assam temperature grid to state boundary")
    print("=" * 80)
    print(f"Input file:    {INPUT_FILE}")
    print(f"Boundary file: {BOUNDARY_FILE}")

    dataset = xr.open_dataset(INPUT_FILE)
    assam_boundary = load_assam_boundary()
    inside_mask = build_inside_boundary_mask(dataset, assam_boundary)

    clipped_dataset = dataset.copy()

    for variable in VARIABLES:
        clipped_dataset[variable] = dataset[variable].where(inside_mask)

    clipped_dataset.attrs = {
        **dataset.attrs,
        "processing_level": "boundary_clipped",
        "boundary_file": str(BOUNDARY_FILE.name),
        "clipping_method": "grid_cell_center_point_within_assam_outer_boundary",
    }

    total_grid_cells = int(dataset.sizes["LATITUDE"] * dataset.sizes["LONGITUDE"])
    cells_inside_boundary = int(inside_mask.sum())
    cells_outside_boundary = total_grid_cells - cells_inside_boundary

    print()
    print("CLIPPING SUMMARY")
    print("-" * 80)
    print(f"Total bbox grid cells:       {total_grid_cells}")
    print(f"Cells inside Assam boundary: {cells_inside_boundary}")
    print(f"Cells outside boundary:      {cells_outside_boundary}")

    for variable in VARIABLES:
        original_valid = int(dataset[variable].notnull().sum())
        clipped_valid = int(clipped_dataset[variable].notnull().sum())

        print()
        print(f"{variable} valid values before clipping: {original_valid:,}")
        print(f"{variable} valid values after clipping:  {clipped_valid:,}")

        if original_valid > 0:
            retained_percent = clipped_valid / original_valid * 100
            print(f"{variable} retained valid values:        {retained_percent:.2f}%")

    for variable in VARIABLES:
        print_variable_stats(clipped_dataset, variable)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    clipped_dataset.to_netcdf(OUTPUT_FILE)

    print()
    print("=" * 80)
    print("Assam temperature boundary clipping completed")
    print("=" * 80)
    print(f"Output file: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()