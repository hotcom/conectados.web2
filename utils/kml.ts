import type { FeatureCollection, Point, Polygon } from "geojson"

export function unitsToKml(fc: FeatureCollection<Point, any>) {
  const placemarks = fc.features
    .map((f) => {
      const [lng, lat] = f.geometry.coordinates
      const { nome, uf, regiao, tipo, pastor, id } = f.properties
      const name = escapeXml(`${nome}`)
      const desc = escapeXml(
        `ID: ${id || ""}
Tipo: ${tipo?.toUpperCase() || ""}
UF: ${uf || ""}
Região: ${regiao || ""}
${pastor ? `Pastor: ${pastor}` : ""}`,
      )
      return `<Placemark>
  <name>${name}</name>
  <description>${desc}</description>
  <ExtendedData>
    <Data name="id"><value>${escapeXml(id || "")}</value></Data>
    <Data name="tipo"><value>${escapeXml(tipo || "")}</value></Data>
    <Data name="uf"><value>${escapeXml(uf || "")}</value></Data>
    <Data name="regiao"><value>${escapeXml(regiao || "")}</value></Data>
    <Data name="pastor"><value>${escapeXml(pastor || "")}</value></Data>
  </ExtendedData>
  <Point><coordinates>${lng},${lat},0</coordinates></Point>
</Placemark>`
    })
    .join("\n")
  return placemarks
}

export function polygonsToKml(fc: FeatureCollection<Polygon, any>) {
  const placemarks = fc.features
    .map((f) => {
      const name = escapeXml((f.properties?.nome || f.properties?.uf || "Polígono") as string)
      const coords = f.geometry.coordinates[0].map(([lng, lat]) => `${lng},${lat},0`).join(" ")
      return `<Placemark>
  <name>${name}</name>
  <Style><LineStyle><color>ff0000ff</color><width>2</width></LineStyle>
  <PolyStyle><color>3fff0000</color></PolyStyle></Style>
  <Polygon>
    <outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs>
  </Polygon>
</Placemark>`
    })
    .join("\n")
  return placemarks
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
