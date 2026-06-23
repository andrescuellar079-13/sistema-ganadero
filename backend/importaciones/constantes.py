"""Especificación declarativa de la plantilla de importación.

Una sola fuente de verdad que alimenta:
  - la generación de la plantilla XLSX (``plantilla.py``),
  - la lectura/normalización del archivo (``lectores.py``),
  - la validación por celda (``validadores.py``).

Fase 1 cubre las hojas ANIMALES, PARCELAS y PESOS. Las demás hojas del spec
(MOVIMIENTOS_PARCELA, VACUNACIONES, TRATAMIENTOS, REPRODUCCION,
PRODUCCION_LECHE, VENTAS, BAJAS) se añaden agregando una entrada a ``HOJAS``
con la misma estructura: el resto de la infraestructura las toma sin cambios.
"""

# --- Choices (espejo de los modelos, evita import circular en validación) ---
SEXO_CHOICES = ["MACHO", "HEMBRA"]
ESTADO_ANIMAL_CHOICES = ["ACTIVO", "VENDIDO", "MUERTO", "DESCARTE", "MATADERO", "BAJA"]
TIPO_PRODUCCION_CHOICES = ["CARNE", "LECHE", "DOBLE_PROPOSITO"]
ORIGEN_CHOICES = ["NACIDO_FINCA", "COMPRADO", "DONADO"]

# Modos de importación
MODO_SOLO_CREAR = "SOLO_CREAR"
MODO_ACTUALIZAR = "ACTUALIZAR_EXISTENTES"
MODO_CREAR_O_ACTUALIZAR = "CREAR_O_ACTUALIZAR"
MODOS_VALIDOS = [MODO_SOLO_CREAR, MODO_ACTUALIZAR, MODO_CREAR_O_ACTUALIZAR]


# Tipos de columna soportados por el normalizador/validador.
TIPO_TEXTO = "texto"
TIPO_ENTERO = "entero"
TIPO_DECIMAL = "decimal"
TIPO_FECHA = "fecha"
TIPO_CHOICE = "choice"
TIPO_REFERENCIA = "referencia"  # nombre/arete que se resuelve contra BD o archivo


def col(key, header, tipo=TIPO_TEXTO, requerido=False, choices=None,
        default=None, ejemplo="", ayuda="", min_valor=None):
    return {
        "key": key,
        "header": header,
        "tipo": tipo,
        "requerido": requerido,
        "choices": choices,
        "default": default,
        "ejemplo": ejemplo,
        "ayuda": ayuda,
        "min_valor": min_valor,
    }


HOJA_ANIMALES = "ANIMALES"
HOJA_PARCELAS = "PARCELAS"
HOJA_PESOS = "PESOS"


HOJAS = {
    HOJA_PARCELAS: {
        "descripcion": "Potreros/parcelas de la finca. Se importan ANTES que "
                       "los animales para poder ubicarlos.",
        "columnas": [
            col("nombre", "nombre", requerido=True, ejemplo="Potrero Norte",
                ayuda="Nombre único de la parcela dentro de la finca."),
            col("estado", "estado", default="ACTIVA", ejemplo="ACTIVA"),
            col("tamano", "tamano_ha", tipo=TIPO_DECIMAL, default=0, ejemplo="12.5",
                min_valor=0, ayuda="Tamaño en hectáreas."),
            col("capacidad_maxima", "capacidad_maxima", tipo=TIPO_ENTERO, default=0,
                ejemplo="40", min_valor=0),
            col("tipo_pastura", "tipo_pastura", ejemplo="Brachiaria"),
        ],
    },
    HOJA_ANIMALES: {
        "descripcion": "Animales de la finca. nro_arete es la referencia global "
                       "usada por las demás hojas.",
        "columnas": [
            col("nro_arete", "nro_arete", requerido=True, ejemplo="AR-0001",
                ayuda="Identificador único global del animal. Obligatorio."),
            col("nombre", "nombre", ejemplo="Lucero"),
            col("sexo", "sexo", tipo=TIPO_CHOICE, requerido=True,
                choices=SEXO_CHOICES, ejemplo="HEMBRA"),
            col("raza", "raza", tipo=TIPO_REFERENCIA, ejemplo="Brahman",
                ayuda="Nombre de una raza ya existente en el catálogo."),
            col("categoria", "categoria", tipo=TIPO_REFERENCIA, ejemplo="Vaca",
                ayuda="Nombre de una categoría ya existente en el catálogo."),
            col("padre_arete", "padre_arete", tipo=TIPO_REFERENCIA, ejemplo="AR-0100",
                ayuda="Arete del padre (MACHO). Puede estar en este mismo archivo."),
            col("madre_arete", "madre_arete", tipo=TIPO_REFERENCIA, ejemplo="AR-0200",
                ayuda="Arete de la madre (HEMBRA). Puede estar en este mismo archivo."),
            col("fecha_nacimiento", "fecha_nacimiento", tipo=TIPO_FECHA,
                ejemplo="15/03/2022"),
            col("fecha_ingreso", "fecha_ingreso", tipo=TIPO_FECHA, ejemplo="01/01/2023"),
            col("peso", "peso_kg", tipo=TIPO_DECIMAL, default=0, ejemplo="380.5",
                min_valor=0),
            col("peso_nacimiento", "peso_nacimiento_kg", tipo=TIPO_DECIMAL, default=0,
                ejemplo="32", min_valor=0),
            col("estado", "estado", tipo=TIPO_CHOICE, choices=ESTADO_ANIMAL_CHOICES,
                default="ACTIVO", ejemplo="ACTIVO"),
            col("tipo_produccion", "tipo_produccion", tipo=TIPO_CHOICE,
                choices=TIPO_PRODUCCION_CHOICES, default="DOBLE_PROPOSITO",
                ejemplo="DOBLE_PROPOSITO"),
            col("origen", "origen", tipo=TIPO_CHOICE, choices=ORIGEN_CHOICES,
                default="NACIDO_FINCA", ejemplo="NACIDO_FINCA"),
            col("color", "color", ejemplo="Blanco"),
            col("parcela_actual", "parcela_actual", tipo=TIPO_REFERENCIA,
                ejemplo="Potrero Norte",
                ayuda="Parcela donde está el animal. Debe existir o venir en la hoja PARCELAS."),
            col("observaciones", "observaciones", ejemplo=""),
        ],
    },
    HOJA_PESOS: {
        "descripcion": "Historial de pesajes. Cada fila referencia un animal por "
                       "nro_arete.",
        "columnas": [
            col("nro_arete", "nro_arete", tipo=TIPO_REFERENCIA, requerido=True,
                ejemplo="AR-0001",
                ayuda="Arete de un animal existente o creado en la hoja ANIMALES."),
            col("fecha_pesaje", "fecha_pesaje", tipo=TIPO_FECHA, requerido=True,
                ejemplo="01/06/2024"),
            col("peso_kg", "peso_kg", tipo=TIPO_DECIMAL, requerido=True, ejemplo="395.0",
                min_valor=0),
            col("condicion_corporal", "condicion_corporal", tipo=TIPO_DECIMAL,
                default=0, ejemplo="3.5", min_valor=0),
            col("observacion", "observacion", ejemplo=""),
        ],
    },
}

# Orden de procesamiento (crítico): catálogos/parcelas → animales → pesos.
ORDEN_HOJAS = [HOJA_PARCELAS, HOJA_ANIMALES, HOJA_PESOS]


def columnas(hoja):
    return HOJAS[hoja]["columnas"]


def headers(hoja):
    return [c["header"] for c in columnas(hoja)]


def header_a_key(hoja):
    return {c["header"].strip().lower(): c["key"] for c in columnas(hoja)}


def columnas_requeridas(hoja):
    return [c for c in columnas(hoja) if c["requerido"]]
