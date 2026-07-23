import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = PROJECT_ROOT / "data" / "raw" / "boundaries" / "assam_source.geojson"

PROCESSED_OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "boundaries"
    / "assam_boundary.geojson"
)

FRONTEND_OUTPUT_FILE = (
    PROJECT_ROOT
    / "apps"
    / "frontend"
    / "src"
    / "data"
    / "geojson"
    / "assam-boundary.json"
)


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Input file not found: {INPUT_FILE}\n"
            "Download Assam GeoJSON and save it as assam_source.geojson."
        )

    with INPUT_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if data.get("type") == "Feature":
        data = {
            "type": "FeatureCollection",
            "features": [data],
        }

    if data.get("type") != "FeatureCollection":
        raise ValueError(
            f"Expected GeoJSON Feature or FeatureCollection, got: {data.get('type')}"
        )

    features = data.get("features", [])

    if not features:
        raise ValueError("GeoJSON has no features.")

    cleaned_geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "name": "Assam Boundary",
            "source": "udit-001/india-maps-data",
            "note": "Used for ClimateTwin Assam V1 regional visualization.",
        },
        "features": features,
    }

    PROCESSED_OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    FRONTEND_OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with PROCESSED_OUTPUT_FILE.open("w", encoding="utf-8") as file:
        json.dump(cleaned_geojson, file, ensure_ascii=False)

    with FRONTEND_OUTPUT_FILE.open("w", encoding="utf-8") as file:
        json.dump(cleaned_geojson, file, ensure_ascii=False)

    geometry_types = {
        feature.get("geometry", {}).get("type")
        for feature in features
    }

    print("Assam boundary prepared successfully.")
    print(f"Input: {INPUT_FILE}")
    print(f"Processed output: {PROCESSED_OUTPUT_FILE}")
    print(f"Frontend output: {FRONTEND_OUTPUT_FILE}")
    print(f"Feature count: {len(features)}")
    print(f"Geometry types: {geometry_types}")


if __name__ == "__main__":
    main()