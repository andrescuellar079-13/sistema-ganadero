# Backend — Sistema Ganadero (Django + GraphQL)

Documentación técnica detallada del backend. Para la visión general del sistema ver el
[`README.md`](../README.md) raíz; para convenciones de trabajo ver [`CLAUDE.md`](../CLAUDE.md).

---

## Contenido

1. [Estructura](#estructura)
2. [Convenciones GraphQL](#convenciones-graphql)
3. [Multi-tenancy y permisos](#multi-tenancy-y-permisos)
4. [Referencia de entidades por app](#referencia-de-entidades-por-app)
5. [Lógica de negocio (señales)](#lógica-de-negocio-señales)
6. [Migraciones](#migraciones)
7. [Seeds y comandos](#seeds-y-comandos)
8. [Gotchas](#gotchas)

---

## Estructura

Cada módulo es una **app Django** independiente con la misma forma:

```
<app>/
├── models.py        # Modelos (FK a Finca casi siempre presente)
├── schema.py        # Types + Query + Mutations + clase Mutation del módulo
├── migrations/
├── admin.py
└── tests.py
```

El esquema global (`config/schema.py`) hereda por mezcla la `Query` y la `Mutation` de cada app:

```python
class Query(AccountsQuery, CatalogosQuery, AnimalesQuery, ..., graphene.ObjectType): ...
class Mutation(AccountsMutation, CatalogosMutation, ..., graphene.ObjectType): ...
schema = graphene.Schema(query=Query, mutation=Mutation)
```

> Si agregas una **app nueva**, recuerda registrar su `Query` y `Mutation` aquí o no existirán en el API.

---

## Convenciones GraphQL

Orden dentro de cada `schema.py` (ver `catalogos/schema.py` como referencia):

1. **Types** — `DjangoObjectType` con `fields = "__all__"`. Se pueden añadir campos calculados
   (`graphene.String()` + `resolve_*`), p. ej. `VacunaType.is_stock_bajo`.
2. **Query** — declara campos y resolvers, **todos con `@login_required`**. Los listados filtran
   por finca activa:
   ```python
   @login_required
   def resolve_medicamentos(self, info):
       return Medicamento.objects.filter(finca_id__in=ids_para_listado(info.context.user))
   ```
3. **Mutations** — una clase `graphene.Mutation` por operación, con prefijos
   **`Crear` / `Actualizar` / `Eliminar`**. Cada `mutate`:
   - lleva `@login_required`,
   - valida acceso a la finca en escritura,
   - retorna `success` (Boolean) + `message` (String) + el objeto, todo en `try/except`.
   ```python
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
   ```
4. **Clase `Mutation` del módulo** — registra cada mutation con `.Field()`
   (`crear_raza = CrearRaza.Field()`). En GraphQL quedan en camelCase: `crearRaza`.

---

## Multi-tenancy y permisos

Helpers centrales en **`accounts/permissions.py`**. Reutilízalos siempre; no reimplementes el scope.

| Helper | Uso |
|---|---|
| `fincas_visibles(user)` | QuerySet de fincas accesibles (superadmin → todas). |
| `ids_fincas_visibles(user)` | Lista de IDs de fincas visibles. |
| `ids_para_listado(user)` | **IDs para LISTADOS por defecto**: la finca activa si es válida, si no todas las visibles. Úsalo en los `resolve_*` de listado. |
| `scope_ids(user, finca_id=None)` | IDs para filtrar cuando se pasa un `finca_id` explícito. |
| `puede_acceder_finca(user, finca_id)` | `True/False` de acceso de lectura a una finca. |
| `validar_finca(user, finca_id)` | Devuelve la `Finca` o lanza `GraphQLError`. |
| `puede_administrar_finca` / `validar_admin_finca` | Permiso de escritura/administración (rol `PROPIETARIO`/`ADMINISTRADOR`/`ENCARGADO` en `UsuarioFinca`, o superadmin). |
| `usuarios_de_finca(finca_id)` | Usuarios activos de una finca (para notificaciones). |

**Regla clave:** los listados usan `ids_para_listado` (finca activa), **no** `ids_fincas_visibles`.
Usar el helper equivocado rompe el cambio de finca activa.

### Roles y permisos (`accounts`)

- `Rol.permisos` es un `JSONField` (lista de claves). `tiene_permiso_rol` soporta `all`,
  coincidencia exacta y por módulo (`animales` cubre `animales_*`).
- `Usuario.es_superadmin` → acceso global (superuser, permiso `all`, o rol nombrado superadmin).
- `UsuarioFinca` modela el acceso N:M usuario↔finca con `rol_en_finca`
  (`PROPIETARIO`, `ADMINISTRADOR`, `ENCARGADO`, `VETERINARIO`, `LECTURA`).

---

## Referencia de entidades por app

> Se listan los campos propios relevantes. Casi todos los modelos llevan `finca` (FK) y
> auditoría (`registrado_por`, `fecha_registro`). Los campos `activo` indican baja lógica.

### accounts

**`Rol`** — `nombre` (unique), `descripcion`, `permisos` (JSON), `activo`.
**`Usuario`** (extiende `AbstractUser`) — `finca` (FK, finca activa), `rol` (FK), `telefono`, `activo`.
**`UsuarioFinca`** — `usuario` (FK), `finca` (FK), `rol_en_finca`, `activo`, `fecha_asignacion`. `unique(usuario, finca)`.

### fincas

**`Finca`** — `nombre`, `propietario`, `departamento`, `municipio`, `ubicacion`, `telefono`, `activo`, `fecha_creacion`.
**`TransferenciaFinca`** — `finca_origen`/`finca_destino` (FK), `fecha_transferencia`, `motivo`, `estado` (`BORRADOR`→`PENDIENTE_RECEPCION`→`RECIBIDA`/`RECHAZADA`/`CANCELADA`), `responsable`, fechas `envio`/`recepcion`, `recibido_por`/`rechazado_por`, `motivo_rechazo`. Valida origen ≠ destino.
**`DetalleTransferenciaFinca`** — `transferencia` (FK), `animal` (FK), `parcela_origen`/`parcela_destino`, `estado_animal_antes/despues`, `peso_actual_transferencia`, `recibido`. `unique(transferencia, animal)`.

### catalogos

**`Raza`** — `nombre`, `orientacion` (Carne/Leche/Doble), `origen`, `descripcion`, `activo`.
**`CategoriaAnimal`** — `nombre`, `sexo_aplica`, `edad_min/max_meses`, `peso_min/max_kg`, `tipo_produccion`, `permite_lactancia`, `permite_reproduccion`, `orden`, `activo` (reglas zootécnicas).
**`TipoMedicamento`** — `nombre`, `descripcion`.
**`Medicamento`** — `tipo` (FK), `nombre`, `laboratorio`, `principio_activo`, `presentacion`, `unidad_medida`, `stock_cantidad`, `stock_minimo`, `contenido_neto`, `fecha_vencimiento`, `precio_compra`, `dosis_recomendada`, `via_aplicacion`, `dias_retiro_carne`, `dias_retiro_leche`, `intervalo_dias`, `imagen`, `activo`.
**`Veterinario`** — `nombre`, `apellidos`, `ci`, `especialidad`, `telefono`, `email`, `matricula_profesional`, `tipo_servicio`, `costo_visita`, `firma_imagen`, `activo`.
**`Alimento`** — `nombre`, `tipo_alimento`, `contenido_neto`, `unidad_medida`, `fecha_vencimiento`, `stock_cantidad`, `stock_minimo`, `precio_referencia`, `costo_por_kg`, porcentajes nutricionales (`materia_seca`, `proteina`, `fibra`), `energia`, `uso_recomendado`, `activo`.
**`Reproductor`** — `raza` (FK), `animal_interno` (FK), `codigo`, `nombre`, `tipo_origen`, `tipo_reproductor`, `codigo_pajuela`, `laboratorio`, `stock_pajuelas`, `costo_pajuela`, `facilidad_parto`, `valor_genetico`, `activo`.
**`Vacuna`** — `nombre`, `enfermedad_previene`, `laboratorio`, `dosis_recomendada`, `via_aplicacion`, `intervalo_dias`, `edad_minima_meses`, `requiere_refuerzo`, `dias_anticipacion_alerta`, `sexo_aplicable`, `tipo_produccion_aplicable`, `stock_cantidad`, `stock_minimo`, `lote`, `fecha_vencimiento`, `activo`. Métodos `is_stock_bajo()`, `is_vencida()`.

### animales

**`Parcela`** — `nombre`, `estado`, `imagen`, `tamano` (ha), `capacidad_maxima`, `tipo_pastura`.
**`Animal`** — `raza`/`categoria`/`padre`/`madre` (FK), `nombre`, `nro_arete` (unique), `sexo`, `fecha_nacimiento`, `edad_ingreso_meses`, `estado` (`ACTIVO`/`VENDIDO`/`MUERTO`/`DESCARTE`/`MATADERO`/`BAJA`), `imagen`, `peso`, `peso_nacimiento`, `fecha_ingreso`, `tipo_produccion`, `origen`, `color`, `observaciones`.
**`AnimalParcela`** — historial: `animal`, `parcela`, `fecha_ingreso`, `fecha_salida` (null = actual).
**`MovimientoAnimal`** — `animal`, `finca_destino`, `parcela_origen`/`parcela_destino`, `fecha_movimiento`, `motivo`, `observaciones`.

### reproduccion

Base abstracta de eventos: **`EventoReproductivo`** — `hembra` (FK), `fecha`, `numero_servicio`, `fecha_probable_parto`, `resultado`, `observaciones`.

**`InseminacionArtificial`** (hereda) — `reproductor` (FK), `numero_pajuela`, `lote_nitrogeno`, `tecnico_inseminador`.
**`MontaNatural`** (hereda) — `reproductor` (FK), `duracion_dias`.
**`DiagnosticoPrenez`** (hereda) — `resultado_prenez`, `dias_gestacion`, `metodo`, `veterinario`, `fecha_confirmacion`.
**`Reproduccion`** (parto) — `madre`/`padre` (FK), `inseminacion`/`monta` (FK), `fecha_servicio`, `fecha_parto_esperado/real`, `tipo_parto` (`NORMAL`/`DISTOCICO`/`ABORTO`/`MULTIPLE`), `num_crias`, `crias` (M2M Animal), `estado`, `peso_total_crias`.
**`Celo`** — `hembra`, `fecha_inicio/fin`, `tipo`, `intensidad`, `detectado_por`.
**`Palpacion`** — `hembra`, `fecha`, `resultado`, `dias_gestacion_estimados`, `veterinario`.
**`HembraRepetidora`** — `animal` (OneToOne), `numero_servicios`, `servicios_fallidos` (JSON), `evaluada_veterinario`, `causa_presunta`, `descartada`, `motivo_descarte`.
**`AbortoDetallado`** — `reproduccion` (OneToOne), `causa`, `estado_feto`, `semanas_gestacion`, `tratamiento_aplicado`, `medidas_preventivas`, `costo_asociado`.
**`Destete`** — `madre`/`cria` (FK), `fecha_destete`, `tipo`, `edad_destete_dias`, `peso_cria`, `estado_cria`.

### produccion

**`RegistroPeso`** — `animal`, `fecha_pesaje`, `peso_kg`, `ganancia_diaria` (calculada), `condicion_corporal`, `observacion`.
**`Lactancia`** — `vaca`, `reproduccion` (FK), `numero_lactancia`, `fecha_inicio`, `fecha_secado`, `dias_produccion`, `total_litros`, `promedio_diario`, `ajuste_305_dias`, `estado`. Método `recalcular_totales()`.
**`ProduccionLeche`** — `vaca`, `lactancia` (FK, **requerida**), `fecha`, `turno` (`MANIANA`/`TARDE`/`NOCHE`), `litros`, `dias_en_lactancia`.
**`AlimentoAnimal`** — `animal`, `alimento` (FK), `cantidad`, `fecha_alimentacion`.
**`EngordeAnimal`** — `animal`, `fecha_inicio`, `peso_inicial`, `peso_objetivo`, `tipo_engorde` (`INTENSIVO`/`EXTENSIVO`/`SEMI_INTENSIVO`), `lote_grupo`, `estado` (`EN_ENGORDE`/`LISTO_VENTA`/`RETIRADO`/`VENDIDO`). Propiedades derivadas del último pesaje: `peso_actual`, `dias_en_engorde`, `ganancia_diaria`, `peso_faltante`; método `actualizar_estado()`.

### sanidad

Base abstracta: **`EventoSanitario`** — `animal`, `medicamento`, `veterinario`, `fecha`, `dosis`, `via_aplicacion`, `costo`, `proxima_fecha`, `observaciones`.

**`Vacunacion`** — `animal`, `vacuna` (FK), `veterinario`, `fecha_aplicacion`, `campana`, `lote`, `dosis_aplicada`, `via_aplicacion`, `fecha_proxima`.
**`Tratamiento`** (hereda `EventoSanitario`) — `diagnostico`, `tipo`, `dias_retiro`, `fecha_inicio/fin`, `costo_total`, `en_tratamiento`, `enfermedad` (FK).
**`Desparasitacion`** (hereda) — `tipo_parasiticida`, `producto`, `dosis`, `peso_aplicacion`, `lote`.
**`TratamientoMedicamento`** — `tratamiento` (FK), `medicamento`, `dosis`, `via_aplicacion`, `dias_retiro`, `fecha`.
**`AnimalMedicamento`** — `animal`, `medicamento`, `dosis`, `fecha_administracion`, `fecha_siguiente`.
**`Diagnostico`** — `animal`, `veterinario`, `descripcion`, `resultado`, `fecha`, `enfermedad` (FK).
**`Observacion`** — `animal`, `descripcion`, `fecha`.
**`Enfermedad`** — `nombre` (unique), `categoria`, `sintomas`, `causa`, `tratamiento_recomendado`, `tiempo_recuperacion_dias`, `es_zoonotica`, `mortalidad_porcentaje`.
**`ExamenLaboratorio`** — `animal`, `tipo_examen`, `laboratorio`, `fecha_toma/resultado`, `resultado`, `es_normal`, `archivo_pdf`.
**`RegistroMastitis`** — `animal`, `fecha`, `cuarto_afectado`, `tipo`, `bacteria`, `recuento_cels_somaticas`, `tratamiento` (FK), `se_curo`, `fecha_curacion`.
**`TiempoRetiro`** — `animal`, `tratamiento` (FK), `tipo_retiro` (carne/leche), `fecha_inicio/fin`, `dias_retiro`, `activo`.

### comercio

**`Cliente`** — `nombre`, `apellidos`, `telefono`, `direccion`, `ci`, `email`.
**`CorrallVenta`** — `nombre`, `descripcion`, `fecha_formacion`, `activo` (agrupa animales para venta por lote).
**`AnimalCorral`** — `corral` (FK), `animal` (FK), `peso_entrada`, `fecha_ingreso`.
**`NotaVenta`** — `cliente` (FK), `corral` (FK opcional), `modalidad_venta`, `monto_total`, `fecha_venta`, `guia_salida`. Método `calcular_total()`.
**`DetalleVenta`** — `nota_venta` (FK), `animal` (FK), `modalidad`, `precio_unitario`, `peso_venta_kg`, `sub_total`, `costo_estimado`, `utilidad`. Al guardar marca el animal como `VENDIDO`.
**`MuerteBaja`** — `animal` (FK), `fecha_baja`, `causa`, `tipo` (`MUERTE`/`SACRIFICIO`/`DESCARTE`/`PERDIDA`/`OTRO`), `motivo_descarte`, `descripcion`, `peso_estimado_kg`. Actualiza el estado del animal.

### compras

**`Proveedor`** — `nombre`, `apellidos`, `direccion`, `telefono`, `estado`, `nit`, `ci`.
**`NotaCompra`** — `proveedor` (FK), `tipo_compra` (`MEDICAMENTO`/`ALIMENTO`/`OTRO`/animal), `fecha_compra`, `monto_total`. Método `calcular_total()`.
**`DetalleCompra`** — `nota_compra` (FK), `medicamento` (FK), `precio_unitario`, `cantidad`, `sub_total`. Suma al stock del medicamento.
**`DetalleCompraAlimento`** — igual contra `alimento`. Suma al stock del alimento.
**`DetalleCompraAnimal`** — datos del animal comprado (`nro_arete`, `nombre`, `sexo`, `raza`, `categoria`, `peso`, `precio_unitario`, `sub_total`, `fecha_nacimiento`).
**`MovimientoInventario`** — `tipo_movimiento`, `tipo_producto`, `medicamento`/`alimento`/`vacuna` (FK), `nota_compra` (FK), `cantidad`, `stock_anterior/posterior`, `precio_unitario`, `fecha`, `motivo` (kardex de insumos).

### alertas

**`Alerta`** (centro de notificaciones) — `animal` (FK opcional), `tipo` (≈15 tipos: `VACUNA_PROXIMA`, `STOCK_BAJO_*`, `PARTO_PROXIMO`, `TRANSFERENCIA_*`, `ANIMAL_LISTO_VENTA`, …), `mensaje`, `fecha_alerta`, `dias_restantes`, `leida`, `prioridad` (`BAJA`/`MEDIA`/`ALTA`/`CRITICA`), `estado` (`PENDIENTE`/`LEIDA`/`EN_PROCESO`/`RESUELTA`/`DESCARTADA`), `modulo_origen`, `fecha_vencimiento`, `accion_recomendada`, `asignado_a`, `resuelta_por`, `fecha_resolucion`. Métodos `marcar_leida()`, `marcar_en_proceso()`, `resolver()`, `descartar()`; propiedad `vencida`.
**`Gasto`** — `animal` (FK opcional), `fecha`, `tipo_gasto`, `descripcion`, `cantidad`, `precio_unitario`, `total` (calculado), `centro_costo`, `metodo_pago`, `parcela`, `proveedor`, `comprobante`.

### rrhh

**`TipoEmpleado`** — `id` (UUID), `nombre` (unique), `descripcion`, `salario_base`, `activo` (catálogo de cargos).
**`Empleado`** — `id` (UUID), `tipo` (FK cargo), datos personales (`nombre`, `apellidos`, `ci` unique, `sexo`, `fecha_nacimiento`), contacto, `tipo_empleado` (rol operativo), `fecha_ingreso`, `salario`, **`estado_laboral`** (canónico: `ACTIVO`/`LICENCIA`/`SUSPENDIDO`/`RETIRADO`), `fecha_salida`, `motivo_salida`, `usuario` (OneToOne opcional), `imagen`, documentos. Propiedades `nombre_completo`, `is_activo`, `cargo_nombre`.

> ⚠️ En `Empleado`, `estado` y `fecha_retiro` son **campos legacy**; el estado laboral canónico es
> `estado_laboral` y la salida es `fecha_salida`.

---

## Lógica de negocio (señales)

| Modelo | Al guardar |
|---|---|
| `RegistroPeso` | Calcula `ganancia_diaria`; fija `Animal.peso` al último pesaje; si hay engorde activo, `actualizar_estado()`. |
| `ProduccionLeche` | Calcula `dias_en_lactancia` y llama `Lactancia.recalcular_totales()`. |
| `DetalleVenta` | Marca el `Animal` como `VENDIDO`. |
| `DetalleCompra` / `DetalleCompraAlimento` | Incrementan `stock_cantidad` del insumo. |
| `MuerteBaja` | Actualiza el estado del `Animal` según el tipo. |
| `Gasto` | `total = cantidad × precio_unitario`. |

---

## Migraciones

```powershell
python manage.py makemigrations <app>
python manage.py migrate
```

- No edites a mano una migración ya aplicada; crea una nueva.
- Si aparecen errores 400 raros, verifica que la última migración esté aplicada (modelo vs BD desincronizados).

---

## Seeds y comandos

| Archivo | Descripción |
|---|---|
| `seed_pedro.py` | Seeder **idempotente** de desarrollo (Hacienda Pedros, usuario `pedro`). Recomendado. |
| `seed_data.py` | Datos base. **Ojo:** su contenido está pegado al final de `manage.py` (ver gotchas). |
| `seed_categorias.py`, `seed_modulos.py` | Seeds específicos de catálogos/módulos. |

---

## Gotchas

- **`manage.py` tiene `seed_data.py` pegado al final.** Comandos one-off (`shell -c`, a veces
  `makemigrations`) ejecutan el seed y emiten ruido o crashean. Para un comando limpio en
  PowerShell, redirige stderr: `python manage.py <cmd> 2>$null`.
- **Bugs latentes de seeders:** `ProduccionLeche` requiere una `Lactancia` previa;
  `RegistroPeso.ganancia` mezcla float/Decimal; `Reproduccion` tiene `tipo_parto` y
  `peso_total_crias` NOT NULL.
- **Herencia multi-tabla:** en `sanidad` (`EventoSanitario`) y `reproduccion`
  (`EventoReproductivo`) varios modelos heredan de una base concreta; al consultar/crear ten en
  cuenta los campos heredados.
- **Pylance:** si VS Code marca `django` como no resuelto, selecciona el intérprete
  `backend/venv/Scripts/python.exe` (ya configurado en `.vscode/settings.json`).
