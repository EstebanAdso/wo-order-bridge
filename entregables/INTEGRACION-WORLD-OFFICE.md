# Plan de integración con World Office Cloud (API)

> Este es el documento que describe **cómo se conecta la plataforma con World
> Office Cloud por API**. Es el 10% final del proyecto: se ejecuta contra la
> cuenta real del cliente, con contrato y accesos. Aquí se explica el qué, el
> cómo y el porqué, con los supuestos marcados y la forma de confirmarlos.

---

## 1. Resumen

La plataforma ya deja todo listo para enviar pedidos a World Office:

- Toda la app habla con World Office a través de **una sola interfaz**
  (`ClienteWorldOffice`, en `src/worldoffice/contrato.ts`).
- Durante el concurso corre la implementación **mock** (`cliente-mock.ts`), que
  simula las respuestas sin tocar la cuenta real.
- Para producción solo se completa la implementación **live**
  (`cliente-live.ts`) y se cambia una variable de entorno
  (`WORLDOFFICE_MODE=live`). **Nada más de la plataforma cambia.**

El archivo que se enviaría a World Office ya se genera hoy y se puede descargar
desde los paneles (botón "Estructura WO"). Lo construye
`construirPayloadWorldOffice()` — el **mismo** código que usará la conexión en
vivo, de modo que lo que se ve en el concurso es idéntico a lo que se enviará.

---

## 2. Arquitectura de la integración

```
Panel (vendedor/contable)
        │  llama
        ▼
obtenerClienteWorldOffice()        ← fábrica, elige mock o live por entorno
        │
        ├── ClienteWorldOfficeMock  (concurso: respuestas simuladas)
        └── ClienteWorldOfficeLive  (producción: HTTP real a World Office)
                 │ usa
                 ▼
        construirPayloadWorldOffice()  ← traduce Orden → JSON de World Office
```

**Por qué así:** aislar el proveedor detrás de una interfaz permite (a) construir
y demostrar el 90% sin acceso real, (b) cambiar a producción sin reescribir los
paneles, y (c) probar cada parte por separado.

---

## 3. Autenticación (real)

World Office Cloud expone una **API REST sobre HTTPS, con JSON y token JWT**
(plan Enterprise). Verificado contra la documentación pública:

- **URL base:** `https://api.worldoffice.cloud/api/v1`
- El token JWT **dura 12 horas**. Se obtiene de dos formas:
  - **Nube (recomendado):** en World Office → Menú → Configuración →
    Configuración General → sección **API**: se visualiza y copia el token.
  - **Programático/on-prem:** servicio `gestionarTokenAPILicencia` (POST con el
    `correo_electronico_registrado`).
- El token se guarda en `WORLDOFFICE_API_TOKEN` (variable de entorno, nunca en el
  código).
- **Importante:** el token NO va como `Bearer`. La cabecera real es:

  ```http
  Authorization: WO <WORLDOFFICE_API_TOKEN>
  Content-Type: application/json
  Accept: application/json
  ```

  Si falta el token, la API responde `401 Unauthorized`. Esto ya está
  implementado en `headers()` de `cliente-live.ts`.

---

## 4. Endpoints que usa la plataforma (reales)

Todos cuelgan de `https://api.worldoffice.cloud/api/v1`.

| Operación | Método | Ruta | Para qué |
|---|---|---|---|
| Crear/editar venta | `PUT` | `/documentos/editarDocumentoVenta` | Crea el documento (pedido o factura). Sin `id` = crear; con `id` = editar. |
| Consultar documento | `GET` | `/documentos/getDocumentoId/{id}` | Verifica el documento creado. |
| Eliminar documento | `DELETE` | `/documentos/eliminar/{id}` | Anular si hace falta. |
| Inventario | `GET` | `/inventario/listar` | Disponibilidad y `idInventario` por ítem. |
| Terceros | `GET` | `/terceros/buscar` | Resuelve el cliente (NIT → `idTerceroExterno`). |
| Buscar por referencia | `GET` | `/documentos/buscarPorReferencia` | Idempotencia: evita duplicar un pedido ya creado. |
| Tipos de documento | `GET` | (servicio "listar tipos de documento") | Confirma el código `documentoTipo` de pedido y factura. |

> **Rutas configurables:** las rutas cuyo nombre exacto se confirma contra la
> cuenta real (`documentoVenta`, `inventario`, `terceros`, `buscarDocumento`) se
> leen de variables de entorno (`WORLDOFFICE_RUTA_*`). Confirmar la integración =
> cambiar `.env`, **sin tocar el código**. Los valores por defecto están en
> `RUTAS_WO_DEFECTO` (`cliente-live.ts`).

El tipo de documento (`documentoTipo`) usa códigos: `"FV"` para **factura de
venta**; el de **pedido** se confirma con el servicio de tipos de documento (en
la plataforma es configurable: `WORLDOFFICE_DOCTIPO_PEDIDO`).

> **Pendiente de confirmar contra la cuenta real** (rutas exactas de
> `/inventario/listar` y `/terceros/buscar`, y la forma de su respuesta). El
> código las aísla en `cliente-live.ts` para que el ajuste sea de una línea.

### Cómo confirmamos lo que no es público

World Office no ofrece ambiente de pruebas público; la validación final es contra
la cuenta real. Plan:

1. Con el token de la cuenta Enterprise, llamar **listar tipos de documento**,
   **inventario** y **terceros** para conocer los IDs reales.
2. Cargar esos IDs en variables de entorno (sección 5).
3. Validar con **un pedido de bajo monto**, revisando con `getDocumentoId` que
   entró bien.
4. Activar `WORLDOFFICE_MODE=live`.

---

## 5. Mapeo de datos (Orden → World Office)

Hay **dos estructuras**, a propósito:

### a) Estructura neutra (legible, descargable)

La que se descarga desde los paneles ("Estructura WO"). Usa código contable y
NIT — pensada para que un humano la revise. La genera `payload.ts`:

```json
{
  "tipoDocumento": "PEDIDO",
  "fecha": "2026-06-28",
  "tercero": { "identificacion": "901222333-4", "nombre": "Refrigeración Andina" },
  "renglones": [
    { "codigoProducto": "0100178", "cantidad": 2, "valorUnitario": 38500,
      "descuentoPorcentaje": 10, "porcentajeIva": 19 }
  ],
  "referenciaExterna": "PED-000001"
}
```

### b) Cuerpo REAL de World Office (lo que envía el cliente live)

La API real referencia **inventario y terceros por ID numérico**, no por código.
Lo genera `mapeo-wo.ts` y lo envía `cliente-live.ts` a
`PUT /documentos/editarDocumentoVenta`:

```json
{
  "fecha": "2026-06-28",
  "documentoTipo": "FV",
  "idEmpresa": 2,
  "idTerceroExterno": 2946,
  "idTerceroInterno": 3664,
  "idFormaPago": 5,
  "idMoneda": 31,
  "trm": "1",
  "porcentajeDescuento": true,
  "valDescuento": 0,
  "reglones": [
    { "idInventario": 4517, "unidadMedida": "und", "cantidad": "2",
      "valorUnitario": "38500", "idBodega": 1, "porDescuento": 10,
      "concepto": "Sello mecánico 7 octavos, resorte corto Parxial" }
  ],
  "idDetalles": []
}
```

### Resolución de IDs (el punto clave de la integración)

Como World Office indexa por ID numérico, antes de enviar el documento hay que
traducir:

| Dato nuestro | Campo World Office | Cómo se resuelve |
|---|---|---|
| `codigo` contable (ej. `0100178`) | `idInventario` (ej. `4517`) | `GET /inventario/listar` → mapa código → idInventario. |
| `clienteNit` (ej. `901222333-4`) | `idTerceroExterno` (ej. `2946`) | `GET /terceros/buscar?identificacion=NIT`. |
| Vendedor responsable | `idTerceroInterno` | Config de la cuenta (`WORLDOFFICE_ID_TERCERO_INTERNO`). |
| Empresa | `idEmpresa` | Config (`WORLDOFFICE_ID_EMPRESA`). |
| Forma de pago / moneda / bodega | `idFormaPago` / `idMoneda` / `idBodega` | Config. |
| `descuentoPct` de la línea | `porDescuento` | Directo. |

**El punto crítico:** el **código contable** se conserva siempre (aunque el
vendedor busque por descripción) y es la llave para resolver el `idInventario`
correcto. Si un código no existe en World Office, el cliente live lo reporta sin
romper el flujo, para depurarlo.

---

## 6. Flujo end-to-end en producción

1. El vendedor arma la cotización y pulsa **Generar pedido**.
2. La plataforma crea la orden y llama `crearPedido(orden)` →
   `POST /v1/documentos` con el JSON de la sección 5.
3. World Office responde con el **id del documento**, que se guarda en la orden
   (`worldOfficeDocId`).
4. Se envía el **correo al área contable** (sección 8).
5. El contable revisa el pedido y pulsa **Convertir a factura** →
   `convertirEnFactura(orden)` crea/convierte el documento de venta.
6. El id de la factura queda asociado a la orden para trazabilidad.

El inventario que ve el vendedor se consulta con `consultarInventario(codigos)`
→ `GET /v1/inventario`, para mostrar disponibilidad **en vivo**.

---

## 7. Robustez: errores, idempotencia y reintentos

Toda la robustez de red vive en `src/worldoffice/http-wo.ts` (`HttpWorldOffice`),
que `cliente-live.ts` usa para **todas** sus llamadas. Ya está implementado:

- **Timeout:** cada petición se aborta con `AbortController` a los
  `WORLDOFFICE_TIMEOUT_MS` (def. 15 s) para que una llamada colgada no bloquee el
  pedido.
- **Reintentos con backoff:** ante errores transitorios (5xx, `429`, red/timeout)
  se reintenta con backoff exponencial (1 s, 3 s, 9 s), hasta
  `WORLDOFFICE_MAX_REINTENTOS` (def. 3). Los errores no transitorios (4xx) se
  propagan sin reintentar.
- **Rate limits:** si World Office responde `429`, se respeta la cabecera
  `Retry-After`.
- **Idempotencia:** antes de crear un pedido, `buscarDocumentoExistente()`
  consulta por `referenciaExterna` (nuestro consecutivo); si ya existe, devuelve
  ese id y **no duplica**. Si el servicio de búsqueda no está disponible, no
  bloquea el envío.
- **Pedido → factura sin duplicar:** `convertirEnFactura()` reutiliza el
  `worldOfficeDocId` del pedido y **edita** ese documento a factura, en lugar de
  crear uno nuevo.
- **Errores HTTP:** `cliente-live.ts` devuelve `ok:false` con código y cuerpo
  (`ErrorWorldOffice`) para mostrar/registrar el problema sin romper la app.
- **Registro:** cada envío guarda el `payloadEnviado` (en `ResultadoWorldOffice`)
  para auditoría.

---

## 8. Notificación por correo (Gmail API)

Cuando entra un pedido, el área contable recibe un correo (ver
`src/lib/notificaciones/`).

- **Demo:** `NotificadorConsola` imprime el correo en consola.
- **Producción:** `NotificadorGmail` envía vía Gmail con **OAuth2**.

Pasos para habilitar Gmail:

1. En Google Cloud Console, crear un proyecto y habilitar la **Gmail API**.
2. Crear credenciales **OAuth 2.0** (Client ID y Client Secret).
3. Autorizar la cuenta remitente de la empresa y obtener un **refresh token**
   con el scope `https://www.googleapis.com/auth/gmail.send`.
4. Cargar en variables de entorno: `GMAIL_SENDER`, `GMAIL_CLIENT_ID`,
   `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` y `NOTIFICACIONES_CONTABLE_TO`.

Con esas variables presentes, la app usa Gmail automáticamente; sin ellas, cae
al modo consola. No hay que tocar código.

---

## 9. Seguridad

- **Secretos solo en variables de entorno** (`.env.local`), nunca en el código
  ni en el repositorio. La plantilla es `.env.example`.
- El token de World Office y las credenciales de Gmail se tratan como
  contraseñas; se rotan si se filtran.
- Las llamadas al API solo se hacen **desde el servidor** (Server Actions / Route
  Handlers), nunca desde el navegador, para no exponer el token.

---

## 10. Checklist de activación (lo ejecuta el ganador)

- [ ] Obtener token de API de la cuenta World Office Enterprise del cliente.
- [ ] Confirmar rutas y esquema de autenticación reales.
- [ ] Ajustar `cliente-live.ts` y `payload.ts` según el mapeo confirmado.
- [ ] Cargar variables de entorno de World Office y Gmail en producción.
- [ ] Probar un pedido real de bajo monto y validar en World Office.
- [ ] Probar una factura real de bajo monto.
- [ ] Activar `WORLDOFFICE_MODE=live`.
- [ ] Verificar inventario en vivo y notificación por correo.

---

## 11. Supuestos y riesgos

- World Office **no tiene ambiente de pruebas público**: la validación final es
  contra la cuenta real, por eso se hace con documentos de bajo monto primero.
- Las rutas y nombres de campos exactos se confirman con la documentación
  Enterprise; el diseño aísla esos detalles en dos archivos para que el ajuste
  sea mínimo.
- La migración del catálogo de escritorio a World Office Cloud la realiza el
  propio equipo de World Office (≈ 1 día) y es responsabilidad del cliente.

---

## 12. Referencias

- Documentación de la API: <https://devapidoc.worldoffice.cloud/>
- Guía de uso e interfaz: <https://devapidoc.worldoffice.cloud/guiaInterfaz.html>
- Portal de desarrolladores: <https://developer.worldoffice.cloud/implementaciones.html>

Implementación en el repositorio:
- `src/worldoffice/contrato.ts` — interfaz que consume la app.
- `src/worldoffice/cliente-live.ts` — llamadas reales (endpoints, mapeo, idempotencia).
- `src/worldoffice/http-wo.ts` — transporte robusto (timeout, backoff, Retry-After).
- `src/worldoffice/mapeo-wo.ts` + `tipos-wo.ts` — cuerpo real de World Office.
- `src/worldoffice/payload.ts` — estructura neutra descargable.
