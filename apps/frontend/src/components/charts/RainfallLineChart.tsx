import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  DailyRainfallAnomaly,
  DailyRainfallSummary,
} from "../../services/api";

interface RainfallLineChartProps {
  data: DailyRainfallSummary[];
  anomalies?: DailyRainfallAnomaly[];
}

interface ChartDataPoint {
  date: string;
  rainfallMean: number;
  rainfallMax: number;
  isExtremeDay: boolean;
  rainfallPercentile?: number;
  rainfallIntensityClass?: string;
  anomalyMm?: number;
  season?: string;
}

interface TooltipPayloadItem {
  payload: ChartDataPoint;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
}

export function RainfallLineChart({
  data,
  anomalies = [],
}: RainfallLineChartProps) {
  const anomalyByDate = new Map(
    anomalies.map((anomaly) => [anomaly.date, anomaly])
  );

  const chartData: ChartDataPoint[] = data.map((day) => {
    const anomaly = anomalyByDate.get(day.date);

    return {
      date: day.date,
      rainfallMean: Number(day.rainfall_mean_mm.toFixed(2)),
      rainfallMax: Number(day.rainfall_max_mm.toFixed(2)),
      isExtremeDay: anomaly?.is_extreme_day ?? false,
      rainfallPercentile: anomaly?.rainfall_percentile,
      rainfallIntensityClass: anomaly?.rainfall_intensity_class,
      anomalyMm: anomaly?.rainfall_anomaly_from_annual_mean_mm,
      season: anomaly?.season,
    };
  });

  return (
    <section style={chartPanelStyle}>
      <div style={chartHeaderStyle}>
        <div>
          <p style={eyebrowStyle}>Rainfall Signal</p>

          <h2 style={titleStyle}>Daily Rainfall Timeline</h2>

          <p style={subtitleStyle}>
            Boundary-clipped daily regional rainfall across Assam. Extreme days
            are highlighted using the anomaly pipeline.
          </p>
        </div>

        <div style={legendWrapStyle}>
          <LegendItem color="#38bdf8" label="Daily mean" />
          <LegendItem color="#ef4444" label="Extreme day" />
        </div>
      </div>

      <div style={chartCanvasStyle}>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart
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
              dataKey="date"
              minTickGap={34}
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
                value: "Rainfall mean (mm/day)",
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
              dataKey="rainfallMean"
              stroke="#38bdf8"
              strokeWidth={2.4}
              dot={<ExtremeAwareDot />}
              activeDot={{
                r: 5,
                fill: "#f9fafb",
                stroke: "#38bdf8",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ExtremeAwareDot({ cx, cy, payload }: DotProps) {
  if (!payload?.isExtremeDay || cx === undefined || cy === undefined) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#ef4444"
      stroke="#ffffff"
      strokeWidth={1.6}
    />
  );
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div style={tooltipStyle}>
      <p style={tooltipTitleStyle}>{point.date}</p>

      <p style={tooltipLineStyle}>
        Mean rainfall: <strong>{point.rainfallMean.toFixed(2)} mm</strong>
      </p>

      <p style={tooltipLineStyle}>
        Max grid cell: <strong>{point.rainfallMax.toFixed(2)} mm</strong>
      </p>

      {point.anomalyMm !== undefined && (
        <p style={tooltipLineStyle}>
          Anomaly: <strong>{point.anomalyMm.toFixed(2)} mm</strong>
        </p>
      )}

      {point.rainfallPercentile !== undefined && (
        <p style={tooltipLineStyle}>
          Percentile: <strong>{point.rainfallPercentile.toFixed(2)}</strong>
        </p>
      )}

      {point.rainfallIntensityClass && (
        <p style={tooltipBadgeStyle}>
          {formatLabel(point.rainfallIntensityClass)}
          {point.season ? ` · ${formatLabel(point.season)}` : ""}
        </p>
      )}
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

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  background: "rgba(239, 68, 68, 0.18)",
  border: "1px solid rgba(239, 68, 68, 0.4)",
  borderRadius: "999px",
  padding: "6px 8px",
  fontSize: "11px",
  fontWeight: 900,
} as const;