# testing.md — Requisitos y estándares de testing

## Herramientas

- **Vitest** para pruebas unitarias de funciones puras (parsing, validación, transformación de
  datos).
- **TestSprite** (integrado vía MCP en Cursor) para generación y ejecución automatizada de pruebas
  end-to-end y de la API, y para detección de regresiones.

## Casos límite obligatorios (definir "hecho" para el pipeline de extracción)

La lógica de extracción no se considera terminada hasta que maneje correctamente, sin romper la UI:

1. CV en PDF de una sola página, formato simple (caso feliz).
2. CV en PDF de múltiples páginas (3+).
3. CV con diseño de dos columnas.
4. CV sin una o más secciones (ej. sin sección de educación).
5. CV escaneado como imagen, sin capa de texto extraíble (debe mostrar error claro, no colapsar).
6. Archivo que no es un CV o no es un PDF válido (debe rechazarse con mensaje claro antes de llegar
   a la API de Claude, para no gastar tokens innecesariamente).
7. CV en español y CV en inglés (si se implementa el extra de bilingüe).
8. Respuesta de la API de Claude que no cumple el schema esperado (debe manejarse con Zod, sin
   romper el render).

## Pruebas negativas obligatorias

- Subir un archivo de más de 4 MB (límite alineado con el máximo de payload de Vercel Functions,
  4.5 MB) → debe rechazarse antes de procesar.
- Subir un archivo con extensión `.pdf` falsa (contenido que no es realmente un PDF) → debe
  rechazarse por validación de contenido, no solo por extensión.
- Simular fallo de la API de Claude (timeout o error 5xx) → la UI debe mostrar un estado de error
  específico, no una pantalla en blanco ni un mensaje genérico de "algo salió mal".

## Cobertura mínima recomendada

No se busca 100% de cobertura (no es el foco del reto). Priorizar:

- 100% de los casos límite de la lista de arriba cubiertos con al menos una prueba.
- Cobertura razonable (no numérica estricta) de `/lib/extraction/*`, que es el corazón del 25% de
  "enfoque de extracción de datos" en la evaluación.
- No es necesario cubrir componentes puramente visuales con pruebas unitarias; para esos, TestSprite
  end-to-end es suficiente.
