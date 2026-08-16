VERSIÓN PARA GITHUB PAGES

Esta versión es 100% estática: NO usa PHP, Node ni base de datos.
Sube únicamente index.html a GitHub Pages.

Funciones:
- CP exactamente 5 dígitos.
- CURP exactamente 18 caracteres.
- Consulta postal en navegador mediante Zippopotam.us.
- Obtiene coordenadas y datos de ubicación.
- Busca UMF/IMSS cercana con OpenStreetMap/Overpass.
- Desglosa la dirección.
- Copia datos individuales.
- Copia todo en texto.
- La CURP no se envía a las APIs externas y no se almacena.

IMPORTANTE:
GitHub Pages es hosting estático. La UMF se obtiene de datos cartográficos abiertos, por lo que puede faltar una unidad o tener datos incompletos. Para confirmar la UMF oficialmente asignada al derechohabiente, debe verificarse con IMSS.

PUBLICACIÓN:
1. Crea un repositorio público en GitHub.
2. Sube index.html en la raíz.
3. Settings > Pages.
4. Deploy from a branch.
5. Branch: main / root.
6. Save.
