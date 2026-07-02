# MIGRATION_LOG — Dashboard → Design System GanadoSoft

Migración de la **capa de presentación** del dashboard a partir de la fuente de
verdad de diseño `ganadosoft-dashboard.html`.

**Regla respetada:** solo presentación. No se tocaron servicios, hooks, queries,
stores, routing ni el shape de los datos. Ningún número/lista se reemplazó por
mock: todo sigue viniendo de `useDashboard` (que orquesta los resolvers de
resumen reales de cada módulo).

Fecha: 2026-07-01 · Rama: `main`

---

## 1. Mapeo de datos (métrica → variable → origen backend)

Todo proviene del hook `useDashboard(fincaId, filtro)` → query `GET_DASHBOARD`.

| Métrica (UI) | Variable en la página | Campo backend |
|---|---|---|
| Producción lechera promedio | `p.promedioLitrosVaca` | `resumenProduccion.promedioLitrosVaca` |
| Vacas preñadas | `r.vacasPrenadas` | `vacasPrenadas` (length) |
| Próximos partos (30 d) | `r.proximosPartos` | `proximosPartos(dias:30)` (length) |
| Animales en retiro | `s.animalesEnRetiro` | `resumenSanidad.animalesEnRetiro` |
| Tratamientos activos | `s.tratamientosActivos` | `resumenSanidad.tratamientosActivos` |
| Vacunas vencidas | `s.vacunasVencidas` | `resumenSanidad.vacunasVencidas` |
| Desparasitaciones vencidas | `s.desparasitacionesVencidas` | `resumenSanidad.desparasitacionesVencidas` |
| Mastitis activas | `s.mastitisActivas` | `resumenSanidad.mastitisActivas` |
| Alertas críticas / vencidas / pendientes / resueltas | `al.criticas` / `al.vencidas` / `al.pendientes` / `al.resueltas` | `resumenAlertas.*` |
| Ventas del período | `finanzas.ventasPeriodo` | suma `ventasPorAnio.montoTotal` (filtro) |
| Gastos del período | `finanzas.gastosPeriodo` | suma `gastos.total` (filtro) |
| Balance del período | `finanzas.balancePeriodo` | `ventasPeriodo − gastosPeriodo` |
| Distribución por categoría | `distribucionCategoria[]` | `reporteAnimalesGrupal.porCategoria` |
| Barra "Requiere tu atención hoy" | `al.vencidas`, `al.pendientes`, `s.vacunasVencidas + s.desparasitacionesVencidas`, `p.animalesSinPesaje` | (combinación de los anteriores) |
| Acciones pendientes | array `acciones` (derivado) | combina `animalesSinPesaje`, `proximosPartos`, `tratamientosActivos`, `vacunasVencidas`, `desparasitacionesVencidas`, `animalesEnRetiro`, `criticas` |

---

## 2. Archivos creados / modificados

### Creados
- `frontend/src/theme/ganadoTokens.js` — **SSOT de design tokens** (colores, radios,
  sombras, tipografía, espaciado) + `STATE_STYLES` (estilos por estado de tile).
- `frontend/src/components/dashboard/Sym.jsx` — icono Material Symbols Rounded.
- `frontend/src/components/dashboard/StatTile.jsx` — tarjeta de métrica.
- `frontend/src/components/dashboard/FinanceCard.jsx` — tarjeta financiera (`hero|default|sky`).
- `frontend/src/components/dashboard/SectionHeader.jsx` — encabezado de sección.
- `frontend/src/components/dashboard/AttentionStrip.jsx` — barra de atención (firma).
- `frontend/src/components/dashboard/ActionRow.jsx` — fila de acción pendiente.
- `frontend/src/components/dashboard/Panel.jsx` — contenedor con encabezado.
- `frontend/src/components/dashboard/DonutChart.jsx` — donut (conic-gradient, N segmentos).
- `frontend/src/components/dashboard/estadoMetricas.js` — **PASO 3**: `UMBRALES` (config editable) + `resolverEstado()` (función pura).
- `frontend/src/components/dashboard/index.js` — barrel de exports.

### Modificados
- `frontend/index.html` — carga de fuentes Google (IBM Plex Sans, IBM Plex Mono,
  Material Symbols Rounded). Se **conservó** Plus Jakarta Sans para el resto de la app.
- `frontend/src/context/ThemeContext.jsx` — inyección **aditiva** de `ganado` en el
  theme (`theme.ganado`). No se alteró `mode`/`primary`/`secondary` ni el toggle claro/oscuro.
- `frontend/src/pages/DashboardPage.jsx` — reescritura de presentación con los
  componentes nuevos. Se **preservó** la lógica de datos, el filtro de período y los
  exports Excel/PDF.

**No se borró** `frontend/src/components/DashboardCard.jsx` (dejó de usarse en el
dashboard, pero puede estar referenciado en otros lugares).

---

## 3. Lógica de color por umbral (PASO 3)

`resolverEstado(metrica, valor)` es pura y lee de `UMBRALES` (editable sin tocar
componentes). Reglas transcritas del brief:

```
mastitisActivas            → v>0 ? 'crit' : 'good'
vacunasVencidas            → v>0 ? 'warn' : 'good'
desparasitacionesVencidas  → v>0 ? 'warn' : 'good'
animalesEnRetiro           → v>0 ? 'warn' : 'calm'
tratamientosActivos        → 'primary'
alertasCriticas            → v>0 ? 'crit' : 'good'
alertasVencidas            → v>0 ? 'crit' : 'good'
alertasPendientes          → v>10 ? 'warn' : v>0 ? 'info' : 'calm'
alertasResueltas           → 'calm'
vacasPrenadas              → 'calm'
proximosPartos             → 'calm'
produccionLeche            → 'info'
```

Solo `warn`/`crit` "encienden" la barra lateral izquierda. Un cero bueno
(mastitis 0, críticas 0) va `good` (verde calmado), nunca en rojo.

---

## 4. Datos faltantes (NO se inventaron)

1. **Tendencias "▲ % vs mes anterior"**: el hook no calcula variación mes-a-mes.
   Se omitieron los indicadores de tendencia; no se muestran valores inventados.
2. **Textos narrativos** ("sin egresos registrados aún", "Ingresos acumulados",
   "Nada crítico", etc.): son **derivados** de los propios valores reales
   (`gastos===0`, `valor>0`, etc.), no datos nuevos.
3. **Conteos de encabezado de sección** ("N sin resolver", "N indicadores
   requieren acción", "N animales activos"): derivados de valores ya presentes.
4. La referencia HTML incluye sidebar + topbar propios; se migró **solo el área de
   contenido**, ya que la app tiene su layout global.

---

## 5. Decisiones tomadas

- **Tokens:** módulo SSOT (`ganadoTokens.js`) + inyección aditiva en `ThemeContext`
  (elegido sobre consolidar en `theme.js` global, para no alterar el resto de la app
  ni el toggle claro/oscuro). Nota: existe un doble-`ThemeProvider` preexistente
  (`main.jsx` usa `theme.js`, `App.jsx` lo reemplaza con el theme mínimo de
  `ThemeContext`); no se corrigió por estar fuera de alcance.
- **Fuentes:** IBM Plex se aplica **scoped al dashboard** (cada componente fija su
  `fontFamily`). El resto de la app sigue con Plus Jakarta Sans.
- **Iconografía:** Material Symbols Rounded (nombres exactos de la referencia) vía
  el helper `Sym`, en lugar de los `@mui/icons-material` previos.
- **Alcance del layout (opción A — fiel a la fuente de verdad):** al adoptar la
  estructura de la referencia, dejaron de renderizarse en pantalla piezas que
  existían antes. **Los datos siguen disponibles en el hook**, no se eliminó nada
  del backend/hook. Elementos ya no mostrados:
  - Sección "Resumen General" (tiles Total / Activos / Vendidos / Bajas). Hoy
    `activos` se muestra en el header de "Producción & Reproducción" y `total` en el
    centro del donut; **vendidos** y **bajas** ya no aparecen.
  - Gráficos recharts: Balance Financiero Mensual, Tendencia de Producción Lechera,
    Alertas por tipo. (La referencia no incluye gráficos.) `datosMensuales` sigue
    alimentando los exports Excel/PDF.
  - Tiles sueltos: Leche hoy / Leche del mes / Animales en engorde. "Sin pesaje"
    quedó reflejado en la barra de atención.

  > Si se desea recuperar alguna de estas piezas en el nuevo lenguaje visual
  > (opción B), es directo: agregar una fila extra de `StatTile` y/o reponer los
  > gráficos debajo del contenido actual.

- **Formato de dinero:** `fmtNum` usa `en-US` (coma miles, punto decimales) para
  igualar la referencia (`6,645,533.40`); el prefijo `Bs` lo agrega `FinanceCard`.

---

## 6. Verificación

- `npx eslint` sobre archivos nuevos/modificados del dashboard: **0 errores**.
  (El único error de lint restante, `react-refresh/only-export-components` en
  `ThemeContext.jsx`, es **preexistente** — confirmado contra HEAD.)
- `npx vite build`: **OK** (2178 módulos, sin errores).
- Sin cambios en: `useDashboard`, `useFincas`, `graphql/dashboard.js`, routing, stores.

---

## 7. Auditoría contra la fuente de verdad (post-migración)

**Corrección aplicada:** se detectaron colores hex literales en `FinanceCard`,
`AttentionStrip` y el sub-balance de `DashboardPage` (todos derivados del HTML pero
no promovidos a tokens). Se agregaron los grupos `financeHero` y `attention` a
`ganadoTokens.js` y se reemplazaron los literales por referencias a tokens.
Resultado: **0 hex literales** en `components/dashboard/` y `DashboardPage.jsx`
(verificado por grep). Lint + build siguen OK.

**Contraste (medido, texto sobre blanco salvo hero):**
- Números grandes (mono ≥26px) y `ink`/`muted` (#5F6A5C ≈ 5.7:1): **AA OK**.
- Balance blanco sobre verde hero: 3.9:1 → **AA large OK** (número 33px).
- `muted-2` (#8A9285 ≈ 3.2:1) en texto chico (pies 11px, conteos) y eyebrow del
  hero (`#B9D3B4` ≈ 2.7:1): **por debajo de AA normal**. Son valores textuales del
  HTML original. Tensión real entre "coincidir con el HTML" y "AA". Se dejó el valor
  del HTML; alternativa propuesta: oscurecer `muted-2` a ~#6E7869 (≈4.5:1) si se
  prioriza AA sobre fidelidad exacta. Requiere decisión del usuario (cambia un token
  de marca).

**Desviación de paleta documentada:** `bg` (#EDF1E8) y `surface-2` (#F3F8F1) siguen
la lista **explícita del brief**, que difiere ~2-4 unidades de las CSS vars del HTML
(`--bg:#F1F4EC`, `--surface-2:#F2F6EE`). Diferencia imperceptible. Marca y semánticos
coinciden exactos con el HTML.
