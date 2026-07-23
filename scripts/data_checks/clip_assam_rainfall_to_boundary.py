import json
from pathlib import Path

import numpy as np
import xarray as xr
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from shapely.prepared import prep


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_RAINFALL_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "rainfall"
    / "assam_rainfall_2025_bbox.nc"
)

INPUT_BOUNDARY_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "boundaries"
    / "assam_outer_boundary.geojson"
)

OUTPUT_RAINFALL_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "rainfall"
    / "assam_rainfall_2025_clipped.nc"
)


def load_assam_boundary(boundary_file: Path):
    if not boundary_file.exists():
        raise FileNotFoundError(f"Boundary file not found: {boundary_file}")

    with boundary_file.open("r", encoding="utf-8") as file:
        boundary_geojson = json.load(file)

    features = boundary_geojson.get("features", [])

    if not features:
        raise ValueError("Boundary GeoJSON has no features.")

    geometries = []

    for feature in features:
        geometry = feature.get("geometry")

        if geometry:
            geometries.append(shape(geometry))

    if not geometries:
        raise ValueError("No valid geometries found in boundary GeoJSON.")

    dissolved_boundary = unary_union(geometries)

    if dissolved_boundary.is_empty:
        raise ValueError("Dissolved Assam boundary is empty.")

    return prep(dissolved_boundary)


def build_spatial_mask(dataset: xr.Dataset, prepared_boundary) -> xr.DataArray:
    latitudes = dataset["LATITUDE"].values
    longitudes = dataset["LONGITUDE"].values

    mask = np.zeros((len(latitudes), len(longitudes)), dtype=bool)

    for lat_index, latitude in enumerate(latitudes):
        for lon_index, longitude in enumerate(longitudes):
            point = Point(float(longitude), float(latitude))

            if prepared_boundary.covers(point):
                mask[lat_index, lon_index] = True

    return xr.DataArray(
        mask,
        coords={
            "LATITUDE": dataset["LATITUDE"],
            "LONGITUDE": dataset["LONGITUDE"],
        },
        dims=("LATITUDE", "LONGITUDE"),
        name="ASSAM_BOUNDARY_MASK",
    )


def main() -> None:
    if not INPUT_RAINFALL_FILE.exists():
        raise FileNotFoundError(f"Rainfall file not found: {INPUT_RAINFALL_FILE}")

    prepared_boundary = load_assam_boundary(INPUT_BOUNDARY_FILE)

    dataset = xr.open_dataset(INPUT_RAINFALL_FILE)

    if "RAINFALL" not in dataset:
        raise ValueError("Expected variable RAINFALL in rainfall dataset.")

    print("Loaded rainfall dataset.")
    print(dataset)

    mask = build_spatial_mask(dataset, prepared_boundary)

    original_valid_values = int(dataset["RAINFALL"].count().item())

    clipped_dataset = dataset.copy()
    clipped_dataset["RAINFALL"] = dataset["RAINFALL"].where(mask)

    clipped_valid_values = int(clipped_dataset["RAINFALL"].count().item())

    clipped_dataset["ASSAM_BOUNDARY_MASK"] = mask

    clipped_dataset.attrs["clipping_method"] = (
        "Grid cells retained when their center point falls inside Assam outer boundary."
    )
    clipped_dataset.attrs["boundary_source"] = str(INPUT_BOUNDARY_FILE)
    clipped_dataset.attrs["source_rainfall_file"] = str(INPUT_RAINFALL_FILE)

    OUTPUT_RAINFALL_FILE.parent.mkdir(parents=True, exist_ok=True)
    clipped_dataset.to_netcdf(OUTPUT_RAINFALL_FILE)

    retained_percentage = (
        clipped_valid_values / original_valid_values * 100
        if original_valid_values > 0
        else 0
    )

    print()
    print("Assam rainfall clipping completed.")
    print(f"Input rainfall file:  {INPUT_RAINFALL_FILE}")
    print(f"Boundary file:        {INPUT_BOUNDARY_FILE}")
    print(f"Output rainfall file: {OUTPUT_RAINFALL_FILE}")
    print()
    print(f"Original valid rainfall values: {original_valid_values}")
    print(f"Clipped valid rainfall values:  {clipped_valid_values}")
    print(f"Retained percentage:            {retained_percentage:.2f}%")
    print()
    print("Mask summary:")
    print(f"- Total grid cells: {mask.size}")
    print(f"- Cells inside Assam boundary: {int(mask.sum().item())}")
    print(f"- Cells outside Assam boundary: {int((~mask).sum().item())}")


if __name__ == "__main__":
    main()