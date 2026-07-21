import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyRainfallSummary } from "../../services/api";


interface RainfallLineChartProps {
  data: DailyRainfallSummary[];
}


function formatDateLabel(date: string): string {
  const parsedDate = new Date(date);

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}


export function RainfallLineChart({ data }: RainfallLineChartProps) {
  const chartData = data.map((day) => ({
    date: day.date,
    label: formatDateLabel(day.date),
    rainfallMean: Number(day.rainfall_mean_mm.toFixed(2)),
    rainfallMax: Number(day.rainfall_max_mm.toFixed(2)),
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
        Daily Rainfall Trend — Assam 2025
      </h3>

      <p
        style={{
          marginTop: 0,
          marginBottom: "20px",
          color: "#6b7280",
        }}
      >
        Regional mean rainfall across valid grid cells.
      </p>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart
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
            dataKey="label"
            minTickGap={28}
            tick={{ fontSize: 12 }}
          />

          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: "Rainfall (mm/day)",
              angle: -90,
              position: "insideLeft",
              style: {
                textAnchor: "middle",
              },
            }}
          />

          <Tooltip
            formatter={(value, name) => {
              const label =
                name === "rainfallMean"
                  ? "Mean rainfall"
                  : "Max grid-cell rainfall";

              return [`${value} mm`, label];
            }}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload;

              return item?.date ?? "";
            }}
          />

          <Line
            type="monotone"
            dataKey="rainfallMean"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}