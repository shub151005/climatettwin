from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import xarray as xr

from app.schemas.simulation import (
    ClimateStressClass,
    ClimateStressResult,
    RainfallIntensityClass,
    RainfallScenarioCell,
    RainfallScenarioResponse,
    RainfallScenarioStatistics,
)


PROJECT_ROOT = Path(__file__).resolve().parents[4]

RAINFALL_DATASET_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "imd"
    / "rainfall"
    / "assam_rainfall_2025_clipped.nc"
)


@dataclass(frozen=True)
class RainfallThreshold:
    label: RainfallIntensityClass
    minimum_mm: float
    maximum_mm: float | None


RAINFALL_THRESHOLDS = (
    RainfallThreshold(
        label=RainfallIntensityClass.TRACE,
        minimum_mm=0.0,
        maximum_mm=0.1,
    ),
    RainfallThreshold(
        label=RainfallIntensityClass.LIGHT,
        minimum_mm=0.1,
        maximum_mm=10.0,
    ),
    RainfallThreshold(
        label=RainfallIntensityClass.MODERATE,
        minimum_mm=10.0,
        maximum_mm=25.0,
    ),
    RainfallThreshold(
        label=RainfallIntensityClass.HEAVY,
        minimum_mm=25.0,
        maximum_mm=50.0,
    ),
    RainfallThreshold(
        label=RainfallIntensityClass.VERY_HEAVY,
        minimum_mm=50.0,
        maximum_mm=100.0,
    ),
    RainfallThreshold(
        label=RainfallIntensityClass.EXTREME,
        minimum_mm=100.0,
        maximum_mm=None,
    ),
)


def classify_rainfall_intensity(
    rainfall_mm: float,
) -> RainfallIntensityClass:
    value = max(float(rainfall_mm), 0.0)

    for threshold in RAINFALL_THRESHOLDS:
        if threshold.maximum_mm is None:
            if value >= threshold.minimum_mm:
                return threshold.label
            continue

        if threshold.minimum_mm <= value < threshold.maximum_mm:
            return threshold.label

    return RainfallIntensityClass.EXTREME


def classify_stress(score: float) -> ClimateStressClass:
    if score < 25.0:
        return ClimateStressClass.LOW

    if score < 50.0:
        return ClimateStressClass.MODERATE

    if score < 75.0:
        return ClimateStressClass.HIGH

    return ClimateStressClass.SEVERE


def build_stress_explanation(
    *,
    rainfall_change_percent: float,
    simulated_mean_mm: float,
    simulated_extreme_cell_count: int,
    classification: ClimateStressClass,
) -> str:
    direction = (
        "increased"
        if rainfall_change_percent > 0
        else "decreased"
        if rainfall_change_percent < 0
        else "remained unchanged"
    )

    return (
        f"Rainfall {direction} by {abs(rainfall_change_percent):.1f}%. "
        f"The simulated regional mean is {simulated_mean_mm:.2f} mm, "
        f"with {simulated_extreme_cell_count} extreme-rainfall cells. "
        f"The resulting rainfall stress is classified as "
        f"{classification.value}."
    )


def calculate_rainfall_stress(
    *,
    rainfall_change_percent: float,
    simulated_mean_mm: float,
    simulated_extreme_cell_count: int,
    total_cell_count: int,
) -> ClimateStressResult:
    rainfall_intensity_component = min(
        max(simulated_mean_mm / 100.0 * 100.0, 0.0),
        100.0,
    )

    rainfall_change_component = min(
        abs(rainfall_change_percent) / 100.0 * 100.0,
        100.0,
    )

    extreme_ratio = (
        simulated_extreme_cell_count / total_cell_count
        if total_cell_count > 0
        else 0.0
    )

    extreme_cell_component = min(extreme_ratio * 100.0, 100.0)

    score = (
        rainfall_intensity_component * 0.50
        + rainfall_change_component * 0.25
        + extreme_cell_component * 0.25
    )

    score = round(min(max(score, 0.0), 100.0), 2)

    classification = classify_stress(score)

    explanation = build_stress_explanation(
        rainfall_change_percent=rainfall_change_percent,
        simulated_mean_mm=simulated_mean_mm,
        simulated_extreme_cell_count=simulated_extreme_cell_count,
        classification=classification,
    )

    return ClimateStressResult(
        score=score,
        classification=classification,
        rainfall_intensity_component=round(
            rainfall_intensity_component,
            2,
        ),
        rainfall_change_component=round(
            rainfall_change_component,
            2,
        ),
        extreme_cell_component=round(
            extreme_cell_component,
            2,
        ),
        explanation=explanation,
    )


def load_rainfall_field(selected_date: str) -> xr.DataArray:
    if not RAINFALL_DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Rainfall dataset was not found at "
            f"{RAINFALL_DATASET_PATH}"
        )

    with xr.open_dataset(RAINFALL_DATASET_PATH) as dataset:
        if "RAINFALL" not in dataset.data_vars:
            raise ValueError(
                "The rainfall dataset does not contain "
                "the RAINFALL variable."
            )

        try:
            rainfall_field = dataset["RAINFALL"].sel(
                TIME=np.datetime64(selected_date)
            )
        except KeyError as exc:
            raise ValueError(
                f"No rainfall data exists for {selected_date}."
            ) from exc

        return rainfall_field.load()


def run_rainfall_scenario(
    *,
    selected_date: str,
    rainfall_change_percent: float,
) -> RainfallScenarioResponse:
    rainfall_field = load_rainfall_field(selected_date)

    multiplier = 1.0 + rainfall_change_percent / 100.0

    cells: list[RainfallScenarioCell] = []

    original_values: list[float] = []
    simulated_values: list[float] = []

    intensity_changed_cell_count = 0
    original_extreme_cell_count = 0
    simulated_extreme_cell_count = 0

    latitudes = rainfall_field["LATITUDE"].values
    longitudes = rainfall_field["LONGITUDE"].values
    values = rainfall_field.values

    for latitude_index, latitude in enumerate(latitudes):
        for longitude_index, longitude in enumerate(longitudes):
            raw_value = values[latitude_index, longitude_index]

            if not np.isfinite(raw_value):
                continue

            original_rainfall_mm = max(float(raw_value), 0.0)

            simulated_rainfall_mm = max(
                original_rainfall_mm * multiplier,
                0.0,
            )

            rainfall_difference_mm = (
                simulated_rainfall_mm - original_rainfall_mm
            )

            original_intensity = classify_rainfall_intensity(
                original_rainfall_mm
            )

            simulated_intensity = classify_rainfall_intensity(
                simulated_rainfall_mm
            )

            intensity_changed = (
                original_intensity != simulated_intensity
            )

            if intensity_changed:
                intensity_changed_cell_count += 1

            if (
                original_intensity
                == RainfallIntensityClass.EXTREME
            ):
                original_extreme_cell_count += 1

            if (
                simulated_intensity
                == RainfallIntensityClass.EXTREME
            ):
                simulated_extreme_cell_count += 1

            original_values.append(original_rainfall_mm)
            simulated_values.append(simulated_rainfall_mm)

            cells.append(
                RainfallScenarioCell(
                    latitude=round(float(latitude), 4),
                    longitude=round(float(longitude), 4),
                    original_rainfall_mm=round(
                        original_rainfall_mm,
                        2,
                    ),
                    simulated_rainfall_mm=round(
                        simulated_rainfall_mm,
                        2,
                    ),
                    rainfall_difference_mm=round(
                        rainfall_difference_mm,
                        2,
                    ),
                    original_intensity=original_intensity,
                    simulated_intensity=simulated_intensity,
                    intensity_changed=intensity_changed,
                )
            )

    if not cells:
        raise ValueError(
            f"No valid rainfall cells were found for {selected_date}."
        )

    original_array = np.asarray(original_values, dtype=float)
    simulated_array = np.asarray(simulated_values, dtype=float)

    statistics = RainfallScenarioStatistics(
        original_mean_mm=round(
            float(np.mean(original_array)),
            2,
        ),
        simulated_mean_mm=round(
            float(np.mean(simulated_array)),
            2,
        ),
        mean_difference_mm=round(
            float(np.mean(simulated_array - original_array)),
            2,
        ),
        original_min_mm=round(
            float(np.min(original_array)),
            2,
        ),
        simulated_min_mm=round(
            float(np.min(simulated_array)),
            2,
        ),
        original_max_mm=round(
            float(np.max(original_array)),
            2,
        ),
        simulated_max_mm=round(
            float(np.max(simulated_array)),
            2,
        ),
        affected_cell_count=len(cells),
        intensity_changed_cell_count=(
            intensity_changed_cell_count
        ),
        original_extreme_cell_count=(
            original_extreme_cell_count
        ),
        simulated_extreme_cell_count=(
            simulated_extreme_cell_count
        ),
    )

    stress = calculate_rainfall_stress(
        rainfall_change_percent=rainfall_change_percent,
        simulated_mean_mm=statistics.simulated_mean_mm,
        simulated_extreme_cell_count=(
            simulated_extreme_cell_count
        ),
        total_cell_count=len(cells),
    )

    return RainfallScenarioResponse(
        region="Assam",
        selected_date=selected_date,
        rainfall_change_percent=rainfall_change_percent,
        statistics=statistics,
        stress=stress,
        cells=cells,
    )