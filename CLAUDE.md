# CLAUDE.md — Guía para Claude en el Sistema Ganadero

Esta guía le da contexto a Claude (y a cualquier desarrollador) sobre las convenciones
reales de este proyecto. **Síguela siempre**: replicar el patrón existente vale más que
"mejorarlo" por tu cuenta.

> Documentación técnica: visión general en `README.md`; detalle por capa en
> `backend/README.md` (entidades campo por campo, señales, gotchas) y `frontend/README.md`.

---

## Stack

- **Backend:** Django 4.2 + Graphene (GraphQL) + graphql-jwt + PostgreSQL. Carpeta `backend/`.
- **Frontend:** React 18 + Vite + Apollo Client + MUI + Tailwind. Carpeta `frontend/`.
- **Idioma del código:** **español** (nombres de modelos, campos, resolvers, hooks, variables).
  Mantenlo. No mezcles inglés salvo en términos técnicos ya establecidos (`success`, `message`, `Query`, `Mutation`).
- **Plataforma de desarrollo:** Windows + PowerShell. Hay un entorno virtual en `backend/venv/`.

---

## Reglas de oro (no negociables)

1. **Multitenancy por finca activa.** El usuario trabaja sobre UNA finca a la vez.
   - **Listados** → filtra por `finca_id__in=ids_para_listado(user)` (NO `ids_fincas_visibles`).
     Usar el helper equivocado rompe el cambio de finca y reintroduce un bug ya corregido.
   - **Detalle / escritura** → valida acceso con `puede_acceder_finca`, `validar_finca`
     o `validar_admin_finca`.
   - Todos los helpers viven en `backend/accounts/permissions.py`. **Reutilízalos, no los reimplementes.**

2. **Todo resolver y toda mutation lleva `@login_required`** (de `graphql_jwt.decorators`).

3. **Mutations devuelven `success` + `message`** y nunca explotan: envuelve la lógica en
   `try/except` y retorna `success=False, message=str(e)` en el error. Sigue el patrón de
   `CrearRaza` / `ActualizarRaza` / `EliminarRaza` en `catalogos/schema.py`.

4. **No inventes mecanismos nuevos.** Antes de escribir, abre un módulo equivalente y copia su
   estructura (p. ej. para una entidad de catálogo, mira `catalogos/`; para frontend, mira
   `useCatalogos.js`).

---

## Arquitectura backend (un módulo = una app Django)

Cada app (`catalogos`, `animales`, `sanidad`, …) tiene:

```
<modulo>/
├── models.py        # Modelos Django. FK a Finca casi siempre presente.
├── schema.py        # Types + Query + Mutations + clase Mutation (registro de .Field())
├── migrations/
└── admin.py
```

`schema.py` se organiza así, en este orden:

```python
# 1. Types
class RazaType(DjangoObjectType):
    class Meta:
        model = Raza
        fields = "__all__"

# 2. Query: declara los campos y sus resolvers (todos @login_required)
class Query(graphene.ObjectType):
    razas = graphene.List(RazaType)

    @login_required
    def resolve_medicamentos(self, info):
        return Medicamento.objects.filter(finca_id__in=ids_para_listado(info.context.user))

# 3. Mutations: una clase por operación (Crear/Actualizar/Eliminar<Entidad>)
class CrearRaza(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
    raza = graphene.Field(RazaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, ...):
        try:
            ...
            return CrearRaza(raza=raza, success=True, message="...")
        except Exception as e:
            return CrearRaza(raza=None, success=False, message=str(e))

# 4. Clase Mutation del módulo: registra cada mutation como .Field()
class Mutation(graphene.ObjectType):
    crear_raza = CrearRaza.Field()
    actualizar_raza = ActualizarRaza.Field()
    eliminar_raza = EliminarRaza.Field()
```

**Registro global:** toda nueva app debe sumar su `Query` y `Mutation` a las clases combinadas
de `backend/config/schema.py` (las hereda por mezcla de clases). Si no la registras ahí, no existe en el API.

Convenciones de nombres de mutations: prefijos **`Crear` / `Actualizar` / `Eliminar`** (en clases)
y `crear_*` / `actualizar_* ` / `eliminar_*` (en el campo). En GraphQL quedan como
`crearRaza`, `actualizarRaza`, `eliminarRaza`.

---

## Arquitectura frontend (un módulo = un hook)

```
frontend/src/
├── graphql/<modulo>.js   # gql`...` de queries y mutations (GET_*, CREATE_*, UPDATE_*, DELETE_*)
├── hooks/use<Modulo>.js  # encapsula useQuery/useMutation + funciones async
├── pages/<Modulo>Page.jsx
└── components/<Entidad>Form.jsx, etc.
```

Patrón del hook (de `useCatalogos.js`): cada acción de escritura es `async`, hace la mutation,
**refetch** del listado, y devuelve un objeto uniforme:

```js
const crearMedicamento = async (variables) => {
  try {
    const fincaId = localStorage.getItem('fincaId')   // finca activa
    const { data } = await crearMedicamentoMutation({ variables: { fincaId, ...variables } })
    await refetchMedicamentos()
    return { success: true, data: data?.crearMedicamento }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

- El `fincaId` SIEMPRE sale de `localStorage.getItem('fincaId')`, nunca hardcodeado.
- Tras una mutation, refetch del query afectado.
- Componentes UI reutilizables ya existen (`PageHeader`, `ConfirmDialog`, `StatusChip`,
  `EmptyState`, etc.) — úsalos antes de crear uno nuevo.

---

## Migraciones

- Después de tocar `models.py`: `python manage.py makemigrations <app>` y luego `migrate`.
- **Nunca** edites a mano una migración ya aplicada; crea una nueva.
- Si un modelo y la BD se desincronizan (errores 400 raros), revisa que la última migración
  esté aplicada antes de tocar código.

---

## ⚠️ Gotchas conocidos de este repo

- **`backend/manage.py` ya está limpio** (forma estándar de Django). Antes tenía una copia vieja
  de `seed_data.py` pegada al final que se ejecutaba tras cada comando one-off; se eliminó. El
  seeder real y mantenido es `seed_data.py` (`python seed_data.py`) o `seed_pedro.py`.
- **Seeders con bugs latentes:** `ProduccionLeche` requiere una `Lactancia` previa;
  `RegistroPeso.ganancia` mezcla float/Decimal; `Reproduccion` tiene `tipo_parto` y
  `peso_total_crias` NOT NULL. Si tocas seeders, ten esto presente.
- **`seed_pedro.py`** es el seeder idempotente de desarrollo (Hacienda Pedros, usuario `pedro`).

---

## Convenciones de Git

- Rama de trabajo: `escobarnina`. Rama principal: `main`.
- La config local de Claude (`.claude/settings.local.json`, skills) vive en la rama de desarrollo,
  no se sube a `main`.
- Commits descriptivos en español. Confirma antes de hacer push.

---

## Flujos asistidos (skills)

- `/nueva-entidad-crud` — checklist para agregar una entidad CRUD completa (backend + frontend)
  siguiendo estas convenciones.
- `/entorno-dev` — cómo levantar backend, frontend y correr migraciones/seeds en Windows.
