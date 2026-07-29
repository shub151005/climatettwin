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

interface ChartDataPoint {
  month: string;
  tmin: number;
  tmean: number;
  tmax: number;
  dtr: number;
  hotDays: number;
  warmNights: number;
}

interface TooltipPayloadItem {
  payload: ChartDataPoint;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
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
  const chartData: ChartDataPoint[] = data.map((month) => ({
    month: MONTH_LABELS[month.month],
    tmin: Number(month.tmin_mean_c.toFixed(2)),
    tmean: Number(month.tmean_mean_c.toFixed(2)),
    tmax: Number(month.tmax_mean_c.toFixed(2)),
    dtr: Number(month.dtr_mean_c.toFixed(2)),
    hotDays: month.hot_days,
    warmNights: month.warm_nights,
  }));

  return (
    <section style={chartPanelStyle}>
      <div style={chartHeaderStyle}>
        <div>
          <p style={eyebrowStyle}>Thermal Profile</p>

          <h2 style={titleStyle}>Monthly Temperature Profile — Assam 2025</h2>

          <p style={subtitleStyle}>
            Monthly mean TMIN, TMEAN, and TMAX from boundary-clipped IMD
            temperature grids.
          </p>
        </div>

        <div style={legendWrapStyle}>
          <LegendItem color="#ef4444" label="TMAX" />
          <LegendItem color="#38bdf8" label="TMEAN" />
          <LegendItem color="#22d3ee" label="TMIN" />
        </div>
      </div>

      <div style={chartCanvasStyle}>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart
            data={chartData}
            margin={{
              top: 16,
              right: 26,
              bottom: 16,
              left: 8,
            }}
          >
            <CartesianGrid
              stroke="rgba(148, 163, 184, 0.16)"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="month"
              tick={{
                fill: "#94a3b8",
                fontSize: 12,
                fontWeight: 800,
              }}
              tickLine={{
                stroke: "rgba(148, 163, 184, 0.3)",
              }}
              axisLine={{
                stroke: "rgba(148, 163, 184, 0.35)",
              }}
            />

            <YAxis
              tick={{
                fill: "#94a3b8",
                fontSize: 11,
                fontWeight: 700,
              }}
              tickLine={{
                stroke: "rgba(148, 163, 184, 0.3)",
              }}
              axisLine={{
                stroke: "rgba(148, 163, 184, 0.35)",
              }}
              label={{
                value: "Temperature (°C)",
                angle: -90,
                position: "insideLeft",
                fill: "#94a3b8",
                fontSize: 12,
                fontWeight: 800,
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Line
              type="monotone"
              dataKey="tmax"
              stroke="#ef4444"
              strokeWidth={2.6}
              dot={{
                r: 3.5,
                fill: "#020617",
                stroke: "#ef4444",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "#ef4444",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />

            <Line
              type="monotone"
              dataKey="tmean"
              stroke="#38bdf8"
              strokeWidth={2.4}
              dot={{
                r: 3.5,
                fill: "#020617",
                stroke: "#38bdf8",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "#38bdf8",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />

            <Line
              type="monotone"
              dataKey="tmin"
              stroke="#22d3ee"
              strokeWidth={2.2}
              dot={{
                r: 3.5,
                fill: "#020617",
                stroke: "#22d3ee",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "#22d3ee",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div style={tooltipStyle}>
      <p style={tooltipTitleStyle}>{point.month}</p>

      <p style={tooltipLineStyle}>
        TMAX mean: <strong>{point.tmax.toFixed(2)} °C</strong>
      </p>

      <p style={tooltipLineStyle}>
        TMEAN mean: <strong>{point.tmean.toFixed(2)} °C</strong>
      </p>

      <p style={tooltipLineStyle}>
        TMIN mean: <strong>{point.tmin.toFixed(2)} °C</strong>
      </p>

      <p style={tooltipLineStyle}>
        DTR mean: <strong>{point.dtr.toFixed(2)} °C</strong>
      </p>

      <p style={tooltipBadgeStyle}>
        Hot days {point.hotDays} · Warm nights {point.warmNights}
      </p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={legendItemStyle}>
      <span
        style={{
          width: "9px",
          height: "9px",
          borderRadius: "999px",
          background: color,
          boxShadow: `0 0 16px ${color}`,
        }}
      />
      {label}
    </div>
  );
}

const chartPanelStyle = {
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98))",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 24px 70px rgba(2, 6, 23, 0.45)",
} as const;

const chartHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  alignItems: "flex-start",
  marginBottom: "12px",
} as const;

const eyebrowStyle = {
  margin: "0 0 7px",
  color: "#38bdf8",
  fontSize: "12px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
} as const;

const titleStyle = {
  margin: 0,
  color: "#f9fafb",
  fontSize: "24px",
  fontWeight: 950,
} as const;

const subtitleStyle = {
  margin: "8px 0 0",
  color: "#cbd5e1",
  fontSize: "14px",
  lineHeight: 1.6,
  fontWeight: 600,
} as const;

const chartCanvasStyle = {
  background: "rgba(2, 6, 23, 0.42)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "10px",
} as const;

const legendWrapStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
} as const;

const legendItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  color: "#cbd5e1",
  fontSize: "12px",
  fontWeight: 850,
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "999px",
  padding: "7px 10px",
} as const;

const tooltipStyle = {
  background: "rgba(15, 23, 42, 0.96)",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  borderRadius: "14px",
  padding: "12px",
  color: "#f9fafb",
  boxShadow: "0 18px 45px rgba(2, 6, 23, 0.55)",
} as const;

const tooltipTitleStyle = {
  margin: "0 0 8px",
  color: "#38bdf8",
  fontSize: "13px",
  fontWeight: 950,
} as const;

const tooltipLineStyle = {
  margin: "4px 0",
  color: "#cbd5e1",
  fontSize: "12px",
  fontWeight: 650,
} as const;

const tooltipBadgeStyle = {
  margin: "9px 0 0",
  color: "#ffffff",
  background: "rgba(249, 115, 22, 0.18)",
  border: "1px solid rgba(249, 115, 22, 0.42)",
  borderRadius: "999px",
  padding: "6px 8px",
  fontSize: "11px",
  fontWeight: 900,
} as const;