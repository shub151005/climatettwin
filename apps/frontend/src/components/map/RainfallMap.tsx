import { useEffect, useMemo, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type {
  GeoJSONSource,
  Map as MapLibreMap,
} from "maplibre-gl";
import type {
  FeatureCollection,
  Polygon,
} from "geojson";

import type { RainfallFieldResponse } from "../../services/api";


interface RainfallMapProps {
  data: RainfallFieldResponse;
}


type RainfallFeatureProperties = {
  rainfall_mm: number;
  category: string;
};


type RainfallFeatureCollection = FeatureCollection<
  Polygon,
  RainfallFeatureProperties
>;


const GRID_SIZE_DEGREES = 0.25;


function getRainfallCategory(value: number): string {
  if (value <= 0.1) {
    return "trace";
  }

  if (value < 10) {
    return "light";
  }

  if (value < 25) {
    return "moderate";
  }

  if (value < 50) {
    return "heavy";
  }

  if (value < 100) {
    return "very_heavy";
  }

  return "extreme";
}


function buildRainfallGeoJson(
  data: RainfallFieldResponse
): RainfallFeatureCollection {
  const halfGrid = GRID_SIZE_DEGREES / 2;

  return {
    type: "FeatureCollection",
    features: data.cells.map((cell) => {
      const west = cell.longitude - halfGrid;
      const east = cell.longitude + halfGrid;
      const south = cell.latitude - halfGrid;
      const north = cell.latitude + halfGrid;

      return {
        type: "Feature",
        properties: {
          rainfall_mm: cell.rainfall_mm,
          category: getRainfallCategory(cell.rainfall_mm),
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      };
    }),
  };
}


function getBoundsFromField(data: RainfallFieldResponse): maplibregl.LngLatBounds {
  const bounds = new maplibregl.LngLatBounds();

  data.cells.forEach((cell) => {
    bounds.extend([cell.longitude, cell.latitude]);
  });

  return bounds;
}


export function RainfallMap({ data }: RainfallMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const rainfallGeoJson = useMemo(() => {
    return buildRainfallGeoJson(data);
  }, [data]);

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
            attribution:
            "© OpenStreetMap contributors © CARTO",
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
      attributionControl:{
        compact: true,
        },
    });

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    map.on("load", () => {
      map.addSource("rainfall-field", {
        type: "geojson",
        data: rainfallGeoJson,
      });

      map.addLayer({
        id: "rainfall-field-fill",
        type: "fill",
        source: "rainfall-field",
        paint: {
          "fill-color": [
            "case",
            ["<=", ["get", "rainfall_mm"], 0.1],
            "#eff6ff",
            ["<", ["get", "rainfall_mm"], 10],
            "#bfdbfe",
            ["<", ["get", "rainfall_mm"], 25],
            "#60a5fa",
            ["<", ["get", "rainfall_mm"], 50],
            "#2563eb",
            ["<", ["get", "rainfall_mm"], 100],
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
          "line-color": "rgba(255,255,255,0.55)",
          "line-width": 0.4,
        },
      });

      const bounds = getBoundsFromField(data);

      map.fitBounds(bounds, {
        padding: 48,
        duration: 800,
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("rainfall-field") as
      | GeoJSONSource
      | undefined;

    if (!source) {
      return;
    }

    source.setData(rainfallGeoJson);
  }, [rainfallGeoJson]);

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
        <h3
         style={{
          margin: 0,
          fontSize: "22px",
          fontWeight: 800,
         }}
        >
  MapLibre Rainfall Layer — Assam
</h3>

        <p style={{ margin: "8px 0 0",
                    color: "#4b5563",
                    fontSize: "15px",
                    fontWeight: 500,
                    }}>
          {data.date} · {data.cell_count} valid grid cells · Mean{" "}
          {data.rainfall_mean_mm.toFixed(2)} mm/day · Max{" "}
          {data.rainfall_max_mm.toFixed(2)} mm/day
        </p>
      </div>

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "640px",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid #d1d5db",
        }}
      />
    </section>
  );
}