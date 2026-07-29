import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type {
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Polygon,
} from "geojson";

import assamDistrictBoundaries from "../../data/geojson/assam-district-boundaries.json";
import assamOuterBoundary from "../../data/geojson/assam-outer-boundary.json";

import type {
  RainfallFieldResponse,
  TemperatureFieldResponse,
} from "../../services/api";


type ClimateLayer = "rainfall" | "TMEAN" | "TMAX" | "TMIN";


interface SmoothClimateOverlayProps {
  map: MapLibreMap | null;
  isMapReady: boolean;
  activeLayer: ClimateLayer;
  rainfallData: RainfallFieldResponse | null;
  temperatureData: TemperatureFieldResponse | null;
}


const assamDistrictBoundaryGeoJson =
  assamDistrictBoundaries as FeatureCollection<Geometry>;

const assamOuterBoundaryGeoJson =
  assamOuterBoundary as FeatureCollection<Geometry>;


const importantPlaceLabels = [
  { name: "Guwahati", latitude: 26.1445, longitude: 91.7362 },
  { name: "Dibrugarh", latitude: 27.4728, longitude: 94.912 },
  { name: "Silchar", latitude: 24.8333, longitude: 92.7789 },
  { name: "Tezpur", latitude: 26.6528, longitude: 92.7926 },
  { name: "Jorhat", latitude: 26.7509, longitude: 94.2037 },
  { name: "Nagaon", latitude: 26.3509, longitude: 92.692 },
  { name: "Goalpara", latitude: 26.1641, longitude: 90.6252 },
  { name: "Dhubri", latitude: 26.0207, longitude: 89.9743 },
  { name: "Diphu", latitude: 25.8434, longitude: 93.431 },
  { name: "Tinsukia", latitude: 27.4886, longitude: 95.3558 },
  { name: "North Lakhimpur", latitude: 27.2364, longitude: 94.1036 },
  { name: "Haflong", latitude: 25.1648, longitude: 93.0176 },
];


export function SmoothClimateOverlay({
  map,
  isMapReady,
  activeLayer,
  rainfallData,
  temperatureData,
}: SmoothClimateOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!map || !isMapReady || !canvasRef.current) {
      return;
    }

    const activeMap = map;
    const canvas = canvasRef.current;

    function resizeCanvas() {
      const container = activeMap.getContainer();
      const width = container.clientWidth;
      const height = container.clientHeight;
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext("2d");

      if (context) {
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }
    }

    function drawOverlay() {
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      context.clearRect(0, 0, width, height);

      context.save();
      clipToAssamBoundary(context, activeMap);

      if (activeLayer === "rainfall") {
        drawRainfallField(context, activeMap, rainfallData);
      } else {
        drawTemperatureField(context, activeMap, temperatureData, activeLayer);
      }

      context.restore();

      drawDistrictBoundaryStroke(context, activeMap);
      drawAssamOuterBoundaryStroke(context, activeMap);
      drawImportantPlaceLabels(context, activeMap);
    }

    function redraw() {
      resizeCanvas();
      drawOverlay();
    }

    redraw();

    activeMap.on("move", redraw);
    activeMap.on("zoom", redraw);
    activeMap.on("resize", redraw);

    return () => {
      activeMap.off("move", redraw);
      activeMap.off("zoom", redraw);
      activeMap.off("resize", redraw);
    };
  }, [map, isMapReady, activeLayer, rainfallData, temperatureData]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        mixBlendMode: "normal",
      }}
    />
  );
}


function drawRainfallField(
  context: CanvasRenderingContext2D,
  map: MapLibreMap,
  data: RainfallFieldResponse | null
) {
  if (!data) {
    return;
  }

  const visibleCells = data.cells.filter((cell) => cell.rainfall_mm > 0.2);

  context.save();
  context.globalCompositeOperation = "source-over";

  for (const cell of visibleCells) {
    const value = cell.rainfall_mm;
    const projected = map.project([cell.longitude, cell.latitude]);

    drawSoftBlob({
      context,
      x: projected.x,
      y: projected.y,
      radius: getRainfallRadius(value, map.getZoom()),
      color: getRainfallColor(value),
      alpha: getRainfallAlpha(value),
      hardCore: value >= 25,
    });
  }

  context.restore();

  addRainfallTexture(context, map, visibleCells.length);
}


function drawTemperatureField(
  context: CanvasRenderingContext2D,
  map: MapLibreMap,
  data: TemperatureFieldResponse | null,
  activeLayer: ClimateLayer
) {
  if (!data || activeLayer === "rainfall") {
    return;
  }

  context.save();
  context.globalCompositeOperation = "source-over";

  for (const cell of data.cells) {
    const value = cell.temperature_c;
    const projected = map.project([cell.longitude, cell.latitude]);

    drawSoftBlob({
      context,
      x: projected.x,
      y: projected.y,
      radius: getTemperatureRadius(map.getZoom()),
      color: getTemperatureColor(value),
      alpha: getTemperatureAlpha(value),
      hardCore: true,
    });
  }

  context.restore();

  addTemperatureTexture(context, map);
}


function drawSoftBlob({
  context,
  x,
  y,
  radius,
  color,
  alpha,
  hardCore,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  hardCore: boolean;
}) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);

  if (hardCore) {
    gradient.addColorStop(0, hexToRgba(color, alpha));
    gradient.addColorStop(0.16, hexToRgba(color, alpha * 0.92));
    gradient.addColorStop(0.38, hexToRgba(color, alpha * 0.62));
    gradient.addColorStop(0.68, hexToRgba(color, alpha * 0.22));
    gradient.addColorStop(1, hexToRgba(color, 0));
  } else {
    gradient.addColorStop(0, hexToRgba(color, alpha));
    gradient.addColorStop(0.32, hexToRgba(color, alpha * 0.62));
    gradient.addColorStop(0.62, hexToRgba(color, alpha * 0.24));
    gradient.addColorStop(1, hexToRgba(color, 0));
  }

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}


function addRainfallTexture(
  context: CanvasRenderingContext2D,
  map: MapLibreMap,
  visibleCellCount: number
) {
  if (visibleCellCount === 0) {
    return;
  }

  const width = context.canvas.clientWidth;
  const height = context.canvas.clientHeight;
  const zoom = map.getZoom();

  context.save();

  context.globalAlpha = 0.14;
  context.strokeStyle = "rgba(220, 245, 255, 0.55)";
  context.lineWidth = 1;

  const spacing = 34;
  const length = 7;
  const offset = Math.round(zoom * 19);

  for (let y = -spacing; y < height + spacing; y += spacing) {
    for (let x = -spacing; x < width + spacing; x += spacing) {
      const noise = Math.sin((x + offset) * 0.019 + y * 0.013) * 10;
      const startX = x + noise;
      const startY = y + Math.cos((y + offset) * 0.017) * 8;

      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(startX + length, startY + length * 0.42);
      context.stroke();
    }
  }

  context.restore();
}


function addTemperatureTexture(
  context: CanvasRenderingContext2D,
  map: MapLibreMap
) {
  const width = context.canvas.clientWidth;
  const height = context.canvas.clientHeight;
  const zoom = map.getZoom();

  context.save();

  context.globalAlpha = 0.07;
  context.strokeStyle = "rgba(255, 255, 255, 0.32)";
  context.lineWidth = 1;

  const spacing = 46;
  const length = 5;
  const offset = Math.round(zoom * 13);

  for (let y = -spacing; y < height + spacing; y += spacing) {
    for (let x = -spacing; x < width + spacing; x += spacing) {
      const noise = Math.sin((x + offset) * 0.017 + y * 0.011) * 8;
      const startX = x + noise;
      const startY = y + Math.cos((y + offset) * 0.013) * 7;

      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(startX + length, startY + length * 0.35);
      context.stroke();
    }
  }

  context.restore();
}


function getRainfallColor(value: number): string {
  if (value < 5) {
    return "#38bdf8";
  }

  if (value < 10) {
    return "#0ea5e9";
  }

  if (value < 25) {
    return "#22c55e";
  }

  if (value < 50) {
    return "#facc15";
  }

  if (value < 100) {
    return "#fb923c";
  }

  return "#ef4444";
}


function getRainfallAlpha(value: number): number {
  if (value < 5) {
    return 0.34;
  }

  if (value < 10) {
    return 0.42;
  }

  if (value < 25) {
    return 0.52;
  }

  if (value < 50) {
    return 0.62;
  }

  if (value < 100) {
    return 0.7;
  }

  return 0.78;
}


function getRainfallRadius(value: number, zoom: number): number {
  const baseRadius = 15 + zoom * 2.8;

  if (value < 5) {
    return baseRadius * 0.85;
  }

  if (value < 10) {
    return baseRadius;
  }

  if (value < 25) {
    return baseRadius * 1.12;
  }

  if (value < 50) {
    return baseRadius * 1.25;
  }

  if (value < 100) {
    return baseRadius * 1.38;
  }

  return baseRadius * 1.52;
}


function getTemperatureColor(value: number): string {
  if (value < 15) {
    return "#60a5fa";
  }

  if (value < 22) {
    return "#22d3ee";
  }

  if (value < 28) {
    return "#facc15";
  }

  if (value < 32) {
    return "#fb923c";
  }

  if (value < 35) {
    return "#f97316";
  }

  return "#dc2626";
}


function getTemperatureAlpha(value: number): number {
  if (value < 22) {
    return 0.5;
  }

  if (value < 28) {
    return 0.56;
  }

  if (value < 32) {
    return 0.64;
  }

  if (value < 35) {
    return 0.72;
  }

  return 0.8;
}


function getTemperatureRadius(zoom: number): number {
  return 60 + zoom * 12;
}


function clipToAssamBoundary(
  context: CanvasRenderingContext2D,
  map: MapLibreMap
) {
  buildGeoJsonBoundaryPath(context, map, assamOuterBoundaryGeoJson);
  context.clip("evenodd");
}


function drawDistrictBoundaryStroke(
  context: CanvasRenderingContext2D,
  map: MapLibreMap
) {
  context.save();

  buildGeoJsonBoundaryPath(context, map, assamDistrictBoundaryGeoJson);

  context.strokeStyle = "rgba(15, 23, 42, 0.65)";
  context.lineWidth = 1.15;
  context.shadowColor = "rgba(255, 255, 255, 0.32)";
  context.shadowBlur = 2;
  context.stroke();

  context.strokeStyle = "rgba(248, 250, 252, 0.45)";
  context.lineWidth = 0.55;
  context.shadowBlur = 0;
  context.stroke();

  context.restore();
}


function drawAssamOuterBoundaryStroke(
  context: CanvasRenderingContext2D,
  map: MapLibreMap
) {
  context.save();

  buildGeoJsonBoundaryPath(context, map, assamOuterBoundaryGeoJson);

  context.strokeStyle = "rgba(248, 250, 252, 0.98)";
  context.lineWidth = 2.4;
  context.shadowColor = "rgba(0, 0, 0, 0.88)";
  context.shadowBlur = 8;
  context.stroke();

  context.restore();
}


function drawImportantPlaceLabels(
  context: CanvasRenderingContext2D,
  map: MapLibreMap
) {
  const zoom = map.getZoom();

  context.save();

  context.font = zoom >= 7 ? "800 13px system-ui" : "800 12px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const label of importantPlaceLabels) {
    const projected = map.project([label.longitude, label.latitude]);

    drawLabelText(context, label.name, projected.x, projected.y);
  }

  context.restore();
}


function drawLabelText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
) {
  context.save();

  context.lineWidth = 4;
  context.strokeStyle = "rgba(2, 6, 23, 0.92)";
  context.strokeText(text, x, y);

  context.fillStyle = "rgba(248, 250, 252, 0.96)";
  context.fillText(text, x, y);

  context.restore();
}


function buildGeoJsonBoundaryPath(
  context: CanvasRenderingContext2D,
  map: MapLibreMap,
  geoJson: FeatureCollection<Geometry>
) {
  context.beginPath();

  for (const feature of geoJson.features) {
    const geometry = feature.geometry;

    if (!geometry) {
      continue;
    }

    if (geometry.type === "Polygon") {
      addPolygonToPath(context, map, geometry);
    }

    if (geometry.type === "MultiPolygon") {
      addMultiPolygonToPath(context, map, geometry);
    }
  }
}


function addPolygonToPath(
  context: CanvasRenderingContext2D,
  map: MapLibreMap,
  polygon: Polygon
) {
  for (const ring of polygon.coordinates) {
    ring.forEach(([longitude, latitude], index) => {
      const projected = map.project([longitude, latitude]);

      if (index === 0) {
        context.moveTo(projected.x, projected.y);
      } else {
        context.lineTo(projected.x, projected.y);
      }
    });

    context.closePath();
  }
}


function addMultiPolygonToPath(
  context: CanvasRenderingContext2D,
  map: MapLibreMap,
  multiPolygon: MultiPolygon
) {
  for (const polygonCoordinates of multiPolygon.coordinates) {
    for (const ring of polygonCoordinates) {
      ring.forEach(([longitude, latitude], index) => {
        const projected = map.project([longitude, latitude]);

        if (index === 0) {
          context.moveTo(projected.x, projected.y);
        } else {
          context.lineTo(projected.x, projected.y);
        }
      });

      context.closePath();
    }
  }
}


function hexToRgba(hex: string, alpha: number): string {
  const normalizedHex = hex.replace("#", "");

  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}