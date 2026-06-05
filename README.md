# Sistema Ganadero - Documentación Técnica

Sistema de gestión ganadera integral desarrollado con Django + GraphQL en el backend y React + Apollo Client en el frontend. Permite administrar animales, reproducción, producción de leche, sanidad, compras, ventas y recursos humanos de una finca ganadera.

---

## Tabla de Contenidos

1. [Tecnologías Utilizadas](#tecnologías-utilizadas)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Módulos y Modelos (Tablas)](#módulos-y-modelos-tablas)
4. [API GraphQL](#api-graphql)
5. [Frontend - Componentes y Páginas](#frontend---componentes-y-páginas)
6. [Seguridad](#seguridad)
7. [Configuración e Instalación](#configuración-e-instalación)
8. [Variables de Entorno](#variables-de-entorno)

---

## Tecnologías Utilizadas

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| Python | 3.10+ | Lenguaje principal |
| Django | 4.2.7 | Framework web |
| graphene-django | 3.1.5 | API GraphQL |
| graphql-jwt | — | Autenticación JWT para GraphQL |
| PostgreSQL | — | Base de datos relacional |
| psycopg2-binary | 2.9.9 | Driver PostgreSQL para Python |
| django-cors-headers | 4.3.1 | Manejo de CORS |
| djangorestframework | 3.14.0 | Utilidades REST auxiliares |
| python-decouple | 3.8 | Variables de entorno (.env) |
| python-dotenv | 1.0.0 | Carga de archivos .env |
| PyJWT | 2.8.0 | Generación y verificación de tokens JWT |

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| React | 18.2.0 | Biblioteca UI principal |
| Vite | 8.0.10 | Bundler y servidor de desarrollo |
| Apollo Client | 3.8.0 | Cliente GraphQL para React |
| Material-UI (MUI) | 9.0.1 | Componentes de interfaz de usuario |
| Tailwind CSS | 3.4.19 | Utilidades CSS |
| React Router | 6.20.0 | Enrutamiento del lado del cliente |
| Chart.js | — | Gráficos estadísticos |
| Recharts | — | Gráficos declarativos para React |
| jsPDF | — | Generación de reportes en PDF |
| xlsx | — | Exportación de datos a Excel |
| TypeScript | — | Tipado estático (configuración) |

---

## Arquitectura del Sistema

```
sistema-ganadero-main/
├── backend/                    # Django + GraphQL
│   ├── config/                 # Configuración principal
│   │   ├── settings.py         # Configuración Django (DB, JWT, CORS, etc.)
│   │   ├── urls.py             # Rutas principales
│   │   ├── schema.py           # Esquema GraphQL global
│   │   └── wsgi.py             # Servidor WSGI
│   ├── accounts/               # Usuarios, roles y permisos
│   ├── fincas/                 # Gestión de fincas
│   ├── catalogos/              # Razas, medicamentos, vacunas, etc.
│   ├── animales/               # Animales y parcelas
│   ├── reproduccion/           # Eventos reproductivos
│   ├── produccion/             # Pesos, lactancia, leche, alimentación
│   ├── sanidad/                # Vacunaciones, tratamientos, diagnósticos
│   ├── comercio/               # Ventas, clientes, muertes/bajas
│   ├── compras/                # Compras, proveedores, stock
│   ├── alertas/                # Alertas automáticas y gastos
│   └── rrhh/                   # Recursos humanos
│
└── frontend/                   # React + Apollo Client
    └── src/
        ├── apollo/             # Configuración Apollo (authLink, errorLink)
        ├── context/            # AuthContext, LayoutContext
        ├── components/         # 70+ componentes reutilizables
        ├── pages/              # 20+ páginas principales
        ├── graphql/            # Queries y mutations por módulo
        ├── hooks/              # Custom hooks para cada módulo
        ├── services/           # Generación de reportes (PDF/Excel)
        └── utils/              # Constantes y utilidades
```

**Flujo de una petición:**

```
Usuario (Browser)
    └─> React + Apollo Client
            └─> POST /graphql/ (con header Authorization: JWT <token>)
                    └─> graphql_jwt Middleware (verifica token)
                            └─> Resolver GraphQL (verifica permisos)
                                    └─> Modelo Django (PostgreSQL)
                                            └─> Respuesta JSON
```

---

## Módulos y Modelos (Tablas)

### `accounts` — Usuarios, Roles y Permisos

#### Tabla: `Rol`
| Campo | Tipo | Descripción |
|---|---|---|
| nombre | CharField | Nombre del rol (ej: Administrador) |
| descripcion | TextField | Descripción del rol |
| permisos | JSONField | Lista de permisos asignados al rol |
| activo | BooleanField | Estado del rol |

#### Tabla: `Usuario` (extiende AbstractUser)
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca a la que pertenece el usuario |
| rol | FK → Rol | Rol asignado |
| telefono | CharField | Teléfono de contacto |
| activo | BooleanField | Estado del usuario |

**Métodos:**
- `tiene_permiso(permiso)` — Verifica si el usuario tiene un permiso específico
- `es_administrador` — Propiedad que indica si tiene rol de admin

---

### `fincas` — Gestión de Fincas

#### Tabla: `Finca`
| Campo | Tipo | Descripción |
|---|---|---|
| nombre | CharField | Nombre de la finca |
| propietario | CharField | Nombre del propietario |
| departamento | CharField | Departamento/provincia |
| municipio | CharField | Municipio |
| ubicacion | TextField | Descripción de ubicación |
| telefono | CharField | Teléfono de la finca |
| activo | BooleanField | Estado de la finca |
| fecha_creacion | DateTimeField | Fecha de registro |

---

### `catalogos` — Catálogos del Sistema

#### Tabla: `Raza`
| Campo | Tipo | Descripción |
|---|---|---|
| nombre | CharField | Nombre de la raza |
| orientacion | CharField | Carne / Leche / Doble propósito |
| origen | CharField | Origen geográfico |
| descripcion | TextField | Descripción |
| activo | BooleanField | Estado |

#### Tabla: `CategoriaAnimal`
| Campo | Tipo | Descripción |
|---|---|---|
| nombre | CharField | Nombre de la categoría (ej: Ternero, Novillo) |
| descripcion | TextField | Descripción |
| activo | BooleanField | Estado |

#### Tabla: `Medicamento`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca propietaria |
| tipo | FK → TipoMedicamento | Tipo de medicamento |
| nombre | CharField | Nombre comercial |
| laboratorio | CharField | Laboratorio fabricante |
| unidad_medida | CharField | Unidad de medida (ml, g, etc.) |
| stock_cantidad | DecimalField | Cantidad en stock actual |
| contenido_neto | DecimalField | Contenido neto por envase |
| fecha_vencimiento | DateField | Fecha de vencimiento |
| precio_compra | DecimalField | Precio de compra |
| intervalo_dias | IntegerField | Días entre dosis |
| imagen | ImageField | Foto del producto |
| activo | BooleanField | Estado |

#### Tabla: `Veterinario`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca asignada |
| nombre | CharField | Nombre |
| apellidos | CharField | Apellidos |
| ci | CharField | Cédula de identidad |
| especialidad | CharField | Especialidad veterinaria |
| telefono | CharField | Teléfono |
| email | EmailField | Correo electrónico |
| activo | BooleanField | Estado |

#### Tabla: `Alimento`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca propietaria |
| nombre | CharField | Nombre del alimento |
| contenido_neto | DecimalField | Contenido neto por presentación |
| unidad_medida | CharField | Unidad de medida |
| fecha_vencimiento | DateField | Fecha de vencimiento |
| stock_cantidad | DecimalField | Stock actual |
| precio_referencia | DecimalField | Precio de referencia |
| activo | BooleanField | Estado |

#### Tabla: `Reproductor`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca propietaria |
| raza | FK → Raza | Raza del reproductor |
| codigo | CharField | Código identificador |
| nombre | CharField | Nombre |
| tipo_origen | CharField | INTERNO / EXTERNO / SEMEN |
| codigo_pajuela | CharField | Código de pajuela (semen) |
| laboratorio | CharField | Laboratorio de la pajuela |
| observaciones | TextField | Notas adicionales |
| activo | BooleanField | Estado |

#### Tabla: `Vacuna`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca asignada |
| nombre | CharField (unique) | Nombre de la vacuna |
| descripcion | TextField | Descripción |
| dosis_recomendada | DecimalField | Dosis recomendada |
| via_aplicacion | CharField | INTRAMUSCULAR / SUBCUTANEA / INTRADERMICA / ORAL |
| intervalo_dias | IntegerField | Días entre dosis de refuerzo |
| edad_minima_meses | IntegerField | Edad mínima para aplicar |
| activo | BooleanField | Estado |

---

### `animales` — Animales y Parcelas

#### Tabla: `Parcela`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca propietaria |
| nombre | CharField | Nombre de la parcela |
| estado | CharField | Estado actual |
| imagen | ImageField | Foto de la parcela |
| tamano | DecimalField | Tamaño en hectáreas |
| capacidad_maxima | IntegerField | Capacidad máxima de animales |
| tipo_pastura | CharField | Tipo de pasto |

#### Tabla: `Animal`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca propietaria |
| raza | FK → Raza | Raza del animal |
| categoria | FK → CategoriaAnimal | Categoría |
| padre | FK → Animal (self) | Padre biológico |
| madre | FK → Animal (self) | Madre biológica |
| nombre | CharField | Nombre del animal |
| nro_arete | CharField (unique) | Número de arete identificador |
| sexo | CharField | MACHO / HEMBRA |
| fecha_nacimiento | DateField | Fecha de nacimiento |
| edad_ingreso_meses | IntegerField | Edad al ingresar a la finca |
| estado | CharField | ACTIVO / VENDIDO / MUERTO / DESCARTE / MATADERO / BAJA |
| imagen | ImageField | Foto del animal |
| peso | DecimalField | Peso actual en kg |
| peso_nacimiento | DecimalField | Peso al nacer en kg |
| fecha_ingreso | DateField | Fecha de ingreso a la finca |
| tipo_produccion | CharField | CARNE / LECHE / DOBLE_PROPOSITO |
| origen | CharField | NACIDO_FINCA / COMPRADO / DONADO |
| color | CharField | Color del animal |
| observaciones | TextField | Notas adicionales |
| fecha_registro | DateTimeField | Fecha de registro en el sistema |

#### Tabla: `AnimalParcela` (historial de movimientos)
| Campo | Tipo | Descripción |
|---|---|---|
| animal | FK → Animal | Animal |
| parcela | FK → Parcela | Parcela |
| fecha_ingreso | DateField | Fecha de ingreso a la parcela |
| fecha_salida | DateField | Fecha de salida (null = actual) |

---

### `reproduccion` — Eventos Reproductivos

#### Tabla: `InseminacionArtificial`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| hembra | FK → Animal | Vaca inseminada |
| fecha | DateField | Fecha del procedimiento |
| numero_servicio | IntegerField | Número de servicio |
| reproductor | FK → Reproductor | Reproductor (pajuela) |
| numero_pajuela | CharField | Número de pajuela |
| lote_nitrogeno | CharField | Lote de nitrógeno |
| tecnico_inseminador | CharField | Técnico responsable |
| fecha_probable_parto | DateField | Fecha probable de parto |
| resultado | CharField | PENDIENTE / PRENADA / VACIA / REPETIR |
| observaciones | TextField | Notas |
| registrado_por | FK → Usuario | Usuario que registró |

#### Tabla: `MontaNatural`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| hembra | FK → Animal | Vaca |
| reproductor | FK → Reproductor | Toro |
| duracion_dias | IntegerField | Días de monta |
| fecha_probable_parto | DateField | Fecha estimada de parto |
| resultado | CharField | PENDIENTE / PRENADA / VACIA / REPETIR |

#### Tabla: `DiagnosticoPrenez`
| Campo | Tipo | Descripción |
|---|---|---|
| hembra | FK → Animal | Vaca diagnosticada |
| resultado_prenez | CharField | POSITIVO / NEGATIVO / DUDOSO |
| dias_gestacion | IntegerField | Días de gestación |
| metodo | CharField | Método de diagnóstico |
| veterinario | FK → Veterinario | Veterinario responsable |
| fecha_confirmacion | DateField | Fecha de confirmación |

#### Tabla: `Reproduccion` (parto)
| Campo | Tipo | Descripción |
|---|---|---|
| madre | FK → Animal | Vaca madre |
| padre | FK → Animal | Padre (si aplica) |
| inseminacion | FK → InseminacionArtificial | IA relacionada |
| monta | FK → MontaNatural | Monta relacionada |
| fecha_parto_esperado | DateField | Fecha esperada de parto |
| fecha_parto_real | DateField | Fecha real del parto |
| tipo_parto | CharField | NORMAL / DISTOCICO / ABORTO / MULTIPLE |
| num_crias | IntegerField | Número de crías |
| crias | M2M → Animal | Crías nacidas |
| estado | CharField | SERVIDA / PRENADA / PARIDA / ABORTO / VACIA |
| peso_total_crias | DecimalField | Peso total de las crías |
| observaciones | TextField | Notas |
| registrado_por | FK → Usuario | Usuario que registró |

---

### `produccion` — Producción y Pesos

#### Tabla: `RegistroPeso`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| animal | FK → Animal | Animal pesado |
| fecha_pesaje | DateField | Fecha del pesaje |
| peso_kg | DecimalField | Peso registrado en kg |
| ganancia_diaria | DecimalField | Ganancia diaria calculada |
| condicion_corporal | DecimalField | Condición corporal (1-5) |
| observacion | TextField | Notas |
| registrado_por | FK → Usuario | Usuario responsable |

#### Tabla: `Lactancia`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| vaca | FK → Animal | Vaca en lactancia |
| reproduccion | FK → Reproduccion | Parto que inició la lactancia |
| numero_lactancia | IntegerField | Número de lactancia de la vaca |
| fecha_inicio | DateField | Inicio de la lactancia |
| fecha_secado | DateField | Fecha de secado |
| dias_produccion | IntegerField | Días totales en producción |
| total_litros | DecimalField | Total de litros producidos |
| promedio_diario | DecimalField | Promedio diario de litros |
| ajuste_305_dias | DecimalField | Producción ajustada a 305 días |
| estado | CharField | ACTIVA / SECADA / FINALIZADA |

**Métodos:**
- `recalcular_totales()` — Recalcula total y promedio de litros

#### Tabla: `ProduccionLeche`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| vaca | FK → Animal | Vaca |
| lactancia | FK → Lactancia | Lactancia activa |
| fecha | DateField | Fecha del ordeño |
| turno | CharField | MANIANA / TARDE / NOCHE |
| litros | DecimalField | Litros producidos |
| dias_en_lactancia | IntegerField | Días transcurridos en lactancia |
| registrado_por | FK → Usuario | Usuario responsable |

#### Tabla: `AlimentoAnimal`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| animal | FK → Animal | Animal alimentado |
| alimento | FK → Alimento | Alimento suministrado |
| cantidad | DecimalField | Cantidad suministrada |
| fecha_alimentacion | DateField | Fecha |
| registrado_por | FK → Usuario | Usuario responsable |

---

### `sanidad` — Salud Animal

#### Tabla: `Vacunacion`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| animal | FK → Animal | Animal vacunado |
| vacuna | FK → Vacuna | Vacuna aplicada |
| fecha_aplicacion | DateField | Fecha de aplicación |
| dosis_aplicada | DecimalField | Dosis aplicada |
| via_aplicacion | CharField | Vía de aplicación |
| proxima_dosis | DateField | Fecha próxima dosis |
| veterinario | FK → Veterinario | Veterinario responsable |
| registrado_por | FK → Usuario | Usuario que registró |

#### Tabla: `Tratamiento`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| animal | FK → Animal | Animal tratado |
| medicamento | FK → Medicamento | Medicamento usado |
| fecha_inicio | DateField | Inicio del tratamiento |
| fecha_fin | DateField | Fin del tratamiento |
| dosis | DecimalField | Dosis aplicada |
| frecuencia | CharField | Frecuencia de aplicación |
| veterinario | FK → Veterinario | Veterinario responsable |
| diagnostico | TextField | Diagnóstico |
| observaciones | TextField | Notas |
| registrado_por | FK → Usuario | Usuario que registró |

---

### `comercio` — Ventas y Bajas

#### Tabla: `Cliente`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| nombre | CharField | Nombre del cliente |
| apellidos | CharField | Apellidos |
| telefono | CharField | Teléfono |
| direccion | TextField | Dirección |
| ci | CharField | Cédula de identidad |
| email | EmailField | Correo electrónico |

#### Tabla: `NotaVenta`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| cliente | FK → Cliente | Cliente comprador |
| monto_total | DecimalField | Monto total de la venta |
| fecha_venta | DateField | Fecha de venta |
| guia_salida | CharField | Número de guía de salida |
| observaciones | TextField | Notas |
| registrado_por | FK → Usuario | Usuario que registró |

**Métodos:**
- `calcular_total()` — Recalcula el monto total sumando detalles

#### Tabla: `DetalleVenta`
| Campo | Tipo | Descripción |
|---|---|---|
| nota_venta | FK → NotaVenta | Nota de venta |
| animal | FK → Animal | Animal vendido |
| precio_unitario | DecimalField | Precio de venta |
| peso_venta_kg | DecimalField | Peso al momento de venta |
| sub_total | DecimalField | Subtotal del ítem |

> Al guardar un `DetalleVenta`, el estado del `Animal` se actualiza automáticamente a `VENDIDO`.

#### Tabla: `MuerteBaja`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| animal | FK → Animal | Animal dado de baja |
| fecha_baja | DateField | Fecha de la baja |
| causa | CharField | Causa principal |
| tipo | CharField | MUERTE / SACRIFICIO / DESCARTE / PERDIDA / OTRO |
| descripcion | TextField | Descripción detallada |
| peso_estimado_kg | DecimalField | Peso estimado al dar de baja |
| registrado_por | FK → Usuario | Usuario que registró |

> Al guardar, el estado del `Animal` se actualiza automáticamente según el tipo de baja.

---

### `compras` — Compras y Proveedores

#### Tabla: `Proveedor`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| nombre | CharField | Nombre del proveedor |
| apellidos | CharField | Apellidos |
| direccion | TextField | Dirección |
| telefono | CharField | Teléfono |
| estado | BooleanField | Estado activo/inactivo |
| nit | CharField | NIT fiscal |
| ci | CharField | Cédula de identidad |

#### Tabla: `NotaCompra`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| proveedor | FK → Proveedor | Proveedor |
| tipo_compra | CharField | MEDICAMENTO / ALIMENTO / OTRO |
| fecha_compra | DateField | Fecha de compra |
| monto_total | DecimalField | Monto total |
| observaciones | TextField | Notas |
| registrado_por | FK → Usuario | Usuario que registró |

**Métodos:**
- `calcular_total()` — Suma todos los detalles de la compra

#### Tabla: `DetalleCompra`
| Campo | Tipo | Descripción |
|---|---|---|
| nota_compra | FK → NotaCompra | Nota de compra |
| medicamento | FK → Medicamento | Medicamento comprado |
| precio_unitario | DecimalField | Precio unitario |
| cantidad | DecimalField | Cantidad comprada |
| sub_total | DecimalField | Subtotal |

> Al guardar, actualiza automáticamente el `stock_cantidad` del medicamento.

#### Tabla: `DetalleCompraAlimento`
| Campo | Tipo | Descripción |
|---|---|---|
| nota_compra | FK → NotaCompra | Nota de compra |
| alimento | FK → Alimento | Alimento comprado |
| precio_unitario | DecimalField | Precio unitario |
| cantidad | DecimalField | Cantidad comprada |
| sub_total | DecimalField | Subtotal |

> Al guardar, actualiza automáticamente el `stock_cantidad` del alimento.

---

### `alertas` — Alertas y Gastos

#### Tabla: `Alerta`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| animal | FK → Animal (null) | Animal relacionado (opcional) |
| tipo | CharField | VACUNA_PROXIMA / VACUNA_VENCIDA / PARTO_PROXIMO / STOCK_BAJO_MEDICAMENTO / STOCK_BAJO_ALIMENTO / PESAJE_PENDIENTE / OTRO |
| mensaje | TextField | Mensaje de la alerta |
| fecha_alerta | DateField | Fecha de la alerta |
| dias_restantes | IntegerField | Días restantes para el evento |
| leida | BooleanField | Si la alerta fue leída |
| referencia_id | IntegerField | ID del objeto relacionado |
| referencia_tipo | CharField | Tipo del objeto relacionado |

**Métodos:**
- `marcar_leida()` — Marca la alerta como leída

#### Tabla: `Gasto`
| Campo | Tipo | Descripción |
|---|---|---|
| finca | FK → Finca | Finca |
| animal | FK → Animal (null) | Animal relacionado (opcional) |
| fecha | DateField | Fecha del gasto |
| tipo_gasto | CharField | SANIDAD / REPRODUCCION / ALIMENTO / MANO_DE_OBRA / TRANSPORTE / MANTENIMIENTO / COMBUSTIBLE / OTRO |
| descripcion | TextField | Descripción del gasto |
| cantidad | DecimalField | Cantidad de unidades |
| precio_unitario | DecimalField | Precio por unidad |
| total | DecimalField | Total calculado automáticamente |
| registrado_por | FK → Usuario | Usuario que registró |

---

### `rrhh` — Recursos Humanos

#### Tabla: `TipoEmpleado`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUIDField | Identificador único |
| nombre | CharField (unique) | Tipo de empleado (ej: Vaquero, Administrador) |
| descripcion | TextField | Descripción del tipo |
| salario_base | DecimalField | Salario base del tipo |
| activo | BooleanField | Estado |

#### Tabla: `Empleado`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUIDField | Identificador único |
| finca | FK → Finca | Finca |
| tipo | FK → TipoEmpleado | Tipo de empleado |
| nombre | CharField | Nombre |
| apellidos | CharField | Apellidos |
| ci | CharField (unique) | Cédula de identidad |
| sexo | CharField | Sexo |
| fecha_nacimiento | DateField | Fecha de nacimiento |
| telefono | CharField | Teléfono |
| email | EmailField | Correo electrónico |
| direccion | TextField | Dirección |
| fecha_ingreso | DateField | Fecha de ingreso |
| fecha_retiro | DateField | Fecha de retiro (null = activo) |
| salario | DecimalField | Salario actual |
| usuario | OneToOne → Usuario | Cuenta de usuario vinculada |
| estado | CharField | ACTIVO / INACTIVO / LICENCIA / VACACIONES |
| imagen | ImageField | Foto del empleado |

**Propiedades:**
- `nombre_completo` — Concatena nombre y apellidos
- `is_activo` — Booleano, verdadero si estado es ACTIVO

---

## API GraphQL

El sistema expone **un único endpoint GraphQL** que centraliza todas las operaciones:

```
POST /graphql/
```

### Autenticación

```graphql
# Iniciar sesión
mutation Login($username: String!, $password: String!) {
  tokenAuth(username: $username, password: $password) {
    token
    refreshToken
  }
}

# Renovar token
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    token
  }
}

# Cerrar sesión
mutation Logout {
  logout {
    success
  }
}

# Datos del usuario autenticado
query MiUsuario {
  miUsuario {
    id
    username
    email
    firstName
    lastName
    rol {
      nombre
      permisosLista
    }
    finca { id nombre }
    telefono
    isActive
  }
}
```

### Operaciones por Módulo

Cada módulo expone sus propias `queries` y `mutations` en el esquema GraphQL global:

| Módulo | Queries | Mutations |
|---|---|---|
| accounts | `miUsuario`, `usuarios`, `roles` | `crearUsuario`, `editarUsuario`, `crearRol`, `editarRol` |
| animales | `animales`, `animal`, `parcelas` | `crearAnimal`, `editarAnimal`, `crearParcela`, `moverAnimal` |
| catalogos | `razas`, `vacunas`, `medicamentos`, `alimentos`, `veterinarios`, `reproductores` | `crear*`, `editar*`, `eliminar*` |
| produccion | `registrosPeso`, `lactancias`, `produccionLeche` | `registrarPeso`, `crearLactancia`, `registrarProduccion` |
| reproduccion | `inseminaciones`, `montas`, `partos` | `crearInseminacion`, `crearMonta`, `registrarParto` |
| sanidad | `vacunaciones`, `tratamientos` | `registrarVacunacion`, `crearTratamiento` |
| comercio | `ventas`, `clientes`, `muertesBajas` | `crearVenta`, `crearCliente`, `registrarBaja` |
| compras | `compras`, `proveedores` | `crearCompra`, `crearProveedor` |
| alertas | `alertas`, `gastos` | `marcarAlertaLeida`, `crearGasto` |
| rrhh | `empleados`, `tiposEmpleado` | `crearEmpleado`, `editarEmpleado` |

---

## Frontend - Componentes y Páginas

### Páginas principales (`src/pages/`)

| Página | Ruta | Descripción |
|---|---|---|
| `DashboardPage` | `/dashboard` | Estadísticas generales, gráficos y alertas |
| `AnimalesPage` | `/animales` | Listado, búsqueda y gestión de animales |
| `CatalogosPage` | `/catalogos` | Razas, categorías, vacunas, medicamentos |
| `ParcelasPage` | `/parcelas` | Gestión de parcelas y movimiento de animales |
| `ProduccionPage` | `/produccion` | Registro de pesos y producción de leche |
| `ReproduccionPage` | `/reproduccion` | IA, monta natural, partos |
| `SanidadPage` | `/sanidad` | Vacunaciones y tratamientos |
| `VacunacionesPage` | `/vacunaciones` | Historial de vacunaciones |
| `VentasPage` | `/ventas` | Notas de venta y listado |
| `ComprasPage` | `/compras` | Notas de compra de insumos |
| `ProveedoresPage` | `/proveedores` | Gestión de proveedores |
| `RrhhPage` | `/rrhh` | Gestión de empleados |
| `AlertasPage` | `/alertas` | Alertas del sistema |
| `UsuariosPage` | `/usuarios` | Administración de usuarios |
| `RolesPage` | `/roles` | Administración de roles y permisos |
| `MuerteBajaPage` | `/muertes-bajas` | Registro de bajas de animales |
| `FincaPage` | `/finca` | Configuración de la finca |
| `UnauthorizedPage` | `/unauthorized` | Acceso denegado |
| `NotFoundPage` | `*` | Página 404 |

### Componentes reutilizables (`src/components/`)

**UI General:**
- `PageHeader` — Cabecera de páginas con título y acciones
- `ConfirmDialog` — Diálogo de confirmación genérico
- `EmptyState` — Estado vacío para listas sin datos
- `PageAlert` — Alertas/notificaciones en página
- `StatusChip` — Chip de estado con colores por tipo
- `LoadingSpinner` — Indicador de carga
- `ErrorMessage` — Visualización de errores

**Formularios:**
- `AnimalForm` — Formulario de creación/edición de animales
- `ParcelaForm` — Formulario de parcelas
- `VacunacionForm` — Registro de vacunaciones
- `ProduccionLecheForm` — Registro de producción de leche
- `RegistroPesoForm` — Registro de pesajes
- `InseminacionForm` — Inseminación artificial
- `PartoForm` — Registro de partos
- `CompraForm` — Nota de compra
- `VentaForm` — Nota de venta
- `EmpleadoForm` — Empleados

**Visualización:**
- `AnimalCard` — Tarjeta resumen de animal
- `AlertaCard` — Tarjeta de alerta del sistema
- `ProximosPartosCard` — Widget de partos próximos
- `ProximasVacunaciones` — Widget de vacunaciones próximas

**Gráficos:**
- `AnimalesPorSexoChart` — Distribución por sexo (pie chart)
- `AnimalesPorCategoriaChart` — Distribución por categoría
- `VacunacionesPorMesChart` — Vacunaciones por mes (bar chart)
- `BarChart`, `PieChart` — Componentes genéricos de gráficos

**Autenticación y Rutas:**
- `Login` — Formulario de inicio de sesión
- `ProtectedRoute` — HOC que requiere autenticación
- `RoleBasedRoute` — HOC que requiere un permiso específico

**Layout:**
- `Navbar` — Barra superior de navegación
- `Sidebar` — Menú lateral con navegación
- `Layout` — Contenedor principal del layout

### Hooks personalizados (`src/hooks/`)

Cada módulo tiene su propio hook que encapsula las operaciones GraphQL:

- `useAuth` — Login, logout, verificación de sesión y permisos
- `useAnimales` — CRUD de animales y filtros
- `useProduccion` — Registro de pesos y producción de leche
- `useReproduccion` — Gestión de eventos reproductivos
- `useSanidad` — Vacunaciones y tratamientos
- `useVacunaciones` — Historial de vacunaciones
- `useVentas` — Notas de venta y clientes
- `useCompras` — Compras y proveedores
- `useCatalogos` — Acceso a catálogos del sistema
- `useAlertas` — Alertas y notificaciones
- `useRrhh` — Gestión de empleados

### Servicios (`src/services/`)

- `reportesService.js` — Generación de reportes en **PDF** (jsPDF) y **Excel** (xlsx) para cualquier módulo del sistema

---

## Seguridad

### 1. Autenticación JWT

El sistema utiliza **JSON Web Tokens (JWT)** para autenticación sin estado:

- **Token de acceso:** Expira en **8 horas**
- **Refresh token:** Válido por **7 días**
- **Prefijo del header:** `Authorization: JWT <token>`
- **Verificación de expiración:** Activada en todos los endpoints

```python
GRAPHQL_JWT = {
    'JWT_VERIFY_EXPIRATION': True,
    'JWT_EXPIRATION_DELTA': timedelta(hours=8),
    'JWT_ALLOW_REFRESH': True,
    'JWT_REFRESH_EXPIRATION_DELTA': timedelta(days=7),
    'JWT_AUTH_HEADER_PREFIX': 'JWT',
}
```

En el frontend, Apollo Client agrega automáticamente el header de autorización mediante un `authLink` antes de cada petición GraphQL.

### 2. Control de Acceso Basado en Roles (RBAC)

El sistema implementa un modelo de permisos granular con dos capas de validación:

**Capa Backend (Django):**
- Decorador `@login_required` en cada resolver GraphQL
- Verificación de permisos del rol en operaciones sensibles
- Cada usuario tiene un `Rol` con una lista JSON de permisos

**Capa Frontend (React):**
- `AuthContext` mantiene los permisos del usuario en memoria
- `RoleBasedRoute` bloquea el acceso a rutas sin permiso
- `evaluarPermiso()` soporta tres tipos de evaluación:
  - `'all'` — Acceso total (superadmin)
  - Exacto: `'animales_ver'` — Permiso específico
  - Módulo: `'animales'` — Cubre todos los permisos del módulo

**Permisos disponibles:**

| Módulo | Permisos |
|---|---|
| Dashboard | `dashboard_ver` |
| Animales | `animales_ver`, `animales_crear`, `animales_editar`, `animales_eliminar` |
| Parcelas | `parcelas_ver`, `parcelas_crear`, `parcelas_editar`, `parcelas_eliminar` |
| Vacunas | `vacunas_ver`, `vacunas_crear`, `vacunas_editar`, `vacunas_eliminar` |
| Vacunaciones | `vacunaciones_ver`, `vacunaciones_crear` |
| Reproducción | `reproduccion_ver`, `reproduccion_crear` |
| Producción | `produccion_ver`, `produccion_crear` |
| Sanidad | `sanidad_ver`, `sanidad_crear` |
| Ventas | `ventas_ver`, `ventas_crear` |
| Compras | `compras_ver`, `compras_crear` |
| RRHH | `rrhh_ver`, `rrhh_crear`, `rrhh_editar`, `rrhh_eliminar` |
| Alertas | `alertas_ver`, `alertas_crear` |
| Configuración | `configuracion_ver`, `configuracion_editar` |
| Usuarios | `usuarios_ver`, `usuarios_crear`, `usuarios_editar`, `usuarios_eliminar` |
| Roles | `roles_ver`, `roles_crear`, `roles_editar`, `roles_eliminar` |

### 3. Validación de Contraseñas

Django aplica las siguientes validaciones sobre las contraseñas de los usuarios:

- Mínimo **8 caracteres**
- No puede ser similar al nombre de usuario o email
- No puede ser una contraseña común (lista negra de Django)
- No puede ser completamente numérica

### 4. CORS (Cross-Origin Resource Sharing)

```python
# Solo permite el frontend en desarrollo
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Siempre False en producción
```

### 5. CSRF

- El endpoint `/graphql/` tiene `csrf_exempt` ya que usa autenticación JWT stateless
- El resto de las rutas Django mantienen la protección CSRF activa

### 6. Seguridad del Servidor

Middlewares de Django activos:

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # CORS (debe ir primero)
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### 7. Variables de Entorno

Credenciales y configuraciones sensibles se almacenan en un archivo `.env` usando `python-decouple`:

```
SECRET_KEY=...
DEBUG=False
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432
```

### 8. Manejo de Tokens en el Frontend

El `errorLink` de Apollo Client detecta errores de autenticación automáticamente:
- Si el servidor responde con error `UNAUTHENTICATED` o `JWT_EXPIRED`, limpia el token del `localStorage` y redirige al login

---

## Configuración e Instalación

### Requisitos previos

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
# 1. Entrar a la carpeta backend
cd backend

# 2. Crear entorno virtual e instalar dependencias
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# 3. Configurar variables de entorno
copy .env.example .env
# Editar .env con las credenciales de PostgreSQL

# 4. Aplicar migraciones
python manage.py migrate

# 5. Crear superusuario
python manage.py createsuperuser

# 6. Iniciar servidor de desarrollo
python manage.py runserver
```

### Frontend

```bash
# 1. Entrar a la carpeta frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `SECRET_KEY` | Clave secreta de Django | — |
| `DEBUG` | Modo de depuración | `True` |
| `DB_NAME` | Nombre de la base de datos | `sistema ganadero` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | — |
| `DB_HOST` | Host de PostgreSQL | `127.0.0.1` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |

---

## Localización

| Configuración | Valor |
|---|---|
| Idioma | Español (`es-es`) |
| Zona horaria | `America/Asuncion` |
| Internacionalización | Activada |
| Zonas horarias en DB | Activadas |

---

*Sistema desarrollado por Montero Software — 2024*
