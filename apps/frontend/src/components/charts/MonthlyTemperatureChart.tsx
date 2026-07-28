import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonthlyTemperatureSummary } from "../../services/api";


interface MonthlyTemperatureChartProps {
  data: MonthlyTemperatureSummary[];
}


const MONTH_LABELS = [
  "",
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


export function MonthlyTemperatureChart({
  data,
}: MonthlyTemperatureChartProps) {
  const chartData = data.map((month) => ({
    month: MONTH_LABELS[month.month],
    tmin: month.tmin_mean_c,
    tmax: month.tmax_mean_c,
    tmean: month.tmean_mean_c,
    dtr: month.dtr_mean_c,
    hotDays: month.hot_days,
    warmNights: month.warm_nights,
    coolDays: month.cool_days,
  }));

  return (
    <section
      style={{
        marginTop: "24px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "20px",
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "20px",
          color: "#111827",
          fontWeight: 800,
          textAlign: "center",
        }}
      >
        Monthly Temperature Profile — Assam 2025
      </h2>

      <p
        style={{
          margin: "0 0 18px",
          color: "#4b5563",
          fontSize: "14px",
          lineHeight: 1.6,
          textAlign: "center",
        }}
      >
        Monthly mean TMIN, TMEAN, and TMAX from boundary-clipped IMD temperature
        grids.
      </p>

      <div style={{ width: "100%", height: "360px" }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{
              top: 16,
              right: 24,
              left: 8,
              bottom: 12,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="month"
              tick={{
                fontSize: 12,
              }}
            />

            <YAxis
              tick={{
                fontSize: 12,
              }}
              label={{
                value: "Temperature (°C)",
                angle: -90,
                position: "insideLeft",
                style: {
                  fontSize: 12,
                  fill: "#374151",
                },
              }}
            />

            <Tooltip
              formatter={(value, name) => {
                const labelMap: Record<string, string> = {
                  tmin: "TMIN mean",
                  tmean: "TMEAN mean",
                  tmax: "TMAX mean",
                  dtr: "DTR mean",
                };

                return [`${Number(value).toFixed(2)} °C`, labelMap[String(name)]];
              }}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
              }}
            />

            <Line
              type="monotone"
              dataKey="tmax"
              stroke="#dc2626"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />

            <Line
              type="monotone"
              dataKey="tmean"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />

            <Line
              type="monotone"
              dataKey="tmin"
              stroke="#0891b2"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "18px",
          flexWrap: "wrap",
          marginTop: "12px",
          color: "#4b5563",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        <span>TMAX mean</span>
        <span>TMEAN mean</span>
        <span>TMIN mean</span>
      </div>
    </section>
  );
}
