import { useEffect, useMemo, useState } from "react";

import { MonthlyRainfallBarChart } from "./components/charts/MonthlyRainfallBarChart";
import { RainfallLineChart } from "./components/charts/RainfallLineChart";
import { RainfallFieldPreview } from "./components/map/RainfallFieldPreview";
import {
  getAssamDailyRainfallSummary,
  getAssamMonthlyRainfallSummary,
  getAssamRainfallField,
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

  const [selectedFieldDate, setSelectedFieldDate] = useState("2025-05-30");
  const [isFieldLoading, setIsFieldLoading] = useState(false);
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
        ] = await Promise.all([
          getHealthStatus(),
          getAssamDailyRainfallSummary(),
          getAssamMonthlyRainfallSummary(),
          getAssamRainfallField("2025-05-30"),
        ]);

        setHealth(healthResult);
        setRainfall(rainfallResult);
        setMonthlyRainfall(monthlyRainfallResult);
        setRainfallField(rainfallFieldResult);
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


  function shiftDate(dateValue: string, dayOffset: number): string {
    const currentDate = new Date(dateValue);
    currentDate.setDate(currentDate.getDate() + dayOffset);

    const minDate = new Date("2025-01-01");
    const maxDate = new Date("2025-12-31");

    if (currentDate < minDate) {
      return "2025-01-01";
    }

    if (currentDate > maxDate) {
      return "2025-12-31";
    }

    return currentDate.toISOString().slice(0, 10);
  }


  async function handlePreviousFieldDay(): Promise<void> {
    const previousDate = shiftDate(selectedFieldDate, -1);
    await handleFieldDateChange(previousDate);
  }


  async function handleNextFieldDay(): Promise<void> {
    const nextDate = shiftDate(selectedFieldDate, 1);
    await handleFieldDateChange(nextDate);
  }


  useEffect(() => {
    if (!isPlayingFieldAnimation) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSelectedFieldDate((currentDate) => {
        const nextDate = shiftDate(currentDate, 1);

        if (nextDate === currentDate || nextDate === "2025-12-31") {
          setIsPlayingFieldAnimation(false);
        }

        void handleFieldDateChange(nextDate);

        return nextDate;
      });
    }, 900);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlayingFieldAnimation]);


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
          maxWidth: "1200px",
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
            First frontend milestone using real IMD rainfall data processed
            through the ClimateTwin pipeline.
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
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  Spatial Rainfall State
                </h3>

                <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                  Select a date or play the rainfall field animation.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "end",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    void handlePreviousFieldDay();
                  }}
                  disabled={
                    isFieldLoading || selectedFieldDate === "2025-01-01"
                  }
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "10px",
                    background: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  Previous
                </button>

                <div>
                  <label
                    htmlFor="field-date"
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      color: "#374151",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Date
                  </label>

                  <input
                    id="field-date"
                    type="date"
                    min="2025-01-01"
                    max="2025-12-31"
                    value={selectedFieldDate}
                    onChange={(event) => {
                      void handleFieldDateChange(event.target.value);
                    }}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "10px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void handleNextFieldDay();
                  }}
                  disabled={
                    isFieldLoading || selectedFieldDate === "2025-12-31"
                  }
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "10px",
                    background: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  Next
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingFieldAnimation((current) => !current);
                  }}
                  disabled={isFieldLoading}
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
              <RainfallFieldPreview data={rainfallField} />
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


export default App;