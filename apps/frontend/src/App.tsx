import { useEffect, useMemo, useState } from "react";

import { MonthlyRainfallBarChart } from "./components/charts/MonthlyRainfallBarChart";
import { RainfallLineChart } from "./components/charts/RainfallLineChart";
import {
  getAssamDailyRainfallSummary,
  getAssamMonthlyRainfallSummary,
  getHealthStatus,
  type DailyRainfallSummary,
  type HealthResponse,
  type MonthlyRainfallSummary,
} from "./services/api";


function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [rainfall, setRainfall] = useState<DailyRainfallSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [monthlyRainfall, setMonthlyRainfall] = useState<
  MonthlyRainfallSummary[]
  >([]);


  useEffect(() => {
    async function loadInitialData(): Promise<void> {
      try {
         const [healthResult, rainfallResult, monthlyRainfallResult] =
            await Promise.all([
            getHealthStatus(),
            getAssamDailyRainfallSummary(),
            getAssamMonthlyRainfallSummary(),
            ]);

setHealth(healthResult);
setRainfall(rainfallResult);
setMonthlyRainfall(monthlyRainfallResult);

        setHealth(healthResult);
        setRainfall(rainfallResult);
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
              Highest regional mean rainfall day
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