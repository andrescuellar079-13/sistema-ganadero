---
name: nueva-entidad-crud
description: Checklist guiado para agregar una entidad CRUD completa (modelo + GraphQL backend + hook/graphql/página frontend) siguiendo las convenciones reales del Sistema Ganadero. Úsalo cuando el usuario pida crear una entidad, tabla, módulo o CRUD nuevo.
---

# Agregar una entidad CRUD nueva

Sigue los pasos en orden. **Antes de escribir nada**, abre un módulo equivalente ya existente
(p. ej. `backend/catalogos/` para una entidad de catálogo, o `backend/sanidad/` si lleva animal)
y **copia su patrón**. No inventes estructura nueva.

## 1. Backend — modelo

En `backend/<app>/models.py`:
- Define el modelo en **español**. Casi siempre lleva `finca = models.ForeignKey(Finca, ...)`.
- Incluye `activo = models.BooleanField(default=True)` si la entidad se "desactiva" en vez de borrarse.
- Si tiene lógica al guardar, ponla en `save()` o en métodos del modelo (mira ejemplos como
  `NotaVenta.calcular_total()` o el `save()` de `DetalleVenta`).

Luego: `python manage.py makemigrations <app>` y `python manage.py migrate`.

## 2. Backend — schema.py

En `backend/<app>/schema.py`, en este orden:
1. **Type:** `class <Entidad>Type(DjangoObjectType)` con `model` y `fields = "__all__"`.
2. **Query:** declara el campo y su resolver. **Listados filtran por finca activa:**
   ```python
   @login_required
   def resolve_<plural>(self, info):
       return <Modelo>.objects.filter(finca_id__in=ids_para_listado(info.context.user))
   ```
   Importa los helpers de `accounts.permissions`.
3. **Mutations:** una clase por operación — `Crear<Entidad>`, `Actualizar<Entidad>`,
   `Eliminar<Entidad>`. Cada una:
   - lleva `@login_required`,
   - valida acceso a la finca en escritura (`validar_finca` / `validar_admin_finca` / `puede_acceder_finca`),
   - retorna `success` + `message`, todo dentro de `try/except`.
4. **Clase `Mutation` del módulo:** registra cada una con `.Field()`
   (`crear_<entidad> = Crear<Entidad>.Field()`).

## 3. Backend — registro global

Si es una **app nueva**, agrégala en `backend/config/schema.py`:
importa `Query as <App>Query, Mutation as <App>Mutation` y súmalas a las clases combinadas
`Query` y `Mutation`. Si la app ya estaba registrada, no hace falta.

## 4. Frontend — operaciones GraphQL

En `frontend/src/graphql/<modulo>.js`: define `GET_<PLURAL>`, `CREATE_<ENTIDAD>`,
`UPDATE_<ENTIDAD>`, `DELETE_<ENTIDAD>` con `gql\`...\``. Las mutations piden `success` y `message`
en la respuesta.

## 5. Frontend — hook

En `frontend/src/hooks/use<Modulo>.js` (o el hook existente del módulo):
- `useQuery` para el listado, `useMutation` para cada operación.
- Cada acción es `async`, hace la mutation, **refetch** del listado, y devuelve
  `{ success: true, data }` o `{ success: false, error }`.
- El `fincaId` SIEMPRE de `localStorage.getItem('fincaId')`.

Copia el bloque de `crearMedicamento` en `useCatalogos.js` como plantilla.

## 6. Frontend — UI

- Formulario `<Entidad>Form.jsx` en `components/`.
- Integra en la página `<Modulo>Page.jsx`.
- Reutiliza componentes existentes: `PageHeader`, `ConfirmDialog`, `StatusChip`, `EmptyState`,
  `PageAlert`, `LoadingSpinner`. No reinventes.

## 7. Verificar

- Backend: que el esquema cargue sin errores (`python manage.py migrate` y arrancar el server).
- Recuerda el gotcha de `manage.py` (seed pegado): usa `2>$null` en PowerShell para comandos one-off.
- Frontend: que el listado cambie al cambiar de finca activa (prueba real del multitenancy).
