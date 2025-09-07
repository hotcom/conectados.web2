import type { FeatureCollection, Point } from "geojson"

export const unidadesFC: FeatureCollection<Point, any> = {
  type: "FeatureCollection",
  features: [
    // Norte
    f("U-001", "Manaus Centro", "AM", "N", "igreja", -3.119, -60.021, "Pr. João"),
    f("U-002", "Belém Sul", "PA", "N", "nucleo", -1.456, -48.503, "Pr. Adão"),
    f("U-003", "Porto Velho Leste", "RO", "N", "celula", -8.758, -63.903),

    // Nordeste
    f("U-010", "Fortaleza Aldeota", "CE", "NE", "igreja", -3.73, -38.521, "Pr. Lucas"),
    f("U-011", "Recife Centro", "PE", "NE", "nucleo", -8.047, -34.877),
    f("U-012", "Salvador Norte", "BA", "NE", "celula", -12.977, -38.501),

    // Centro-Oeste
    f("U-020", "Goiânia Bueno", "GO", "CO", "igreja", -16.686, -49.264),
    f("U-021", "Cuiabá Leste", "MT", "CO", "nucleo", -15.598, -56.097),
    f("U-022", "Campo Grande Oeste", "MS", "CO", "celula", -20.469, -54.62),

    // Sudeste
    f("U-030", "São Paulo Zona Sul", "SP", "SE", "igreja", -23.55, -46.633, "Pr. Marcelo"),
    f("U-031", "Campinas Taquaral", "SP", "SE", "nucleo", -22.905, -47.06),
    f("U-032", "Rio de Janeiro Barra", "RJ", "SE", "celula", -22.906, -43.172),
    f("U-033", "Belo Horizonte Centro-Sul", "MG", "SE", "igreja", -19.916, -43.934),

    // Sul
    f("U-040", "Curitiba Batel", "PR", "S", "igreja", -25.428, -49.273),
    f("U-041", "Florianópolis Trindade", "SC", "nucleo", -27.595, -48.549),
    f("U-042", "Porto Alegre Moinhos", "RS", "celula", -30.034, -51.217),

    // Extras
    f("U-050", "Natal Ponta Negra", "RN", "NE", "igreja", -5.794, -35.211),
    f("U-051", "Vitória Camburi", "ES", "SE", "nucleo", -20.32, -40.338),
    f("U-052", "Brasília Asa Sul", "DF", "CO", "celula", -15.794, -47.882),
    f("U-053", "Macapá Centro", "AP", "N", "nucleo", 0.038, -51.066),
  ],
}

function f(
  id: string,
  nome: string,
  uf: string,
  regiao: "N" | "NE" | "CO" | "SE" | "S",
  tipo: "igreja" | "nucleo" | "celula",
  lat: number,
  lng: number,
  pastor?: string,
) {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: { id, nome, uf, regiao, tipo, pastor },
  }
}
