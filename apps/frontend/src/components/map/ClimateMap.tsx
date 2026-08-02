import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection, Geometry, Point, Polygon } from "geojson";

import assamDistrictBoundaries from "../../data/geojson/assam-district-boundaries.json";
import assamOuterBoundary from "../../data/geojson/assam-outer-boundary.json";

import { SmoothClimateOverlay } from "./SmoothClimateOverlay";

import type {
  RainfallFieldResponse,
  TemperatureFieldResponse,
  RainfallScenarioResponse,
  ScenarioComparisonMode,
} from "../../services/api";


type ClimateLayer = "rainfall" | "TMEAN" | "TMAX" | "TMIN";


interface ClimateMapProps {
  rainfallData: RainfallFieldResponse | null;
  temperatureData: TemperatureFieldResponse | null;
  activeLayer: ClimateLayer;
  rainfallScenarioResult: RainfallScenarioResponse | null;
  simulationComparisonMode: ScenarioComparisonMode;
  simulationProgress: number;
}


const RAINFALL_GRID_SIZE_DEGREES = 0.25;

const assamDistrictBoundaryGeoJson =
  assamDistrictBoundaries as FeatureCollection<Geometry>;

const assamOuterBoundaryGeoJson =
  assamOuterBoundary as FeatureCollection<Geometry>;


const rainfallLegendItems = [
  { label: "Trace", range: "≤ 0.1 mm", color: "#eff6ff" },
  { label: "Light", range: "0.1–10 mm", color: "#38bdf8" },
  { label: "Moderate", range: "10–25 mm", color: "#22c55e" },
  { label: "Heavy", range: "25–50 mm", color: "#facc15" },
  { label: "Very Heavy", range: "50–100 mm", color: "#fb923c" },
  { label: "Extreme", range: "≥ 100 mm", color: "#ef4444" },
];


const temperatureLegendItems = [
  { label: "Very Cool", range: "< 15 °C", color: "#60a5fa" },
  { label: "Cool", range: "15–22 °C", color: "#22d3ee" },
  { label: "Mild", range: "22–28 °C", color: "#facc15" },
  { label: "Warm", range: "28–32 °C", color: "#fb923c" },
  { label: "Hot", range: "32–35 °C", color: "#f97316" },
  { label: "Very Hot", range: "≥ 35 °C", color: "#dc2626" },
];

const rainfallDifferenceLegendItems = [
  { label: "Reduction", range: "< -10 mm", color: "#2563eb" },
  { label: "Slight reduction", range: "-10–0 mm", color: "#22d3ee" },
  { label: "Minimal change", range: "≈ 0 mm", color: "#94a3b8" },
  { label: "Increase", range: "0–20 mm", color: "#facc15" },
  { label: "Strong increase", range: "20–50 mm", color: "#f97316" },
  { label: "Extreme increase", range: "> 50 mm", color: "#ef4444" },
];


export function ClimateMap({
  rainfallData,
  temperatureData,
  activeLayer,
  rainfallScenarioResult,
  simulationComparisonMode,
  simulationProgress,
}: ClimateMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const latestRainfallDataRef = useRef<RainfallFieldResponse | null>(null);
  const latestTemperatureDataRef = useRef<TemperatureFieldResponse | null>(null);

  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    latestRainfallDataRef.current = rainfallData;
  }, [rainfallData]);

  useEffect(() => {
    latestTemperatureDataRef.current = temperatureData;
  }, [temperatureData]);

  const rainfallGeoJson = useMemo(() => {
    return buildRainfallGeoJson(rainfallData);
  }, [rainfallData]);

  const temperatureGeoJson = useMemo(() => {
    return buildTemperatureGeoJson(temperatureData);
  }, [temperatureData]);

  const isDifferenceMode =
    activeLayer === "rainfall" &&
    rainfallScenarioResult !== null &&
    simulationComparisonMode === "difference";

  const legendItems = isDifferenceMode
    ? rainfallDifferenceLegendItems
    : activeLayer === "rainfall"
      ? rainfallLegendItems
      : temperatureLegendItems;

  const legendTitle = isDifferenceMode
    ? "Scenario Difference"
    : activeLayer === "rainfall"
      ? simulationComparisonMode === "simulated" && rainfallScenarioResult
        ? `Simulated Rainfall · ${Math.round(simulationProgress * 100)}%`
        : "Rainfall Intensity"
      : `${activeLayer} Temperature`;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          cartoDark: {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors © CARTO",
          },
        },
        layers: [
          {
            id: "carto-dark",
            type: "raster",
            source: "cartoDark",
            paint: {
              "raster-opacity": 0.95,
            },
          },
        ],
      },
      center: [93.4, 26.25],
      zoom: 6.75,
      attributionControl: {
        compact: true,
      },
    });

    mapRef.current = map;
    setMapInstance(map);

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("rainfall-field", {
        type: "geojson",
        data: rainfallGeoJson,
      });

      map.addSource("temperature-field", {
        type: "geojson",
        data: temperatureGeoJson,
      });

      map.addSource("assam-district-boundaries", {
        type: "geojson",
        data: assamDistrictBoundaryGeoJson,
      });

      map.addSource("assam-outer-boundary", {
        type: "geojson",
        data: assamOuterBoundaryGeoJson,
      });

      map.addLayer({
        id: "rainfall-field-click-target",
        type: "fill",
        source: "rainfall-field",
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.01,
        },
      });

      map.addLayer({
        id: "temperature-field-click-target",
        type: "circle",
        source: "temperature-field",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            12,
            7,
            18,
            9,
            28,
          ],
          "circle-color": "#ffffff",
          "circle-opacity": 0.01,
          "circle-stroke-opacity": 0,
        },
      });

      map.on("mouseenter", "rainfall-field-click-target", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "rainfall-field-click-target", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("mouseenter", "temperature-field-click-target", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "temperature-field-click-target", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "rainfall-field-click-target", (event) => {
        const feature = event.features?.[0];
        const currentRainfallData = latestRainfallDataRef.current;

        if (!feature || !event.lngLat || !currentRainfallData) {
          return;
        }

        const properties = feature.properties as {
          rainfall_mm?: number;
          latitude?: number;
          longitude?: number;
        };

        const rainfallMm = Number(properties.rainfall_mm ?? 0);
        const latitude = Number(properties.latitude ?? 0);
        const longitude = Number(properties.longitude ?? 0);

        showPopup(
          map,
          popupRef,
          event.lngLat,
          buildRainfallPopupHtml({
            date: currentRainfallData.date,
            rainfallMm,
            latitude,
            longitude,
          })
        );
      });

      map.on("click", "temperature-field-click-target", (event) => {
        const feature = event.features?.[0];
        const currentTemperatureData = latestTemperatureDataRef.current;

        if (!feature || !event.lngLat || !currentTemperatureData) {
          return;
        }

        const properties = feature.properties as {
          variable?: string;
          temperature_c?: number;
          latitude?: number;
          longitude?: number;
        };

        const variable = String(
          properties.variable ?? currentTemperatureData.variable
        );
        const temperatureC = Number(properties.temperature_c ?? 0);
        const latitude = Number(properties.latitude ?? 0);
        const longitude = Number(properties.longitude ?? 0);

        showPopup(
          map,
          popupRef,
          event.lngLat,
          buildTemperaturePopupHtml({
            date: currentTemperatureData.date,
            variable,
            temperatureC,
            latitude,
            longitude,
          })
        );
      });

      setIsMapReady(true);

      window.setTimeout(() => {
        map.resize();
        fitMapToAssam(map);
      }, 150);
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    const rainfallSource = map.getSource("rainfall-field") as
      | GeoJSONSource
      | undefined;

    const temperatureSource = map.getSource("temperature-field") as
      | GeoJSONSource
      | undefined;

    if (rainfallSource) {
      rainfallSource.setData(rainfallGeoJson);
    }

    if (temperatureSource) {
      temperatureSource.setData(temperatureGeoJson);
    }
  }, [rainfallGeoJson, temperatureGeoJson, isMapReady]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    popupRef.current?.remove();
    popupRef.current = null;

    applyClickLayerVisibility(map, activeLayer);

    window.setTimeout(() => {
      map.resize();
      fitMapToAssam(map);
    }, 80);
  }, [activeLayer, rainfallGeoJson, temperatureGeoJson, isMapReady]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#020617",
      }}
    >
      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      <SmoothClimateOverlay
        map={mapInstance}
        isMapReady={isMapReady}
        activeLayer={activeLayer}
        rainfallData={rainfallData}
        temperatureData={temperatureData}
        rainfallScenarioResult={rainfallScenarioResult}
        simulationComparisonMode={simulationComparisonMode}
        simulationProgress={simulationProgress}
      />

      <MapLegend
        title={legendTitle}
        items={legendItems}
        activeLayer={activeLayer}
      />
    </div>
  );
}


interface MapLegendProps {
  title: string;
  items: {
    label: string;
    range: string;
    color: string;
  }[];
  activeLayer: ClimateLayer;
}


function MapLegend({ title, items, activeLayer }: MapLegendProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: "18px",
        bottom: "96px",
        background: "rgba(15, 23, 42, 0.82)",
        border: "1px solid rgba(148, 163, 184, 0.35)",
        borderRadius: "16px",
        padding: "13px",
        minWidth: "210px",
        boxShadow: "0 18px 40px rgba(2, 6, 23, 0.45)",
        backdropFilter: "blur(14px)",
        zIndex: 6,
      }}
    >
      <p
        style={{
          margin: "0 0 9px",
          color: "#f9fafb",
          fontSize: "13px",
          fontWeight: 950,
        }}
      >
        {title}
      </p>

      <div
        style={{
          display: "grid",
          gap: "7px",
        }}
      >
        {items.map((item) => (
          <div
            key={`${activeLayer}-${item.label}`}
            style={{
              display: "grid",
              gridTemplateColumns: "18px 1fr auto",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                width: "18px",
                height: "12px",
                borderRadius: activeLayer === "rainfall" ? "3px" : "999px",
                background: item.color,
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            />

            <span
              style={{
                color: "#e5e7eb",
                fontSize: "12px",
                fontWeight: 850,
              }}
            >
              {item.label}
            </span>

            <span
              style={{
                color: "#cbd5e1",
                fontSize: "11px",
                fontWeight: 750,
              }}
            >
              {item.range}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


function applyClickLayerVisibility(map: MapLibreMap, activeLayer: ClimateLayer) {
  const rainfallVisibility = activeLayer === "rainfall" ? "visible" : "none";
  const temperatureVisibility = activeLayer === "rainfall" ? "none" : "visible";

  if (map.getLayer("rainfall-field-click-target")) {
    map.setLayoutProperty(
      "rainfall-field-click-target",
      "visibility",
      rainfallVisibility
    );
  }

  if (map.getLayer("temperature-field-click-target")) {
    map.setLayoutProperty(
      "temperature-field-click-target",
      "visibility",
      temperatureVisibility
    );
  }
}


function buildRainfallGeoJson(
  data: RainfallFieldResponse | null
): FeatureCollection<Polygon> {
  if (!data) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  return {
    type: "FeatureCollection",
    features: data.cells.map((cell) => {
      const halfSize = RAINFALL_GRID_SIZE_DEGREES / 2;

      return {
        type: "Feature",
        properties: {
          value: cell.rainfall_mm,
          rainfall_mm: cell.rainfall_mm,
          latitude: cell.latitude,
          longitude: cell.longitude,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [cell.longitude - halfSize, cell.latitude - halfSize],
              [cell.longitude + halfSize, cell.latitude - halfSize],
              [cell.longitude + halfSize, cell.latitude + halfSize],
              [cell.longitude - halfSize, cell.latitude + halfSize],
              [cell.longitude - halfSize, cell.latitude - halfSize],
            ],
          ],
        },
      };
    }),
  };
}


function buildTemperatureGeoJson(
  data: TemperatureFieldResponse | null
): FeatureCollection<Point> {
  if (!data) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  return {
    type: "FeatureCollection",
    features: data.cells.map((cell) => {
      return {
        type: "Feature",
        properties: {
          variable: data.variable,
          value: cell.temperature_c,
          temperature_c: cell.temperature_c,
          latitude: cell.latitude,
          longitude: cell.longitude,
        },
        geometry: {
          type: "Point",
          coordinates: [cell.longitude, cell.latitude],
        },
      };
    }),
  };
}


function showPopup(
  map: MapLibreMap,
  popupRef: MutableRefObject<maplibregl.Popup | null>,
  lngLat: maplibregl.LngLat,
  html: string
) {
  popupRef.current?.remove();

  popupRef.current = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: "280px",
    className: "climate-popup",
  })
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(map);
}


function buildRainfallPopupHtml({
  date,
  rainfallMm,
  latitude,
  longitude,
}: {
  date: string;
  rainfallMm: number;
  latitude: number;
  longitude: number;
}) {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="font-size: 12px; font-weight: 900; color: #0284c7; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">
        Rainfall Source Cell
      </div>

      <div style="font-size: 16px; font-weight: 900; color: #111827; margin-bottom: 8px;">
        ${rainfallMm.toFixed(2)} mm
      </div>

      <div style="font-size: 13px; color: #374151; line-height: 1.6;">
        <strong>Date:</strong> ${date}<br />
        <strong>Latitude:</strong> ${latitude.toFixed(2)}<br />
        <strong>Longitude:</strong> ${longitude.toFixed(2)}
      </div>
    </div>
  `;
}


function buildTemperaturePopupHtml({
  date,
  variable,
  temperatureC,
  latitude,
  longitude,
}: {
  date: string;
  variable: string;
  temperatureC: number;
  latitude: number;
  longitude: number;
}) {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="font-size: 12px; font-weight: 900; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">
        Temperature Source Cell
      </div>

      <div style="font-size: 16px; font-weight: 900; color: #111827; margin-bottom: 8px;">
        ${variable}: ${temperatureC.toFixed(2)} °C
      </div>

      <div style="font-size: 13px; color: #374151; line-height: 1.6;">
        <strong>Date:</strong> ${date}<br />
        <strong>Latitude:</strong> ${latitude.toFixed(2)}<br />
        <strong>Longitude:</strong> ${longitude.toFixed(2)}
      </div>
    </div>
  `;
}


function fitMapToAssam(map: MapLibreMap) {
  const coordinates: { longitude: number; latitude: number }[] = [];

  for (const feature of assamOuterBoundaryGeoJson.features) {
    const geometry = feature.geometry;

    if (!geometry) {
      continue;
    }

    if (geometry.type === "Polygon") {
      for (const ring of geometry.coordinates) {
        for (const [longitude, latitude] of ring) {
          coordinates.push({ longitude, latitude });
        }
      }
    }

    if (geometry.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          for (const [longitude, latitude] of ring) {
            coordinates.push({ longitude, latitude });
          }
        }
      }
    }
  }

  if (coordinates.length === 0) {
    return;
  }

  const bounds = coordinates.reduce(
    (currentBounds, coordinate) => {
      return currentBounds.extend([
        coordinate.longitude,
        coordinate.latitude,
      ]);
    },
    new maplibregl.LngLatBounds(
      [coordinates[0].longitude, coordinates[0].latitude],
      [coordinates[0].longitude, coordinates[0].latitude]
    )
  );

  map.fitBounds(bounds, {
    padding: {
      top: 92,
      right: 280,
      bottom: 128,
      left: 360,
    },
    duration: 450,
    maxZoom: 7.25,
  });
}