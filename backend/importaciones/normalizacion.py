"""Normalización de valores crudos de celdas a tipos Python.

Cada función devuelve ``(valor, None)`` si pudo convertir, o ``(None, codigo)``
con un código de error estable (usado en el reporte de errores). Las celdas
vacías devuelven ``(None, None)`` salvo que el llamador exija obligatoriedad.
"""
from datetime import date, datetime
from decimal import Decimal, InvalidOperation


def es_vacio(valor):
    return valor is None or (isinstance(valor, str) and valor.strip() == "")


def normalizar_texto(valor):
    if es_vacio(valor):
        return None, None
    return str(valor).strip(), None


def normalizar_decimal(valor):
    """Acepta '380.5', '380,5', 380.5, números. Devuelve Decimal."""
    if es_vacio(valor):
        return None, None
    if isinstance(valor, (int, float, Decimal)):
        try:
            return Decimal(str(valor)), None
        except (InvalidOperation, ValueError):
            return None, "DECIMAL_INVALIDO"
    texto = str(valor).strip().replace(" ", "")
    # Soporta coma decimal y separador de miles con punto/coma.
    if "," in texto and "." in texto:
        # El último separador es el decimal.
        if texto.rfind(",") > texto.rfind("."):
            texto = texto.replace(".", "").replace(",", ".")
        else:
            texto = texto.replace(",", "")
    elif "," in texto:
        texto = texto.replace(",", ".")
    try:
        return Decimal(texto), None
    except (InvalidOperation, ValueError):
        return None, "DECIMAL_INVALIDO"


def normalizar_entero(valor):
    if es_vacio(valor):
        return None, None
    dec, err = normalizar_decimal(valor)
    if err:
        return None, "ENTERO_INVALIDO"
    try:
        return int(dec), None
    except (ValueError, TypeError):
        return None, "ENTERO_INVALIDO"


_FORMATOS_FECHA = ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%y")


def normalizar_fecha(valor):
    """Acepta DD/MM/YYYY, YYYY-MM-DD (y variantes) o un date/datetime nativo."""
    if es_vacio(valor):
        return None, None
    if isinstance(valor, datetime):
        return valor.date(), None
    if isinstance(valor, date):
        return valor, None
    texto = str(valor).strip()
    # openpyxl a veces entrega '2024-06-01 00:00:00'
    texto = texto.split(" ")[0]
    for fmt in _FORMATOS_FECHA:
        try:
            return datetime.strptime(texto, fmt).date(), None
        except ValueError:
            continue
    return None, "FECHA_INVALIDA"
