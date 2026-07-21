import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonthlyRainfallSummary } from "../../services/api";


interface MonthlyRainfallBarChartProps {
  data: MonthlyRainfallSummary[];
}


const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];


export function MonthlyRainfallBarChart({
  data,
}: MonthlyRainfallBarChartProps) {
  const chartData = data.map((month) => ({
    month: MONTH_LABELS[month.month - 1],
    totalRainfall: Number(month.rainfall_total_mean_mm.toFixed(2)),
    rainyDays: month.rainy_days,
    heavyRainDays: month.heavy_rain_days,
  }));

  return (
    <div
      style={{
        width: "100%",
        height: "420px",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "20px",
        background: "#ffffff",
      }}
    >
      <h3 style={{ marginBottom: "4px" }}>
        Monthly Rainfall Seasonality — Assam 2025
      </h3>

      <p
        style={{
          marginTop: 0,
          marginBottom: "20px",
          color: "#6b7280",
        }}
      >
        Monthly total of regional mean rainfall across valid grid cells.
      </p>

      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={chartData}
          margin={{
            top: 10,
            right: 24,
            left: 8,
            bottom: 16,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: "Rainfall total (mm)",
              angle: -90,
              position: "insideLeft",
              style: {
                textAnchor: "middle",
              },
            }}
          />

          <Tooltip
            formatter={(value, name) => {
              if (name === "totalRainfall") {
                return [`${value} mm`, "Monthly rainfall"];
              }

              return [value, name];
            }}
          />

          <Bar
            dataKey="totalRainfall"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}