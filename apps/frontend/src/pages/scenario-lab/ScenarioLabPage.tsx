import { useEffect, useRef, useState } from "react";

import { ClimateMap } from "../../components/map/ClimateMap";
import SimulationControlPanel from "../../components/simulation/SimulationControlPanel";
import {
  getAssamRainfallField,
  runAssamRainfallScenario,
  type RainfallFieldResponse,
  type RainfallScenarioResponse,
  type ScenarioComparisonMode,
} from "../../services/api";

const DEFAULT_DATE = "2025-05-31";

export default function ScenarioLabPage() {
  const [rainfallField, setRainfallField] =
    useState<RainfallFieldResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);
  const [rainfallChangePercent, setRainfallChangePercent] = useState(30);
  const [comparisonMode, setComparisonMode] =
    useState<ScenarioComparisonMode>("original");
  const [result, setResult] = useState<RainfallScenarioResponse | null>(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [isSimulationPlaying, setIsSimulationPlaying] = useState(false);
  const [isLoadingField, setIsLoadingField] = useState(true);
  const [isSimulationLoading, setIsSimulationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    void loadRainfallField(DEFAULT_DATE);
  }, []);

  useEffect(() => {
    if (!isSimulationPlaying || !result) {
      return;
    }

    const durationMs = 4800;
    const startedAt = performance.now();

    function animate(now: number) {
      const linearProgress = Math.min((now - startedAt) / durationMs, 1);
      setSimulationProgress(easeInOutCubic(linearProgress));

      if (linearProgress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        setIsSimulationPlaying(false);
      }
    }

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isSimulationPlaying, result]);

  async function loadRainfallField(date: string) {
    try {
      setError(null);
      setIsLoadingField(true);
      const field = await getAssamRainfallField(date);
      setRainfallField(field);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load the rainfall field.",
      );
    } finally {
      setIsLoadingField(false);
    }
  }

  async function handleDateChange(date: string) {
    setSelectedDate(date);
    setResult(null);
    setComparisonMode("original");
    setSimulationProgress(0);
    setIsSimulationPlaying(false);
    await loadRainfallField(date);
  }

  async function handleRunSimulation() {
    try {
      setError(null);
      setIsSimulationLoading(true);

      const scenario = await runAssamRainfallScenario({
        selected_date: selectedDate,
        rainfall_change_percent: rainfallChangePercent,
      });

      setResult(scenario);
      setComparisonMode("simulated");
      setSimulationProgress(0);
      setIsSimulationPlaying(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to run the rainfall scenario.",
      );
    } finally {
      setIsSimulationLoading(false);
    }
  }

  function handleResetSimulation() {
    setResult(null);
    setComparisonMode("original");
    setSimulationProgress(0);
    setIsSimulationPlaying(false);
    setRainfallChangePercent(30);
    setError(null);
  }

  function handleReplay() {
    if (!result) {
      return;
    }

    setComparisonMode("simulated");
    setSimulationProgress(0);
    setIsSimulationPlaying(true);
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Predict · Perturb · Compare</p>
          <h1 style={titleStyle}>Scenario Lab</h1>
          <p style={subtitleStyle}>
            Dedicated spatial workspace for controlled rainfall experiments.
            Predictive future-temperature modelling will be added as the next
            simulation engine.
          </p>
        </div>

        <div style={modePillStyle}>What-if engine · Rainfall V1</div>
      </section>

      <section style={workspaceStyle}>
        <aside style={controlsStyle}>
          <SimulationControlPanel
            selectedDate={selectedDate}
            rainfallChangePercent={rainfallChangePercent}
            comparisonMode={comparisonMode}
            result={result}
            isLoading={isSimulationLoading}
            error={error}
            onDateChange={(date) => {
              void handleDateChange(date);
            }}
            onRainfallChange={setRainfallChangePercent}
            onComparisonModeChange={setComparisonMode}
            onRunSimulation={() => {
              void handleRunSimulation();
            }}
            onResetSimulation={handleResetSimulation}
          />
        </aside>

        <section style={mapPanelStyle}>
          {isLoadingField ? (
            <div style={loadingStyle}>Loading Assam rainfall field...</div>
          ) : (
            <ClimateMap
              rainfallData={rainfallField}
              temperatureData={null}
              activeLayer="rainfall"
              rainfallScenarioResult={result}
              simulationComparisonMode={comparisonMode}
              simulationProgress={simulationProgress}
            />
          )}

          {result && (
            <div style={playbackStyle}>
              <div>
                <p style={playbackLabelStyle}>Scenario progression</p>
                <p style={playbackValueStyle}>
                  {Math.round(simulationProgress * 100)}% · {comparisonMode}
                </p>
              </div>

              <div style={trackStyle}>
                <div
                  style={{
                    ...fillStyle,
                    width: `${Math.round(simulationProgress * 100)}%`,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleReplay}
                disabled={isSimulationPlaying}
                style={replayButtonStyle}
              >
                {isSimulationPlaying ? "Animating" : "Replay"}
              </button>
            </div>
          )}
        </section>

        <aside style={intelligenceStyle}>
          <p style={panelEyebrowStyle}>Scenario Intelligence</p>
          <h2 style={panelTitleStyle}>Result Summary</h2>

          {result ? (
            <div style={summaryGridStyle}>
              <SummaryRow
                label="Selected date"
                value={result.selected_date}
              />
              <SummaryRow
                label="Adjustment"
                value={`${result.rainfall_change_percent > 0 ? "+" : ""}${result.rainfall_change_percent}%`}
              />
              <SummaryRow
                label="Original mean"
                value={`${result.statistics.original_mean_mm.toFixed(2)} mm`}
              />
              <SummaryRow
                label="Simulated mean"
                value={`${result.statistics.simulated_mean_mm.toFixed(2)} mm`}
              />
              <SummaryRow
                label="Mean difference"
                value={`${result.statistics.mean_difference_mm > 0 ? "+" : ""}${result.statistics.mean_difference_mm.toFixed(2)} mm`}
              />
              <SummaryRow
                label="Stress score"
                value={`${result.stress.score.toFixed(0)} / 100`}
              />
            </div>
          ) : (
            <p style={emptyTextStyle}>
              Configure a date and rainfall adjustment, then run a simulation to
              generate spatial comparison and stress intelligence.
            </p>
          )}
        </aside>
      </section>

      <section style={archiveStyle}>
        <div>
          <p style={panelEyebrowStyle}>Previous Simulations</p>
          <h2 style={archiveTitleStyle}>Saved Snapshot Archive</h2>
        </div>
        <p style={archiveTextStyle}>
          This section will store final map images, parameters, summary metrics
          and model versions without reopening the live interactive workspace.
        </p>
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryRowStyle}>
      <span style={summaryLabelStyle}>{label}</span>
      <span style={summaryValueStyle}>{value}</span>
    </div>
  );
}

function easeInOutCubic(progress: number): number {
  const clamped = Math.max(0, Math.min(progress, 1));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

const pageStyle = {
  minHeight: "calc(100vh - 74px)",
  padding: "14px",
  boxSizing: "border-box",
} as const;

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  marginBottom: "12px",
  padding: "4px 4px 0",
} as const;

const eyebrowStyle = {
  margin: "0 0 7px",
  color: "#f97316",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
} as const;

const titleStyle = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1,
  fontWeight: 950,
} as const;

const subtitleStyle = {
  maxWidth: "720px",
  margin: "9px 0 0",
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.55,
} as const;

const modePillStyle = {
  marginTop: "4px",
  padding: "9px 12px",
  border: "1px solid rgba(249, 115, 22, 0.32)",
  borderRadius: "8px",
  background: "rgba(249, 115, 22, 0.1)",
  color: "#fdba74",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
} as const;

const workspaceStyle = {
  height: "calc(100vh - 194px)",
  minHeight: "640px",
  display: "grid",
  gridTemplateColumns: "340px minmax(0, 1fr) 260px",
  gap: "12px",
} as const;

const controlsStyle = {
  minWidth: 0,
  overflowY: "auto",
  overflowX: "hidden",
} as const;

const mapPanelStyle = {
  position: "relative",
  minWidth: 0,
  overflow: "hidden",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: "14px",
  background: "#020617",
} as const;

const loadingStyle = {
  height: "100%",
  display: "grid",
  placeItems: "center",
  color: "#cbd5e1",
  fontWeight: 850,
} as const;

const intelligenceStyle = {
  minWidth: 0,
  padding: "15px",
  overflowY: "auto",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "14px",
  background: "rgba(8, 15, 30, 0.84)",
} as const;

const panelEyebrowStyle = {
  margin: "0 0 7px",
  color: "#22d3ee",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
} as const;

const panelTitleStyle = {
  margin: "0 0 16px",
  fontSize: "20px",
  fontWeight: 950,
} as const;

const summaryGridStyle = {
  display: "grid",
} as const;

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "11px 0",
  borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
} as const;

const summaryLabelStyle = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 800,
} as const;

const summaryValueStyle = {
  color: "#f8fafc",
  fontSize: "11px",
  fontWeight: 900,
  textAlign: "right",
} as const;

const emptyTextStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.7,
} as const;

const playbackStyle = {
  position: "absolute",
  left: "18px",
  right: "18px",
  bottom: "18px",
  zIndex: 8,
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: "13px",
  padding: "10px 12px",
  border: "1px solid rgba(249, 115, 22, 0.38)",
  borderRadius: "10px",
  background: "rgba(8, 15, 30, 0.88)",
  backdropFilter: "blur(14px)",
} as const;

const playbackLabelStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "9px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
} as const;

const playbackValueStyle = {
  margin: "3px 0 0",
  color: "#fb923c",
  fontSize: "11px",
  fontWeight: 950,
  textTransform: "capitalize",
} as const;

const trackStyle = {
  height: "5px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "rgba(71, 85, 105, 0.72)",
} as const;

const fillStyle = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #22d3ee, #f97316)",
} as const;

const replayButtonStyle = {
  padding: "7px 10px",
  border: "1px solid rgba(249, 115, 22, 0.5)",
  borderRadius: "7px",
  background: "rgba(249, 115, 22, 0.12)",
  color: "#fdba74",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
} as const;

const archiveStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  marginTop: "12px",
  padding: "15px 17px",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "12px",
  background: "rgba(8, 15, 30, 0.7)",
} as const;

const archiveTitleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 950,
} as const;

const archiveTextStyle = {
  maxWidth: "660px",
  margin: 0,
  color: "#64748b",
  fontSize: "11px",
  lineHeight: 1.6,
} as const;