import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection, Geometry, Point, Polygon } from "geojson";

import assamDistrictBoundaries from "../../data/geojson/assam-district-boundaries.json";
import assamOuterBoundary from "../../data/geojson/assam-outer-boundary.json";

import type {
  RainfallFieldResponse,
  TemperatureFieldResponse,
} from "../../services/api";


type ClimateLayer = "rainfall" | "TMEAN" | "TMAX" | "TMIN";


interface ClimateMapProps {
  rainfallData: RainfallFieldResponse | null;
  temperatureData: TemperatureFieldResponse | null;
  activeLayer: ClimateLayer;
}


const RAINFALL_GRID_SIZE_DEGREES = 0.25;

const assamDistrictBoundaryGeoJson =
  assamDistrictBoundaries as FeatureCollection<Geometry>;

const assamOuterBoundaryGeoJson =
  assamOuterBoundary as FeatureCollection<Geometry>;


export function ClimateMap({
  rainfallData,
  temperatureData,
  activeLayer,
}: ClimateMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const rainfallGeoJson = useMemo(() => {
    return buildRainfallGeoJson(rainfallData);
  }, [rainfallData]);

  const temperatureGeoJson = useMemo(() => {
    return buildTemperatureGeoJson(temperatureData);
  }, [temperatureData]);

  const activeStats = useMemo(() => {
    if (activeLayer === "rainfall" && rainfallData) {
      return {
        title: "Rainfall",
        date: rainfallData.date,
        value: `${rainfallData.rainfall_mean_mm.toFixed(2)} mm mean`,
        range: `${rainfallData.rainfall_min_mm.toFixed(
          2
        )}–${rainfallData.rainfall_max_mm.toFixed(2)} mm`,
        cells: rainfallData.cell_count,
      };
    }

    if (activeLayer !== "rainfall" && temperatureData) {
      return {
        title: temperatureData.variable,
        date: temperatureData.date,
        value: `${temperatureData.temperature_mean_c.toFixed(2)} °C mean`,
        range: `${temperatureData.temperature_min_c.toFixed(
          2
        )}–${temperatureData.temperature_max_c.toFixed(2)} °C`,
        cells: temperatureData.cell_count,
      };
    }

    return null;
  }, [activeLayer, rainfallData, temperatureData]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors © CARTO",
          },
        },
        layers: [
          {
            id: "carto",
            type: "raster",
            source: "carto",
          },
        ],
      },
      center: [93.5, 26.2],
      zoom: 6.4,
      attributionControl: {
        compact: true,
      },
    });

    mapRef.current = map;

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
        id: "rainfall-field-fill",
        type: "fill",
        source: "rainfall-field",
        paint: {
          "fill-color": [
            "case",
            ["<=", ["get", "value"], 0.1],
            "#eff6ff",
            ["<", ["get", "value"], 10],
            "#bfdbfe",
            ["<", ["get", "value"], 25],
            "#60a5fa",
            ["<", ["get", "value"], 50],
            "#2563eb",
            ["<", ["get", "value"], 100],
            "#1d4ed8",
            "#312e81",
          ],
          "fill-opacity": 0.72,
        },
      });

      map.addLayer({
        id: "rainfall-field-outline",
        type: "line",
        source: "rainfall-field",
        paint: {
          "line-color": "rgba(255,255,255,0.35)",
          "line-width": 0.45,
        },
      });

      map.addLayer({
        id: "temperature-field-circle",
        type: "circle",
        source: "temperature-field",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            10,
            7,
            16,
            9,
            24,
          ],
          "circle-color": [
            "case",
            ["<", ["get", "value"], 15],
            "#dbeafe",
            ["<", ["get", "value"], 22],
            "#93c5fd",
            ["<", ["get", "value"], 28],
            "#facc15",
            ["<", ["get", "value"], 32],
            "#fb923c",
            ["<", ["get", "value"], 35],
            "#ef4444",
            "#7f1d1d",
          ],
          "circle-opacity": 0.88,
          "circle-stroke-color": "#111827",
          "circle-stroke-width": 1.5,
        },
      });

      map.addLayer({
        id: "assam-district-boundary-line",
        type: "line",
        source: "assam-district-boundaries",
        paint: {
          "line-color": "rgba(17,24,39,0.45)",
          "line-width": 0.8,
          "line-opacity": 0.75,
        },
      });

      map.addLayer({
        id: "assam-outer-boundary-line",
        type: "line",
        source: "assam-outer-boundary",
        paint: {
          "line-color": "#111827",
          "line-width": 3.2,
          "line-opacity": 0.98,
        },
      });

      setIsMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
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

    applyLayerVisibility(map, activeLayer);

    if (activeLayer === "rainfall") {
      fitMapToPolygonGeoJson(map, rainfallGeoJson);
    } else {
      fitMapToPointGeoJson(map, temperatureGeoJson);
    }
  }, [activeLayer, rainfallGeoJson, temperatureGeoJson, isMapReady]);

  return (
    <section
      style={{
        marginTop: "24px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "20px",
              fontWeight: 800,
            }}
          >
            Climate Spatial Layer — Assam
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#4b5563",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Rainfall is rendered as 0.25° grid cells. Temperature is rendered as
            coarse 1° grid-center markers to avoid misleading polygon spillover.
          </p>
        </div>

        {activeStats && (
          <div
            style={{
              textAlign: "right",
              color: "#111827",
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            <div>
              {activeStats.title} · {activeStats.date}
            </div>
            <div>{activeStats.value}</div>
            <div style={{ color: "#6b7280" }}>
              Range {activeStats.range} · {activeStats.cells} cells
            </div>
          </div>
        )}
      </div>

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "520px",
        }}
      />
    </section>
  );
}


function applyLayerVisibility(map: MapLibreMap, activeLayer: ClimateLayer) {
  const rainfallVisibility = activeLayer === "rainfall" ? "visible" : "none";
  const temperatureVisibility = activeLayer === "rainfall" ? "none" : "visible";

  if (map.getLayer("rainfall-field-fill")) {
    map.setLayoutProperty(
      "rainfall-field-fill",
      "visibility",
      rainfallVisibility
    );
  }

  if (map.getLayer("rainfall-field-outline")) {
    map.setLayoutProperty(
      "rainfall-field-outline",
      "visibility",
      rainfallVisibility
    );
  }

  if (map.getLayer("temperature-field-circle")) {
    map.setLayoutProperty(
      "temperature-field-circle",
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


function fitMapToPolygonGeoJson(
  map: MapLibreMap,
  geoJson: FeatureCollection<Polygon>
) {
  if (geoJson.features.length === 0) {
    return;
  }

  const coordinates = geoJson.features.flatMap((feature) =>
    feature.geometry.coordinates[0].map(([longitude, latitude]) => ({
      longitude,
      latitude,
    }))
  );

  fitMapToCoordinates(map, coordinates);
}


function fitMapToPointGeoJson(
  map: MapLibreMap,
  geoJson: FeatureCollection<Point>
) {
  if (geoJson.features.length === 0) {
    return;
  }

  const coordinates = geoJson.features.map((feature) => {
    const [longitude, latitude] = feature.geometry.coordinates;

    return {
      longitude,
      latitude,
    };
  });

  fitMapToCoordinates(map, coordinates);
}


function fitMapToCoordinates(
  map: MapLibreMap,
  coordinates: { longitude: number; latitude: number }[]
) {
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
    padding: 64,
    duration: 500,
    maxZoom: 7.2,
  });
}