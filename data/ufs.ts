import type { FeatureCollection, Polygon } from "geojson"

// UFs simplificadas em retângulos de referência para demo.
// Substitua por shapes oficiais de estados (IBGE) quando desejar.
export const ufsFC: FeatureCollection<Polygon, { uf: string }> = {
  type: "FeatureCollection",
  features: [
    box("AM", [-70, -2], [-58, -8]),
    box("PA", [-55.5, 1], [-46, -7]),
    box("CE", [-41.5, -2.5], [-37.5, -7.5]),
    box("PE", [-41.5, -7.5], [-34.5, -9.7]),
    box("BA", [-46, -8], [-37, -18]),
    box("GO", [-52.5, -15], [-48, -19.5]),
    box("MT", [-60, -11.5], [-52, -17]),
    box("MS", [-58, -20], [-53, -23.5]),
    box("SP", [-50.5, -20], [-44, -24.8]),
    box("RJ", [-44.7, -21.5], [-40.7, -23.4]),
    box("MG", [-51, -16.5], [-39.8, -22.5]),
    box("PR", [-54, -23], [-48, -26.5]),
    box("SC", [-53, -26.5], [-48.5, -29.5]),
    box("RS", [-57.8, -29.5], [-50, -33.8]),
    box("RN", [-38.8, -4.6], [-35.5, -6.8]),
    box("ES", [-41.1, -18.2], [-39.5, -20.9]),
    box("DF", [-48.1, -15.5], [-47.3, -16.2]),
    box("AP", [-53.2, 1.9], [-49.3, -1.2]),
  ],
}

function box(uf: string, nw: [number, number], se: [number, number]) {
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
    properties: { uf },
  }
}
