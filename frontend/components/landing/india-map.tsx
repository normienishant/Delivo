"use client";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const INDIA_TOPO = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CITIES = [
  { name: "Delhi", coordinates: [77.209, 28.6139] as [number, number] },
  { name: "Mumbai", coordinates: [72.8777, 19.076] as [number, number] },
  { name: "Bangalore", coordinates: [77.5946, 12.9716] as [number, number] },
  { name: "Kolkata", coordinates: [88.3639, 22.5726] as [number, number] },
  { name: "Chennai", coordinates: [80.2707, 13.0827] as [number, number] },
  { name: "Hyderabad", coordinates: [78.4867, 17.385] as [number, number] },
  { name: "Ahmedabad", coordinates: [72.5714, 23.0225] as [number, number] },
  { name: "Pune", coordinates: [73.8567, 18.5204] as [number, number] },
  { name: "Jaipur", coordinates: [75.7873, 26.9124] as [number, number] },
  { name: "Lucknow", coordinates: [80.9462, 26.8467] as [number, number] },
  { name: "Bhopal", coordinates: [77.4126, 23.2599] as [number, number] },
  { name: "Patna", coordinates: [85.1376, 25.5941] as [number, number] },
  { name: "Guwahati", coordinates: [91.7362, 26.1445] as [number, number] },
  { name: "Chandigarh", coordinates: [76.7794, 30.7333] as [number, number] },
  { name: "Kochi", coordinates: [76.2673, 9.9312] as [number, number] },
  { name: "Indore", coordinates: [75.8577, 22.7196] as [number, number] },
  { name: "Nagpur", coordinates: [79.0882, 21.1458] as [number, number] },
  { name: "Visakhapatnam", coordinates: [83.2185, 17.6868] as [number, number] },
  { name: "Surat", coordinates: [72.8311, 21.1702] as [number, number] },
  { name: "Srinagar", coordinates: [74.7973, 34.0837] as [number, number] },
];

export default function IndiaMap() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1650,       // large, slight cutoff okay
          center: [81, 23],  // central India, slight adjustment to minimize NE/Srinagar clip
        }}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        <Geographies geography={INDIA_TOPO}>
          {({ geographies }) =>
            geographies
              .filter((geo) => geo.id === "356")
              .map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="rgba(245, 158, 11, 0.04)"
                  stroke="#f59e0b"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      fill: "rgba(245, 158, 11, 0.1)",
                      strokeWidth: 0.6,
                      transition: "0.3s",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              ))
          }
        </Geographies>

        {CITIES.map((city, i) => (
          <Marker key={i} coordinates={city.coordinates}>
            <circle r={12} fill="none" stroke="#f59e0b" strokeWidth={0.4} opacity={0.7}>
              <animate attributeName="r" values="8;20;8" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle r={6.5} fill="#f59e0b" opacity={0.95}>
              <animate attributeName="opacity" values="0.95;0.4;0.95" dur="2s" repeatCount="indefinite" />
            </circle>
            {i < 10 && (
              <text
                textAnchor="middle"
                y={-20}
                fill="#f59e0b"
                fontSize={10}
                opacity={0.8}
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.5"
              >
                {city.name.toUpperCase()}
              </text>
            )}
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}