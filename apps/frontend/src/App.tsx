import { useEffect, useMemo, useState } from "react";

import { MonthlyRainfallBarChart } from "./components/charts/MonthlyRainfallBarChart";
import { RainfallLineChart } from "./components/charts/RainfallLineChart";
import { RainfallFieldPreview } from "./components/map/RainfallFieldPreview";
import { RainfallMap } from "./components/map/RainfallMap";

import {
  getAssamDailyRainfallSummary,
  getAssamMonthlyRainfallSummary,
  getAssamRainfallField,
  getAssamRainfallFieldSequence,
  getAssamRainfallMetadata,
  getHealthStatus,
  type DailyRainfallSummary,
  type HealthResponse,
  type MonthlyRainfallSummary,
  type RainfallFieldResponse,
  type RainfallMetadataResponse,
} from "./services/api";


function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [rainfall, setRainfall] = useState<DailyRainfallSummary[]>([]);
  const [monthlyRainfall, setMonthlyRainfall] = useState<
    MonthlyRainfallSummary[]
  >([]);
  const [rainfallMetadata, setRainfallMetadata] =
    useState<RainfallMetadataResponse | null>(null);

  const [rainfallField, setRainfallField] =
    useState<RainfallFieldResponse | null>(null);
  const [fieldSequence, setFieldSequence] = useState<RainfallFieldResponse[]>(
    []
  );

  const [selectedFieldDate, setSelectedFieldDate] = useState("2025-05-30");
  const [sequenceStartDate, setSequenceStartDate] = useState("2025-05-24");
  const [sequenceEndDate, setSequenceEndDate] = useState("2025-06-07");

  const [isFieldLoading, setIsFieldLoading] = useState(false);
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
        ] = await Promise.all([
          getHealthStatus(),
          getAssamRainfallMetadata(),
          getAssamDailyRainfallSummary(),
          getAssamMonthlyRainfallSummary(),
        ]);

        const defaultFieldDate = metadataData.end_date;
        const sequenceEnd = metadataData.end_date;

        const sequenceStartDateObject = new Date(metadataData.end_date);
        sequenceStartDateObject.setDate(sequenceStartDateObject.getDate() - 14);

        const sequenceStart = sequenceStartDateObject
          .toISOString()
          .slice(0, 10);

        const [fieldData, sequenceData] = await Promise.all([
          getAssamRainfallField(defaultFieldDate),
          getAssamRainfallFieldSequence(sequenceStart, sequenceEnd),
        ]);

        setHealth(healthData);
        setRainfallMetadata(metadataData);
        setRainfall(dailyRainfallData);
        setMonthlyRainfall(monthlyRainfallData);
        setRainfallField(fieldData);
        setFieldSequence(sequenceData.fields);

        setSelectedFieldDate(defaultFieldDate);
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
            Real Rainfall Intelligence
          </h1>

          <p
            style={{
              maxWidth: "820px",
              margin: "14px 0 0",
              color: "#4b5563",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            Boundary-clipped rainfall analysis for Assam using real IMD gridded
            rainfall data, geospatial processing, backend APIs, and interactive
            MapLibre visualization.
          </p>
        </header>

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
            label="Total Regional Rainfall"
            value={`${rainfallStats.totalRainfall.toFixed(1)} mm`}
            helper="Sum of daily regional mean rainfall"
          />

          <MetricCard
            label="Wet Days"
            value={rainfallStats.wetDays.toString()}
            helper="Days with regional mean rainfall above 1 mm"
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
              }}
            >
              Highest Regional Mean Rainfall Day
            </h2>

            <p
              style={{
                margin: 0,
                color: "#374151",
                fontSize: "15px",
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

        <RainfallLineChart data={rainfall} />

        <MonthlyRainfallBarChart data={monthlyRainfall} />

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
              marginBottom: "16px",
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
                Spatial Rainfall State Animation
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#4b5563",
                  fontSize: "15px",
                }}
              >
                Preload a date range, then animate rainfall fields from frontend
                memory.
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
                  Dataset coverage: {rainfallMetadata.start_date} to{" "}
                  {rainfallMetadata.end_date} · {rainfallMetadata.day_count} days ·{" "}
                  {rainfallMetadata.average_valid_grid_cells_per_day} average
                  valid Assam cells/day · {rainfallMetadata.processing_level}
                </p>
              )}

              {rainfallStats.maxRainfallDay && (
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#4b5563",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Peak rainfall day: {rainfallStats.maxRainfallDay.date} ·{" "}
                  {rainfallStats.maxRainfallDay.rainfall_mean_mm.toFixed(2)} mm
                  regional mean ·{" "}
                  {rainfallStats.maxRainfallDay.rainfall_max_mm.toFixed(2)} mm
                  max grid-cell rainfall
                </p>
              )}
            </div>

            <p
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {fieldSequence.length > 0 && currentSequenceIndex >= 0
                ? `Frame ${currentSequenceIndex + 1} / ${fieldSequence.length}`
                : "No sequence loaded"}
            </p>
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
                onChange={(event) => setSequenceStartDate(event.target.value)}
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
              onClick={() =>
                setIsPlayingFieldAnimation((currentValue) => !currentValue)
              }
              disabled={fieldSequence.length === 0}
              style={{
                ...secondaryButtonStyle,
                background: isPlayingFieldAnimation ? "#dc2626" : "#2563eb",
                color: "#ffffff",
                borderColor: isPlayingFieldAnimation ? "#dc2626" : "#2563eb",
              }}
            >
              {isPlayingFieldAnimation ? "Pause" : "Play"}
            </button>

            <label style={labelStyle}>
              Single date
              <input
                type="date"
                value={selectedFieldDate}
                min={rainfallMetadata?.start_date}
                max={rainfallMetadata?.end_date}
                onChange={(event) => handleFieldDateChange(event.target.value)}
                style={inputStyle}
              />
            </label>
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
          rainfallField && (
            <>
              <RainfallMap data={rainfallField} />
              <RainfallFieldPreview data={rainfallField} />
            </>
          )
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