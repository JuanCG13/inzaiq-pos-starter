# Carga HTTP de lectura con k6

**Guion preparado; no hay benchmark de capacidad ejecutado.** Requiere k6 instalado por el operador; no se instala desde el proyecto ni se ejecuta en el CI existente. Es una prueba contra un servidor ya desplegado/autorizado de staging, con base y datos representativos aislados. El script no puede identificar si un hostname corresponde realmente a producción: revisar `BASE_URL` antes de arrancar. No ejecutar carga contra un servicio de terceros.

## Qué mide

Cada recorrido obtiene `GET /api/admin/products?limit=20&offset=…` y `GET /api/admin/orders?limit=20&offset=0`, con una sesión Better Auth válida y organización activa. El rol `viewer` permite ambas lecturas y evita conceder permisos de escritura al generador.

El `setup` comprueba `/api/health`, `/api/readiness` y catálogo no vacío antes de comenzar. Liveness no se usa como sustituto de una lectura de negocio. El script solo envía **GET**; no crea pedidos, cobra, modifica stock, registra cuentas ni rellena datos. La resolución/renovación de una sesión puede realizar mantenimiento interno de autenticación. No hay autenticación dentro del bucle mediante contraseñas.

Cada iteración inicia **dos solicitudes secuenciales** de negocio. `RATE=5` significa hasta 5 recorridos iniciados por segundo, aproximadamente 10 solicitudes de negocio/s en la meseta; no significa cinco usuarios humanos concurrentes. El modelo de llegada sigue ofreciendo tráfico aunque suba la latencia. Los VUs son ejecutores necesarios para sostener esa tasa, no cuentas ni sesiones reales. Si faltan, `dropped_iterations` hace fallar el ensayo en vez de presentar menor tráfico como éxito.

Las comprobaciones exigen estado 200, JSON y el contrato básico de productos/pedidos. Una página de login 200, HTML de proxy o respuesta vacía no cuenta como una lectura correcta. Los nombres de ruta en métricas no contienen IDs de producto, y no se registran bodies, cookies ni tokens. No habilitar `--http-debug`, volcados de entorno ni capturas de headers en un runner con credenciales.

## Preparación reproducible

1. Usar una imagen/revisión y una versión de k6 fijadas en el registro del ensayo. Base remota del mismo proveedor/región/clase que se quiere evaluar; SQLite local sirve para smoke funcional, no para estimar capacidad cloud.
2. Aplicar migraciones/configuración aprobadas y cargar datos sintéticos fuera de este script. Registrar número de tenants, productos, pedidos, líneas por pedido e índices. Debe existir al menos un producto visible. Para `CATALOG_PAGES>1`, cada página probada debe contener productos; una página vacía falla deliberadamente.
3. Activar métricas del generador, ingress, pods, HPA, DB/pooler y collector. Fijar presupuesto y criterio de interrupción antes de aumentar tasa. Ningún comando de esta guía crea recursos, pero ejecutarlo sí genera tráfico y puede consumir cuotas.
4. Crear una identidad de staging con rol `viewer`, iniciar sesión y seleccionar su organización. Obtener su header `Cookie` mediante el flujo autorizado; inyectarlo como secreto de entorno `AUTH_COOKIE`. No usar una clave Stripe, contraseña, token de servicio ni token OAuth MCP: los endpoints `/api/admin/*` resuelven sesión web, no Bearer MCP.

Instalar k6 según su [documentación oficial](https://grafana.com/docs/k6/latest/set-up/install-k6/); registrar `k6 version`. Desde la raíz del repositorio, en una shell de un runner autorizado:

```sh
mkdir -p test-results
export BASE_URL=https://staging.example.com
export RATE=5 RAMP_SECONDS=10 HOLD_SECONDS=30 DOWN_SECONDS=10
export PREALLOCATED_VUS=5 MAX_VUS=25 RUN_ID=staging-read-baseline
# Bash: lectura silenciosa; el secreto no se escribe en el comando ni en git.
read -r -s -p 'Cookie de sesión de staging: ' AUTH_COOKIE
export AUTH_COOKIE
k6 run --out json=test-results/load-metrics.json tests/load/read-journeys.js
unset AUTH_COOKIE
```

`BASE_URL` acepta solo un origen sin ruta, query ni credenciales. HTTP se admite únicamente para `localhost`, `127.0.0.1` o `[::1]`; los demás destinos requieren HTTPS verificado. Los redirects están desactivados para no reenviar credenciales a otro destino. `test-results/` ya está excluido de git. Proteger los artefactos del runner, conservar solo las métricas necesarias y sus fechas; no subir el entorno de ejecución.

Para varios tenants/identidades se admite `AUTH_COOKIES_JSON`, un array JSON de 1–500 headers Cookie completos, suministrado **solo por el gestor de secretos del runner**. No usarlo a la vez que `AUTH_COOKIE`. Cada VU conserva una identidad por índice; todas las sesiones deben tener organización activa, acceso de lectura y vigencia suficiente. El setup verifica la primera; las restantes se comprueban al ejecutar sus lecturas. El reparto por VU no garantiza porcentajes exactos de tráfico por tenant. Una sola cookie mide carga repetida sobre una sesión/tenant y no demuestra millones de sesiones distintas. Revocar las sesiones de prueba al finalizar y no desactivar expiración, permisos ni protecciones de login para mejorar resultados.

## Parámetros y umbrales

| Variable | Defecto | Rango / significado |
| --- | --- | --- |
| `BASE_URL` | Obligatoria | Origen autorizado; sin `/api` al final |
| `RATE` | 5 | 1–1000 recorridos/s en la meseta; límite del guion, no capacidad avalada |
| `RAMP_SECONDS` / `DOWN_SECONDS` | 10 / 10 | 1–300 segundos por fase |
| `HOLD_SECONDS` | 30 | 1–1800 segundos; usar una meseta sostenida tras el smoke |
| `PREALLOCATED_VUS` / `MAX_VUS` | 5 / 25 | 1–2000; máximo >= preasignados, consumirán recursos del generador |
| `PAGE_SIZE` / `CATALOG_PAGES` | 20 / 1 | 1–100 filas; 1–1000 páginas de catálogo; offset máximo generado 99900 |
| `TIMEOUT_SECONDS` | 5 | 1–30 por solicitud; no hay reintentos que oculten errores |
| `P95_MS` | 750 | p95 de solicitudes de negocio menor a este valor |
| `JOURNEY_P95_MS` | 1500 | p95 del recorrido completo de dos lecturas menor a este valor |
| `MAX_ERROR_RATE` | 0.01 | 0–0.1; tasas de fallos HTTP y de contrato menores o iguales |
| `RUN_ID` | `read-baseline` | 1–64 letras, dígitos, guiones o `_`; sin datos de clientes |

Los umbrales son ejemplos de aceptación para un ensayo, **no SLO contratados**. `http_reqs{phase:load}>0` evita un falso éxito sin muestras. `dropped_iterations==0` exige que el generador haya ofrecido lo planificado. Una tasa funcional superior al límite aborta tras el periodo inicial de evaluación de 10 segundos. Los límites de latencia se evalúan al finalizar. Un fallo de threshold produce salida no cero de k6: conservar ese código al integrarlo en automatización. No usar `|| true` para presentar una ejecución fallida como correcta.

## Cómo obtener una conclusión útil

- Empezar por el smoke de 50 segundos. Después repetir con rampas lentas y mesetas de varios minutos; el HPA tiene ventanas de estabilización mayores que el smoke. Comparar caché fría/caliente y una réplica frente a la configuración final, dentro del presupuesto de DB.
- Aumentar la tasa por escalones controlados; detener ante errores funcionales, saturación, timeouts, pérdida de readiness o límites de costo. No cambiar simultáneamente tasa, recursos, datos e índices si se quiere identificar la causa.
- Registrar revisión/digest, región, proveedor/clase DB, plan de consultas, número de filas/tenants, HPA/pools, cuotas, recursos del generador, parámetros, duración, llegadas ofrecidas, solicitudes completadas/s, VUs activos, dropped iterations, p50/p95/p99, errores y saturación.
- Un generador sin CPU/red o un `MAX_VUS` insuficiente invalida una afirmación sobre el límite del servidor. Un dataset pequeño y repetido tampoco representa un catálogo grande ni vecinos ruidosos entre tenants.
- Esta prueba no ejecuta navegador, descarga todos los assets, mide Web Vitals, MCP, checkout, webhooks, venta POS, stock concurrente, recuperación ni failover. Los flujos de escritura necesitan otro ensayo con sandbox del proveedor, stock sintético, idempotencia y comprobaciones de invariantes; **no usar ventas de producción como carga**.
- Repetir un mismo escenario estable y reportar el rango observado, no extrapolar una proporción lineal a millones. La capacidad válida pertenece a esa versión, infraestructura, mezcla de tráfico y SLO.

Fuentes oficiales: [ramping-arrival-rate](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-arrival-rate/), [thresholds y códigos de salida](https://grafana.com/docs/k6/latest/using-k6/thresholds/). Infraestructura y alcance: [enterprise](../../docs/enterprise.md), [HPA y presupuesto](../../deploy/enterprise/README.md).
