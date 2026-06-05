# CrédiControl — Especificación de Requisitos de Software (SRS)
### Sistema SaaS de Cobranzas Diarias para Prestamistas
**Versión:** 1.0 — Borrador  
**Fecha:** Mayo 2026  
**Autor:** Juan David Aguilar Garizabal — SocioIA  
**Cliente piloto:** Dairo Ramírez  
**Clasificación:** Confidencial

---

## 1. Introducción y Contexto

### 1.1 Propósito del Documento

Este documento define la Especificación de Requisitos de Software (SRS) para **CrédiControl**, una plataforma SaaS 100% escalable orientada al mercado de prestamistas informales en Colombia y Latinoamérica. Sirve como contrato técnico entre SocioIA y los stakeholders del producto, y como base de arquitectura para el equipo de desarrollo.

### 1.2 Contexto del Mercado

| Indicador | Dato |
|-----------|------|
| Acceso a crédito formal | Solo el 35% de los colombianos tiene acceso a crédito bancario formal (Colombia Fintech, 2024) |
| Dependencia del informal | El 84.8% de los microempresarios en Colombia no accedió a crédito formal en 2024 (DANE) |
| Vendedores informales | El 90% de los vendedores informales recurrieron al pagadiario en 2024 (IPES Bogotá) |
| Recaudo diario | Un prestamista activo puede recibir entre $5 y $10 millones de pesos diarios en su cartera |
| Competencia tecnológica | La competencia real hoy es el cuadernillo físico. No existe un SaaS dominante en este mercado |

> **Oportunidad de Mercado:** CrédiControl entra a un mercado enorme, tecnológicamente desatendido, donde el umbral para generar valor es bajo: cualquier cosa mejor que un cuadernillo es una mejora radical para el prestamista.

### 1.3 Modelo de Negocio del SaaS

CrédiControl opera bajo un modelo de **suscripción mensual**. Cada prestamista que se registra obtiene su propio espacio completamente aislado (tenant) con sus clientes, cobradores, préstamos y datos independientes de cualquier otro usuario de la plataforma. El administrador de SocioIA tiene acceso a un panel de Super Admin para gestionar todos los tenants.

### 1.4 Modelo de Negocio del Prestamista (investigación de campo)

| Aspecto | Cómo opera en la realidad |
|---------|--------------------------|
| Modalidad de cobro | Diario (pagadiario), semanal o quincenal. El diario es el más común en barrios populares y mercados |
| Plazos típicos | Entre 10 y 60 días hábiles. Muy pocos superan los 3 meses |
| Tasas de interés | Entre 10% y 50% mensual sobre el capital. Cada prestamista define su propia tasa por cliente |
| Modelos de interés | 1) Solo interés diario (el capital no baja). 2) Cuota fija (capital + interés dividido en N días). 3) Sobre saldo (la cuota baja a medida que paga) |
| Estructura operativa | Un dueño del negocio con varios cobradores, cada uno asignado a una ruta geográfica fija |
| Control actual | Cuadernillos físicos por cobrador. Sin visibilidad en tiempo real para el administrador |
| Mora | Si hoy no pagó, ya está en mora. Sin días de gracia. Se cobra un recargo diario adicional |
| Refinanciamiento | Muy común: al terminar un préstamo, el cliente saca uno nuevo generalmente por un monto mayor |
| Medios de pago | Efectivo en campo principalmente. Cada vez más frecuente Nequi y transferencias bancarias |
| Comprobante | Hoy no existe. El cobrador anota en el cuadernillo. El cliente no recibe nada formal |

---

## 2. Arquitectura SaaS y Multi-Tenancy

### 2.1 Modelo de Multi-Tenancy

CrédiControl implementa multi-tenancy mediante **Row Level Security (RLS)** de Supabase sobre una base de datos PostgreSQL compartida. Cada registro en todas las tablas del sistema está vinculado a un `organization_id` único que identifica al tenant.

> **Patrón de Aislamiento:** Cada prestamista tiene sus datos 100% aislados mediante políticas RLS en PostgreSQL. Ningún tenant puede ver, acceder ni modificar datos de otro. El aislamiento es garantizado a nivel de base de datos, no solo a nivel de aplicación.

### 2.2 Jerarquía de Roles del Sistema

| Rol | Alcance | Permisos Clave |
|-----|---------|----------------|
| **Super Admin** | Global — todos los tenants | Ver todos los tenants, gestionar suscripciones, impersonar cuentas para soporte, ver métricas globales, crear/suspender organizaciones |
| **Admin (Prestamista)** | Su organización — acceso total | Crear préstamos, gestionar clientes, crear cobradores, ver toda la cartera, cerrar caja, ver reportes, personalizar el negocio |
| **Cobrador** | Su ruta del día — acceso restringido | Ver solo sus clientes asignados del día, registrar pagos, enviar comprobante WhatsApp, ver su propio historial de cobros |

### 2.3 Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | Next.js 14 + React + TypeScript | SSR para rendimiento móvil, tipado seguro, ecosistema maduro |
| Estilos | Tailwind CSS + shadcn/ui | Desarrollo rápido, componentes accesibles, consistencia visual |
| Base de datos | Supabase (PostgreSQL) | RLS nativo para multi-tenancy, auth integrado, realtime, backups automáticos |
| Autenticación | Supabase Auth | JWT con roles en metadata, sesiones seguras, soporte MFA |
| Almacenamiento | Supabase Storage | Logos de organización, documentos de préstamo, firmas digitales |
| Hosting | Vercel | Deploy automático, CDN global, preview environments por PR |
| Pagos SaaS | Por definir (Wompi / Stripe) | Gestión de suscripciones del prestamista a CrédiControl |
| WhatsApp | API nativa wa.me | Sin costo adicional, apertura directa con mensaje precargado |
| Email | Resend | Notificaciones transaccionales, recordatorios, bienvenida |

### 2.4 Principios de Diseño UI/UX

- **Mobile-first absoluto:** el cobrador usa la app en la calle. Toda la interfaz se diseña primero para 375px de ancho.
- **Máximo 3 toques para registrar un pago:** es la acción más crítica del sistema y debe ser la más rápida.
- **Feedback inmediato:** animaciones de confirmación en cada pago registrado, toasts de estado, skeletons en carga.
- **Offline-aware:** si el cobrador pierde conexión, el sistema avisa claramente y reintenta automáticamente al recuperar red.
- **Personalización por tenant:** el admin puede subir el logo de su negocio y el nombre aparece en comprobantes y pantallas.
- **Accesibilidad:** contraste mínimo AA, áreas de toque de al menos 44×44px, etiquetas en todos los campos.

---

## 3. Módulos Funcionales del Sistema

### 3.1 Panel de Super Admin

Módulo exclusivo de SocioIA para gestionar toda la plataforma. Solo accesible con credenciales de super administrador con doble factor de autenticación.

#### 3.1.1 Dashboard Global
- Métricas en tiempo real: total de tenants activos, en trial, suspendidos.
- Recaudo de suscripciones del mes actual vs mes anterior.
- Actividad de la plataforma: cobros registrados hoy, nuevos préstamos creados, usuarios activos.
- Gráfico de crecimiento mensual de tenants nuevos.
- Alertas de sistema: tenants con suscripción vencida, errores críticos, uso de almacenamiento.

#### 3.1.2 Gestión de Tenants
- Listado de todas las organizaciones con filtros: activa, en trial, suspendida, vencida.
- Vista detalle de cada tenant: nombre del negocio, dueño, fecha de registro, plan, vencimiento, número de cobradores, préstamos activos, último login.
- Acciones: activar, suspender, extender periodo, resetear contraseña del admin, impersonar cuenta para soporte.
- Crear organización manualmente para onboarding asistido.
- Exportar listado de tenants a Excel.

#### 3.1.3 Gestión de Suscripciones
- Ver estado de suscripción por tenant: activa, en gracia, vencida, cancelada.
- Aplicar descuentos o periodos de cortesía manualmente.
- Historial de pagos de suscripción por tenant.
- Configurar planes: nombre, precio, límites de cobradores y préstamos activos, funcionalidades incluidas.

#### 3.1.4 Métricas de Producto
- Funcionalidades más usadas por los tenants.
- Tasa de retención mensual.
- Tiempo promedio de onboarding: desde registro hasta primer cobro registrado.
- Cobradores activos en los últimos 7 días por tenant.

---

### 3.2 Onboarding del Prestamista

El registro es completamente automático. El prestamista entra, se registra y empieza a operar sin intervención de SocioIA.

**Flujo de Registro:**

1. El prestamista entra a la landing page y hace clic en "Comenzar gratis".
2. Formulario: nombre completo, nombre del negocio, ciudad, teléfono, correo y contraseña.
3. Verificación del correo vía link automático (Resend).
4. Al verificar, se crea automáticamente su organización con su `organization_id` único.
5. Tutorial de bienvenida de 3 pasos: crear primer cliente → crear primer cobrador → crear primer préstamo.
6. Al completar el tutorial, accede al dashboard completo. El periodo de prueba inicia automáticamente.

> **Objetivo de onboarding:** El prestamista debe poder registrar su primer cobro real en menos de 5 minutos desde que entra a la plataforma. Ese es el momento AHA del producto.

---

### 3.3 Módulo de Clientes

- Registro: nombre completo, cédula, teléfono (WhatsApp), dirección, barrio/zona, foto opcional, notas internas.
- Búsqueda rápida por nombre o cédula con resultados instantáneos mientras se escribe.
- Perfil del cliente: historial de todos sus préstamos, comportamiento de pago (% de puntualidad), total prestado históricamente.
- **Badge de comportamiento** calculado automáticamente: Excelente pagador (verde) / Regular (amarillo) / Riesgo alto (rojo).
- Editar y desactivar clientes. Un cliente desactivado conserva su historial.
- Importación masiva desde Excel (v2).

---

### 3.4 Módulo de Préstamos

Núcleo financiero del sistema. Soporta los tres modelos de interés reales del mercado colombiano.

#### 3.4.1 Modelos de Interés Soportados

| Modelo | Cómo funciona |
|--------|---------------|
| **Cuota Fija** (el más común) | Total = Capital + (Capital × Tasa mensual). Cuota diaria = Total ÷ días hábiles. El saldo baja uniformemente cada día. Ej: $1.000.000 al 20% en 20 días = Total $1.200.000, cuota $60.000/día. |
| **Solo Interés** | El cliente paga solo el interés diario. El capital se paga al final del plazo en un solo pago. Útil para clientes con flujo diario pero sin capacidad de amortizar capital. |
| **Sobre Saldo Reducido** | El interés se calcula sobre el saldo pendiente. La cuota baja a medida que el cliente paga capital. Para clientes preferenciales. |

#### 3.4.2 Creación de Préstamo — Formulario en 3 Pasos

1. **Paso 1 — Cliente:** buscar y seleccionar cliente existente o crear uno nuevo inline sin salir del formulario.
2. **Paso 2 — Condiciones:** capital prestado, modelo de interés, tasa mensual (%), plazo en días, toggle excluir sábados, toggle excluir domingos, cobrador asignado. Preview en tiempo real del cronograma antes de confirmar.
3. **Paso 3 — Confirmación:** resumen completo con total a pagar, cuota diaria, fecha inicio y fecha fin. Al confirmar: animación de éxito.

#### 3.4.3 Estados de un Préstamo

| Estado | Condición |
|--------|-----------|
| **Activo** | El préstamo está vigente y el cliente paga según el cronograma. |
| **En Mora** | El cliente no registró pago en la fecha esperada. Se activa automáticamente al finalizar el día. |
| **Saldado** | El cliente completó todos los pagos. Se cierra automáticamente. |
| **Refinanciado** | El cliente saldó y abrió un nuevo préstamo. El antiguo queda referenciado. |
| **Cancelado** | El admin canceló el préstamo manualmente con justificación registrada. |

#### 3.4.4 Refinanciamiento con un Clic

- Desde el detalle del préstamo → botón "Refinanciar".
- El sistema precarga el saldo pendiente como capital mínimo del nuevo préstamo.
- El admin puede ajustar el monto (siempre ≥ saldo pendiente).
- Al confirmar: préstamo anterior → Refinanciado. Préstamo nuevo → Activo.

---

### 3.5 Módulo de Rutas de Cobro

- El admin ve el mapa de cobros del día: todos los clientes con pago esperado hoy, agrupados por cobrador.
- Vista del cobrador en móvil: lista ordenada de clientes a visitar con nombre, barrio, dirección y monto a cobrar.
- Estado en tiempo real: el admin ve cuántos cobros lleva cada cobrador sin necesidad de llamarlos.
- El cobrador puede marcar "Cliente no encontrado" si fue a la dirección y no estaba. Queda registrado con hora.
- **Geolocalización opcional:** al registrar el pago, el sistema captura la ubicación GPS del cobrador y la envía al admin como confirmación de visita real.

---

### 3.6 Módulo de Cobros Diarios

La pantalla más usada del sistema. Diseñada para que el cobrador registre un pago en **máximo 3 toques** desde su celular en campo.

**Flujo de Registro de Pago:**

1. El cobrador toca la tarjeta del cliente en su lista de ruta.
2. Se abre un panel con monto esperado precargado y selector de medio de pago (Efectivo / Nequi / Transferencia).
3. Toca "Registrar Pago" → animación verde de éxito → tarjeta cambia a estado Pagado.
4. Aparece botón "Enviar Comprobante por WhatsApp" → un toque abre WhatsApp con el mensaje listo.

**Tipos de Cobro Soportados:**
- Pago completo de la cuota del día.
- Pago parcial: el cliente paga menos del monto esperado.
- Pago de cuotas vencidas: el cliente paga días atrasados junto con la cuota actual.
- Liquidación total: el cliente cancela el saldo completo. El sistema cierra el préstamo automáticamente.
- Cobro de mora: se cobra el recargo acumulado según la política del tenant.

**Comprobante de Pago por WhatsApp:**

El mensaje precargado incluye:
- Nombre del negocio del prestamista (personalizado por tenant).
- Nombre completo del cliente.
- Fecha y hora exacta del registro.
- Monto pagado y medio de pago.
- Número de cuota: "Cuota 8 de 30".
- Saldo restante del préstamo.
- Nombre del cobrador.
- Ubicación del cobro si la geolocalización está activa.

---

### 3.7 Módulo de Mora

- **Detección automática:** un job programado corre cada noche y marca en mora todos los préstamos con cuotas sin pagar.
- Panel de mora: clientes con días de atraso, monto acumulado, último contacto y cobrador asignado. Ordenado por días de mora descendente.
- Cálculo configurable por el admin: porcentaje diario sobre la cuota vencida **o** monto fijo por día.
- Alerta inmediata: cuando un cliente entra en mora, el cobrador asignado y el admin reciben notificación.
- Historial de mora por cliente: veces que ha entrado, duración promedio, si pagó los recargos.
- Botón de contacto rápido: desde la lista de mora, un toque abre WhatsApp con el número del cliente.

---

### 3.8 Módulo de Caja

- Resumen del día por cobrador: total esperado, total recaudado, diferencia, % de cumplimiento.
- Desglose por medio de pago: efectivo, Nequi, transferencia.
- **Cierre de ruta:** al terminar la jornada, el cobrador declara el total de efectivo que porta. El sistema compara contra el recaudo registrado.
- **Cierre de caja general:** el admin consolida todos los cierres de ruta en el cierre del día.
- Historial de cierres por fecha y por cobrador.
- Exportar cierre del día a PDF.

---

### 3.9 Módulo de Reportes

- Filtros: hoy, esta semana, este mes, rango personalizado.
- Recaudo total del período con comparativo vs período anterior.
- Intereses generados vs capital recuperado.
- Rendimiento por cobrador: recaudo, % de cumplimiento, días trabajados.
- Cartera en riesgo: mora de más de 3, 7 y 15 días.
- Préstamos nuevos vs saldados vs refinanciados en el período.
- Top 10 mejores clientes por puntualidad y volumen.
- Proyección de recaudo: con base en el cronograma activo, cuánto debe entrar los próximos 30 días.
- Exportar a Excel (incluido desde v1).

---

### 3.10 Módulo de Configuración del Tenant

- Información del negocio: nombre, logo, ciudad, teléfono de contacto.
- **Política de mora:** tipo (porcentaje o monto fijo), valor, días de gracia (por defecto: 0).
- **Días hábiles:** configurar si sábados y domingos cuentan como días de cobro por defecto.
- **Tasa de interés predeterminada:** se precarga al crear un nuevo préstamo (editable préstamo a préstamo).
- Gestión de cobradores: crear, editar, activar y desactivar. Ver historial de actividad.
- Personalizar la plantilla del mensaje de comprobante de WhatsApp.
- Cambiar contraseña y datos de la cuenta.

---

## 4. Esquema de Base de Datos

> Todas las tablas incluyen `organization_id` para el aislamiento multi-tenant vía RLS de Supabase.

### `organizations` — Tenants del SaaS

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Identificador único de la organización |
| nombre_negocio | text | Nombre del negocio del prestamista |
| logo_url | text nullable | URL del logo en Supabase Storage |
| ciudad | text | Ciudad de operación |
| telefono | text | Teléfono de contacto |
| plan | text | Plan de suscripción activo |
| estado_suscripcion | text | `activo` / `trial` / `vencido` / `suspendido` |
| trial_hasta | date nullable | Fecha de fin del periodo de prueba |
| created_at | timestamptz | Fecha de registro en la plataforma |

### `profiles` — Usuarios del Sistema

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK FK auth.users | Vinculado al sistema de auth de Supabase |
| organization_id | uuid FK organizations | Tenant al que pertenece |
| nombre_completo | text | Nombre del usuario |
| rol | text | `super_admin` / `admin` / `cobrador` |
| telefono | text nullable | Número para WhatsApp |
| activo | boolean default true | Si puede iniciar sesión |
| ultimo_acceso | timestamptz | Último login registrado |

### `clientes`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| organization_id | uuid FK | Aislamiento de tenant |
| nombre | text | Nombre completo |
| cedula | text | Número de identificación |
| telefono | text | Número WhatsApp para comprobantes |
| direccion | text | Dirección de cobro |
| barrio | text | Barrio o zona para organizar rutas |
| notas | text nullable | Notas internas del prestamista |
| score_pago | numeric | 0–100, calculado por el sistema |
| activo | boolean | |
| created_at | timestamptz | |

### `prestamos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| organization_id | uuid FK | |
| cliente_id | uuid FK clientes | |
| cobrador_id | uuid FK profiles | Cobrador asignado |
| capital | numeric | Monto prestado |
| modelo_interes | text | `cuota_fija` / `solo_interes` / `sobre_saldo` |
| tasa_mensual | numeric | Porcentaje mensual acordado |
| total_pagar | numeric | Capital + interés total calculado |
| cuota_diaria | numeric | Monto de cada cuota diaria |
| plazo_dias | integer | Total de días del préstamo |
| dias_habiles | integer | Días de cobro real (excluye fines de semana) |
| excluir_sabados | boolean | |
| excluir_domingos | boolean | |
| fecha_inicio | date | |
| fecha_fin | date | |
| estado | text | `activo` / `en_mora` / `saldado` / `refinanciado` / `cancelado` |
| prestamo_anterior_id | uuid nullable | Si es refinanciamiento, referencia al anterior |
| created_by | uuid FK profiles | Admin que creó el préstamo |
| created_at | timestamptz | |

### `cronograma_pagos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| prestamo_id | uuid FK | |
| organization_id | uuid FK | |
| numero_cuota | integer | Día 1, día 2, etc. |
| fecha_esperada | date | Fecha programada de pago |
| monto_esperado | numeric | Cuota diaria según el modelo |
| estado | text | `pendiente` / `pagado` / `parcial` / `vencido` |
| fecha_pago | timestamptz nullable | Cuando se registró el pago |
| monto_pagado | numeric default 0 | Lo que realmente pagó |
| medio_pago | text nullable | `efectivo` / `nequi` / `transferencia` |
| cobrador_id | uuid nullable | Quién registró el pago |
| lat | numeric nullable | Latitud del cobro si geolocalización activa |
| lng | numeric nullable | Longitud del cobro |

### `mora_registros`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| prestamo_id | uuid FK | |
| organization_id | uuid FK | |
| fecha_inicio_mora | date | Cuando entró en mora |
| dias_mora | integer | Días acumulados |
| monto_mora | numeric | Recargo acumulado |
| monto_pagado_mora | numeric default 0 | |
| estado | text | `activa` / `pagada` / `condonada` |

### `cierres_caja`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| organization_id | uuid FK | |
| cobrador_id | uuid FK | |
| fecha | date | Fecha del cierre |
| total_esperado | numeric | Lo que debía cobrar según cronograma |
| total_recaudado | numeric | Lo que realmente registró |
| efectivo_declarado | numeric | Lo que el cobrador declaró traer |
| cerrado_por | uuid FK | Admin que cerró la caja |
| created_at | timestamptz | |

---

## 5. Requisitos No Funcionales

| Atributo | Especificación |
|----------|----------------|
| **Rendimiento móvil** | Registro de un pago en menos de 2 segundos en red 4G. Lista de ruta del cobrador carga en menos de 1.5 segundos. |
| **Disponibilidad** | 99.5% de uptime mensual. Supabase y Vercel garantizan SLA de alta disponibilidad. |
| **Seguridad de datos** | RLS en todas las tablas sin excepción. JWT con expiración de 1 hora. Refresh tokens seguros. Logs de acceso por usuario. |
| **Escalabilidad** | La arquitectura soporta hasta 10.000 tenants activos sin cambios de infraestructura. |
| **Responsividad** | Diseño funcional desde 375px (iPhone SE) hasta 1920px. Sin scroll horizontal en ningún breakpoint. |
| **Offline awareness** | Si el cobrador pierde conexión, el sistema avisa claramente y reintenta el envío automáticamente al recuperar red. |
| **Privacidad** | Los datos de cada tenant son inaccesibles para otros tenants incluso con acceso directo a la BD. |
| **Auditoría** | Toda acción crítica (crear préstamo, registrar pago, cancelar) queda en log con usuario, timestamp y estado anterior vs nuevo. |
| **Usabilidad cobrador** | El cobrador no requiere capacitación técnica. Onboarding de un nuevo cobrador en menos de 10 minutos. |
| **Internacionalización** | v1 en español colombiano. Arquitectura preparada para i18n desde el inicio. |

---

## 6. Plan de Desarrollo por Fases

| Fase | Duración Est. | Entregables | Objetivo |
|------|--------------|-------------|----------|
| **Fase 0 — Fundación** | 1 semana | Setup Next.js + Supabase, RLS base, autenticación con roles, CI/CD en Vercel | Infraestructura lista para desarrollo |
| **Fase 1 — MVP Core** | 3 semanas | Onboarding tenant, CRUD clientes, crear préstamo (cuota fija), ruta del cobrador, registrar pago, comprobante WhatsApp | Primer prestamista puede operar digitalmente |
| **Fase 2 — Operación Completa** | 2 semanas | Modelos de interés adicionales, mora automática, refinanciamiento, caja diaria, cierre de ruta | Operación completa del negocio cubierta |
| **Fase 3 — Inteligencia** | 2 semanas | Reportes completos, exportación Excel, geolocalización, score de clientes, panel Super Admin v1 | Visibilidad y control total para el admin |
| **Fase 4 — SaaS Completo** | 1 semana | Suscripciones, gestión de planes, emails automáticos, landing page de ventas | Producto SaaS listo para adquirir clientes |
| **Fase 5 — Pulido** | 1 semana | Tests e2e críticos, optimización de performance, accesibilidad, documentación interna | Calidad de producción |

> **Estrategia de Lanzamiento:** Dairo Ramírez opera como cliente piloto beta durante las fases 1 y 2, proporcionando feedback real de campo. Esto garantiza que el MVP resuelve los problemas reales del negocio antes de abrirlo a nuevos tenants.

---

## 7. Estrategia de Pruebas

### 7.1 Pruebas Críticas de Negocio

Obligatorias antes de cualquier despliegue a producción. Validan la lógica financiera que maneja dinero real.

| Prueba | Escenario | Resultado Esperado |
|--------|-----------|-------------------|
| Cálculo cuota fija | Capital $500.000, tasa 20%, 10 días | Total = $600.000. Cuota = $60.000/día exacto. |
| Cálculo solo interés | Capital $1.000.000, tasa 10%, 30 días | Interés diario = $3.333. Capital al final: $1.000.000. |
| Exclusión fines de semana | Préstamo 10 días hábiles iniciando viernes. Verificar cronograma. | Sábados y domingos omitidos. 10 cuotas en días hábiles consecutivos. |
| Cálculo de mora | Política: 2% diario sobre cuota. Cliente 3 días sin pagar cuota de $60.000. | Mora = $60.000 × 2% × 3 = $3.600. |
| Pago parcial | Cuota esperada $60.000. Cliente paga $40.000. | Saldo de la cuota: $20.000 pendiente. Saldo total del préstamo se actualiza correctamente. |
| Liquidación total | Cliente paga el saldo completo restante. | Préstamo pasa a estado Saldado automáticamente. Cobros futuros eliminados del cronograma. |
| Refinanciamiento | Préstamo activo con saldo $300.000. Admin crea refinanciamiento por $500.000. | Préstamo anterior: Refinanciado. Nuevo préstamo: Activo con capital $500.000. |
| Aislamiento multi-tenant | Usuario del tenant A intenta acceder a datos del tenant B vía API directa. | Error 403. RLS bloquea el acceso. Ningún dato filtrado. |

### 7.2 Pruebas de Flujo de Usuario

- **Flujo cobrador:** login → ver ruta → tocar cliente → registrar pago → enviar WhatsApp. Menos de 30 segundos.
- **Flujo admin:** login → crear cliente → crear préstamo → ver dashboard → ver cobros del día → cerrar caja.
- **Flujo onboarding:** registro → verificación email → tutorial → primer préstamo creado. Menos de 5 minutos.
- **Flujo mora:** préstamo vencido → job de mora corre → cliente aparece en panel → admin contacta por WhatsApp.

### 7.3 Pruebas de Rendimiento Móvil

- Lista de ruta con 50 clientes carga en menos de 1.5 segundos en red 4G.
- Registro de pago y actualización de estado en menos de 2 segundos.
- Dashboard del admin con 500 préstamos activos carga en menos de 3 segundos.
- La app no consume más de 150MB de RAM en dispositivos Android de gama media.

### 7.4 Pruebas de Seguridad

- Un cobrador no puede acceder a rutas de otro cobrador del mismo tenant.
- Un cobrador no puede acceder al dashboard de admin del mismo tenant.
- Un admin no puede ver datos de otro tenant aunque conozca el `organization_id`.
- Los tokens JWT vencidos son rechazados correctamente.
- Los endpoints de API sin autenticación retornan 401, no datos vacíos.

---

## 8. Glosario del Dominio

| Término | Definición |
|---------|-----------|
| **Pagadiario / Gota a gota** | Modalidad de préstamo informal con cobro diario. Nombre coloquial del negocio que este sistema digitaliza. |
| **Tenant** | Cada prestamista registrado en CrédiControl. Su espacio es completamente independiente de otros tenants. |
| **Ruta de cobro** | Lista de clientes que un cobrador debe visitar en un día, organizados geográficamente. |
| **Cuota diaria** | Monto fijo que el cliente debe pagar cada día hábil según su cronograma de préstamo. |
| **Mora** | Estado de un préstamo cuando el cliente no pagó en la fecha esperada. Genera recargos adicionales. |
| **Refinanciamiento** | Cierre de un préstamo activo y apertura inmediata de uno nuevo generalmente de mayor capital. |
| **Bóveda** | Capital asignado a un cobrador para que opere su propia sub-cartera (funcionalidad de v2). |
| **Score de pago** | Indicador de 0 a 100 calculado por el sistema que refleja la puntualidad histórica del cliente. |
| **Cuota fija** | Modelo donde cada cuota incluye capital amortizado más interés del período. |
| **Solo interés** | Modelo donde el cliente paga solo los intereses diariamente y el capital al final del plazo. |
| **Sobre saldo** | Modelo donde el interés se calcula sobre el capital pendiente, haciendo que la cuota disminuya con el tiempo. |
| **RLS** | Row Level Security: mecanismo de PostgreSQL que filtra automáticamente los datos por `organization_id`. |
| **Onboarding** | Proceso de registro y configuración inicial de un nuevo prestamista en la plataforma. |
| **Super Admin** | Rol de SocioIA con acceso a todos los tenants para administrar la plataforma completa. |

---

*SocioIA · Juan David Aguilar Garizabal · Valledupar, Colombia · Mayo 2026 · Documento Confidencial*
