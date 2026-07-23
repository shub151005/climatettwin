import json
from pathlib import Path

from shapely.geometry import shape, mapping
from shapely.ops import unary_union


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = PROJECT_ROOT / "data" / "raw" / "boundaries" / "assam_source.geojson"

PROCESSED_BOUNDARY_DIR = PROJECT_ROOT / "data" / "processed" / "boundaries"

FRONTEND_GEOJSON_DIR = (
    PROJECT_ROOT
    / "apps"
    / "frontend"
    / "src"
    / "data"
    / "geojson"
)

DISTRICT_PROCESSED_OUTPUT_FILE = (
    PROCESSED_BOUNDARY_DIR / "assam_district_boundaries.geojson"
)

OUTER_PROCESSED_OUTPUT_FILE = (
    PROCESSED_BOUNDARY_DIR / "assam_outer_boundary.geojson"
)

DISTRICT_FRONTEND_OUTPUT_FILE = (
    FRONTEND_GEOJSON_DIR / "assam-district-boundaries.json"
)

OUTER_FRONTEND_OUTPUT_FILE = (
    FRONTEND_GEOJSON_DIR / "assam-outer-boundary.json"
)


def load_geojson(input_file: Path) -> dict:
    if not input_file.exists():
        raise FileNotFoundError(
            f"Input file not found: {input_file}\n"
            "Download Assam GeoJSON and save it as assam_source.geojson."
        )

    with input_file.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if data.get("type") == "Feature":
        return {
            "type": "FeatureCollection",
            "features": [data],
        }

    if data.get("type") != "FeatureCollection":
        raise ValueError(
            f"Expected GeoJSON Feature or FeatureCollection, got: {data.get('type')}"
        )

    return data


def clean_feature_collection(source_geojson: dict) -> dict:
    features = source_geojson.get("features", [])

    if not features:
        raise ValueError("GeoJSON has no features.")

    cleaned_features = []

    for index, feature in enumerate(features):
        geometry = feature.get("geometry")

        if not geometry:
            print(f"Skipping feature {index}: missing geometry")
            continue

        geometry_type = geometry.get("type")

        if geometry_type not in {"Polygon", "MultiPolygon"}:
            print(f"Skipping feature {index}: unsupported geometry type {geometry_type}")
            continue

        properties = feature.get("properties", {})

        cleaned_features.append(
            {
                "type": "Feature",
                "properties": properties,
                "geometry": geometry,
            }
        )

    if not cleaned_features:
        raise ValueError("No valid Polygon or MultiPolygon features found.")

    return {
        "type": "FeatureCollection",
        "metadata": {
            "name": "Assam District/Internal Boundaries",
            "source": "Raw Assam GeoJSON source stored locally",
            "note": "Used for ClimateTwin Assam V1 district/internal boundary visualization.",
        },
        "features": cleaned_features,
    }


def build_outer_boundary(district_geojson: dict) -> dict:
    shapely_geometries = []

    for feature in district_geojson["features"]:
        geometry = feature.get("geometry")

        if geometry:
            shapely_geometries.append(shape(geometry))

    if not shapely_geometries:
        raise ValueError("No geometries available for dissolve operation.")

    dissolved_geometry = unary_union(shapely_geometries)

    if dissolved_geometry.is_empty:
        raise ValueError("Dissolved Assam boundary is empty.")

    outer_feature = {
        "type": "Feature",
        "properties": {
            "name": "Assam",
            "boundary_type": "outer_state_boundary",
            "source_feature_count": len(district_geojson["features"]),
        },
        "geometry": mapping(dissolved_geometry),
    }

    return {
        "type": "FeatureCollection",
        "metadata": {
            "name": "Assam Outer Boundary",
            "source": "Dissolved from Assam district/internal boundary features",
            "note": "Used for ClimateTwin Assam V1 outer state boundary visualization.",
        },
        "features": [outer_feature],
    }


def write_geojson(data: dict, output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with output_file.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False)


def main() -> None:
    source_geojson = load_geojson(INPUT_FILE)

    district_geojson = clean_feature_collection(source_geojson)
    outer_geojson = build_outer_boundary(district_geojson)

    write_geojson(district_geojson, DISTRICT_PROCESSED_OUTPUT_FILE)
    write_geojson(outer_geojson, OUTER_PROCESSED_OUTPUT_FILE)

    write_geojson(district_geojson, DISTRICT_FRONTEND_OUTPUT_FILE)
    write_geojson(outer_geojson, OUTER_FRONTEND_OUTPUT_FILE)

    district_geometry_types = {
        feature.get("geometry", {}).get("type")
        for feature in district_geojson["features"]
    }

    outer_geometry_types = {
        feature.get("geometry", {}).get("type")
        for feature in outer_geojson["features"]
    }

    print("Assam boundary preparation completed.")
    print(f"Input: {INPUT_FILE}")
    print()
    print("District/internal boundary outputs:")
    print(f"- Processed: {DISTRICT_PROCESSED_OUTPUT_FILE}")
    print(f"- Frontend:  {DISTRICT_FRONTEND_OUTPUT_FILE}")
    print(f"- Feature count: {len(district_geojson['features'])}")
    print(f"- Geometry types: {district_geometry_types}")
    print()
    print("Outer boundary outputs:")
    print(f"- Processed: {OUTER_PROCESSED_OUTPUT_FILE}")
    print(f"- Frontend:  {OUTER_FRONTEND_OUTPUT_FILE}")
    print(f"- Feature count: {len(outer_geojson['features'])}")
    print(f"- Geometry types: {outer_geometry_types}")


if __name__ == "__main__":
    main()