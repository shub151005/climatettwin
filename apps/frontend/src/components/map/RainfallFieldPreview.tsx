import type { RainfallFieldResponse } from "../../services/api";


interface RainfallFieldPreviewProps {
  data: RainfallFieldResponse;
}


function getRainfallOpacity(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0.1;
  }

  const normalized = value / maxValue;

  return Math.max(0.12, Math.min(1, normalized));
}


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
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: 0 }}>
          Rainfall Field Preview — Assam Bounding Box
        </h3>

        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          {data.date} · {data.cell_count} valid grid cells · Mean{" "}
          {data.rainfall_mean_mm.toFixed(2)} mm/day · Max{" "}
          {data.rainfall_max_mm.toFixed(2)} mm/day
        </p>
      </div>

      <div
        style={{
          overflowX: "auto",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
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
            const x = ((cell.longitude - minLon) / (maxLon - minLon + 0.25)) * width;

            const y =
              height -
              ((cell.latitude - minLat + 0.25) / (maxLat - minLat + 0.25)) *
                height;

            const opacity = getRainfallOpacity(
              cell.rainfall_mm,
              data.rainfall_max_mm
            );

            return (
              <rect
                key={`${cell.latitude}-${cell.longitude}`}
                x={x}
                y={y}
                width={cellWidth}
                height={cellHeight}
                fill="#2563eb"
                fillOpacity={opacity}
              >
                <title>
                  Lat {cell.latitude}, Lon {cell.longitude}:{" "}
                  {cell.rainfall_mm.toFixed(2)} mm
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
          fontSize: "14px",
        }}
      >
        This is a grid preview, not the final geographic map. The final V1 map
        will use proper map boundaries and geospatial layers.
      </p>
    </section>
  );
}