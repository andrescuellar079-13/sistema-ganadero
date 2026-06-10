# Frontend — Sistema Ganadero (React + Apollo Client)

Documentación técnica del frontend. Para la visión general ver el [`README.md`](../README.md) raíz;
para convenciones de trabajo ver [`CLAUDE.md`](../CLAUDE.md).

**Stack:** React 18 · Vite · Apollo Client · Material-UI (MUI) v9 · Tailwind CSS · React Router ·
Recharts · jsPDF · xlsx.

---

## Contenido

1. [Estructura](#estructura)
2. [Punto de entrada y providers](#punto-de-entrada-y-providers)
3. [Apollo Client](#apollo-client)
4. [Contexts](#contexts)
5. [Multi-tenancy en el frontend](#multi-tenancy-en-el-frontend)
6. [Hooks](#hooks)
7. [GraphQL](#graphql)
8. [Páginas y rutas](#páginas-y-rutas)
9. [Componentes](#componentes)
10. [Reportes reutilizables](#reportes-reutilizables)
11. [Servicios, constantes y tema](#servicios-constantes-y-tema)
12. [Scripts](#scripts)

---

## Estructura

```
src/
├── main.jsx          # Entrada: ApolloProvider + ThemeProvider + CssBaseline
├── App.jsx           # AuthProvider + LayoutProvider + Router + rutas protegidas
├── theme.js          # Tema MUI (paleta verde ganadero, tipografía Plus Jakarta Sans)
├── apollo/           # client.js (authLink, errorLink, httpLink)
├── context/          # AuthContext, LayoutContext
├── hooks/            # Un hook por módulo (use<Modulo>)
├── graphql/          # gql`...` de queries y mutations por módulo
├── pages/            # Páginas (una por ruta)
├── components/       # UI, formularios, gráficos, reportes, layout, auth
├── services/         # reportesService (PDF/Excel)
├── constants/        # Constantes de dominio (p. ej. rrhh)
└── utils/            # constants.js (GRAPHQL_URL)
```

Aprox. **24 hooks**, **20 archivos GraphQL**, **22 páginas** y **~85 componentes**.

---

## Punto de entrada y providers

`main.jsx` envuelve la app con `ApolloProvider` (cliente GraphQL) y `ThemeProvider` (MUI) + `CssBaseline`.

`App.jsx` compone los providers de dominio y el router:

```jsx
<AuthProvider>
  <LayoutProvider>
    <BrowserRouter>
      <AppContent />   {/* login vs layout protegido */}
    </BrowserRouter>
  </LayoutProvider>
</AuthProvider>
```

Las rutas protegidas se envuelven con `ProtectedRoute` + `requiredPermission`. Sin permiso →
redirección a `/unauthorized`.

---

## Apollo Client

`apollo/client.js` encadena tres links:

- **`authLink`** (`setContext`): lee `localStorage.token` y añade el header `Authorization: JWT <token>`.
- **`errorLink`**: intercepta errores GraphQL/red; ante un error de autenticación (token expirado/
  inválido) limpia `localStorage` (`token`, `fincaId`) y redirige a `/login`.
- **`httpLink`**: apunta a `GRAPHQL_URL` (`utils/constants.js`).

Cache: `InMemoryCache` con `errorPolicy: 'all'`.

---

## Contexts

**`AuthContext`** (`useAuth()`) centraliza autenticación, usuario y permisos:

- `user`, `token`, `isAuthenticated`, `loading`.
- `login(username, password)` → ejecuta la mutation, guarda el token, carga `GET_MI_USUARIO` y
  almacena el `fincaId` del usuario en `localStorage`.
- `logout()` → mutation + limpieza de sesión + reset del store de Apollo.
- `tienePermiso(permiso)` → evalúa `all` / permiso exacto / por módulo.
- `esAdministrador`, `userRole`, `nombreCompleto`.

**`LayoutContext`** (`useLayout()`) — control de `sidebarOpen`.

---

## Multi-tenancy en el frontend

El sistema es multi-finca. La **finca activa** se guarda en `localStorage.fincaId` (se fija al hacer
login y se cambia desde el selector del `Layout`).

- Los hooks que crean registros leen el `fincaId` de `localStorage` y lo envían en las variables:
  ```js
  const fincaId = localStorage.getItem('fincaId')
  await crearMutation({ variables: { fincaId, ...variables } })
  ```
- El backend filtra los listados por la finca activa, así que al cambiar de finca los datos cambian.
- **Nunca** hardcodees el `fincaId`: tómalo siempre de `localStorage`.

---

## Hooks

Un hook por módulo encapsula sus `useQuery`/`useMutation`. Cada acción de escritura es `async`,
hace la mutation, **refetch** del listado y devuelve un objeto uniforme `{ success, data }` o
`{ success, error }`.

```js
const crearMedicamento = async (variables) => {
  try {
    const fincaId = localStorage.getItem('fincaId')
    const { data } = await crearMedicamentoMutation({ variables: { fincaId, ...variables } })
    await refetchMedicamentos()
    return { success: true, data: data?.crearMedicamento }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

| Hook | Módulo |
|---|---|
| `useAuth` | Sesión, permisos |
| `useAnimales`, `useAnimalesPaginados`, `useMovimientosAnimal` | Animales |
| `useParcelas`, `useParcelasPaginadas` | Parcelas |
| `useCatalogos`, `useVacunas` | Catálogos / vacunas |
| `useVacunaciones` | Vacunaciones |
| `useSanidad` | Sanidad (tratamientos, diagnósticos, mastitis, retiros…) |
| `useReproduccion` | Reproducción (IA, monta, partos, celos, palpaciones…) |
| `useProduccion` | Pesos, leche, lactancias, engorde |
| `useVentas`, `useClientes`, `useFiltrosVentas`, `useReportesVentas` | Comercio |
| `useCompras`, `useProveedores` | Compras |
| `useMuertesBajas` | Bajas/muertes |
| `useFincas`, `useTransferencias` | Fincas y transferencias |
| `useRrhh` | Empleados |
| `useAlertas` | Alertas |
| `useDashboard` | KPIs y gráficos |

---

## GraphQL

`graphql/` agrupa las operaciones por módulo (`auth.js`, `animales.js`, `sanidad.js`,
`reproduccion.js`, `produccion.js`, `vacunaciones.js`, `vacunas.js`, `catalogos.js`, `compras.js`,
`ventas.js`, `clientes.js`, `proveedores.js`, `fincas.js`, `parcelas.js`, `rrhh.js`, `usuarios.js`,
`roles.js`, `dashboard.js`, `alertas.js`, `inventario.js`). Los hooks importan de aquí.

Convención de nombres: `GET_*` (queries), `CREATE_* / UPDATE_* / DELETE_*` (mutations).

---

## Páginas y rutas

| Página | Ruta | Permiso |
|---|---|---|
| `DashboardPage` | `/`, `/dashboard` | — |
| `AnimalesPage` | `/animales` | `animales_ver` |
| `VacunasPage` | `/vacunas` | `vacunas_ver` |
| `VacunacionesPage` | `/vacunaciones` | `vacunaciones_ver` |
| `ReproduccionPage` | `/reproduccion` | `reproduccion_ver` |
| `ProduccionPage` | `/produccion` | `produccion_ver` |
| `SanidadPage` | `/sanidad` | `sanidad_ver` |
| `AlertasPage` | `/alertas` | `alertas_ver` |
| `RrhhPage` | `/rrhh` | `rrhh_ver` |
| `ClientesPage` | `/clientes` | `ventas_ver` |
| `ProveedoresPage` | `/proveedores` | `compras_ver` |
| `ComprasPage` | `/compras` | `compras_ver` |
| `InventarioPage` | `/inventario` | `compras_ver` |
| `VentasPage` | `/ventas` | `ventas_ver` |
| `MuerteBajaPage` | `/bajas` | `animales_ver` |
| `CatalogosPage` | `/catalogos` | `catalogos_ver` |
| `FincaPage` | `/fincas` | `configuracion_ver` |
| `UsuariosPage` | `/usuarios` | `usuarios_ver` |
| `RolesPage` | `/roles` | `roles_ver` |
| `ReportesReproduccionPage` | `/reportes-reproduccion` | `reproduccion_ver` |
| `UnauthorizedPage` / `NotFoundPage` | `/unauthorized` / `*` | — |

---

## Componentes

- **UI general** (`components/ui/`): `PageHeader`, `ConfirmDialog`, `EmptyState`, `PageAlert`,
  `StatusChip`. Más `LoadingSpinner`, `SuccessMessage`, `ErrorMessage`, `ErrorBoundary`.
- **Layout y auth**: `Layout` (AppBar con selector de finca + badge de alertas, Sidebar), `Sidebar`,
  `Navbar`, `Login`, `ProtectedRoute`, `RoleBasedRoute`.
- **Formularios** (~40): por módulo — `AnimalForm`, `VacunacionForm`, `TratamientoForm`,
  `InseminacionForm`, `PartoForm`, `CeloForm`, `PalpacionForm`, `DesteteForm`,
  `ProduccionLecheForm`, `RegistroPesoForm`, `LactanciaForm`, `IniciarEngordeDialog`,
  `CompraForm`, `VentaForm`, `GastoForm`, `MuerteBajaForm`, `EmpleadoForm`, `FincaForm`,
  `ParcelaForm`, `ClienteForm`, `ProveedorForm`, formularios de catálogos en `components/catalogos/`,
  y de transferencias en `components/transferencias/`.
- **Gráficos** (Recharts): `BarChart`, `LineChart`, `PieChart`, `ChartCard`,
  `AnimalesPorSexoChart`, `AnimalesPorCategoriaChart`, `VacunacionesPorMesChart`.
- **Tarjetas y widgets**: `AnimalCard`, `AlertaCard`, `VacunaCard`, `EmpleadoCard`,
  `DashboardCard`, `ProduccionCard`, `ProximasVacunaciones`, `ProximosPartosCard`, `AlertasList`.

---

## Reportes reutilizables

**`ReportModalReusable.jsx`** es un modal de reportes **dirigido por configuración** (data-driven):
recibe `data`, `tiposReporte`, `columnas`, `filtrosExtra`, `campoFecha`, `getResumen`, etc., y ofrece
selección de tipo, formato **PDF/Excel**, columnas, rango de fechas y filtros extra, con tarjetas de
resumen y vista previa.

Las configuraciones por módulo viven en `components/reportes/` (p. ej.
`produccionReportConfig.js`, `vacunacionesReportConfig.js`). La exportación genérica la realiza
`services/reportesService.js` (`generarReporteGenericoPDF/Excel`).

> Para añadir reportes a un módulo: crea su config en `components/reportes/` y pásala a
> `ReportModalReusable`. No reimplementes el modal.

---

## Servicios, constantes y tema

- **`services/reportesService.js`**: generación de PDF (jsPDF + autoTable) y Excel (xlsx), tanto
  funciones específicas (`generarPDFAnimales`, `generarPDFVentas`) como las genéricas usadas por
  `ReportModalReusable`.
- **`constants/rrhh.js`**: `TIPOS_EMPLEADO`, `ESTADOS_LABORALES` y helpers de etiquetas.
- **`utils/constants.js`**: `GRAPHQL_URL` (`VITE_API_URL` o `http://127.0.0.1:8000/graphql/`).
- **`theme.js`**: tema MUI — paleta verde ganadero (`#2E7D32`), tipografía *Plus Jakarta Sans* y
  estilos de Button/Card/Table/Chip/AppBar/Drawer/Dialog.

---

## Scripts

```powershell
npm install      # dependencias
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción
npm run preview  # previsualizar el build
npm run lint     # ESLint
```
