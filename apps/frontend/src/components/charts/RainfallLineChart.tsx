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
  rainfallPercentile: number | null;
  rainfallIntensityClass: string | null;
  anomalyMm: number | null;
  season: string | null;
}


function formatDateLabel(dateValue: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(dateValue));
}


function formatRainfallClass(value: string | null): string {
  if (!value) {
    return "Not classified";
  }

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


function formatSeason(value: string | null): string {
  if (!value) {
    return "Unknown season";
  }

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


function ExtremeAwareDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
}) {
  const { cx, cy, payload } = props;

  if (!payload?.isExtremeDay || cx === undefined || cy === undefined) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#dc2626"
      stroke="#ffffff"
      strokeWidth={1.5}
    />
  );
}


function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
    value: number;
    name: string;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #d1d5db",
        borderRadius: "12px",
        padding: "12px 14px",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
        minWidth: "220px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          color: "#111827",
          fontSize: "14px",
          fontWeight: 800,
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: "0 0 4px",
          color: "#374151",
          fontSize: "13px",
        }}
      >
        Mean rainfall:{" "}
        <strong>{point.rainfallMean.toFixed(2)} mm/day</strong>
      </p>

      <p
        style={{
          margin: "0 0 4px",
          color: "#374151",
          fontSize: "13px",
        }}
      >
        Max grid-cell rainfall:{" "}
        <strong>{point.rainfallMax.toFixed(2)} mm/day</strong>
      </p>

      {point.anomalyMm !== null && (
        <p
          style={{
            margin: "0 0 4px",
            color: "#374151",
            fontSize: "13px",
          }}
        >
          Anomaly: <strong>{point.anomalyMm.toFixed(2)} mm</strong>
        </p>
      )}

      {point.rainfallPercentile !== null && (
        <p
          style={{
            margin: "0 0 4px",
            color: "#374151",
            fontSize: "13px",
          }}
        >
          Percentile:{" "}
          <strong>{point.rainfallPercentile.toFixed(2)}th</strong>
        </p>
      )}

      <p
        style={{
          margin: "0 0 4px",
          color: point.isExtremeDay ? "#991b1b" : "#374151",
          fontSize: "13px",
          fontWeight: point.isExtremeDay ? 800 : 500,
        }}
      >
        {point.isExtremeDay ? "Extreme rainfall day" : "Normal rainfall day"}
      </p>

      <p
        style={{
          margin: 0,
          color: "#374151",
          fontSize: "13px",
        }}
      >
        Class:{" "}
        <strong>{formatRainfallClass(point.rainfallIntensityClass)}</strong>{" "}
        · Season: <strong>{formatSeason(point.season)}</strong>
      </p>
    </div>
  );
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
      rainfallMean: day.rainfall_mean_mm,
      rainfallMax: day.rainfall_max_mm,
      isExtremeDay: anomaly?.is_extreme_day ?? false,
      rainfallPercentile: anomaly?.rainfall_percentile ?? null,
      rainfallIntensityClass: anomaly?.rainfall_intensity_class ?? null,
      anomalyMm: anomaly?.rainfall_anomaly_from_annual_mean_mm ?? null,
      season: anomaly?.season ?? null,
    };
  });

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#111827",
            fontSize: "20px",
            fontWeight: 800,
          }}
        >
          Daily Rainfall Timeline
        </h2>

        <p
          style={{
            margin: "8px 0 0",
            color: "#4b5563",
            fontSize: "15px",
            lineHeight: 1.6,
          }}
        >
          Daily regional mean rainfall across Assam-clipped valid grid cells.
          Extreme days are highlighted using the anomaly pipeline.
        </p>
      </div>

      <div
        style={{
          width: "100%",
          height: "340px",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 12,
              right: 28,
              bottom: 8,
              left: 12,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              minTickGap={26}
              tick={{
                fill: "#4b5563",
                fontSize: 12,
              }}
              axisLine={{
                stroke: "#9ca3af",
              }}
              tickLine={{
                stroke: "#9ca3af",
              }}
            />

            <YAxis
              tick={{
                fill: "#4b5563",
                fontSize: 12,
              }}
              axisLine={{
                stroke: "#9ca3af",
              }}
              tickLine={{
                stroke: "#9ca3af",
              }}
              label={{
                value: "Rainfall mean (mm/day)",
                angle: -90,
                position: "insideLeft",
                fill: "#374151",
                fontSize: 13,
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Line
              type="monotone"
              dataKey="rainfallMean"
              name="Regional mean rainfall"
              stroke="#2563eb"
              strokeWidth={2}
              dot={<ExtremeAwareDot />}
              activeDot={{
                r: 5,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          marginTop: "12px",
          color: "#4b5563",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        <span>
          <span
            style={{
              display: "inline-block",
              width: "22px",
              height: "3px",
              background: "#2563eb",
              marginRight: "8px",
              verticalAlign: "middle",
            }}
          />
          Daily regional mean
        </span>

        <span>
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              background: "#dc2626",
              borderRadius: "999px",
              marginRight: "8px",
              verticalAlign: "middle",
            }}
          />
          Extreme rainfall days
        </span>
      </div>
    </section>
  );
}