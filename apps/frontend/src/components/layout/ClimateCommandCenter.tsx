import { ClimateMap } from "../map/ClimateMap";

import type {
  DailyRainfallAnomaly,
  DailyRainfallSummary,
  RainfallFieldResponse,
  RainfallMetadataResponse,
  TemperatureFieldResponse,
  TemperatureMetadataResponse,
  RainfallScenarioResponse,
  ScenarioComparisonMode,
} from "../../services/api";

type ClimateLayer = "rainfall" | "TMEAN" | "TMAX" | "TMIN";

interface ClimateCommandCenterProps {
  activeClimateLayer: ClimateLayer;
  rainfallField: RainfallFieldResponse | null;
  temperatureField: TemperatureFieldResponse | null;
  rainfallMetadata: RainfallMetadataResponse | null;
  temperatureMetadata: TemperatureMetadataResponse | null;
  selectedRainfallAnomaly: DailyRainfallAnomaly | null;
  rainfallStats: {
    totalRainfall: number;
    wetDays: number;
    maxRainfallDay: DailyRainfallSummary | null;
  };
  currentSequenceIndex: number;
  fieldSequenceLength: number;
  selectedFieldDate: string;
  selectedTemperatureDate: string;
  sequenceStartDate: string;
  sequenceEndDate: string;
  isFieldLoading: boolean;
  isTemperatureFieldLoading: boolean;
  isSequenceLoading: boolean;
  isPlayingFieldAnimation: boolean;
  onClimateLayerChange: (layer: ClimateLayer) => void;
  onTemperatureDateChange: (dateValue: string) => void;
  onLoadTemperatureField: () => void;
  onSequenceStartDateChange: (dateValue: string) => void;
  onSequenceEndDateChange: (dateValue: string) => void;
  onLoadSequence: () => void;
  onShowPeakRainfallDay: () => void;
  onLoadPeakRainfallSequence: () => void;
  onPreviousSequenceFrame: () => void;
  onNextSequenceFrame: () => void;
  onToggleRainfallAnimation: () => void;
  onSingleRainfallDateChange: (dateValue: string) => void;
  rainfallScenarioResult: RainfallScenarioResponse | null;
  simulationComparisonMode: ScenarioComparisonMode;
  simulationProgress: number;
  isSimulationPlaying: boolean;
  onReplayRainfallSimulation: () => void;
}

export function ClimateCommandCenter({
  activeClimateLayer,
  rainfallField,
  temperatureField,
  rainfallMetadata,
  temperatureMetadata,
  selectedRainfallAnomaly,
  rainfallStats,
  currentSequenceIndex,
  fieldSequenceLength,
  selectedFieldDate,
  selectedTemperatureDate,
  sequenceStartDate,
  sequenceEndDate,
  isFieldLoading,
  isTemperatureFieldLoading,
  isSequenceLoading,
  isPlayingFieldAnimation,
  onClimateLayerChange,
  onTemperatureDateChange,
  onLoadTemperatureField,
  onSequenceStartDateChange,
  onSequenceEndDateChange,
  onLoadSequence,
  onShowPeakRainfallDay,
  onLoadPeakRainfallSequence,
  onPreviousSequenceFrame,
  onNextSequenceFrame,
  onToggleRainfallAnimation,
  onSingleRainfallDateChange,
  rainfallScenarioResult,
  simulationComparisonMode,
  simulationProgress,
  isSimulationPlaying,
  onReplayRainfallSimulation,
}: ClimateCommandCenterProps) {
  const activeLayerLabel =
    activeClimateLayer === "rainfall" ? "Rainfall" : activeClimateLayer;

  return (
    <section style={commandCenterShellStyle}>
      <div style={backgroundGlowStyle} />

      <div style={topBarStyle}>
        <div>
          <p style={eyebrowStyle}>ClimateTwin Assam</p>
          <h1 style={heroTitleStyle}>Live Climate Command Center</h1>
          <p style={heroSubtitleStyle}>
            Smooth boundary-clipped rainfall and temperature intelligence from
            real IMD gridded datasets.
          </p>
        </div>

        <div style={activeLayerPillStyle}>
          <span style={activeDotStyle} />
          Active Layer: {activeLayerLabel}
        </div>
      </div>

      <div style={metricStripStyle}>
        <HeroMetricCard
          label="Current Rainfall"
          value={
            rainfallField
              ? `${rainfallField.rainfall_mean_mm.toFixed(2)} mm`
              : "Loading"
          }
          helper={rainfallField ? rainfallField.date : "Daily field mean"}
        />

        <HeroMetricCard
          label="Temperature Field"
          value={
            temperatureField
              ? `${temperatureField.temperature_mean_c.toFixed(2)} °C`
              : "Loading"
          }
          helper={
            temperatureField
              ? `${temperatureField.variable} · ${temperatureField.date}`
              : "Selected layer mean"
          }
        />

        <HeroMetricCard
          label="Wet Days"
          value={rainfallStats.wetDays.toString()}
          helper="Regional mean rainfall > 1 mm"
        />

        <HeroMetricCard
          label="Coverage"
          value={
            rainfallMetadata
              ? `${rainfallMetadata.start_date} → ${rainfallMetadata.end_date}`
              : "Loading"
          }
          helper={
            rainfallMetadata
              ? `${rainfallMetadata.day_count} days · clipped`
              : "Dataset range"
          }
        />
      </div>

      <div style={mapStageStyle}>
        <div style={mapWrapperStyle}>
          {isFieldLoading ? (
            <div style={mapLoadingStyle}>Loading spatial rainfall field...</div>
          ) : (
            <ClimateMap
              rainfallData={rainfallField}
              temperatureData={temperatureField}
              activeLayer={activeClimateLayer}
              rainfallScenarioResult={rainfallScenarioResult}
              simulationComparisonMode={simulationComparisonMode}
              simulationProgress={simulationProgress}
            />
          )}
        </div>

        <div style={leftPanelStyle}>
          <p style={panelEyebrowStyle}>Observe · Understand · Simulate</p>
          <h2 style={panelTitleStyle}>Assam Climate State</h2>

          {activeClimateLayer === "rainfall" && rainfallField && (
            <div style={panelBodyStyle}>
              <InfoRow label="Rainfall Date" value={rainfallField.date} />
              <InfoRow
                label="Regional Mean"
                value={`${rainfallField.rainfall_mean_mm.toFixed(2)} mm`}
              />
              <InfoRow
                label="Grid Range"
                value={`${rainfallField.rainfall_min_mm.toFixed(
                  2
                )}–${rainfallField.rainfall_max_mm.toFixed(2)} mm`}
              />
              <InfoRow label="Valid Cells" value={rainfallField.cell_count.toString()} />

              {selectedRainfallAnomaly && (
                <>
                  <div style={panelDividerStyle} />
                  <InfoRow
                    label="Intensity"
                    value={formatRainfallClass(
                      selectedRainfallAnomaly.rainfall_intensity_class
                    )}
                  />
                  <InfoRow
                    label="Anomaly"
                    value={`${selectedRainfallAnomaly.rainfall_anomaly_from_annual_mean_mm.toFixed(
                      2
                    )} mm`}
                  />
                  <InfoRow
                    label="Percentile"
                    value={`${selectedRainfallAnomaly.rainfall_percentile.toFixed(
                      2
                    )}`}
                  />
                  <InfoRow
                    label="Season"
                    value={formatSeason(selectedRainfallAnomaly.season)}
                  />
                </>
              )}
            </div>
          )}

          {activeClimateLayer !== "rainfall" && temperatureField && (
            <div style={panelBodyStyle}>
              <InfoRow label="Variable" value={temperatureField.variable} />
              <InfoRow label="Date" value={temperatureField.date} />
              <InfoRow
                label="Regional Mean"
                value={`${temperatureField.temperature_mean_c.toFixed(2)} °C`}
              />
              <InfoRow
                label="Grid Range"
                value={`${temperatureField.temperature_min_c.toFixed(
                  2
                )}–${temperatureField.temperature_max_c.toFixed(2)} °C`}
              />
              <InfoRow
                label="Valid Cells"
                value={temperatureField.cell_count.toString()}
              />
            </div>
          )}
        </div>

        <div style={rightPanelStyle}>
          <p style={panelEyebrowStyle}>Layers</p>
          <h3 style={sidePanelTitleStyle}>Climate Layers</h3>

          <div style={layerButtonStackStyle}>
            <button
              type="button"
              onClick={() => onClimateLayerChange("rainfall")}
              style={getVerticalLayerButtonStyle(
                activeClimateLayer === "rainfall"
              )}
            >
              Rainfall
            </button>

            <button
              type="button"
              onClick={() => onClimateLayerChange("TMEAN")}
              disabled={isTemperatureFieldLoading}
              style={getVerticalLayerButtonStyle(activeClimateLayer === "TMEAN")}
            >
              TMEAN
            </button>

            <button
              type="button"
              onClick={() => onClimateLayerChange("TMAX")}
              disabled={isTemperatureFieldLoading}
              style={getVerticalLayerButtonStyle(activeClimateLayer === "TMAX")}
            >
              TMAX
            </button>

            <button
              type="button"
              onClick={() => onClimateLayerChange("TMIN")}
              disabled={isTemperatureFieldLoading}
              style={getVerticalLayerButtonStyle(activeClimateLayer === "TMIN")}
            >
              TMIN
            </button>
          </div>

          <div style={panelDividerStyle} />

          <label style={darkLabelStyle}>
            Temperature date
            <input
              type="date"
              value={selectedTemperatureDate}
              min={temperatureMetadata?.start_date}
              max={temperatureMetadata?.end_date}
              onChange={(event) => onTemperatureDateChange(event.target.value)}
              style={darkInputStyle}
            />
          </label>

          <button
            type="button"
            onClick={onLoadTemperatureField}
            disabled={isTemperatureFieldLoading}
            style={dangerButtonStyle}
          >
            {isTemperatureFieldLoading ? "Loading..." : "Load temperature"}
          </button>
        </div>

        {rainfallScenarioResult && activeClimateLayer === "rainfall" && (
          <div style={scenarioProgressStyle}>
            <div>
              <p style={scenarioProgressLabelStyle}>Scenario progression</p>
              <p style={scenarioProgressValueStyle}>
                {Math.round(simulationProgress * 100)}% · {simulationComparisonMode}
              </p>
            </div>

            <div style={scenarioProgressTrackStyle}>
              <div
                style={{
                  ...scenarioProgressFillStyle,
                  width: `${Math.round(simulationProgress * 100)}%`,
                }}
              />
            </div>

            <button
              type="button"
              onClick={onReplayRainfallSimulation}
              disabled={isSimulationPlaying}
              style={scenarioReplayButtonStyle}
            >
              {isSimulationPlaying ? "Animating" : "Replay"}
            </button>
          </div>
        )}

        <div style={bottomTimelineStyle}>
          <div style={timelineLeftStyle}>
            <p style={timelineTitleStyle}>Rainfall Timeline</p>
            <p style={timelineMetaStyle}>
              {fieldSequenceLength > 0 && currentSequenceIndex >= 0
                ? `Frame ${currentSequenceIndex + 1} / ${fieldSequenceLength}`
                : "Load sequence to animate rainfall field"}
            </p>
          </div>

          <label style={compactLabelStyle}>
            Start
            <input
              type="date"
              value={sequenceStartDate}
              min={rainfallMetadata?.start_date}
              max={rainfallMetadata?.end_date}
              onChange={(event) => onSequenceStartDateChange(event.target.value)}
              style={compactInputStyle}
            />
          </label>

          <label style={compactLabelStyle}>
            End
            <input
              type="date"
              value={sequenceEndDate}
              min={rainfallMetadata?.start_date}
              max={rainfallMetadata?.end_date}
              onChange={(event) => onSequenceEndDateChange(event.target.value)}
              style={compactInputStyle}
            />
          </label>

          <button
            type="button"
            onClick={onLoadSequence}
            disabled={isSequenceLoading}
            style={timelineButtonStyle}
          >
            {isSequenceLoading ? "Loading..." : "Load"}
          </button>

          <button
            type="button"
            onClick={onShowPeakRainfallDay}
            disabled={!rainfallStats.maxRainfallDay || isFieldLoading}
            style={timelineButtonStyle}
          >
            Peak Day
          </button>

          <button
            type="button"
            onClick={onLoadPeakRainfallSequence}
            style={greenTimelineButtonStyle}
          >
            Peak Seq
          </button>

          <button
            type="button"
            onClick={onPreviousSequenceFrame}
            disabled={fieldSequenceLength === 0}
            style={timelineButtonStyle}
          >
            Prev
          </button>

          <button
            type="button"
            onClick={onNextSequenceFrame}
            disabled={fieldSequenceLength === 0}
            style={timelineButtonStyle}
          >
            Next
          </button>

          <button
            type="button"
            onClick={onToggleRainfallAnimation}
            disabled={fieldSequenceLength === 0}
            style={{
              ...playButtonStyle,
              background: isPlayingFieldAnimation ? "#dc2626" : "#2563eb",
            }}
          >
            {isPlayingFieldAnimation ? "Pause" : "Play"}
          </button>

          <label style={compactLabelStyle}>
            Single
            <input
              type="date"
              value={selectedFieldDate}
              min={rainfallMetadata?.start_date}
              max={rainfallMetadata?.end_date}
              onChange={(event) => onSingleRainfallDateChange(event.target.value)}
              style={compactInputStyle}
            />
          </label>
        </div>
      </div>
    </section>
  );
}

interface HeroMetricCardProps {
  label: string;
  value: string;
  helper: string;
}

function HeroMetricCard({ label, value, helper }: HeroMetricCardProps) {
  return (
    <article style={heroMetricCardStyle}>
      <p style={heroMetricLabelStyle}>{label}</p>
      <p style={heroMetricValueStyle}>{value}</p>
      <p style={heroMetricHelperStyle}>{helper}</p>
    </article>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={infoValueStyle}>{value}</span>
    </div>
  );
}

const scenarioProgressStyle = {
  position: "absolute",
  left: "50%",
  bottom: "96px",
  transform: "translateX(-50%)",
  zIndex: 9,
  width: "min(620px, calc(100% - 580px))",
  minWidth: "360px",
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: "14px",
  padding: "11px 14px",
  borderRadius: "12px",
  background: "rgba(8, 15, 30, 0.86)",
  border: "1px solid rgba(236, 106, 6, 0.42)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 18px 44px rgba(2, 6, 23, 0.5)",
} as const;

const scenarioProgressLabelStyle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.09em",
} as const;

const scenarioProgressValueStyle = {
  margin: "3px 0 0",
  color: "#f97316",
  fontSize: "12px",
  fontWeight: 950,
  textTransform: "capitalize",
} as const;

const scenarioProgressTrackStyle = {
  height: "5px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "rgba(71, 85, 105, 0.7)",
} as const;

const scenarioProgressFillStyle = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #22d3ee, #f97316)",
  boxShadow: "0 0 12px rgba(249, 115, 22, 0.55)",
  transition: "width 40ms linear",
} as const;

const scenarioReplayButtonStyle = {
  border: "1px solid rgba(249, 115, 22, 0.55)",
  borderRadius: "8px",
  background: "rgba(249, 115, 22, 0.14)",
  color: "#fdba74",
  padding: "7px 11px",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
} as const;

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

function getVerticalLayerButtonStyle(isActive: boolean) {
  return {
    width: "100%",
    padding: "11px 12px",
    borderRadius: "999px",
    border: isActive
      ? "1px solid rgba(56, 189, 248, 0.85)"
      : "1px solid rgba(148, 163, 184, 0.28)",
    background: isActive
      ? "linear-gradient(135deg, rgba(14,165,233,0.95), rgba(37,99,235,0.95))"
      : "rgba(15, 23, 42, 0.72)",
    color: "#f9fafb",
    cursor: "pointer",
    fontWeight: 900,
    letterSpacing: "0.02em",
    boxShadow: isActive ? "0 12px 30px rgba(14,165,233,0.28)" : "none",
  } as const;
}

const commandCenterShellStyle = {
  position: "relative",
  width: "100%",
  minHeight: "calc(100vh - 24px)",
  borderRadius: "22px",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 18% 18%, rgba(14,165,233,0.20), transparent 34%), radial-gradient(circle at 84% 14%, rgba(249,115,22,0.18), transparent 30%), #020617",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  boxShadow: "0 30px 90px rgba(2, 6, 23, 0.65)",
  padding: "18px",
  marginBottom: "28px",
} as const;

const backgroundGlowStyle = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.88), rgba(2,6,23,0.96))",
  pointerEvents: "none",
} as const;

const topBarStyle = {
  position: "relative",
  zIndex: 5,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "14px",
} as const;

const eyebrowStyle = {
  margin: "0 0 8px",
  color: "#38bdf8",
  fontSize: "12px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
} as const;

const heroTitleStyle = {
  margin: 0,
  color: "#f9fafb",
  fontSize: "36px",
  lineHeight: 1.05,
  fontWeight: 950,
} as const;

const heroSubtitleStyle = {
  margin: "10px 0 0",
  maxWidth: "760px",
  color: "#cbd5e1",
  fontSize: "15px",
  lineHeight: 1.55,
} as const;

const activeLayerPillStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 13px",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.3)",
  color: "#f9fafb",
  fontSize: "13px",
  fontWeight: 900,
  backdropFilter: "blur(14px)",
} as const;

const activeDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  background: "#22c55e",
  boxShadow: "0 0 16px rgba(34,197,94,0.9)",
} as const;

const metricStripStyle = {
  position: "relative",
  zIndex: 5,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "12px",
} as const;

const heroMetricCardStyle = {
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  borderRadius: "18px",
  padding: "14px",
  backdropFilter: "blur(16px)",
} as const;

const heroMetricLabelStyle = {
  margin: "0 0 7px",
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
} as const;

const heroMetricValueStyle = {
  margin: 0,
  color: "#f9fafb",
  fontSize: "21px",
  fontWeight: 950,
  lineHeight: 1.2,
} as const;

const heroMetricHelperStyle = {
  margin: "6px 0 0",
  color: "#cbd5e1",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 700,
} as const;

const mapStageStyle = {
  position: "relative",
  zIndex: 4,
  height: "calc(100vh - 245px)",
  minHeight: "620px",
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "#020617",
} as const;

const mapWrapperStyle = {
  position: "absolute",
  inset: 0,
} as const;

const mapLoadingStyle = {
  width: "100%",
  height: "100%",
  display: "grid",
  placeItems: "center",
  color: "#f9fafb",
  background: "#020617",
  fontWeight: 900,
} as const;

const leftPanelStyle = {
  position: "absolute",
  left: "18px",
  top: "18px",
  zIndex: 8,
  width: "300px",
  background: "rgba(15, 23, 42, 0.82)",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  borderRadius: "18px",
  padding: "16px",
  color: "#f9fafb",
  backdropFilter: "blur(16px)",
  boxShadow: "0 18px 50px rgba(2, 6, 23, 0.45)",
} as const;

const rightPanelStyle = {
  position: "absolute",
  right: "18px",
  top: "18px",
  zIndex: 8,
  width: "210px",
  background: "rgba(15, 23, 42, 0.82)",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  borderRadius: "18px",
  padding: "16px",
  color: "#f9fafb",
  backdropFilter: "blur(16px)",
  boxShadow: "0 18px 50px rgba(2, 6, 23, 0.45)",
} as const;

const panelEyebrowStyle = {
  margin: "0 0 7px",
  color: "#38bdf8",
  fontSize: "11px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
} as const;

const panelTitleStyle = {
  margin: "0 0 14px",
  color: "#f9fafb",
  fontSize: "21px",
  fontWeight: 950,
} as const;

const sidePanelTitleStyle = {
  margin: "0 0 12px",
  color: "#f9fafb",
  fontSize: "17px",
  fontWeight: 950,
} as const;

const panelBodyStyle = {
  display: "grid",
  gap: "9px",
} as const;

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 0",
  borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
} as const;

const infoLabelStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 800,
} as const;

const infoValueStyle = {
  color: "#f9fafb",
  fontSize: "12px",
  fontWeight: 900,
  textAlign: "right",
} as const;

const panelDividerStyle = {
  height: "1px",
  background: "rgba(148, 163, 184, 0.24)",
  margin: "6px 0",
} as const;

const layerButtonStackStyle = {
  display: "grid",
  gap: "9px",
} as const;

const darkLabelStyle = {
  display: "grid",
  gap: "6px",
  color: "#cbd5e1",
  fontSize: "12px",
  fontWeight: 900,
  marginBottom: "10px",
} as const;

const darkInputStyle = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(15, 23, 42, 0.85)",
  color: "#f9fafb",
  fontWeight: 800,
} as const;

const dangerButtonStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(248,113,113,0.65)",
  background: "linear-gradient(135deg, #991b1b, #7f1d1d)",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 900,
} as const;

const bottomTimelineStyle = {
  position: "absolute",
  left: "18px",
  right: "18px",
  bottom: "18px",
  zIndex: 8,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "end",
  gap: "10px",
  background: "rgba(15, 23, 42, 0.84)",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  borderRadius: "18px",
  padding: "13px",
  backdropFilter: "blur(16px)",
  boxShadow: "0 18px 50px rgba(2, 6, 23, 0.45)",
} as const;

const timelineLeftStyle = {
  minWidth: "190px",
  marginRight: "4px",
} as const;

const timelineTitleStyle = {
  margin: 0,
  color: "#f9fafb",
  fontSize: "14px",
  fontWeight: 950,
} as const;

const timelineMetaStyle = {
  margin: "5px 0 0",
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 800,
} as const;

const compactLabelStyle = {
  display: "grid",
  gap: "5px",
  color: "#cbd5e1",
  fontSize: "11px",
  fontWeight: 900,
} as const;

const compactInputStyle = {
  width: "125px",
  padding: "9px 10px",
  borderRadius: "11px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(15, 23, 42, 0.9)",
  color: "#f9fafb",
  fontWeight: 800,
} as const;

const timelineButtonStyle = {
  padding: "10px 12px",
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(15, 23, 42, 0.9)",
  color: "#f9fafb",
  cursor: "pointer",
  fontWeight: 900,
} as const;

const greenTimelineButtonStyle = {
  ...timelineButtonStyle,
  border: "1px solid rgba(16,185,129,0.55)",
  background: "linear-gradient(135deg, #047857, #065f46)",
} as const;

const playButtonStyle = {
  padding: "10px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(96,165,250,0.6)",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 950,
} as const;