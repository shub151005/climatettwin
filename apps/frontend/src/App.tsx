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
  getHealthStatus,
  type DailyRainfallSummary,
  type HealthResponse,
  type MonthlyRainfallSummary,
  type RainfallFieldResponse,
} from "./services/api";


function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [rainfall, setRainfall] = useState<DailyRainfallSummary[]>([]);
  const [monthlyRainfall, setMonthlyRainfall] = useState<
    MonthlyRainfallSummary[]
  >([]);
  const [rainfallField, setRainfallField] =
    useState<RainfallFieldResponse | null>(null);

  const [fieldSequence, setFieldSequence] = useState<
    RainfallFieldResponse[]
  >([]);

  const [selectedFieldDate, setSelectedFieldDate] = useState("2025-05-30");
  const [sequenceStartDate, setSequenceStartDate] = useState("2025-05-24");
  const [sequenceEndDate, setSequenceEndDate] = useState("2025-06-07");

  const [isFieldLoading, setIsFieldLoading] = useState(false);
  const [isSequenceLoading, setIsSequenceLoading] = useState(false);
  const [isPlayingFieldAnimation, setIsPlayingFieldAnimation] =
    useState(false);

  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function loadInitialData(): Promise<void> {
      try {
        setError(null);

        const [
          healthResult,
          rainfallResult,
          monthlyRainfallResult,
          rainfallFieldResult,
          rainfallSequenceResult,
        ] = await Promise.all([
          getHealthStatus(),
          getAssamDailyRainfallSummary(),
          getAssamMonthlyRainfallSummary(),
          getAssamRainfallField("2025-05-30"),
          getAssamRainfallFieldSequence("2025-05-24", "2025-06-07"),
        ]);

        setHealth(healthResult);
        setRainfall(rainfallResult);
        setMonthlyRainfall(monthlyRainfallResult);
        setRainfallField(rainfallFieldResult);
        setFieldSequence(rainfallSequenceResult.fields);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unknown API error"
        );
      }
    }

    void loadInitialData();
  }, []);


  async function handleFieldDateChange(dateValue: string): Promise<void> {
    try {
      setSelectedFieldDate(dateValue);
      setIsFieldLoading(true);
      setError(null);
      setIsPlayingFieldAnimation(false);

      const rainfallFieldResult = await getAssamRainfallField(dateValue);

      setRainfallField(rainfallFieldResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown rainfall field error"
      );
    } finally {
      setIsFieldLoading(false);
    }
  }


  async function handleLoadSequence(): Promise<void> {
    try {
      setIsSequenceLoading(true);
      setIsPlayingFieldAnimation(false);
      setError(null);

      const sequenceResult = await getAssamRainfallFieldSequence(
        sequenceStartDate,
        sequenceEndDate
      );

      setFieldSequence(sequenceResult.fields);

      if (sequenceResult.fields.length > 0) {
        const firstField = sequenceResult.fields[0];
        setRainfallField(firstField);
        setSelectedFieldDate(firstField.date);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown rainfall sequence error"
      );
    } finally {
      setIsSequenceLoading(false);
    }
  }


  function getCurrentSequenceIndex(): number {
    return fieldSequence.findIndex(
      (field) => field.date === selectedFieldDate
    );
  }


  function showSequenceField(index: number): void {
    const field = fieldSequence[index];

    if (!field) {
      return;
    }

    setRainfallField(field);
    setSelectedFieldDate(field.date);
  }


  function handlePreviousSequenceFrame(): void {
    const currentIndex = getCurrentSequenceIndex();

    if (currentIndex <= 0) {
      return;
    }

    setIsPlayingFieldAnimation(false);
    showSequenceField(currentIndex - 1);
  }


  function handleNextSequenceFrame(): void {
    const currentIndex = getCurrentSequenceIndex();

    if (currentIndex < 0 || currentIndex >= fieldSequence.length - 1) {
      return;
    }

    setIsPlayingFieldAnimation(false);
    showSequenceField(currentIndex + 1);
  }


  useEffect(() => {
    if (!isPlayingFieldAnimation || fieldSequence.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const currentIndex = getCurrentSequenceIndex();

      if (currentIndex < 0 || currentIndex >= fieldSequence.length - 1) {
        setIsPlayingFieldAnimation(false);
        return;
      }

      showSequenceField(currentIndex + 1);
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlayingFieldAnimation, selectedFieldDate, fieldSequence]);


  const rainfallStats = useMemo(() => {
    if (rainfall.length === 0) {
      return null;
    }

    const totalRainfall = rainfall.reduce(
      (sum, day) => sum + day.rainfall_mean_mm,
      0
    );

    const wetDays = rainfall.filter(
      (day) => day.rainfall_mean_mm > 0.1
    ).length;

    const maxRainfallDay = rainfall.reduce((maxDay, currentDay) =>
      currentDay.rainfall_mean_mm > maxDay.rainfall_mean_mm
        ? currentDay
        : maxDay
    );

    return {
      totalRainfall,
      wetDays,
      maxRainfallDay,
    };
  }, [rainfall]);


  const currentSequenceIndex = getCurrentSequenceIndex();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        background: "#f3f4f6",
        color: "#111827",
      }}
    >
      <section
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "32px" }}>
          <p
            style={{
              marginBottom: "8px",
              color: "#2563eb",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: "12px",
            }}
          >
            ClimateTwin Assam
          </p>

          <h1 style={{ margin: 0, fontSize: "42px" }}>
            Real Rainfall Intelligence
          </h1>

          <p
            style={{
              maxWidth: "720px",
              color: "#4b5563",
              fontSize: "18px",
              lineHeight: 1.6,
            }}
          >
            Real IMD rainfall data processed through the ClimateTwin pipeline,
            served through FastAPI, and visualized in React.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <MetricCard
            label="API status"
            value={health ? health.status : "checking"}
          />

          <MetricCard
            label="Records loaded"
            value={rainfall.length.toString()}
          />

          <MetricCard
            label="Wet days"
            value={
              rainfallStats ? rainfallStats.wetDays.toString() : "-"
            }
          />

          <MetricCard
            label="Total regional mean rainfall"
            value={
              rainfallStats
                ? `${rainfallStats.totalRainfall.toFixed(1)} mm`
                : "-"
            }
          />
        </section>

        {rainfallStats && (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Highest Regional Mean Rainfall Day
            </h2>

            <p style={{ marginBottom: 0, color: "#4b5563" }}>
              <strong>{rainfallStats.maxRainfallDay.date}</strong> recorded a
              regional mean rainfall of{" "}
              <strong>
                {rainfallStats.maxRainfallDay.rainfall_mean_mm.toFixed(2)} mm
              </strong>
              .
            </p>
          </section>
        )}

        {rainfall.length > 0 && (
          <RainfallLineChart data={rainfall} />
        )}

        {monthlyRainfall.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <MonthlyRainfallBarChart data={monthlyRainfall} />
          </div>
        )}

        {rainfallField && (
          <section style={{ marginTop: "24px" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>
                    Spatial Rainfall State Animation
                  </h3>

                  <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                    Preload a date range, then animate rainfall fields from
                    frontend memory.
                  </p>
                </div>

                <div
                  style={{
                    color: "#4b5563",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {fieldSequence.length > 0 && currentSequenceIndex >= 0
                    ? `Frame ${
                        currentSequenceIndex + 1
                      } / ${fieldSequence.length}`
                    : "No sequence loaded"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "end",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <label
                    htmlFor="sequence-start-date"
                    style={labelStyle}
                  >
                    Start date
                  </label>

                  <input
                    id="sequence-start-date"
                    type="date"
                    min="2025-01-01"
                    max="2025-12-31"
                    value={sequenceStartDate}
                    onChange={(event) => {
                      setSequenceStartDate(event.target.value);
                    }}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    htmlFor="sequence-end-date"
                    style={labelStyle}
                  >
                    End date
                  </label>

                  <input
                    id="sequence-end-date"
                    type="date"
                    min="2025-01-01"
                    max="2025-12-31"
                    value={sequenceEndDate}
                    onChange={(event) => {
                      setSequenceEndDate(event.target.value);
                    }}
                    style={inputStyle}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void handleLoadSequence();
                  }}
                  disabled={isSequenceLoading}
                  style={secondaryButtonStyle}
                >
                  {isSequenceLoading ? "Loading..." : "Load sequence"}
                </button>

                <button
                  type="button"
                  onClick={handlePreviousSequenceFrame}
                  disabled={
                    isFieldLoading ||
                    fieldSequence.length === 0 ||
                    currentSequenceIndex <= 0
                  }
                  style={secondaryButtonStyle}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNextSequenceFrame}
                  disabled={
                    isFieldLoading ||
                    fieldSequence.length === 0 ||
                    currentSequenceIndex >= fieldSequence.length - 1
                  }
                  style={secondaryButtonStyle}
                >
                  Next
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingFieldAnimation((current) => !current);
                  }}
                  disabled={
                    isFieldLoading ||
                    isSequenceLoading ||
                    fieldSequence.length === 0 ||
                    currentSequenceIndex >= fieldSequence.length - 1
                  }
                  style={{
                    padding: "10px 14px",
                    border: "1px solid #2563eb",
                    borderRadius: "10px",
                    background: isPlayingFieldAnimation
                      ? "#eff6ff"
                      : "#2563eb",
                    color: isPlayingFieldAnimation ? "#2563eb" : "#ffffff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {isPlayingFieldAnimation ? "Pause" : "Play"}
                </button>

                <div>
                  <label
                    htmlFor="single-field-date"
                    style={labelStyle}
                  >
                    Single date
                  </label>

                  <input
                    id="single-field-date"
                    type="date"
                    min="2025-01-01"
                    max="2025-12-31"
                    value={selectedFieldDate}
                    onChange={(event) => {
                      void handleFieldDateChange(event.target.value);
                    }}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {isFieldLoading ? (
              <section
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  padding: "20px",
                }}
              >
                Loading rainfall field...
              </section>
            ) : (
              <>
                <RainfallMap data={rainfallField} />
                <RainfallFieldPreview data={rainfallField} />
              </>
            )}
          </section>
        )}

        {rainfall.length === 0 && !error && (
          <p>Loading rainfall data...</p>
        )}

        {error && (
          <section
            style={{
              marginTop: "24px",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "16px",
              color: "#991b1b",
            }}
          >
            <h2>Error</h2>
            <p>{error}</p>
          </section>
        )}
      </section>
    </main>
  );
}


interface MetricCardProps {
  label: string;
  value: string;
}


function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "20px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: "8px 0 0",
          fontSize: "24px",
          fontWeight: 700,
        }}
      >
        {value}
      </p>
    </div>
  );
}


const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 600,
};


const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#111827",
  background: "#ffffff",
};


const secondaryButtonStyle = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 600,
  minWidth: "96px",
};


export default App;