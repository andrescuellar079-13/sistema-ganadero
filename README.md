# Sistema Ganadero

Sistema integral de gestión ganadera desarrollado con **Django + GraphQL** (backend) y
**React + Apollo Client** (frontend). Administra animales, reproducción, producción de leche y
carne, sanidad, compras, ventas, inventario, recursos humanos y alertas de una o varias fincas,
con un modelo **multi-tenant** (multi-finca) y control de acceso por roles.

---

## Tabla de Contenidos

1. [Tecnologías](#tecnologías)
2. [Arquitectura](#arquitectura)
3. [Catálogo de módulos y entidades](#catálogo-de-módulos-y-entidades)
4. [API GraphQL](#api-graphql)
5. [Multi-tenancy y finca activa](#multi-tenancy-y-finca-activa)
6. [Seguridad y permisos](#seguridad-y-permisos)
7. [Instalación](#instalación)
8. [Variables de entorno](#variables-de-entorno)
9. [Documentación detallada](#documentación-detallada)

---

## Tecnologías

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| Python | 3.10+ | Lenguaje principal |
| Django | 4.2.7 | Framework web |
| graphene-django | 3.1.5 | API GraphQL (graphene 3.4.3) |
| django-graphql-jwt | 0.4.0 | Autenticación JWT para GraphQL |
| django-filter | 23.5 | Filtros de queries |
| PostgreSQL | 14+ | Base de datos relacional |
| psycopg2-binary | 2.9.9 | Driver PostgreSQL |
| django-cors-headers | 4.3.1 | Manejo de CORS |
| djangorestframework | 3.14.0 | Utilidades REST auxiliares |
| python-decouple / python-dotenv | — | Variables de entorno (`.env`) |

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| React | 18.2.0 | Biblioteca UI principal |
| Vite | 8.x | Bundler y servidor de desarrollo |
| Apollo Client | 3.8.0 | Cliente GraphQL |
| Material-UI (MUI) | 9.x | Componentes de interfaz |
| Tailwind CSS | 3.4.x | Utilidades CSS |
| React Router | 6.20.0 | Enrutamiento |
| Recharts | — | Gráficos |
| jsPDF + jspdf-autotable | — | Reportes en PDF |
| xlsx | — | Exportación a Excel |

---

## Arquitectura

```
sistema-ganadero/
├── backend/                  # Django + GraphQL (un app Django por módulo)
│   ├── config/               # settings, urls, schema GraphQL global
│   ├── accounts/             # Usuarios, roles, permisos, acceso multi-finca
│   ├── fincas/               # Fincas y transferencias entre fincas
│   ├── catalogos/            # Razas, categorías, medicamentos, vacunas, alimentos…
│   ├── animales/             # Animales, parcelas y movimientos
│   ├── reproduccion/         # Inseminación, monta, partos, celos, palpaciones…
│   ├── produccion/           # Pesos, lactancia, leche, alimentación, engorde
│   ├── sanidad/              # Vacunaciones, tratamientos, diagnósticos, mastitis…
│   ├── comercio/             # Clientes, corrales, ventas, muertes/bajas
│   ├── compras/              # Proveedores, compras, inventario
│   ├── alertas/              # Centro de notificaciones y gastos
│   ├── rrhh/                 # Empleados y tipos de empleado
│   └── seed_*.py             # Seeders de datos de prueba
│
└── frontend/                 # React + Apollo Client
    └── src/
        ├── apollo/           # Cliente Apollo (authLink, errorLink)
        ├── context/          # AuthContext, LayoutContext
        ├── hooks/            # Un hook por módulo (use<Modulo>)
        ├── graphql/          # Queries y mutations por módulo
        ├── pages/            # Páginas/rutas
        ├── components/       # Componentes (UI, formularios, gráficos, reportes…)
        ├── services/         # Generación de reportes PDF/Excel
        ├── constants/ utils/ # Constantes y configuración
        └── theme.js          # Tema MUI
```

**Flujo de una petición:**

```
Usuario (Browser)
  └─> React + Apollo Client
        └─> POST /graphql/  (header Authorization: JWT <token>)
              └─> Middleware graphql_jwt (verifica token)
                    └─> Resolver GraphQL (@login_required + scope por finca)
                          └─> Modelo Django (PostgreSQL)
                                └─> Respuesta JSON
```

---

## Catálogo de módulos y entidades

> Referencia campo por campo de cada modelo: **[`backend/README.md`](backend/README.md)**.

| Módulo (app) | Entidades principales | Responsabilidad |
|---|---|---|
| **accounts** | `Rol`, `Usuario`, `UsuarioFinca` | Autenticación, roles/permisos y acceso de un usuario a varias fincas. |
| **fincas** | `Finca`, `TransferenciaFinca`, `DetalleTransferenciaFinca` | Datos de la finca y transferencia de animales entre fincas con flujo de recepción. |
| **catalogos** | `Raza`, `CategoriaAnimal`, `TipoMedicamento`, `Medicamento`, `Veterinario`, `Alimento`, `Reproductor`, `Vacuna` | Catálogos maestros (con stock, reglas zootécnicas y datos técnicos). |
| **animales** | `Parcela`, `Animal`, `AnimalParcela`, `MovimientoAnimal` | Inventario de animales, parcelas e historial de movimientos. |
| **reproduccion** | `InseminacionArtificial`, `MontaNatural`, `DiagnosticoPrenez`, `Reproduccion` (parto), `Celo`, `Palpacion`, `HembraRepetidora`, `AbortoDetallado`, `Destete` | Ciclo reproductivo completo. `InseminacionArtificial`/`MontaNatural`/`DiagnosticoPrenez` heredan de `EventoReproductivo`. |
| **produccion** | `RegistroPeso`, `Lactancia`, `ProduccionLeche`, `AlimentoAnimal`, `EngordeAnimal` | Pesajes, producción de leche por lactancia, alimentación y control de engorde (carne). |
| **sanidad** | `Vacunacion`, `Tratamiento`, `Desparasitacion`, `TratamientoMedicamento`, `AnimalMedicamento`, `Diagnostico`, `Observacion`, `Enfermedad`, `ExamenLaboratorio`, `RegistroMastitis`, `TiempoRetiro` | Salud animal. `Tratamiento`/`Desparasitacion` heredan de `EventoSanitario`. |
| **comercio** | `Cliente`, `CorrallVenta`, `AnimalCorral`, `NotaVenta`, `DetalleVenta`, `MuerteBaja` | Ventas (por animal o por corral/lote), clientes y bajas de animales. |
| **compras** | `Proveedor`, `NotaCompra`, `DetalleCompra`, `DetalleCompraAlimento`, `DetalleCompraAnimal`, `MovimientoInventario` | Compras de insumos y animales, con actualización de stock e inventario. |
| **alertas** | `Alerta`, `Gasto` | Centro de notificaciones (prioridad/estado/módulo/asignación) y registro de egresos. |
| **rrhh** | `TipoEmpleado`, `Empleado` | Personal de la finca y sus cargos. |

### Lógica de negocio automática (señales en `save()`)

- **`RegistroPeso`** → recalcula `ganancia_diaria`, actualiza `Animal.peso` con el pesaje más
  reciente y, si hay engorde activo, lo pasa a `LISTO_VENTA` al alcanzar el peso objetivo.
- **`ProduccionLeche`** → calcula días en lactancia y recalcula los totales de la `Lactancia`.
- **`DetalleVenta`** → marca el `Animal` como `VENDIDO`.
- **`DetalleCompra` / `DetalleCompraAlimento`** → suman al `stock_cantidad` del medicamento/alimento.
- **`MuerteBaja`** → actualiza el estado del `Animal` según el tipo de baja.
- **`Gasto`** → calcula `total = cantidad × precio_unitario`.

---

## API GraphQL

Endpoint único:

```
POST /graphql/
```

Cada app aporta su `Query` y su `Mutation`, combinadas en `backend/config/schema.py`.

### Autenticación

```graphql
mutation Login($username: String!, $password: String!) {
  tokenAuth(username: $username, password: $password) { token refreshToken }
}

query MiUsuario {
  miUsuario {
    id username email firstName lastName
    rol { nombre permisosLista }
    finca { id nombre }
  }
}
```

El frontend agrega `Authorization: JWT <token>` automáticamente (Apollo `authLink`). Convención de
mutations: `crear*` / `actualizar*` / `eliminar*`, devolviendo siempre `success` y `message`.

---

## Multi-tenancy y finca activa

El sistema es **multi-finca**. Un usuario puede tener acceso a varias fincas (`UsuarioFinca`) pero
trabaja sobre **una finca activa a la vez** (la del selector, guardada en `Usuario.finca` y, en el
frontend, en `localStorage.fincaId`).

- Los **listados** se restringen a la finca activa mediante el helper `ids_para_listado(user)`.
- El **acceso a un registro concreto** o las **escrituras** se validan con
  `puede_acceder_finca` / `validar_finca` / `validar_admin_finca`.
- El **superadmin** ve todas las fincas.

Todos los helpers viven en `backend/accounts/permissions.py`. Detalle completo en
[`backend/README.md`](backend/README.md).

---

## Seguridad y permisos

- **JWT:** token de acceso 8 h, refresh 7 días, prefijo `JWT`. Verificación de expiración activa.
- **RBAC:** cada `Usuario` tiene un `Rol` con una lista JSON de permisos. La evaluación soporta
  `all` (acceso total), permiso exacto (`animales_ver`) o módulo (`animales` cubre todos sus permisos).
  Se valida en backend (`@login_required` + scope por finca) y en frontend (`ProtectedRoute`).
- **CORS:** restringido a `localhost:5173` en desarrollo; `CORS_ALLOW_ALL_ORIGINS=False`.
- **CSRF:** `/graphql/` es `csrf_exempt` (JWT stateless); el resto mantiene CSRF.
- **Contraseñas:** validadores estándar de Django (mín. 8, no comunes, no numéricas).
- **Secretos:** en `.env` (no versionado).

Permisos por módulo: `dashboard`, `animales`, `parcelas`, `vacunas`, `vacunaciones`,
`reproduccion`, `produccion`, `sanidad`, `ventas`, `compras`, `catalogos`, `rrhh`, `alertas`,
`configuracion`, `usuarios`, `roles` (cada uno con sus sufijos `_ver`, `_crear`, `_editar`, `_eliminar`).

---

## Instalación

**Requisitos:** Python 3.10+, Node.js 18+, PostgreSQL 14+.

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env          # editar credenciales de PostgreSQL
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver       # http://127.0.0.1:8000/graphql/
```

### Frontend

```powershell
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

> Detalle de comandos, seeds y un gotcha importante de `manage.py`: **[`backend/README.md`](backend/README.md)**.

---

## Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `SECRET_KEY` | Clave secreta de Django | — |
| `DEBUG` | Modo depuración | `True` |
| `DB_NAME` | Nombre de la base de datos | `sistema ganadero` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | — |
| `DB_HOST` | Host de PostgreSQL | `127.0.0.1` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `VITE_API_URL` *(frontend)* | URL del endpoint GraphQL | `http://127.0.0.1:8000/graphql/` |

**Localización:** Español (`es-es`), zona horaria `America/Asuncion`, i18n y zonas horarias en DB activadas.

---

## Documentación detallada

| Documento | Contenido |
|---|---|
| **[`backend/README.md`](backend/README.md)** | Convenciones GraphQL, multi-tenancy, referencia de entidades campo por campo, señales, migraciones, seeds y gotchas. |
| **[`frontend/README.md`](frontend/README.md)** | Estructura, Apollo, contexts, hooks, páginas/rutas, componentes, reportes reutilizables y tema MUI. |
| **[`CLAUDE.md`](CLAUDE.md)** | Guía de convenciones y buenas prácticas para trabajar (con Claude) sobre este proyecto. |

---

*Sistema desarrollado por Montero Software.*
