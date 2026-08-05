import { useEffect, useMemo, useRef, useState } from "react";

import { MonthlyRainfallBarChart } from "../../components/charts/MonthlyRainfallBarChart";
import { MonthlyTemperatureChart } from "../../components/charts/MonthlyTemperatureChart";
import { RainfallLineChart } from "../../components/charts/RainfallLineChart";
import { ClimateCommandCenter } from "../../components/layout/ClimateCommandCenter";
import SimulationControlPanel from "../../components/simulation/SimulationControlPanel";

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
  runAssamRainfallScenario,
  type DailyRainfallAnomaly,
  type DailyRainfallSummary,
  type HealthResponse,
  type MonthlyRainfallSummary,
  type MonthlyTemperatureSummary,
  type RainfallAnomalySummaryResponse,
  type RainfallFieldResponse,
  type RainfallMetadataResponse,
  type RainfallScenarioResponse,
  type ScenarioComparisonMode,
  type SeasonalRainfallSummary,
  type TemperatureFieldResponse,
  type TemperatureMetadataResponse,
  type TemperatureSummaryResponse,
} from "../../services/api";

type ClimateLayer = "rainfall" | "TMEAN" | "TMAX" | "TMIN";

function LivePage() {
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

  const [selectedFieldDate, setSelectedFieldDate] = useState("2025-05-31");
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

  const [simulationDate, setSimulationDate] = useState("2025-05-31");
  const [rainfallChangePercent, setRainfallChangePercent] = useState(30);
  const [simulationComparisonMode, setSimulationComparisonMode] =
    useState<ScenarioComparisonMode>("original");
  const [rainfallScenarioResult, setRainfallScenarioResult] =
    useState<RainfallScenarioResponse | null>(null);
  const [isSimulationLoading, setIsSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [isSimulationPlaying, setIsSimulationPlaying] = useState(false);
  const simulationAnimationFrameRef = useRef<number | null>(null);
  const [isRouteLayoutReady, setIsRouteLayoutReady] = useState(false);

  useEffect(() => {
    let secondFrameId = 0;

    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        setIsRouteLayoutReady(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);

      if (secondFrameId !== 0) {
        window.cancelAnimationFrame(secondFrameId);
      }
    };
  }, []);

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

        const defaultRainfallDate = anomalySummaryData.peak_day;
        const defaultTemperatureDate = temperatureSummaryData.peak_tmax_day;

        const sequenceStartDateObject = new Date(defaultRainfallDate);
        sequenceStartDateObject.setDate(sequenceStartDateObject.getDate() - 7);

        const sequenceEndDateObject = new Date(defaultRainfallDate);
        sequenceEndDateObject.setDate(sequenceEndDateObject.getDate() + 7);

        const sequenceStart = clampDateStringToRange(
          sequenceStartDateObject.toISOString().slice(0, 10),
          metadataData.start_date,
          metadataData.end_date
        );

        const sequenceEnd = clampDateStringToRange(
          sequenceEndDateObject.toISOString().slice(0, 10),
          metadataData.start_date,
          metadataData.end_date
        );

        const [fieldData, sequenceData, temperatureFieldData] =
          await Promise.all([
            getAssamRainfallField(defaultRainfallDate),
            getAssamRainfallFieldSequence(sequenceStart, sequenceEnd),
            getAssamTemperatureField(defaultTemperatureDate, "TMAX"),
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

        setSelectedFieldDate(defaultRainfallDate);
        setSimulationDate(defaultRainfallDate);
        setSelectedTemperatureDate(defaultTemperatureDate);
        setSequenceStartDate(sequenceStart);
        setSequenceEndDate(sequenceEnd);
        setActiveClimateLayer("rainfall");
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
      warmNightMonth: MONTH_LABELS[warmNightMonth.month],
      warmNightCount: warmNightMonth.warm_nights,
      peakHeatMonth: MONTH_LABELS[peakHeatMonth.month],
      peakHeatMonthTmax: peakHeatMonth.tmax_mean_c,
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

  function clampDateToRainfallMetadata(dateValue: Date): string {
    const isoDate = dateValue.toISOString().slice(0, 10);

    if (!rainfallMetadata) {
      return isoDate;
    }

    return clampDateStringToRange(
      isoDate,
      rainfallMetadata.start_date,
      rainfallMetadata.end_date
    );
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
      startDate: clampDateToRainfallMetadata(startDate),
      endDate: clampDateToRainfallMetadata(endDate),
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

  async function handleClimateLayerChange(layer: ClimateLayer) {
    try {
      setError(null);
      setActiveClimateLayer(layer);

      if (layer === "rainfall") {
        setIsPlayingFieldAnimation(false);
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
      setIsPlayingFieldAnimation(false);

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
  }

  async function handleLoadPeakRainfallSequence() {
    const peakWindow = getPeakRainfallSequenceWindow();

    if (!peakWindow) {
      return;
    }

    await loadSequence(peakWindow.startDate, peakWindow.endDate);
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

  function handleToggleRainfallAnimation() {
    setActiveClimateLayer("rainfall");
    setIsPlayingFieldAnimation((currentValue) => !currentValue);
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
    }, 650);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlayingFieldAnimation, fieldSequence]);

  useEffect(() => {
    if (!isSimulationPlaying || !rainfallScenarioResult) {
      return;
    }

    const durationMs = 4800;
    const startedAt = performance.now();

    function animate(now: number) {
      const elapsed = now - startedAt;
      const linearProgress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeInOutCubic(linearProgress);

      setSimulationProgress(easedProgress);

      if (linearProgress < 1) {
        simulationAnimationFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        simulationAnimationFrameRef.current = null;
        setIsSimulationPlaying(false);
      }
    }

    simulationAnimationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (simulationAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(simulationAnimationFrameRef.current);
        simulationAnimationFrameRef.current = null;
      }
    };
  }, [isSimulationPlaying, rainfallScenarioResult]);

  function handleReplayRainfallSimulation() {
    if (!rainfallScenarioResult) {
      return;
    }

    setSimulationComparisonMode("simulated");
    setSimulationProgress(0);
    setIsSimulationPlaying(true);
  }

  async function handleRunRainfallSimulation() {
    try {
      setSimulationError(null);
      setIsSimulationLoading(true);
      setIsPlayingFieldAnimation(false);

      const result = await runAssamRainfallScenario({
        selected_date: simulationDate,
        rainfall_change_percent: rainfallChangePercent,
      });

      setRainfallScenarioResult(result);
      setSimulationComparisonMode("simulated");
      setSimulationProgress(0);
      setIsSimulationPlaying(true);
      setActiveClimateLayer("rainfall");
    } catch (caughtError) {
      setSimulationError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to run rainfall scenario."
      );
    } finally {
      setIsSimulationLoading(false);
    }
  }

  function handleResetRainfallSimulation() {
    setRainfallScenarioResult(null);
    setSimulationError(null);
    setSimulationComparisonMode("original");
    setSimulationProgress(0);
    setIsSimulationPlaying(false);
    setRainfallChangePercent(30);
    setSimulationDate(selectedFieldDate);
  }

  const currentSequenceIndex = getCurrentSequenceIndex();

  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 28%), radial-gradient(circle at top right, rgba(249,115,22,0.16), transparent 30%), #020617",
        color: "#f9fafb",
        padding: "12px",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "none",
          margin: 0,
        }}
      >
        {isRouteLayoutReady ? (
          <ClimateCommandCenter
          activeClimateLayer={activeClimateLayer}
          rainfallField={rainfallField}
          temperatureField={temperatureField}
          rainfallMetadata={rainfallMetadata}
          temperatureMetadata={temperatureMetadata}
          selectedRainfallAnomaly={selectedRainfallAnomaly}
          rainfallStats={rainfallStats}
          currentSequenceIndex={currentSequenceIndex}
          fieldSequenceLength={fieldSequence.length}
          selectedFieldDate={selectedFieldDate}
          selectedTemperatureDate={selectedTemperatureDate}
          sequenceStartDate={sequenceStartDate}
          sequenceEndDate={sequenceEndDate}
          isFieldLoading={isFieldLoading}
          isTemperatureFieldLoading={isTemperatureFieldLoading}
          isSequenceLoading={isSequenceLoading}
          isPlayingFieldAnimation={isPlayingFieldAnimation}
          onClimateLayerChange={handleClimateLayerChange}
          onTemperatureDateChange={setSelectedTemperatureDate}
          onLoadTemperatureField={handleLoadTemperatureField}
          onSequenceStartDateChange={setSequenceStartDate}
          onSequenceEndDateChange={setSequenceEndDate}
          onLoadSequence={handleLoadSequence}
          onShowPeakRainfallDay={handleShowPeakRainfallDay}
          onLoadPeakRainfallSequence={handleLoadPeakRainfallSequence}
          onPreviousSequenceFrame={handlePreviousSequenceFrame}
          onNextSequenceFrame={handleNextSequenceFrame}
          onToggleRainfallAnimation={handleToggleRainfallAnimation}
          onSingleRainfallDateChange={handleFieldDateChange}
          rainfallScenarioResult={rainfallScenarioResult}
          simulationComparisonMode={simulationComparisonMode}
          simulationProgress={simulationProgress}
          isSimulationPlaying={isSimulationPlaying}
          onReplayRainfallSimulation={handleReplayRainfallSimulation}
          simulationPanel={
            <SimulationControlPanel
              selectedDate={simulationDate}
              rainfallChangePercent={rainfallChangePercent}
              comparisonMode={simulationComparisonMode}
              result={rainfallScenarioResult}
              isLoading={isSimulationLoading}
              error={simulationError}
              onDateChange={setSimulationDate}
              onRainfallChange={setRainfallChangePercent}
              onComparisonModeChange={setSimulationComparisonMode}
              onRunSimulation={handleRunRainfallSimulation}
              onResetSimulation={handleResetRainfallSimulation}
            />
          }
          />
        ) : (
          <section style={routeMapPreparingStyle}>
            Preparing Assam climate map...
          </section>
        )}

        {error && <section style={errorStyle}>{error}</section>}

        <section style={analysisGridStyle}>
          <AnalysisPanel
            eyebrow="Rainfall Signal"
            title="Rainfall Intelligence"
            metrics={[
              {
                label: "Annual Mean",
                value: rainfallAnomalySummary
                  ? `${rainfallAnomalySummary.annual_mean_rainfall_mm.toFixed(
                      2
                    )} mm/day`
                  : "Loading",
              },
              {
                label: "Wet Days",
                value: rainfallAnomalySummary
                  ? rainfallAnomalySummary.wet_days.toString()
                  : "Loading",
              },
              {
                label: "Extreme Days",
                value: rainfallAnomalySummary
                  ? rainfallAnomalySummary.extreme_days.toString()
                  : "Loading",
              },
              {
                label: "Peak Anomaly",
                value: rainfallAnomalySummary
                  ? `+${rainfallAnomalySummary.peak_day_anomaly_mm.toFixed(
                      2
                    )} mm`
                  : "Loading",
              },
            ]}
            text={
              rainfallStats.maxRainfallDay
                ? `Strongest rainfall event: ${
                    rainfallStats.maxRainfallDay.date
                  } · ${rainfallStats.maxRainfallDay.rainfall_mean_mm.toFixed(
                    2
                  )} mm regional mean · ${rainfallStats.maxRainfallDay.rainfall_max_mm.toFixed(
                    2
                  )} mm max grid-cell rainfall.`
                : "Loading rainfall event intelligence."
            }
          />

          <AnalysisPanel
            eyebrow="Thermal Signal"
            title="Temperature Intelligence"
            metrics={[
              {
                label: "Annual TMEAN",
                value: temperatureSummary
                  ? `${temperatureSummary.annual_tmean_mean_c.toFixed(2)} °C`
                  : "Loading",
              },
              {
                label: "Annual TMAX",
                value: temperatureSummary
                  ? `${temperatureSummary.annual_tmax_mean_c.toFixed(2)} °C`
                  : "Loading",
              },
              {
                label: "Hot Days",
                value: temperatureSummary
                  ? temperatureSummary.hot_days.toString()
                  : "Loading",
              },
              {
                label: "Warm Nights",
                value: temperatureSummary
                  ? temperatureSummary.warm_nights.toString()
                  : "Loading",
              },
            ]}
            text={
              temperatureSummary
                ? `Peak heat day: ${
                    temperatureSummary.peak_tmax_day
                  } · ${temperatureSummary.peak_tmax_mean_c.toFixed(
                    2
                  )} °C regional mean TMAX. Coldest night: ${
                    temperatureSummary.coldest_tmin_day
                  } · ${temperatureSummary.coldest_tmin_mean_c.toFixed(
                    2
                  )} °C regional mean TMIN.`
                : "Loading temperature intelligence."
            }
          />
        </section>

        {seasonalRainfallSummary.length > 0 && (
          <section style={darkPanelStyle}>
            <div style={panelHeadingRowStyle}>
              <div>
                <p style={analysisEyebrowStyle}>Seasonal Distribution</p>
                <h2 style={analysisTitleStyle}>
                  Seasonal Rainfall Intelligence
                </h2>
              </div>

              {dominantSeason && (
                <p style={statusPillStyle}>
                  Dominant: {formatSeason(dominantSeason.season)} ·{" "}
                  {dominantSeason.season_share_of_annual_rainfall_percent.toFixed(
                    2
                  )}
                  %
                </p>
              )}
            </div>

            <div style={seasonGridStyle}>
              {seasonalRainfallSummary.map((season) => (
                <article
                  key={season.season}
                  style={{
                    ...seasonCardStyle,
                    border:
                      season.season === dominantSeason?.season
                        ? "1px solid rgba(34,197,94,0.65)"
                        : "1px solid rgba(148,163,184,0.22)",
                    background:
                      season.season === dominantSeason?.season
                        ? "linear-gradient(135deg, rgba(22,101,52,0.48), rgba(15,23,42,0.76))"
                        : "rgba(15,23,42,0.72)",
                  }}
                >
                  <p style={seasonLabelStyle}>{formatSeason(season.season)}</p>
                  <p style={seasonValueStyle}>
                    {season.total_rainfall_mm.toFixed(1)} mm
                  </p>
                  <p style={seasonHelperStyle}>
                    {season.season_share_of_annual_rainfall_percent.toFixed(2)}%
                    annual share · {season.day_count} days
                  </p>
                  <p style={seasonMetaStyle}>
                    Mean {season.mean_rainfall_mm.toFixed(2)} mm/day · Wet{" "}
                    {season.wet_days} · Dry {season.dry_days} · Extreme{" "}
                    {season.extreme_days}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {climateInterpretation && (
          <section style={darkPanelStyle}>
            <p style={analysisEyebrowStyle}>Cross-variable Climate State</p>
            <h2 style={analysisTitleStyle}>Climate State Interpretation</h2>

            <p style={analysisTextStyle}>
              Assam’s 2025 climate signal is rainfall-dominated during the{" "}
              <strong>{climateInterpretation.dominantRainfallSeason}</strong>,
              while the strongest heat signal appears around{" "}
              <strong>{climateInterpretation.peakHeatDate}</strong>.
            </p>

            <div style={interpretationGridStyle}>
              <InterpretationCard
                title="Rainfall regime"
                text={`${climateInterpretation.dominantRainfallSeason} contributed ${climateInterpretation.dominantRainfallShare.toFixed(
                  2
                )}% of annual rainfall.`}
              />
              <InterpretationCard
                title="Peak rainfall event"
                text={`${climateInterpretation.peakRainfallDate} recorded ${climateInterpretation.peakRainfallAmount.toFixed(
                  2
                )} mm regional mean rainfall during ${climateInterpretation.peakRainfallSeason}.`}
              />
              <InterpretationCard
                title="Heat signal"
                text={`${climateInterpretation.peakHeatDate} reached ${climateInterpretation.peakHeatValue.toFixed(
                  2
                )} °C regional mean TMAX. Warmest month: ${
                  climateInterpretation.peakHeatMonth
                }.`}
              />
              <InterpretationCard
                title="Day-night contrast"
                text={`${climateInterpretation.lowestDtrMonth} had the lowest mean DTR at ${climateInterpretation.lowestDtrValue.toFixed(
                  2
                )} °C.`}
              />
            </div>
          </section>
        )}

        <section style={chartStackStyle}>
          <div style={chartShellStyle}>
            <RainfallLineChart data={rainfall} anomalies={rainfallAnomalies} />
          </div>

          <div style={chartShellStyle}>
            <MonthlyRainfallBarChart data={monthlyRainfall} />
          </div>

          <div style={chartShellStyle}>
            <MonthlyTemperatureChart data={monthlyTemperature} />
          </div>
        </section>

        <section style={systemPanelStyle}>
          <p style={analysisEyebrowStyle}>ClimateTwin V1 System Status</p>

          <h2 style={analysisTitleStyle}>
            Real Data Engineering + Geospatial Climate Intelligence Pipeline
          </h2>

          <p style={analysisTextStyle}>
            This build is not a weather API wrapper. It ingests real gridded IMD
            rainfall and temperature datasets, converts and processes raw climate
            files, clips them to the Assam boundary, derives analytical
            summaries, exposes backend APIs, and visualizes spatial climate
            layers through an interactive MapLibre dashboard.
          </p>

          <div style={systemGridStyle}>
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
                "Smooth canvas climate overlay",
                "Rainfall/temperature switch",
                "Popups and dynamic legends",
              ]}
            />
          </div>

          <div style={backendFooterStyle}>
            Backend: <strong>{health?.status ?? "loading"}</strong>
            {health && <> · {health.application} · {health.version}</>}
          </div>
        </section>
      </section>
    </main>
  );
}

interface AnalysisPanelProps {
  eyebrow: string;
  title: string;
  metrics: { label: string; value: string }[];
  text: string;
}

function AnalysisPanel({ eyebrow, title, metrics, text }: AnalysisPanelProps) {
  return (
    <article style={analysisCardStyle}>
      <p style={analysisEyebrowStyle}>{eyebrow}</p>
      <h2 style={analysisTitleStyle}>{title}</h2>

      <div style={miniMetricGridStyle}>
        {metrics.map((metric) => (
          <MiniMetric
            key={`${title}-${metric.label}`}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>

      <p style={analysisTextStyle}>{text}</p>
    </article>
  );
}

interface MiniMetricProps {
  label: string;
  value: string;
}

function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <article style={miniMetricStyle}>
      <p style={miniMetricLabelStyle}>{label}</p>
      <p style={miniMetricValueStyle}>{value}</p>
    </article>
  );
}

interface SystemStatusCardProps {
  title: string;
  items: string[];
}

function SystemStatusCard({ title, items }: SystemStatusCardProps) {
  return (
    <article style={systemStatusCardStyle}>
      <h3 style={systemStatusTitleStyle}>{title}</h3>

      <div style={{ display: "grid", gap: "7px" }}>
        {items.map((item) => (
          <p key={`${title}-${item}`} style={systemStatusItemStyle}>
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
    <article style={interpretationCardStyle}>
      <h3 style={interpretationTitleStyle}>{title}</h3>
      <p style={interpretationTextStyle}>{text}</p>
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

function easeInOutCubic(progress: number): number {
  const clampedProgress = Math.max(0, Math.min(progress, 1));

  return clampedProgress < 0.5
    ? 4 * clampedProgress * clampedProgress * clampedProgress
    : 1 - Math.pow(-2 * clampedProgress + 2, 3) / 2;
}

function clampDateStringToRange(
  dateValue: string,
  startDate: string,
  endDate: string
): string {
  if (dateValue < startDate) {
    return startDate;
  }

  if (dateValue > endDate) {
    return endDate;
  }

  return dateValue;
}

function formatSeason(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const routeMapPreparingStyle = {
  minHeight: "620px",
  marginBottom: "28px",
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: "22px",
  background: "rgba(8, 15, 30, 0.82)",
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.04em",
} as const;

const errorStyle = {
  marginBottom: "24px",
  background: "rgba(127, 29, 29, 0.9)",
  border: "1px solid rgba(248,113,113,0.55)",
  color: "#ffffff",
  borderRadius: "16px",
  padding: "18px 20px",
  fontWeight: 800,
} as const;

const analysisGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "18px",
  marginBottom: "22px",
} as const;

const analysisCardStyle = {
  background: "rgba(15, 23, 42, 0.84)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 22px 60px rgba(2, 6, 23, 0.42)",
} as const;

const darkPanelStyle = {
  background: "rgba(15, 23, 42, 0.84)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: "22px",
  padding: "20px",
  marginBottom: "22px",
  boxShadow: "0 22px 60px rgba(2, 6, 23, 0.42)",
} as const;

const systemPanelStyle = {
  ...darkPanelStyle,
  marginBottom: 0,
} as const;

const analysisEyebrowStyle = {
  margin: "0 0 8px",
  color: "#38bdf8",
  fontSize: "12px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
} as const;

const analysisTitleStyle = {
  margin: "0 0 14px",
  color: "#f9fafb",
  fontSize: "24px",
  fontWeight: 950,
} as const;

const analysisTextStyle = {
  margin: "14px 0 0",
  color: "#cbd5e1",
  fontSize: "14px",
  lineHeight: 1.75,
  fontWeight: 600,
} as const;

const miniMetricGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
} as const;

const miniMetricStyle = {
  background: "rgba(2, 6, 23, 0.5)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "14px",
  padding: "12px",
} as const;

const miniMetricLabelStyle = {
  margin: "0 0 6px",
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
} as const;

const miniMetricValueStyle = {
  margin: 0,
  color: "#f9fafb",
  fontSize: "20px",
  fontWeight: 950,
} as const;

const panelHeadingRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  alignItems: "flex-start",
  marginBottom: "16px",
} as const;

const statusPillStyle = {
  margin: 0,
  color: "#f9fafb",
  background: "rgba(34,197,94,0.16)",
  border: "1px solid rgba(34,197,94,0.42)",
  borderRadius: "999px",
  padding: "9px 12px",
  fontSize: "12px",
  fontWeight: 900,
} as const;

const seasonGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px",
} as const;

const seasonCardStyle = {
  borderRadius: "16px",
  padding: "16px",
} as const;

const seasonLabelStyle = {
  margin: "0 0 8px",
  color: "#cbd5e1",
  fontSize: "12px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
} as const;

const seasonValueStyle = {
  margin: 0,
  color: "#f9fafb",
  fontSize: "24px",
  fontWeight: 950,
} as const;

const seasonHelperStyle = {
  margin: "7px 0 0",
  color: "#cbd5e1",
  fontSize: "13px",
  lineHeight: 1.45,
  fontWeight: 700,
} as const;

const seasonMetaStyle = {
  margin: "10px 0 0",
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 700,
} as const;

const interpretationGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px",
  marginTop: "18px",
} as const;

const interpretationCardStyle = {
  background: "rgba(2, 6, 23, 0.5)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "16px",
  padding: "15px",
} as const;

const interpretationTitleStyle = {
  margin: "0 0 8px",
  color: "#f9fafb",
  fontSize: "14px",
  fontWeight: 950,
} as const;

const interpretationTextStyle = {
  margin: 0,
  color: "#cbd5e1",
  fontSize: "13px",
  lineHeight: 1.65,
  fontWeight: 600,
} as const;

const chartStackStyle = {
  display: "grid",
  gap: "22px",
  marginBottom: "22px",
} as const;

const chartShellStyle = {
  background: "transparent",
  borderRadius: "22px",
  overflow: "visible",
} as const;

const systemGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px",
  marginTop: "18px",
} as const;

const systemStatusCardStyle = {
  background: "rgba(2, 6, 23, 0.5)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "16px",
  padding: "16px",
} as const;

const systemStatusTitleStyle = {
  margin: "0 0 10px",
  color: "#f9fafb",
  fontSize: "15px",
  fontWeight: 950,
} as const;

const systemStatusItemStyle = {
  margin: 0,
  color: "#cbd5e1",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 700,
} as const;

const backendFooterStyle = {
  marginTop: "16px",
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: 800,
} as const;

export default LivePage;