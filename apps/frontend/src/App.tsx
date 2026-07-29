import { useEffect, useMemo, useState } from "react";

import { MonthlyRainfallBarChart } from "./components/charts/MonthlyRainfallBarChart";
import { MonthlyTemperatureChart } from "./components/charts/MonthlyTemperatureChart";
import { RainfallLineChart } from "./components/charts/RainfallLineChart";
import { RainfallFieldPreview } from "./components/map/RainfallFieldPreview";
import { ClimateMap } from "./components/map/ClimateMap";

import {
  getAssamDailyRainfallAnomalies,
  getAssamDailyRainfallSummary,
  getAssamMonthlyRainfallSummary,
  getAssamMonthlyTemperatureSummary,
  getAssamRainfallAnomalySummary,
  getAssamRainfallField,
  getAssamRainfallFieldSequence,
  getAssamRainfallMetadata,
  getAssamSeasonalRainfallSummary,
  getAssamTemperatureField,
  getAssamTemperatureMetadata,
  getAssamTemperatureSummary,
  getHealthStatus,
  type DailyRainfallAnomaly,
  type DailyRainfallSummary,
  type HealthResponse,
  type MonthlyRainfallSummary,
  type MonthlyTemperatureSummary,
  type RainfallAnomalySummaryResponse,
  type RainfallFieldResponse,
  type RainfallMetadataResponse,
  type SeasonalRainfallSummary,
  type TemperatureFieldResponse,
  type TemperatureMetadataResponse,
  type TemperatureSummaryResponse,
} from "./services/api";


type ClimateLayer = "rainfall" | "TMEAN" | "TMAX" | "TMIN";


function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const [rainfall, setRainfall] = useState<DailyRainfallSummary[]>([]);
  const [monthlyRainfall, setMonthlyRainfall] = useState<
    MonthlyRainfallSummary[]
  >([]);

  const [rainfallAnomalies, setRainfallAnomalies] = useState<
    DailyRainfallAnomaly[]
  >([]);

  const [rainfallAnomalySummary, setRainfallAnomalySummary] =
    useState<RainfallAnomalySummaryResponse | null>(null);

  const [seasonalRainfallSummary, setSeasonalRainfallSummary] = useState<
    SeasonalRainfallSummary[]
  >([]);

  const [rainfallMetadata, setRainfallMetadata] =
    useState<RainfallMetadataResponse | null>(null);

  const [temperatureMetadata, setTemperatureMetadata] =
    useState<TemperatureMetadataResponse | null>(null);

  const [temperatureSummary, setTemperatureSummary] =
    useState<TemperatureSummaryResponse | null>(null);

  const [monthlyTemperature, setMonthlyTemperature] = useState<
    MonthlyTemperatureSummary[]
  >([]);

  const [rainfallField, setRainfallField] =
    useState<RainfallFieldResponse | null>(null);

  const [temperatureField, setTemperatureField] =
    useState<TemperatureFieldResponse | null>(null);

  const [fieldSequence, setFieldSequence] = useState<RainfallFieldResponse[]>(
    []
  );

  const [activeClimateLayer, setActiveClimateLayer] =
    useState<ClimateLayer>("rainfall");

  const [selectedFieldDate, setSelectedFieldDate] = useState("2025-05-30");
  const [selectedTemperatureDate, setSelectedTemperatureDate] =
    useState("2025-07-24");

  const [sequenceStartDate, setSequenceStartDate] = useState("2025-05-24");
  const [sequenceEndDate, setSequenceEndDate] = useState("2025-06-07");

  const [isFieldLoading, setIsFieldLoading] = useState(false);

  const [isTemperatureFieldLoading, setIsTemperatureFieldLoading] =
    useState(false);

  const [isSequenceLoading, setIsSequenceLoading] = useState(false);

  const [isPlayingFieldAnimation, setIsPlayingFieldAnimation] = useState(false);

  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function loadInitialData() {
      try {
        setError(null);

        const [
          healthData,
          metadataData,
          dailyRainfallData,
          monthlyRainfallData,
          anomalyData,
          anomalySummaryData,
          seasonalSummaryData,
          temperatureMetadataData,
          temperatureSummaryData,
          monthlyTemperatureData,
        ] = await Promise.all([
          getHealthStatus(),
          getAssamRainfallMetadata(),
          getAssamDailyRainfallSummary(),
          getAssamMonthlyRainfallSummary(),
          getAssamDailyRainfallAnomalies(),
          getAssamRainfallAnomalySummary(),
          getAssamSeasonalRainfallSummary(),
          getAssamTemperatureMetadata(),
          getAssamTemperatureSummary(),
          getAssamMonthlyTemperatureSummary(),
        ]);

        const defaultFieldDate = metadataData.end_date;
        const sequenceEnd = metadataData.end_date;

        const sequenceStartDateObject = new Date(metadataData.end_date);
        sequenceStartDateObject.setDate(sequenceStartDateObject.getDate() - 14);

        const sequenceStart = sequenceStartDateObject
          .toISOString()
          .slice(0, 10);

        const [fieldData, sequenceData, temperatureFieldData] =
          await Promise.all([
            getAssamRainfallField(defaultFieldDate),
            getAssamRainfallFieldSequence(sequenceStart, sequenceEnd),
            getAssamTemperatureField(
              temperatureSummaryData.peak_tmax_day,
              "TMAX"
            ),
          ]);

        setHealth(healthData);

        setRainfallMetadata(metadataData);
        setRainfall(dailyRainfallData);
        setMonthlyRainfall(monthlyRainfallData);
        setRainfallAnomalies(anomalyData);
        setRainfallAnomalySummary(anomalySummaryData);
        setSeasonalRainfallSummary(seasonalSummaryData);

        setTemperatureMetadata(temperatureMetadataData);
        setTemperatureSummary(temperatureSummaryData);
        setMonthlyTemperature(monthlyTemperatureData);
        setTemperatureField(temperatureFieldData);

        setRainfallField(fieldData);
        setFieldSequence(sequenceData.fields);

        setSelectedFieldDate(defaultFieldDate);
        setSelectedTemperatureDate(temperatureSummaryData.peak_tmax_day);
        setSequenceStartDate(sequenceStart);
        setSequenceEndDate(sequenceEnd);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load initial ClimateTwin data."
        );
      }
    }

    loadInitialData();
  }, []);


  const rainfallStats = useMemo(() => {
    if (rainfall.length === 0) {
      return {
        totalRainfall: 0,
        wetDays: 0,
        maxRainfallDay: null as DailyRainfallSummary | null,
      };
    }

    const totalRainfall = rainfall.reduce(
      (sum, day) => sum + day.rainfall_mean_mm,
      0
    );

    const wetDays = rainfall.filter((day) => day.rainfall_mean_mm > 1).length;

    const maxRainfallDay = rainfall.reduce((maxDay, currentDay) => {
      return currentDay.rainfall_mean_mm > maxDay.rainfall_mean_mm
        ? currentDay
        : maxDay;
    }, rainfall[0]);

    return {
      totalRainfall,
      wetDays,
      maxRainfallDay,
    };
  }, [rainfall]);


  const selectedRainfallAnomaly = useMemo(() => {
    if (!rainfallField) {
      return null;
    }

    return (
      rainfallAnomalies.find(
        (anomaly) => anomaly.date === rainfallField.date
      ) ?? null
    );
  }, [rainfallAnomalies, rainfallField]);


  const peakRainfallAnomaly = useMemo(() => {
    if (!rainfallStats.maxRainfallDay) {
      return null;
    }

    return (
      rainfallAnomalies.find(
        (anomaly) => anomaly.date === rainfallStats.maxRainfallDay?.date
      ) ?? null
    );
  }, [rainfallAnomalies, rainfallStats.maxRainfallDay]);


  const dominantSeason = useMemo(() => {
    if (seasonalRainfallSummary.length === 0) {
      return null;
    }

    return seasonalRainfallSummary.reduce((maxSeason, currentSeason) => {
      return currentSeason.total_rainfall_mm > maxSeason.total_rainfall_mm
        ? currentSeason
        : maxSeason;
    }, seasonalRainfallSummary[0]);
  }, [seasonalRainfallSummary]);


  const climateInterpretation = useMemo(() => {
    if (
      !rainfallAnomalySummary ||
      !dominantSeason ||
      !temperatureSummary ||
      monthlyTemperature.length === 0
    ) {
      return null;
    }

    const peakHeatMonth = monthlyTemperature.reduce((maxMonth, currentMonth) => {
      return currentMonth.tmax_mean_c > maxMonth.tmax_mean_c
        ? currentMonth
        : maxMonth;
    }, monthlyTemperature[0]);

    const warmNightMonth = monthlyTemperature.reduce(
      (maxMonth, currentMonth) => {
        return currentMonth.warm_nights > maxMonth.warm_nights
          ? currentMonth
          : maxMonth;
      },
      monthlyTemperature[0]
    );

    const lowestDtrMonth = monthlyTemperature.reduce(
      (minMonth, currentMonth) => {
        return currentMonth.dtr_mean_c < minMonth.dtr_mean_c
          ? currentMonth
          : minMonth;
      },
      monthlyTemperature[0]
    );

    return {
      dominantRainfallSeason: formatSeason(dominantSeason.season),
      dominantRainfallShare:
        dominantSeason.season_share_of_annual_rainfall_percent,

      peakRainfallDate: rainfallAnomalySummary.peak_day,
      peakRainfallAmount: rainfallAnomalySummary.peak_day_rainfall_mean_mm,
      peakRainfallSeason: formatSeason(rainfallAnomalySummary.peak_day_season),

      peakHeatDate: temperatureSummary.peak_tmax_day,
      peakHeatValue: temperatureSummary.peak_tmax_mean_c,

      warmNightDate: temperatureSummary.warmest_night_day,
      warmNightValue: temperatureSummary.warmest_night_tmin_c,

      peakHeatMonth: MONTH_LABELS[peakHeatMonth.month],
      peakHeatMonthTmax: peakHeatMonth.tmax_mean_c,

      warmNightMonth: MONTH_LABELS[warmNightMonth.month],
      warmNightCount: warmNightMonth.warm_nights,

      lowestDtrMonth: MONTH_LABELS[lowestDtrMonth.month],
      lowestDtrValue: lowestDtrMonth.dtr_mean_c,
    };
  }, [
    rainfallAnomalySummary,
    dominantSeason,
    temperatureSummary,
    monthlyTemperature,
  ]);


  function getCurrentSequenceIndex(): number {
    if (!rainfallField || fieldSequence.length === 0) {
      return -1;
    }

    return fieldSequence.findIndex((field) => field.date === rainfallField.date);
  }


  function clampDateToMetadata(dateValue: Date): string {
    const isoDate = dateValue.toISOString().slice(0, 10);

    if (!rainfallMetadata) {
      return isoDate;
    }

    if (isoDate < rainfallMetadata.start_date) {
      return rainfallMetadata.start_date;
    }

    if (isoDate > rainfallMetadata.end_date) {
      return rainfallMetadata.end_date;
    }

    return isoDate;
  }


  function getPeakRainfallSequenceWindow(): {
    startDate: string;
    endDate: string;
  } | null {
    if (!rainfallStats.maxRainfallDay) {
      return null;
    }

    const peakDate = new Date(rainfallStats.maxRainfallDay.date);

    const startDate = new Date(peakDate);
    startDate.setDate(startDate.getDate() - 7);

    const endDate = new Date(peakDate);
    endDate.setDate(endDate.getDate() + 7);

    return {
      startDate: clampDateToMetadata(startDate),
      endDate: clampDateToMetadata(endDate),
    };
  }


  async function handleFieldDateChange(dateValue: string) {
    try {
      setError(null);
      setIsFieldLoading(true);
      setIsPlayingFieldAnimation(false);

      const fieldData = await getAssamRainfallField(dateValue);

      setSelectedFieldDate(dateValue);
      setRainfallField(fieldData);
      setActiveClimateLayer("rainfall");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load rainfall field."
      );
    } finally {
      setIsFieldLoading(false);
    }
  }


  async function handleTemperatureLayerChange(layer: ClimateLayer) {
    try {
      setError(null);
      setActiveClimateLayer(layer);

      if (layer === "rainfall") {
        return;
      }

      setIsTemperatureFieldLoading(true);

      const fieldData = await getAssamTemperatureField(
        selectedTemperatureDate,
        layer
      );

      setTemperatureField(fieldData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load temperature field."
      );
    } finally {
      setIsTemperatureFieldLoading(false);
    }
  }


  async function handleLoadTemperatureField() {
    const selectedLayer =
      activeClimateLayer === "rainfall" ? "TMEAN" : activeClimateLayer;

    try {
      setError(null);
      setIsTemperatureFieldLoading(true);

      const fieldData = await getAssamTemperatureField(
        selectedTemperatureDate,
        selectedLayer
      );

      setTemperatureField(fieldData);
      setActiveClimateLayer(selectedLayer);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load temperature field."
      );
    } finally {
      setIsTemperatureFieldLoading(false);
    }
  }


  async function loadSequence(startDate: string, endDate: string) {
    try {
      setError(null);
      setIsSequenceLoading(true);
      setIsPlayingFieldAnimation(false);

      const sequenceData = await getAssamRainfallFieldSequence(
        startDate,
        endDate
      );

      setSequenceStartDate(startDate);
      setSequenceEndDate(endDate);
      setFieldSequence(sequenceData.fields);

      if (sequenceData.fields.length > 0) {
        const firstField = sequenceData.fields[0];

        setRainfallField(firstField);
        setSelectedFieldDate(firstField.date);
        setActiveClimateLayer("rainfall");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load rainfall field sequence."
      );
    } finally {
      setIsSequenceLoading(false);
    }
  }


  async function handleLoadSequence() {
    await loadSequence(sequenceStartDate, sequenceEndDate);
  }


  async function handleShowPeakRainfallDay() {
    if (!rainfallStats.maxRainfallDay) {
      return;
    }

    await handleFieldDateChange(rainfallStats.maxRainfallDay.date);
    setActiveClimateLayer("rainfall");
  }


  async function handleLoadPeakRainfallSequence() {
    const peakWindow = getPeakRainfallSequenceWindow();

    if (!peakWindow) {
      return;
    }

    await loadSequence(peakWindow.startDate, peakWindow.endDate);
    setActiveClimateLayer("rainfall");
  }


  function showSequenceField(index: number) {
    if (index < 0 || index >= fieldSequence.length) {
      return;
    }

    const field = fieldSequence[index];

    setRainfallField(field);
    setSelectedFieldDate(field.date);
    setActiveClimateLayer("rainfall");
  }


  function handlePreviousSequenceFrame() {
    const currentIndex = getCurrentSequenceIndex();

    if (currentIndex <= 0) {
      showSequenceField(fieldSequence.length - 1);
      return;
    }

    showSequenceField(currentIndex - 1);
  }


  function handleNextSequenceFrame() {
    const currentIndex = getCurrentSequenceIndex();

    if (currentIndex === -1 || currentIndex >= fieldSequence.length - 1) {
      showSequenceField(0);
      return;
    }

    showSequenceField(currentIndex + 1);
  }


  useEffect(() => {
    if (!isPlayingFieldAnimation || fieldSequence.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRainfallField((currentField) => {
        if (!currentField) {
          const firstField = fieldSequence[0];
          setSelectedFieldDate(firstField.date);
          setActiveClimateLayer("rainfall");
          return firstField;
        }

        const currentIndex = fieldSequence.findIndex(
          (field) => field.date === currentField.date
        );

        const nextIndex =
          currentIndex === -1 || currentIndex >= fieldSequence.length - 1
            ? 0
            : currentIndex + 1;

        const nextField = fieldSequence[nextIndex];
        setSelectedFieldDate(nextField.date);
        setActiveClimateLayer("rainfall");

        return nextField;
      });
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlayingFieldAnimation, fieldSequence]);


  const currentSequenceIndex = getCurrentSequenceIndex();
  const peakRainfallSequenceWindow = getPeakRainfallSequenceWindow();


  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        padding: "32px",
      }}
    >
      <section
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: "28px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#2563eb",
              fontSize: "14px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            ClimateTwin Assam
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "42px",
              lineHeight: 1.1,
              fontWeight: 900,
            }}
          >
            Real Rainfall & Temperature Intelligence
          </h1>

          <p
            style={{
              maxWidth: "840px",
              margin: "14px 0 0",
              color: "#4b5563",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            Boundary-clipped climate analysis for Assam using real IMD gridded
            rainfall and temperature data, geospatial processing, backend APIs,
            anomaly detection, seasonal intelligence, cross-variable climate
            interpretation, and interactive MapLibre visualization.
          </p>
        </header>

        <section
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "18px",
            padding: "22px",
            marginBottom: "20px",
            color: "#ffffff",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#93c5fd",
              fontSize: "13px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            ClimateTwin V1 System Status
          </p>

          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "24px",
              fontWeight: 900,
            }}
          >
            Real Data Engineering + Geospatial Climate Intelligence Pipeline
          </h2>

          <p
            style={{
              margin: "0 0 18px",
              color: "#d1d5db",
              fontSize: "15px",
              lineHeight: 1.7,
              maxWidth: "980px",
            }}
          >
            This build is not a weather API wrapper. It ingests real gridded IMD
            rainfall and temperature datasets, converts and processes raw climate
            files, clips them to the Assam boundary, derives analytical summaries,
            exposes backend APIs, and visualizes spatial climate layers through
            an interactive MapLibre dashboard.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <SystemStatusCard
              title="Data Sources"
              items={[
                "IMD rainfall grid",
                "IMD TMIN/TMAX grids",
                "Assam boundary GeoJSON",
              ]}
            />

            <SystemStatusCard
              title="Processing"
              items={[
                "GRD/NetCDF conversion",
                "Assam bbox extraction",
                "Boundary clipping",
              ]}
            />

            <SystemStatusCard
              title="Analytics"
              items={[
                "Rainfall anomalies",
                "Seasonal rainfall share",
                "Heat and warm-night signals",
              ]}
            />

            <SystemStatusCard
              title="Spatial System"
              items={[
                "MapLibre map layer",
                "Rainfall/temperature switch",
                "Popups and dynamic legends",
              ]}
            />
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <MetricCard
            label="Backend Status"
            value={health?.status ?? "Loading..."}
            helper={health ? `${health.application} · ${health.version}` : ""}
          />

          <MetricCard
            label="Annual Rainfall Mean"
            value={
              rainfallAnomalySummary
                ? `${rainfallAnomalySummary.annual_mean_rainfall_mm.toFixed(
                    2
                  )} mm/day`
                : "Loading..."
            }
            helper="2025 internal rainfall baseline"
          />

          <MetricCard
            label="Annual TMEAN"
            value={
              temperatureSummary
                ? `${temperatureSummary.annual_tmean_mean_c.toFixed(2)} °C`
                : "Loading..."
            }
            helper="Mean daily temperature"
          />

          <MetricCard
            label="Dataset Coverage"
            value={
              rainfallMetadata
                ? `${rainfallMetadata.start_date} → ${rainfallMetadata.end_date}`
                : "Loading..."
            }
            helper={
              rainfallMetadata
                ? `${rainfallMetadata.day_count} days · ${rainfallMetadata.processing_level}`
                : "Reading rainfall metadata"
            }
          />
        </section>

        {rainfallAnomalySummary && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <MetricCard
              label="Wet Days"
              value={rainfallAnomalySummary.wet_days.toString()}
              helper="Days with regional mean rainfall above 1 mm"
            />

            <MetricCard
              label="Extreme Rainfall Days"
              value={rainfallAnomalySummary.extreme_days.toString()}
              helper="Days in the top 5% of 2025 rainfall distribution"
            />

            <MetricCard
              label="Peak Rainfall Anomaly"
              value={`+${rainfallAnomalySummary.peak_day_anomaly_mm.toFixed(
                2
              )} mm`}
              helper={`Above 2025 mean on ${rainfallAnomalySummary.peak_day}`}
            />

            <MetricCard
              label="Dominant Rainfall Season"
              value={
                dominantSeason ? formatSeason(dominantSeason.season) : "Loading..."
              }
              helper={
                dominantSeason
                  ? `${dominantSeason.season_share_of_annual_rainfall_percent.toFixed(
                      2
                    )}% annual rainfall share`
                  : "Reading seasonal summary"
              }
            />
          </section>
        )}

        {seasonalRainfallSummary.length > 0 && (
          <section style={whitePanelStyle}>
            <h2 style={sectionTitleStyle}>Seasonal Rainfall Intelligence</h2>

            <p style={sectionSubtitleStyle}>
              Seasonal aggregation from the boundary-clipped 2025 Assam rainfall
              anomaly dataset.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              {seasonalRainfallSummary.map((season) => (
                <article
                  key={season.season}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "16px",
                    background:
                      season.season === dominantSeason?.season
                        ? "#ecfdf5"
                        : "#ffffff",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 8px",
                      color: "#374151",
                      fontSize: "13px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {formatSeason(season.season)}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#111827",
                      fontSize: "24px",
                      fontWeight: 900,
                    }}
                  >
                    {season.total_rainfall_mm.toFixed(1)} mm
                  </p>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#4b5563",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    {season.season_share_of_annual_rainfall_percent.toFixed(2)}%
                    annual share · {season.day_count} days
                  </p>

                  <p
                    style={{
                      margin: "10px 0 0",
                      color: "#4b5563",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    Mean {season.mean_rainfall_mm.toFixed(2)} mm/day · Wet{" "}
                    {season.wet_days} · Dry {season.dry_days} · Extreme{" "}
                    {season.extreme_days}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {temperatureSummary && (
          <section style={whitePanelStyle}>
            <h2 style={sectionTitleStyle}>Temperature Intelligence</h2>

            <p style={sectionSubtitleStyle}>
              Boundary-clipped Assam temperature intelligence from IMD daily
              minimum and maximum temperature grids.
              {temperatureMetadata && (
                <>
                  {" "}
                  Coverage: {temperatureMetadata.start_date} →{" "}
                  {temperatureMetadata.end_date} ·{" "}
                  {temperatureMetadata.average_valid_grid_cells_per_day} valid
                  cells/day · {monthlyTemperature.length} monthly summaries.
                </>
              )}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <MetricCard
                label="Annual TMEAN"
                value={`${temperatureSummary.annual_tmean_mean_c.toFixed(
                  2
                )} °C`}
                helper="Mean daily temperature"
              />

              <MetricCard
                label="Annual TMAX"
                value={`${temperatureSummary.annual_tmax_mean_c.toFixed(2)} °C`}
                helper="Mean daily maximum temperature"
              />

              <MetricCard
                label="Annual TMIN"
                value={`${temperatureSummary.annual_tmin_mean_c.toFixed(2)} °C`}
                helper="Mean daily minimum temperature"
              />

              <MetricCard
                label="Annual DTR"
                value={`${temperatureSummary.annual_dtr_mean_c.toFixed(2)} °C`}
                helper="Mean diurnal temperature range"
              />

              <MetricCard
                label="Hot Days"
                value={temperatureSummary.hot_days.toString()}
                helper="Days with regional mean TMAX ≥ 35 °C"
              />

              <MetricCard
                label="Warm Nights"
                value={temperatureSummary.warm_nights.toString()}
                helper="Days with regional mean TMIN ≥ 25 °C"
              />

              <MetricCard
                label="Peak Heat Day"
                value={temperatureSummary.peak_tmax_day}
                helper={`${temperatureSummary.peak_tmax_mean_c.toFixed(
                  2
                )} °C regional mean TMAX`}
              />

              <MetricCard
                label="Coldest Night"
                value={temperatureSummary.coldest_tmin_day}
                helper={`${temperatureSummary.coldest_tmin_mean_c.toFixed(
                  2
                )} °C regional mean TMIN`}
              />
            </div>
          </section>
        )}

        {climateInterpretation && (
          <section
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: "16px",
              padding: "22px",
              marginBottom: "20px",
              color: "#ffffff",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                color: "#93c5fd",
                fontSize: "13px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Cross-variable climate state
            </p>

            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "22px",
                fontWeight: 900,
              }}
            >
              Climate State Interpretation
            </h2>

            <p
              style={{
                margin: "0 0 18px",
                color: "#d1d5db",
                fontSize: "15px",
                lineHeight: 1.7,
                maxWidth: "980px",
              }}
            >
              Assam’s 2025 climate signal is rainfall-dominated during the
              monsoon, while the strongest heat and warm-night signals appear in
              the broad warm-season window. This panel combines rainfall
              seasonality, rainfall extremes, temperature summaries, and monthly
              thermal behavior.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <InterpretationCard
                title="Rainfall regime"
                text={`${climateInterpretation.dominantRainfallSeason} contributed ${climateInterpretation.dominantRainfallShare.toFixed(
                  2
                )}% of annual rainfall, making it the dominant rainfall season.`}
              />

              <InterpretationCard
                title="Peak rainfall event"
                text={`The strongest rainfall event occurred on ${climateInterpretation.peakRainfallDate}, with ${climateInterpretation.peakRainfallAmount.toFixed(
                  2
                )} mm regional mean rainfall during ${climateInterpretation.peakRainfallSeason}.`}
              />

              <InterpretationCard
                title="Heat signal"
                text={`The peak heat day was ${climateInterpretation.peakHeatDate}, reaching ${climateInterpretation.peakHeatValue.toFixed(
                  2
                )} °C regional mean TMAX. The warmest month by mean TMAX was ${climateInterpretation.peakHeatMonth} at ${climateInterpretation.peakHeatMonthTmax.toFixed(
                  2
                )} °C.`}
              />

              <InterpretationCard
                title="Monsoon thermal behavior"
                text={`${climateInterpretation.warmNightMonth} had the strongest warm-night signal with ${climateInterpretation.warmNightCount} warm nights. ${climateInterpretation.lowestDtrMonth} had the lowest mean DTR at ${climateInterpretation.lowestDtrValue.toFixed(
                  2
                )} °C, suggesting reduced day-night temperature contrast.`}
              />
            </div>
          </section>
        )}

        {rainfallStats.maxRainfallDay && (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "18px 20px",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "18px",
                color: "#111827",
              }}
            >
              Peak Rainfall Event Intelligence
            </h2>

            <p
              style={{
                margin: 0,
                color: "#374151",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              {rainfallStats.maxRainfallDay.date} recorded{" "}
              <strong>
                {rainfallStats.maxRainfallDay.rainfall_mean_mm.toFixed(2)} mm
              </strong>{" "}
              regional mean rainfall, with a maximum grid-cell rainfall of{" "}
              <strong>
                {rainfallStats.maxRainfallDay.rainfall_max_mm.toFixed(2)} mm
              </strong>
              .
              {peakRainfallAnomaly && (
                <>
                  {" "}
                  It was{" "}
                  <strong>
                    {peakRainfallAnomaly.rainfall_anomaly_from_annual_mean_mm.toFixed(
                      2
                    )}{" "}
                    mm above the 2025 Assam daily mean
                  </strong>
                  , ranked at the{" "}
                  <strong>
                    {peakRainfallAnomaly.rainfall_percentile.toFixed(2)}th
                    percentile
                  </strong>
                  , classified as{" "}
                  <strong>
                    {formatRainfallClass(
                      peakRainfallAnomaly.rainfall_intensity_class
                    )}
                  </strong>{" "}
                  during the{" "}
                  <strong>{formatSeason(peakRainfallAnomaly.season)}</strong>{" "}
                  season.
                </>
              )}
              {peakRainfallSequenceWindow && (
                <>
                  {" "}
                  Suggested event window:{" "}
                  <strong>
                    {peakRainfallSequenceWindow.startDate} →{" "}
                    {peakRainfallSequenceWindow.endDate}
                  </strong>
                  .
                </>
              )}
            </p>
          </section>
        )}

        <RainfallLineChart data={rainfall} anomalies={rainfallAnomalies} />

        <MonthlyRainfallBarChart data={monthlyRainfall} />

        <MonthlyTemperatureChart data={monthlyTemperature} />

        <section
          style={{
            marginTop: "24px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              alignItems: "flex-start",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 800,
                }}
              >
                Spatial Climate State Map
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#4b5563",
                  fontSize: "15px",
                  lineHeight: 1.6,
                }}
              >
                Switch between rainfall and temperature grid layers on the same
                Assam boundary-clipped MapLibre view.
              </p>

              {rainfallMetadata && (
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#4b5563",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Rainfall coverage: {rainfallMetadata.start_date} to{" "}
                  {rainfallMetadata.end_date} · {rainfallMetadata.day_count}{" "}
                  days · {rainfallMetadata.average_valid_grid_cells_per_day}{" "}
                  average valid Assam cells/day.
                </p>
              )}

              {temperatureField && activeClimateLayer !== "rainfall" && (
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#4b5563",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Temperature layer: {temperatureField.variable} ·{" "}
                  {temperatureField.date} · mean{" "}
                  {temperatureField.temperature_mean_c.toFixed(2)} °C · range{" "}
                  {temperatureField.temperature_min_c.toFixed(2)}–
                  {temperatureField.temperature_max_c.toFixed(2)} °C.
                </p>
              )}

              {selectedRainfallAnomaly && activeClimateLayer === "rainfall" && (
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#4b5563",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Rainfall day intelligence:{" "}
                  {formatRainfallClass(
                    selectedRainfallAnomaly.rainfall_intensity_class
                  )}{" "}
                  · anomaly{" "}
                  {selectedRainfallAnomaly.rainfall_anomaly_from_annual_mean_mm.toFixed(
                    2
                  )}{" "}
                  mm · percentile{" "}
                  {selectedRainfallAnomaly.rainfall_percentile.toFixed(2)} ·{" "}
                  {formatSeason(selectedRainfallAnomaly.season)}
                </p>
              )}
            </div>

            <p
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "14px",
                fontWeight: 800,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "999px",
                padding: "8px 12px",
              }}
            >
              {activeClimateLayer === "rainfall" &&
              fieldSequence.length > 0 &&
              currentSequenceIndex >= 0
                ? `Rainfall frame ${currentSequenceIndex + 1} / ${
                    fieldSequence.length
                  }`
                : `Active layer: ${activeClimateLayer}`}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <div style={controlPanelStyle}>
              <div style={controlPanelHeaderStyle}>
                <div>
                  <h3 style={controlPanelTitleStyle}>
                    Temperature Layer Controls
                  </h3>
                  <p style={controlPanelSubtitleStyle}>
                    Load TMEAN, TMAX, or TMIN for a selected temperature date.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleTemperatureLayerChange("rainfall")}
                  style={getLayerButtonStyle(activeClimateLayer === "rainfall")}
                >
                  Rainfall
                </button>

                <button
                  type="button"
                  onClick={() => handleTemperatureLayerChange("TMEAN")}
                  disabled={isTemperatureFieldLoading}
                  style={getLayerButtonStyle(activeClimateLayer === "TMEAN")}
                >
                  TMEAN
                </button>

                <button
                  type="button"
                  onClick={() => handleTemperatureLayerChange("TMAX")}
                  disabled={isTemperatureFieldLoading}
                  style={getLayerButtonStyle(activeClimateLayer === "TMAX")}
                >
                  TMAX
                </button>

                <button
                  type="button"
                  onClick={() => handleTemperatureLayerChange("TMIN")}
                  disabled={isTemperatureFieldLoading}
                  style={getLayerButtonStyle(activeClimateLayer === "TMIN")}
                >
                  TMIN
                </button>

                <label style={labelStyle}>
                  Temperature date
                  <input
                    type="date"
                    value={selectedTemperatureDate}
                    min={temperatureMetadata?.start_date}
                    max={temperatureMetadata?.end_date}
                    onChange={(event) =>
                      setSelectedTemperatureDate(event.target.value)
                    }
                    style={inputStyle}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleLoadTemperatureField}
                  disabled={isTemperatureFieldLoading}
                  style={{
                    ...secondaryButtonStyle,
                    background: "#7f1d1d",
                    color: "#ffffff",
                    borderColor: "#7f1d1d",
                  }}
                >
                  {isTemperatureFieldLoading ? "Loading..." : "Load temperature"}
                </button>
              </div>
            </div>

            <div style={controlPanelStyle}>
              <div style={controlPanelHeaderStyle}>
                <div>
                  <h3 style={controlPanelTitleStyle}>
                    Rainfall Animation Controls
                  </h3>
                  <p style={controlPanelSubtitleStyle}>
                    Load a rainfall date range and animate the rainfall field
                    sequence.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
                <label style={labelStyle}>
                  Start date
                  <input
                    type="date"
                    value={sequenceStartDate}
                    min={rainfallMetadata?.start_date}
                    max={rainfallMetadata?.end_date}
                    onChange={(event) =>
                      setSequenceStartDate(event.target.value)
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  End date
                  <input
                    type="date"
                    value={sequenceEndDate}
                    min={rainfallMetadata?.start_date}
                    max={rainfallMetadata?.end_date}
                    onChange={(event) => setSequenceEndDate(event.target.value)}
                    style={inputStyle}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleLoadSequence}
                  disabled={isSequenceLoading}
                  style={secondaryButtonStyle}
                >
                  {isSequenceLoading ? "Loading..." : "Load sequence"}
                </button>

                <button
                  type="button"
                  onClick={handleShowPeakRainfallDay}
                  disabled={!rainfallStats.maxRainfallDay || isFieldLoading}
                  style={{
                    ...secondaryButtonStyle,
                    background: "#111827",
                    color: "#ffffff",
                    borderColor: "#111827",
                  }}
                >
                  Peak rainfall day
                </button>

                <button
                  type="button"
                  onClick={handleLoadPeakRainfallSequence}
                  disabled={!peakRainfallSequenceWindow || isSequenceLoading}
                  style={{
                    ...secondaryButtonStyle,
                    background: "#064e3b",
                    color: "#ffffff",
                    borderColor: "#064e3b",
                  }}
                >
                  Peak sequence
                </button>

                <button
                  type="button"
                  onClick={handlePreviousSequenceFrame}
                  disabled={fieldSequence.length === 0}
                  style={secondaryButtonStyle}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNextSequenceFrame}
                  disabled={fieldSequence.length === 0}
                  style={secondaryButtonStyle}
                >
                  Next
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveClimateLayer("rainfall");
                    setIsPlayingFieldAnimation((currentValue) => !currentValue);
                  }}
                  disabled={fieldSequence.length === 0}
                  style={{
                    ...secondaryButtonStyle,
                    background: isPlayingFieldAnimation ? "#dc2626" : "#2563eb",
                    color: "#ffffff",
                    borderColor: isPlayingFieldAnimation
                      ? "#dc2626"
                      : "#2563eb",
                  }}
                >
                  {isPlayingFieldAnimation ? "Pause" : "Play"}
                </button>

                <label style={labelStyle}>
                  Single rainfall date
                  <input
                    type="date"
                    value={selectedFieldDate}
                    min={rainfallMetadata?.start_date}
                    max={rainfallMetadata?.end_date}
                    onChange={(event) =>
                      handleFieldDateChange(event.target.value)
                    }
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {isFieldLoading ? (
          <section
            style={{
              marginTop: "24px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            Loading rainfall field...
          </section>
        ) : (
          <ClimateMap
            rainfallData={rainfallField}
            temperatureData={temperatureField}
            activeLayer={activeClimateLayer}
          />
        )}

        {activeClimateLayer === "rainfall" && rainfallField && (
          <RainfallFieldPreview data={rainfallField} />
        )}

        {error && (
          <section
            style={{
              marginTop: "24px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "16px",
              padding: "18px 20px",
              fontWeight: 600,
            }}
          >
            {error}
          </section>
        )}
      </section>
    </main>
  );
}


interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
}


function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "18px 20px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          color: "#6b7280",
          fontSize: "13px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          color: "#111827",
          fontSize: "24px",
          fontWeight: 900,
          lineHeight: 1.2,
        }}
      >
        {value}
      </p>

      <p
        style={{
          margin: "8px 0 0",
          color: "#6b7280",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        {helper}
      </p>
    </article>
  );
}


interface SystemStatusCardProps {
  title: string;
  items: string[];
}


function SystemStatusCard({ title, items }: SystemStatusCardProps) {
  return (
    <article
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "14px",
        padding: "16px",
      }}
    >
      <h3
        style={{
          margin: "0 0 10px",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 900,
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: "grid",
          gap: "7px",
        }}
      >
        {items.map((item) => (
          <p
            key={`${title}-${item}`}
            style={{
              margin: 0,
              color: "#d1d5db",
              fontSize: "13px",
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            ✓ {item}
          </p>
        ))}
      </div>
    </article>
  );
}


interface InterpretationCardProps {
  title: string;
  text: string;
}


function InterpretationCard({ title, text }: InterpretationCardProps) {
  return (
    <article
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "14px",
        padding: "16px",
      }}
    >
      <h3
        style={{
          margin: "0 0 8px",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 800,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#d1d5db",
          fontSize: "14px",
          lineHeight: 1.7,
        }}
      >
        {text}
      </p>
    </article>
  );
}


const MONTH_LABELS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


function formatRainfallClass(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


function formatSeason(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


function getLayerButtonStyle(isActive: boolean) {
  return {
    ...secondaryButtonStyle,
    background: isActive ? "#111827" : "#ffffff",
    color: isActive ? "#ffffff" : "#111827",
    borderColor: isActive ? "#111827" : "#d1d5db",
  } as const;
}


const whitePanelStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "20px",
} as const;


const sectionTitleStyle = {
  margin: "0 0 8px",
  fontSize: "20px",
  color: "#111827",
  fontWeight: 800,
  textAlign: "center",
} as const;


const sectionSubtitleStyle = {
  margin: "0 0 16px",
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: 1.6,
  textAlign: "center",
} as const;


const controlPanelStyle = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "16px",
} as const;


const controlPanelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
  marginBottom: "14px",
} as const;


const controlPanelTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
  fontWeight: 900,
} as const;


const controlPanelSubtitleStyle = {
  margin: "5px 0 0",
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: 1.5,
} as const;


const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  color: "#111827",
  fontSize: "13px",
  fontWeight: 700,
} as const;


const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#111827",
  background: "#ffffff",
} as const;


const secondaryButtonStyle = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 700,
  minWidth: "96px",
} as const;


export default App;