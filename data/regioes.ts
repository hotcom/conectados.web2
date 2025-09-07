import type { FeatureCollection, Polygon } from "geojson"

// Polígonos simplificados (retângulos aproximados) para demo.
// Substitua por GeoJSON oficial das regiões quando desejar.
export const regioesFC: FeatureCollection<Polygon, { nome: string }> = {
  type: "FeatureCollection",
  features: [
    poly("N", [-73, 5], [-44, -2]),
    poly("NE", [-47, -1], [-34, -17.5]),
    poly("CO", [-61, -7], [-45, -20.5]),
    poly("SE", [-51, -14.5], [-39, -25]),
    poly("S", [-57, -25], [-48, -33.8]),
  ],
}

function poly(nome: string, nw: [number, number], se: [number, number]) {
  const [west, north] = nw
  const [east, south] = se
  const coords = [
    [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ],
  ]
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: coords },
    properties: { nome },
  }
}
