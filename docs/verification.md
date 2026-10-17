# Verificación de la versión 0.1.0

Fecha: 2026-10-17. Esta evidencia corresponde al código de esta entrega y a pruebas locales; no demuestra una instalación cloud ni una conexión a una cuenta real de ChatGPT/Claude.

## Resultados

| Comprobación | Resultado |
|---|---|
| TypeScript y tipos de rutas Next | PASS |
| Vitest: dominio, seguridad, autenticación, MCP y telemetría | 128/128 PASS, 14 archivos |
| Compilación Next.js de producción | PASS con DEMO_MODE=false y salida standalone |
| Arranque standalone de producción | PASS: página, health, readiness, catálogo y rechazo de acceso admin sin sesión |
| Diagnóstico de configuración y tablas locales | PASS, 9 comprobaciones |
| npm audit, dependencias de producción | 0 vulnerabilidades reportadas en esta ejecución |
| Navegador | 3/3 PASS: 2 recorridos escritorio/móvil y 1 recorrido final de configuración en caliente |

### Integridad y aislamiento

Las pruebas ejecutan SQL sobre archivos libSQL y PostgreSQL en WASM (PGlite), sin sustituir el motor por mocks. Cubren aislamiento de empresas, roles y scopes, claves foráneas compuestas, restricciones y RLS bajo un rol sin privilegios. Incluyen dos conexiones que compiten por stock, ausencia de stock negativo, recuperación posterior al conflicto, reintentos limitados, cancelación única, versiones, importes enteros, moneda confirmada, idempotencia persistente y rollback si falla la auditoría.

### Autenticación y MCP

Better Auth ejecuta sus migraciones reales tanto sobre SQLite como sobre PostgreSQL. Las pruebas realizan registro, login, organización, DCR, autorización con PKCE, consentimiento, JWT firmado, validación del recurso, rechazo de token alterado, refresh y revocación. El cliente y servidor del SDK MCP oficial intercambian herramientas y ejecutan cambios autorizados. No se sustituye OAuth ni JSON-RPC por una implementación de prueba.

La frontera HTTP de autenticación y discovery tiene pruebas adicionales con errores inyectados: conserva cookies, challenges y URLs originales; normaliza fallos inesperados como 503 con referencia de solicitud. Los mocks se usan para inyectar fallos y sustituir singletons por bases reales de prueba.

### Diagnóstico

Se verifican correlación entre capas, redacción de secretos/PII, resultados success/rejected/failure, respuestas 401/503 y continuidad del negocio cuando falla el exportador. La auditoría de negocio sí es obligatoria y transaccional. La revisión estática no encontró alertas críticas; sus advertencias de console se revisaron como salidas del CLI de migraciones y, en POS, falsos positivos sobre impresión de tickets.

No se verificó un collector OTLP externo. El navegador emite eventos de correlación; almacenamiento RUM y trazas distribuidas del frontend requieren un adaptador del cliente.

### Configuración en caliente y despliegue

Las pruebas verifican configuración por tenant, roles y scopes, escritura con versión esperada, conflicto concurrente y rollback de auditoría. La pausa rechaza nuevos pedidos dentro de la transacción; permite recuperar pedidos ya creados con la misma clave idempotente. MCP expone lectura y actualización con autorización y confirmación de la modificación.

Readiness valida conectividad, migraciones requeridas y tablas de autenticación; admite migraciones adicionales compatibles. Las pruebas distinguen base caída, esquema incompleto y fallo de autenticación: devuelven 503 normalizado mientras liveness sigue independiente de la base. El Dockerfile, manifiesto Kubernetes y guía de despliegue están preparados, pero no se ejecutó Docker ni una actualización real entre réplicas en este entorno. Continuidad, drenaje, CDN de assets y rollback deben validarse en la infraestructura elegida.

### Escala y extensibilidad

La lista de pedidos carga sus líneas en un lote acotado y mantiene el filtro de tenant. Las pruebas sobre libSQL y PostgreSQL comprueban dos consultas con resultados, una con lista vacía, paginación, aislamiento y snapshots de los precios originales; el dashboard usa como máximo cinco consultas. La migración de índice tenant/nombre/ID es aditiva. Esto reduce consultas, no demuestra una tasa de tráfico.

Los escenarios k6, el overlay de autoescalado y los contratos de nuevos modelos de negocio son preparación. No se ejecutó un benchmark remoto ni se demostró capacidad de miles o millones de usuarios simultáneos. Los perfiles de entregas físicas, acceso digital y suscripciones describen puertos, no proveedores activos; ver sus estados en el manifest.

## Recorridos de navegador

1. Crear un producto desde inventario y ajustar stock con motivo.
2. Encontrarlo por SKU en caja y registrar venta en efectivo.
3. Ver el ticket, comprobar cambio y recuperar la venta desde historial.
4. Comprobar la disminución de stock persistida.
5. Recorrer caja e inventario móvil conservando scroll horizontal dentro de la tabla.
6. Cambiar pausa/aviso desde Ajustes, observar el cambio en otra pestaña y comprobar rechazo sin consumir stock; reanudar y vender.

Las pruebas usan datos y base demo persistentes y verifican respuestas HTTP y estado de stock después de operar desde la interfaz. Capturan escritorio 1440 px y móvil 390 px, comprueban ausencia de desbordamiento horizontal de página y de errores JavaScript de la aplicación. Los reportes y capturas quedan en `test-results/` y `playwright-report/`, ignorados por git.

En este entorno el navegador se obtuvo de `@sparticuz/chromium` 153 mediante npm porque la descarga estándar de Chromium no estaba disponible. Playwright acepta `PLAYWRIGHT_EXECUTABLE_PATH` y `PLAYWRIGHT_EXTRA_ARGS` para ese caso; no hay una ruta local fija en el repositorio. Los tests inician Next con webpack. Una caché persistente de Turbopack dañada se apartó y la compilación de producción pasó con caché limpia. Las imágenes externas bloqueadas por el entorno usan el fallback visual; no se afirman pruebas de entrega de imágenes de terceros.

## Reproducir

En un checkout aislado:

```bash
npm ci
npm run demo:setup
npm run doctor
npm run typecheck
npm test
DEMO_MODE=false NEXT_TELEMETRY_DISABLED=1 npm run build
npx playwright install chromium
npm run test:e2e
```

Las pruebas de navegador modifican la base demo. No se ejecutan sobre datos del cliente. GitHub Actions incluye jobs independientes de tipos/pruebas/build y navegador; la ejecución alojada se consulta en la pestaña Actions del repositorio.

## Pendiente para cada instalación real

- Validar Supabase/Neon/Turso con sus credenciales, TLS, pooler, límites de transacción y backup/restauración.
- Desplegar por HTTPS y probar OAuth desde la cuenta y plan concretos de ChatGPT/Claude.
- Configurar proveedor de correo y recuperación de cuenta si forman parte del contrato del cliente.
- Configurar controles de tráfico público, retención de auditoría y datos, y collector/alertas si se requieren.
- Integrar y verificar terminales/pagos online y fiscalidad cuando correspondan. Esta versión registra efectivo y emite comprobantes internos, no facturas fiscales.
