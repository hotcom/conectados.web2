# Isócronas por região (notas)

Isócronas dependem de uma rede viária com velocidades/custos (ex.: OpenStreetMap). PostGIS sozinho não gera isócronas sem a rede e uma engine de roteamento. Opções:

- pgRouting + rede OSM carregada: gerar isócronas por tempo/ distância a partir de cada unidade e agregar por região.
- Serviços externos (OSRM, Valhalla, OpenRouteService) via API; use Server Actions/cron para pré-calcular e salvar como camadas (tabela `isochrones` com MULTIPOLYGON por faixa de tempo).

Depois de pré-calculadas, sirva como GeoJSON pelos endpoints e renderize como layer fill no MapLibre.

Referência geoespacial: PostGIS e extensões para geo-consultas [^4].
