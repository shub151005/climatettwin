from fastapi import APIRouter, HTTPException, status

from app.schemas.simulation import (
    RainfallScenarioRequest,
    RainfallScenarioResponse,
)
from app.services.simulation_service import run_rainfall_scenario


router = APIRouter(
    prefix="/simulation/assam",
    tags=["Climate Simulation"],
)


@router.post(
    "/rainfall-scenario",
    response_model=RainfallScenarioResponse,
    status_code=status.HTTP_200_OK,
)
def create_rainfall_scenario(
    payload: RainfallScenarioRequest,
) -> RainfallScenarioResponse:
    try:
        return run_rainfall_scenario(
            selected_date=payload.selected_date,
            rainfall_change_percent=(
                payload.rainfall_change_percent
            ),
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Rainfall simulation failed.",
        ) from exc