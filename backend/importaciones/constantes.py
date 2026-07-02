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
import unicodedata

# --- Choices (espejo de los modelos, evita import circular en validación) ---
SEXO_CHOICES = ["MACHO", "HEMBRA"]
ESTADO_ANIMAL_CHOICES = ["ACTIVO", "VENDIDO", "MUERTO", "DESCARTE", "MATADERO", "BAJA"]
TIPO_PRODUCCION_CHOICES = ["CARNE", "LECHE", "DOBLE_PROPOSITO"]
ORIGEN_CHOICES = ["NACIDO_FINCA", "COMPRADO", "DONADO"]

# --- Sinónimos por campo choice ----------------------------------------------
# Mapa "forma normalizada del valor escrito por el usuario -> valor canónico
# del modelo". La clave ya viene normalizada por ``normalizar_choice`` (mayús.,
# sin acentos, separadores -> "_"), así que basta listar la variante en esa
# forma. Hace la importación tolerante a variantes naturales: "Nacido en finca",
# "M", "Doble propósito", "Activa", etc. Sin esto, cualquier valor que no sea
# EXACTAMENTE el canónico se reporta como error.
SEXO_SINONIMOS = {
    "M": "MACHO", "MACHOS": "MACHO", "TORO": "MACHO", "TORETE": "MACHO",
    "H": "HEMBRA", "HEMBRAS": "HEMBRA", "VACA": "HEMBRA", "VAQUILLA": "HEMBRA",
    "F": "HEMBRA",  # 'female'
}
ORIGEN_SINONIMOS = {
    "NACIDO_EN_FINCA": "NACIDO_FINCA", "NACIDA_EN_FINCA": "NACIDO_FINCA",
    "NACIDO_EN_LA_FINCA": "NACIDO_FINCA", "NACIDA_EN_LA_FINCA": "NACIDO_FINCA",
    "NACIDO": "NACIDO_FINCA", "NACIDA": "NACIDO_FINCA", "PROPIO": "NACIDO_FINCA",
    "NAC_FINCA": "NACIDO_FINCA", "NAC": "NACIDO_FINCA",
    "COMPRA": "COMPRADO", "COMPRADA": "COMPRADO", "ADQUIRIDO": "COMPRADO",
    "DONACION": "DONADO", "DONADA": "DONADO", "REGALADO": "DONADO",
    "REGALO": "DONADO",
}
TIPO_PRODUCCION_SINONIMOS = {
    "DOBLE": "DOBLE_PROPOSITO", "DOBLE_PROP": "DOBLE_PROPOSITO",
    "DOBLE_PROPOSITO": "DOBLE_PROPOSITO", "DP": "DOBLE_PROPOSITO",
    "MIXTO": "DOBLE_PROPOSITO", "MIXTA": "DOBLE_PROPOSITO",
}
ESTADO_ANIMAL_SINONIMOS = {
    "ACTIVA": "ACTIVO", "VIVO": "ACTIVO", "VIVA": "ACTIVO",
    "VENDIDA": "VENDIDO", "MUERTA": "MUERTO", "MUERTE": "MUERTO",
    "DESCARTADO": "DESCARTE", "DESCARTADA": "DESCARTE",
}

# Modos de importación
MODO_SOLO_CREAR = "SOLO_CREAR"
MODO_ACTUALIZAR = "ACTUALIZAR_EXISTENTES"
MODO_CREAR_O_ACTUALIZAR = "CREAR_O_ACTUALIZAR"
MODOS_VALIDOS = [MODO_SOLO_CREAR, MODO_ACTUALIZAR, MODO_CREAR_O_ACTUALIZAR]


class Opciones:
    """Opciones de creación automática de catálogos durante la importación.

    Por defecto NO se crea nada: un nombre de raza/categoría/parcela que no
    existe se reporta como error (compatibilidad con el flujo histórico). Al
    activar la opción correspondiente, esos nombres se detectan como "nuevos"
    y el importador los crea en la pasada de catálogos.
    """

    def __init__(self, crear_razas=False, crear_categorias=False,
                 crear_parcelas=False):
        self.crear_razas = bool(crear_razas)
        self.crear_categorias = bool(crear_categorias)
        self.crear_parcelas = bool(crear_parcelas)


# Tipos de columna soportados por el normalizador/validador.
TIPO_TEXTO = "texto"
TIPO_ENTERO = "entero"
TIPO_DECIMAL = "decimal"
TIPO_FECHA = "fecha"
TIPO_CHOICE = "choice"
TIPO_REFERENCIA = "referencia"  # nombre/arete que se resuelve contra BD o archivo


def col(key, header, tipo=TIPO_TEXTO, requerido=False, choices=None,
        default=None, ejemplo="", ayuda="", min_valor=None, alias=None,
        sinonimos=None):
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
        # Encabezados alternativos aceptados además de ``header`` (el matching
        # es insensible a mayúsculas, acentos y separadores; ver
        # ``normalizar_encabezado``).
        "alias": alias or [],
        # Sinónimos de VALOR para columnas choice: variante normalizada del
        # usuario -> valor canónico del modelo (ver *_SINONIMOS arriba).
        "sinonimos": sinonimos or {},
    }


def normalizar_choice(texto):
    """Clave canónica de un valor de choice para el matching tolerante.

    Quita acentos, pasa a mayúsculas y unifica separadores comunes a "_" para
    que ``"Nacido en finca"``, ``"nacido-en-finca"`` y ``"NACIDO EN FINCA"``
    normalicen todos igual y puedan resolverse contra choices/sinónimos.
    """
    if texto is None:
        return None
    base = unicodedata.normalize("NFKD", str(texto))
    base = "".join(c for c in base if not unicodedata.combining(c))
    base = base.strip().upper()
    for sep in _SEPARADORES:
        base = base.replace(sep, "_")
    while "__" in base:
        base = base.replace("__", "_")
    return base.strip("_")


HOJA_ANIMALES = "ANIMALES"
HOJA_PARCELAS = "PARCELAS"
HOJA_PESOS = "PESOS"


HOJAS = {
    HOJA_PARCELAS: {
        "descripcion": "Potreros/parcelas de la finca. Se importan ANTES que "
                       "los animales para poder ubicarlos.",
        "columnas": [
            col("nombre", "nombre", requerido=True, ejemplo="Potrero Norte",
                alias=["parcela", "potrero", "nombre parcela"],
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
                alias=["arete", "nro arete", "numero de arete", "número de arete",
                       "n arete", "codigo", "código", "codigo animal",
                       "código animal", "identificacion", "identificación"],
                ayuda="Identificador único global del animal. Obligatorio."),
            col("nombre", "nombre", ejemplo="Lucero",
                alias=["nombre animal", "nombre del animal"]),
            col("sexo", "sexo", tipo=TIPO_CHOICE, requerido=True,
                choices=SEXO_CHOICES, ejemplo="HEMBRA",
                sinonimos=SEXO_SINONIMOS),
            col("raza", "raza", tipo=TIPO_REFERENCIA, ejemplo="Brahman",
                alias=["nombre raza"],
                ayuda="Nombre de la raza. Si no existe puede crearse según las opciones."),
            col("categoria", "categoria", tipo=TIPO_REFERENCIA, ejemplo="Vaca",
                alias=["categoría", "nombre categoria"],
                ayuda="Nombre de la categoría. Si no existe puede crearse según las opciones."),
            col("padre_arete", "padre_arete", tipo=TIPO_REFERENCIA, ejemplo="AR-0100",
                alias=["padre", "arete padre", "padre nro arete"],
                ayuda="Arete del padre (MACHO). Puede estar en este mismo archivo."),
            col("madre_arete", "madre_arete", tipo=TIPO_REFERENCIA, ejemplo="AR-0200",
                alias=["madre", "arete madre", "madre nro arete"],
                ayuda="Arete de la madre (HEMBRA). Puede estar en este mismo archivo."),
            col("fecha_nacimiento", "fecha_nacimiento", tipo=TIPO_FECHA,
                alias=["nacimiento", "fecha nac", "f nacimiento"],
                ejemplo="15/03/2022"),
            col("fecha_ingreso", "fecha_ingreso", tipo=TIPO_FECHA, ejemplo="01/01/2023",
                alias=["ingreso", "fecha de ingreso", "f ingreso"]),
            col("peso", "peso_kg", tipo=TIPO_DECIMAL, default=0, ejemplo="380.5",
                min_valor=0, alias=["peso", "peso actual", "peso kg"]),
            col("peso_nacimiento", "peso_nacimiento_kg", tipo=TIPO_DECIMAL, default=0,
                ejemplo="32", min_valor=0,
                alias=["peso nacimiento", "peso al nacer", "peso al nacimiento"]),
            col("estado", "estado", tipo=TIPO_CHOICE, choices=ESTADO_ANIMAL_CHOICES,
                default="ACTIVO", ejemplo="ACTIVO",
                sinonimos=ESTADO_ANIMAL_SINONIMOS),
            col("tipo_produccion", "tipo_produccion", tipo=TIPO_CHOICE,
                choices=TIPO_PRODUCCION_CHOICES, default="DOBLE_PROPOSITO",
                ejemplo="DOBLE_PROPOSITO",
                alias=["produccion", "producción", "tipo produccion",
                       "tipo de produccion", "tipo producción"],
                sinonimos=TIPO_PRODUCCION_SINONIMOS),
            col("origen", "origen", tipo=TIPO_CHOICE, choices=ORIGEN_CHOICES,
                default="NACIDO_FINCA", ejemplo="NACIDO_FINCA",
                alias=["procedencia"], sinonimos=ORIGEN_SINONIMOS),
            col("color", "color", ejemplo="Blanco", alias=["capa", "pelaje"]),
            col("parcela_actual", "parcela_actual", tipo=TIPO_REFERENCIA,
                ejemplo="Potrero Norte",
                alias=["parcela", "potrero", "ubicacion", "ubicación",
                       "parcela actual"],
                ayuda="Parcela donde está el animal. Debe existir, venir en la hoja "
                      "PARCELAS o crearse según las opciones."),
            col("observaciones", "observaciones", ejemplo="",
                alias=["observacion", "observación", "notas", "comentarios"]),
        ],
    },
    HOJA_PESOS: {
        "descripcion": "Historial de pesajes. Cada fila referencia un animal por "
                       "nro_arete.",
        "columnas": [
            col("nro_arete", "nro_arete", tipo=TIPO_REFERENCIA, requerido=True,
                ejemplo="AR-0001",
                alias=["arete", "nro arete", "codigo", "identificacion"],
                ayuda="Arete de un animal existente o creado en la hoja ANIMALES."),
            col("fecha_pesaje", "fecha_pesaje", tipo=TIPO_FECHA, requerido=True,
                ejemplo="01/06/2024", alias=["fecha", "fecha de pesaje"]),
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


_SEPARADORES = (" ", "_", "-", ".", "/", "\t", "\n")


def normalizar_encabezado(texto):
    """Clave canónica de un encabezado para el matching tolerante.

    Quita acentos, pasa a minúsculas y elimina separadores comunes para que
    ``"Número de Arete"``, ``"nro_arete"`` y ``"NRO ARETE"`` coincidan todos.
    """
    if texto is None:
        return ""
    base = unicodedata.normalize("NFKD", str(texto))
    base = "".join(c for c in base if not unicodedata.combining(c))
    base = base.strip().lower()
    for sep in _SEPARADORES:
        base = base.replace(sep, "")
    return base


def header_a_key(hoja):
    """Mapa ``encabezado_normalizado -> key`` incluyendo header y alias.

    El header canónico tiene prioridad sobre los alias si dos columnas
    normalizan igual (no debería ocurrir, pero el header gana por orden).
    """
    mapa = {}
    for c in columnas(hoja):
        for etiqueta in [*c.get("alias", []), c["header"]]:
            mapa[normalizar_encabezado(etiqueta)] = c["key"]
    return mapa


def columnas_requeridas(hoja):
    return [c for c in columnas(hoja) if c["requerido"]]
