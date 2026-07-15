# ClimateTwin India

ClimateTwin India is an AI-powered regional climate digital twin Proof of Concept.

Version 1 focuses on Assam and aims to integrate official Indian climate datasets for:

- historical climate exploration,
- anomaly analysis,
- rainfall and temperature forecasting,
- uncertainty-aware prediction,
- climate-state representation,
- transparent scenario simulation,
- interactive geospatial analysis.

## Product Loop

Observe → Understand → Predict → Simulate

## V1 Pilot

Assam, India.

## Architecture

The project uses:

- React and TypeScript for the frontend,
- FastAPI for the API layer,
- modular climate-domain services,
- reproducible offline data pipelines,
- separate ML training and evaluation pipelines,
- PostgreSQL/PostGIS for serving spatial application data,
- NetCDF and Parquet for scientific and processed data artifacts.

## Repository Structure

- `apps/` — deployable frontend and backend applications
- `packages/climate_core/` — climate-domain computation
- `packages/data_pipeline/` — ingestion and preprocessing
- `packages/ml/` — ML training, evaluation and inference
- `configs/` — region, variable, dataset and model configurations
- `docs/` — architecture, methodology and research documentation
- `tests/` — unit, integration, data-quality and ML tests

## Status

Current stage: Repository Bootstrap