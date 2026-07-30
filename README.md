Create / replace this file:

```text
D:\hackaton,projects\climatetwin\README.md
```

with this full content:

````md
# ClimateTwin India — V1 Assam Climate Intelligence Prototype

ClimateTwin India is an AI-ready geospatial climate intelligence prototype built for the ISRO hackathon problem statement: **AI-Powered Digital Twin of India’s Climate using India’s National Data**.

The current V1 implementation focuses on **Assam** as a regional proof of concept. It uses real gridded rainfall and temperature datasets, processes them into boundary-clipped regional climate layers, exposes backend APIs, and visualizes the results through a map-first command center interface.

---

## Project Codename

**Project VARSHA**

---

## V1 Scope

ClimateTwin V1 is focused on four core capabilities:

```text
Observe     → View real rainfall and temperature spatial layers
Understand → Analyze anomalies, seasonality, heat signals, and climate state
Animate    → Play rainfall field sequences over time
Inspect    → Click map cells/markers to inspect source-grid values
````

V1 is not a weather API wrapper. It is a real data engineering and geospatial analytics pipeline.

---

## Current Region

```text
Region: Assam, India
Year: 2025
Rainfall grid: 0.25° IMD rainfall data
Temperature grid: 1.0° IMD TMIN/TMAX data
Boundary: Assam GeoJSON boundary
```

---

## Tech Stack

### Frontend

```text
React
TypeScript
Vite
MapLibre GL
Recharts
Canvas overlay rendering
CSS-in-TS component styling
```

### Backend

```text
Python
FastAPI
Pydantic
Pandas
Xarray
NumPy
Shapely
NetCDF processing
```

### Data Processing

```text
IMD rainfall NetCDF processing
IMD temperature GRD to NetCDF conversion
Assam bounding-box extraction
Assam boundary clipping
Daily and monthly summary generation
Rainfall anomaly generation
Seasonal rainfall intelligence
Temperature intelligence summaries
```

---

## Main Features

### 1. Climate Command Center

The frontend is built as a map-first command center.

It includes:

```text
Full-width dark geospatial interface
Smooth climate overlay
Floating rainfall intelligence panel
Floating layer-control panel
Bottom rainfall animation timeline
Dynamic legends
City labels
District boundaries
Source-grid popups
```

---

### 2. Rainfall Intelligence

Rainfall V1 includes:

```text
Daily rainfall summary
Monthly rainfall distribution
Rainfall anomaly detection
Extreme rainfall day detection
Seasonal rainfall contribution
Peak rainfall event identification
Rainfall field sequence animation
```

Current V1 rainfall highlights:

```text
Annual mean rainfall: 5.02 mm/day
Wet days: 201
Extreme rainfall days: 19
Peak rainfall day: 2025-05-31
Peak regional mean rainfall: 78.59 mm
Peak grid-cell rainfall: 176.43 mm
Dominant rainfall season: Monsoon
```

---

### 3. Temperature Intelligence

Temperature V1 includes:

```text
Daily TMIN, TMAX, TMEAN, and DTR summaries
Monthly temperature profile
Hot day count
Warm night count
Cool day count
Peak heat day detection
Coldest night detection
Temperature spatial layer switching
```

Current V1 temperature highlights:

```text
Annual TMEAN: 23.55 °C
Annual TMAX: 28.43 °C
Annual TMIN: 18.67 °C
Annual DTR: 9.76 °C
Hot days: 4
Warm nights: 13
Peak heat day: 2025-07-24
Coldest night: 2025-12-12
```

---

### 4. Spatial Climate Layers

The interactive map supports:

```text
Rainfall
TMEAN
TMAX
TMIN
```

Rainfall is rendered as a smooth atmospheric field clipped to the Assam boundary.

Temperature is rendered using coarse-grid climate patches, also clipped to Assam.

Both layers support source-grid inspection through map popups.

---

## Project Structure

```text
climatetwin/
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   ├── core/
│   │   │   ├── schemas/
│   │   │   └── main.py
│   │   ├── tests/
│   │   └── requirements.txt
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── charts/
│       │   │   ├── layout/
│       │   │   └── map/
│       │   ├── data/
│       │   ├── services/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
│
├── data/
│   ├── raw/
│   │   ├── imd/
│   │   └── boundaries/
│   ├── processed/
│   └── derived/
│
├── scripts/
│   └── data_checks/
│
└── README.md
```

---

## Backend Setup

Open PowerShell:

```powershell
cd D:\hackaton,projects\climatetwin\apps\backend
.venv\Scripts\Activate.ps1
python -m fastapi dev app/main.py
```

Backend runs at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

Open another PowerShell terminal:

```powershell
cd D:\hackaton,projects\climatetwin\apps\frontend
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## Production Build Check

From frontend folder:

```powershell
cd D:\hackaton,projects\climatetwin\apps\frontend
npm run build
```

Preview production build:

```powershell
npm run preview
```

Preview URL:

```text
http://localhost:4173
```

---

## Backend Test

From backend folder:

```powershell
cd D:\hackaton,projects\climatetwin\apps\backend
.venv\Scripts\Activate.ps1
pytest
```

Expected:

```text
1 passed
```

---

## Important API Endpoints

### Health

```text
GET /api/v1/health
```

### Rainfall

```text
GET /api/v1/rainfall/assam/metadata
GET /api/v1/rainfall/assam/daily-summary
GET /api/v1/rainfall/assam/monthly-summary
GET /api/v1/rainfall/assam/daily-anomalies
GET /api/v1/rainfall/assam/anomaly-summary
GET /api/v1/rainfall/assam/seasonal-summary
GET /api/v1/rainfall/assam/field?selected_date=2025-05-31
GET /api/v1/rainfall/assam/field-sequence?start_date=2025-05-24&end_date=2025-06-07
```

### Temperature

```text
GET /api/v1/temperature/assam/metadata
GET /api/v1/temperature/assam/summary
GET /api/v1/temperature/assam/monthly-summary
GET /api/v1/temperature/assam/field?selected_date=2025-07-24&variable=TMAX
```

Supported temperature variables:

```text
TMIN
TMAX
TMEAN
DTR
```

Frontend currently exposes:

```text
TMEAN
TMAX
TMIN
```

---

## Data Pipeline Scripts

Run scripts from project root using backend Python:

```powershell
cd D:\hackaton,projects\climatetwin
apps\backend\.venv\Scripts\python.exe scripts\data_checks\<script_name>.py
```

Important pipeline stages:

```text
Inspect rainfall NetCDF
Extract Assam rainfall bbox
Prepare Assam boundary
Clip rainfall to Assam boundary
Summarize rainfall
Build rainfall anomalies
Inspect temperature GRD files
Extract Assam temperature bbox
Clip temperature to Assam boundary
Summarize temperature
```

---

## Current Processed Data Outputs

### Rainfall

```text
data/processed/imd/rainfall/assam_rainfall_2025_clipped.nc
data/derived/assam/assam_rainfall_daily_summary_2025_clipped.csv
data/derived/assam/assam_rainfall_monthly_summary_2025_clipped.csv
data/derived/assam/assam_rainfall_daily_anomalies_2025_clipped.csv
```

### Temperature

```text
data/processed/imd/temperature/india_temperature_2025.nc
data/processed/imd/temperature/assam_temperature_2025_bbox.nc
data/processed/imd/temperature/assam_temperature_2025_clipped.nc
data/derived/assam/assam_temperature_daily_summary_2025_clipped.csv
data/derived/assam/assam_temperature_monthly_summary_2025_clipped.csv
```

### Boundary

```text
data/processed/boundaries/assam_district_boundaries.geojson
data/processed/boundaries/assam_outer_boundary.geojson
apps/frontend/src/data/geojson/assam-district-boundaries.json
apps/frontend/src/data/geojson/assam-outer-boundary.json
```

---

## Manual Demo Flow

For a demo, use this flow:

### 1. Start backend

```powershell
cd D:\hackaton,projects\climatetwin\apps\backend
.venv\Scripts\Activate.ps1
python -m fastapi dev app/main.py
```

### 2. Start frontend

```powershell
cd D:\hackaton,projects\climatetwin\apps\frontend
npm run dev
```

### 3. Open frontend

```text
http://localhost:5173
```

### 4. Demo sequence

```text
1. Show default rainfall peak day: 2025-05-31
2. Explain rainfall anomaly and extreme rainfall detection
3. Click rainfall cells to show source-grid values
4. Click Peak Seq
5. Press Play to animate rainfall evolution
6. Switch to TMEAN
7. Switch to TMAX
8. Switch to TMIN
9. Click temperature markers to inspect values
10. Scroll to rainfall and temperature charts
11. Explain seasonal rainfall dominance and climate interpretation
```

---

## V1 Stabilization Status

```text
Backend pytest: passed
Frontend production build: passed
Frontend preview: passed
Rainfall layer: working
Temperature layers: working
Map popups: working
Legends: working
Charts: working
Rainfall animation: working
```

---

## Known V1 Limitations

These are intentional V1 limitations:

```text
1. Assam-only regional proof of concept
2. Rainfall uses 2025 internal anomaly baseline, not long-term climatology
3. Temperature grid is coarse 1° resolution
4. Smooth map overlay is a visual interpolation approximation
5. No true future climate prediction yet
6. No flood model or hydrology model yet
7. No live data ingestion yet
```

---

## Planned V2

V2 should add scenario simulation, not fake prediction.

Planned V2 direction:

```text
Scenario Simulation / What-if Climate Stress Testing
```

Possible V2 simulations:

```text
Rainfall anomaly simulator
Heat stress simulator
Flood-risk proxy simulator
Crop/climate stress simulator
Urban heat scenario for Guwahati
```

---

## Roadmap

```text
V1   → Assam climate intelligence command center
V1.1 → Stabilization, responsiveness, deployment polish
V2   → What-if climate stress simulation
V3   → Multi-year climatology and stronger anomaly baseline
V4   → Predictive modeling / forecasting layer
```

---

## Git Workflow

Recommended checkpoint command:

```powershell
cd D:\hackaton,projects\climatetwin
git status
git add .
git commit -m "Stabilize ClimateTwin V1"
```

---

## Project Summary

ClimateTwin V1 demonstrates a real end-to-end climate intelligence system:

```text
Raw climate data
→ preprocessing
→ geospatial clipping
→ analytical summaries
→ anomaly intelligence
→ backend APIs
→ interactive spatial frontend
```

It is a regional but serious foundation for a larger climate digital twin platform.

