# Historial de cambios

[English](CHANGELOG.md) · [Español](CHANGELOG.es.md)

## Sin publicar como versión

### Añadido

- Internacionalización: interfaz en inglés (predeterminado) y español con diccionarios tipados en `src/i18n`, selector de idioma por persona (cookie, luego `Accept-Language` y por último el predeterminado de la instalación), formato de plurales, números y fechas por idioma y un camino documentado para añadir más idiomas ([guía](docs/i18n.md), en inglés).
- `npm run configure` gestiona idiomas (`--locales`, `--default-locale`) y la lista de monedas del formulario de productos (`--currencies`) con validación; `npm run doctor` comprueba la configuración de localización.
- `npm run docs:screenshots` captura todas las pantallas (22) desde una instancia real y aislada, y regenera la galería, las miniaturas y las cuadrículas de los README.
- Catálogo de ejemplo en inglés y español con precios según la moneda (`src/db/demo-catalog.ts`, `DEMO_LOCALE` opcional).

### Cambios

- **Valores por defecto:** la moneda predeterminada ahora es USD y el idioma y formato predeterminados son inglés (`en-US`); antes eran PYG y español (`es-PY`). Los precios existentes no se convierten. Para recuperar los valores anteriores: `npm run configure -- --default-locale es --locale es-PY --currency PYG`.
- Los mensajes de API, MCP y ajustes operativos ahora están en inglés canónico y conservan códigos de error estables; la interfaz traduce por código. Las integraciones que comparaban textos en español deben usar `error.code`.
- Las capturas del repositorio están en inglés y cubren todas las pantallas; se reemplazaron las cuatro imágenes anteriores en español/PYG.
- El catálogo de ejemplo del punto de venta ahora son diez productos en inglés, en USD y sin imágenes remotas.
- Las etiquetas de los scopes del consentimiento pasaron del formulario a los diccionarios.

### Correcciones

- El `pattern` del identificador de la empresa en el onboarding era una expresión regular inválida en los navegadores actuales (error de consola y validación omitida).
- La página de agentes conectados ya no provoca un desajuste de hidratación.
- La marca "opcional" del campo de imagen del producto ya no pasa a una línea propia.

### Pruebas

- 24 pruebas unitarias nuevas (paridad de diccionarios y marcadores, plurales, negociación de idioma con entradas hostiles, formato y lectura de importes, validación de configuración, script `configure`, traducción de errores, catálogo de ejemplo) y 4 recorridos de navegador nuevos (cambio de idioma sin recargar datos, primera visita según el navegador, cookie manipulada, inicio de sesión y 404 localizados, selector de moneda); los recorridos existentes ahora corren en inglés/USD.

### Documentación

- Nueva identidad InzaiQ Starter y comandos de clonado actualizados al nombre del repositorio.
- README principal en inglés y una versión completa en español, con navegación clara e índice de guías por idioma.
- Capturas reales de escritorio y móvil y una galería de las interfaces incluidas.

## 0.1.0 — 2026-10-17

- Template modular en Next.js con catálogo, inventario, pedidos, auditoría, aislamiento por empresa, roles e importes enteros respaldados por SQL real.
- SDK oficial de MCP, OAuth/PKCE con Better Auth, consentimiento por empresa, scopes y revocación inmediata.
- Precios del servidor, validación del total y moneda confirmados, control de versiones, idempotencia persistente y cancelación/reposición atómicas.
- Adaptadores PostgreSQL para Supabase/Neon y Turso/libSQL, migraciones portables, RLS con denegación predeterminada y datos de ejemplo exclusivos de desarrollo.
- Telemetría estructurada con redacción, OpenTelemetry opcional, diagnóstico y CI.
- Interfaz adaptable y documentación de ensamblaje para agentes.
- Pruebas de aislamiento entre empresas, rollback ante fallo de auditoría, ventas concurrentes, precios/monedas desactualizados y escrituras repetidas.
- Configuración operativa en caliente por empresa, actualizaciones con versión esperada, auditoría y herramientas MCP de ajustes.
- Docker standalone, readiness de esquema, despliegues graduales y guías de operación y rollback.

### Escala y extensibilidad

- Carga por lotes de las líneas de pedidos e índice de catálogo por empresa/nombre/ID.
- Pool PostgreSQL configurable, validado y con presupuesto por réplica.
- Guías de escala y extensión por módulos, con mapa de archivos y contratos para agentes.
