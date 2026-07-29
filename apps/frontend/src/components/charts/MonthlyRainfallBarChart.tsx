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

interface ChartDataPoint {
  month: string;
  rainfallTotal: number;
  rainyDays: number;
  heavyRainDays: number;
  rainfallMax: number;
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

export function MonthlyRainfallBarChart({
  data,
}: MonthlyRainfallBarChartProps) {
  const chartData: ChartDataPoint[] = data.map((month) => ({
    month: MONTH_LABELS[month.month],
    rainfallTotal: Number(month.rainfall_total_mean_mm.toFixed(2)),
    rainyDays: month.rainy_days,
    heavyRainDays: month.heavy_rain_days,
    rainfallMax: Number(month.rainfall_max_mm.toFixed(2)),
  }));

  return (
    <section style={chartPanelStyle}>
      <div style={chartHeaderStyle}>
        <div>
          <p style={eyebrowStyle}>Seasonality</p>

          <h2 style={titleStyle}>Monthly Rainfall Distribution</h2>

          <p style={subtitleStyle}>
            Monthly total of regional mean rainfall from Assam boundary-clipped
            valid grid cells.
          </p>
        </div>

        <div style={statusPillStyle}>Monsoon-loaded rainfall regime</div>
      </div>

      <div style={chartCanvasStyle}>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={chartData}
            margin={{
              top: 16,
              right: 26,
              bottom: 16,
              left: 8,
            }}
          >
            <defs>
              <linearGradient id="rainfallBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                <stop offset="55%" stopColor="#2563eb" stopOpacity={0.82} />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.75} />
              </linearGradient>
            </defs>

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
                value: "Rainfall total (mm)",
                angle: -90,
                position: "insideLeft",
                fill: "#94a3b8",
                fontSize: 12,
                fontWeight: 800,
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar
              dataKey="rainfallTotal"
              fill="url(#rainfallBarGradient)"
              radius={[8, 8, 0, 0]}
              maxBarSize={78}
            />
          </BarChart>
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
        Rainfall total: <strong>{point.rainfallTotal.toFixed(2)} mm</strong>
      </p>

      <p style={tooltipLineStyle}>
        Max daily grid value: <strong>{point.rainfallMax.toFixed(2)} mm</strong>
      </p>

      <p style={tooltipLineStyle}>
        Rainy days: <strong>{point.rainyDays}</strong>
      </p>

      <p style={tooltipLineStyle}>
        Heavy rain days: <strong>{point.heavyRainDays}</strong>
      </p>
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

const statusPillStyle = {
  color: "#dbeafe",
  background: "rgba(37, 99, 235, 0.16)",
  border: "1px solid rgba(96, 165, 250, 0.38)",
  borderRadius: "999px",
  padding: "8px 11px",
  fontSize: "12px",
  fontWeight: 900,
  whiteSpace: "nowrap",
} as const;

const chartCanvasStyle = {
  background: "rgba(2, 6, 23, 0.42)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "10px",
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