from enum import Enum

from pydantic import BaseModel, Field, model_validator


class ScenarioComparisonMode(str, Enum):
    ORIGINAL = "original"
    SIMULATED = "simulated"
    DIFFERENCE = "difference"


class ClimateStressClass(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"


class RainfallIntensityClass(str, Enum):
    TRACE = "trace"
    LIGHT = "light"
    MODERATE = "moderate"
    HEAVY = "heavy"
    VERY_HEAVY = "very_heavy"
    EXTREME = "extreme"


class RainfallScenarioRequest(BaseModel):
    selected_date: str = Field(
        ...,
        description="Simulation date in YYYY-MM-DD format.",
        examples=["2025-05-31"],
    )

    rainfall_change_percent: float = Field(
        ...,
        ge=-100.0,
        le=200.0,
        description=(
            "Percentage change applied to rainfall. "
            "-100 represents complete rainfall removal."
        ),
        examples=[30.0],
    )

    @model_validator(mode="after")
    def validate_date_format(self) -> "RainfallScenarioRequest":
        from datetime import datetime

        try:
            datetime.strptime(self.selected_date, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError(
                "selected_date must use YYYY-MM-DD format."
            ) from exc

        return self


class RainfallScenarioCell(BaseModel):
    latitude: float
    longitude: float

    original_rainfall_mm: float = Field(ge=0.0)
    simulated_rainfall_mm: float = Field(ge=0.0)

    rainfall_difference_mm: float

    original_intensity: RainfallIntensityClass
    simulated_intensity: RainfallIntensityClass

    intensity_changed: bool


class RainfallScenarioStatistics(BaseModel):
    original_mean_mm: float
    simulated_mean_mm: float
    mean_difference_mm: float

    original_min_mm: float
    simulated_min_mm: float

    original_max_mm: float
    simulated_max_mm: float

    affected_cell_count: int = Field(ge=0)
    intensity_changed_cell_count: int = Field(ge=0)

    original_extreme_cell_count: int = Field(ge=0)
    simulated_extreme_cell_count: int = Field(ge=0)


class ClimateStressResult(BaseModel):
    score: float = Field(ge=0.0, le=100.0)
    classification: ClimateStressClass

    rainfall_intensity_component: float = Field(ge=0.0, le=100.0)
    rainfall_change_component: float = Field(ge=0.0, le=100.0)
    extreme_cell_component: float = Field(ge=0.0, le=100.0)

    explanation: str


class RainfallScenarioResponse(BaseModel):
    region: str
    selected_date: str

    scenario_type: str = "rainfall_percentage_change"
    rainfall_change_percent: float

    unit: str = "millimetres"

    statistics: RainfallScenarioStatistics
    stress: ClimateStressResult

    cells: list[RainfallScenarioCell]