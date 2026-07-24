import type { RainfallFieldResponse } from "../../services/api";


interface RainfallFieldPreviewProps {
  data: RainfallFieldResponse;
}


function getRainfallColor(value: number): string {
  if (value <= 0.1) {
    return "#eff6ff";
  }

  if (value < 10) {
    return "#bfdbfe";
  }

  if (value < 25) {
    return "#60a5fa";
  }

  if (value < 50) {
    return "#2563eb";
  }

  if (value < 100) {
    return "#1d4ed8";
  }

  return "#312e81";
}


function getRainfallCategory(value: number): string {
  if (value <= 0.1) {
    return "No / trace rain";
  }

  if (value < 10) {
    return "Light rain";
  }

  if (value < 25) {
    return "Moderate rain";
  }

  if (value < 50) {
    return "Heavy rain";
  }

  if (value < 100) {
    return "Very heavy rain";
  }

  return "Extreme rain";
}


const LEGEND_ITEMS = [
  {
    label: "0–0.1",
    description: "Trace",
    color: "#eff6ff",
  },
  {
    label: "0.1–10",
    description: "Light",
    color: "#bfdbfe",
  },
  {
    label: "10–25",
    description: "Moderate",
    color: "#60a5fa",
  },
  {
    label: "25–50",
    description: "Heavy",
    color: "#2563eb",
  },
  {
    label: "50–100",
    description: "Very heavy",
    color: "#1d4ed8",
  },
  {
    label: "100+",
    description: "Extreme",
    color: "#312e81",
  },
];


export function RainfallFieldPreview({ data }: RainfallFieldPreviewProps) {
  const latitudes = data.cells.map((cell) => cell.latitude);
  const longitudes = data.cells.map((cell) => cell.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const width = 900;
  const height = 420;

  const cellWidth = width / (maxLon - minLon + 0.25);
  const cellHeight = height / (maxLat - minLat + 0.25);

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div>
          <h3 style={{  margin: 0,
                       fontSize: "22px",
                       fontWeight: 800,
                      }}>
            Rainfall Field Preview — Assam Boundary-Clipped Field
          </h3>

          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            {data.date} · {data.cell_count} valid grid cells · Mean{" "}
            {data.rainfall_mean_mm.toFixed(2)} mm/day · Max{" "}
            {data.rainfall_max_mm.toFixed(2)} mm/day
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(90px, 1fr))",
            gap: "8px",
            fontSize: "13px",
          }}
        >
          {LEGEND_ITEMS.map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#4b5563",
              }}
            >
              <span
                style={{
                  width: "18px",
                  height: "12px",
                  borderRadius: "4px",
                  background: item.color,
                  border: "1px solid #d1d5db",
                }}
              />

              <span>
                <strong>{item.label}</strong> mm · {item.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          background:
            "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Rainfall grid preview"
        >
          {data.cells.map((cell) => {
            const x =
              ((cell.longitude - minLon) / (maxLon - minLon + 0.25)) *
              width;

            const y =
              height -
              ((cell.latitude - minLat + 0.25) /
                (maxLat - minLat + 0.25)) *
                height;

            return (
              <rect
                key={`${cell.latitude}-${cell.longitude}`}
                x={x}
                y={y}
                width={cellWidth}
                height={cellHeight}
                fill={getRainfallColor(cell.rainfall_mm)}
                stroke="rgba(255,255,255,0.24)"
                strokeWidth={0.5}
              >
                <title>
                  Lat {cell.latitude}, Lon {cell.longitude}:{" "}
                  {cell.rainfall_mm.toFixed(2)} mm —{" "}
                  {getRainfallCategory(cell.rainfall_mm)}
                </title>
              </rect>
            );
          })}
        </svg>
      </div>

      <p
        style={{
          marginTop: "12px",
          color: "#6b7280",
          fontSize: "15px",
        }}
      >
        This is a boundary-clipped rainfall field preview using Assam grid cells retained inside the state boundary.
      </p>
    </section>
  );
}