"""Endpoints multipart de importación masiva.

Rutas (montadas bajo ``/api/importaciones/`` en ``config/urls.py``):
  GET  plantilla/                 → descarga la plantilla XLSX
  POST previsualizar/             → sube archivo, valida y devuelve resumen
  POST confirmar/                 → ejecuta la importación
  POST cancelar/                  → cancela una importación pendiente
  GET  <id>/errores/              → descarga el reporte de errores XLSX

Seguridad: usuario autenticado (JWT) + permiso administrativo sobre la finca.
La ``finca_id`` se toma SIEMPRE del formulario, nunca del archivo.
"""
import json

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from accounts.permissions import puede_administrar_finca, validar_finca

from . import constantes, plantilla, reportes, servicios
from .auth import NoAutenticado, usuario_desde_request
from .models import ImportacionGanadera

# Límites configurables.
MAX_MB = getattr(settings, "IMPORTACION_MAX_MB", 15)
EXTENSIONES_OK = (".xlsx", ".xlsm", ".csv")


def _json_error(mensaje, status=400):
    return JsonResponse({"ok": False, "mensaje": mensaje}, status=status)


def _flag(request, nombre):
    """Lee un booleano del form ('true'/'1'/'on' = verdadero)."""
    return str(request.POST.get(nombre, "")).strip().lower() in ("true", "1", "on", "yes")


def _autenticar(request):
    return usuario_desde_request(request)


def _xlsx_response(contenido, nombre):
    resp = HttpResponse(
        contenido,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    resp["Content-Disposition"] = f'attachment; filename="{nombre}"'
    return resp


@csrf_exempt
@require_http_methods(["GET"])
def descargar_plantilla(request):
    try:
        _autenticar(request)
    except NoAutenticado as exc:
        return _json_error(str(exc), status=401)
    try:
        contenido = plantilla.generar_plantilla()
    except Exception as exc:  # openpyxl ausente, etc.
        return _json_error(f"No se pudo generar la plantilla: {exc}", status=500)
    return _xlsx_response(contenido, plantilla.PLANTILLA_NOMBRE)


@csrf_exempt
@require_http_methods(["POST"])
def previsualizar(request):
    try:
        usuario = _autenticar(request)
    except NoAutenticado as exc:
        return _json_error(str(exc), status=401)

    finca_id = request.POST.get("finca_id")
    modo = request.POST.get("modo", constantes.MODO_SOLO_CREAR)
    modo_estricto = request.POST.get("modo_estricto", "true").lower() != "false"
    opciones = constantes.Opciones(
        crear_razas=_flag(request, "crear_razas"),
        crear_categorias=_flag(request, "crear_categorias"),
        crear_parcelas=_flag(request, "crear_parcelas"),
    )
    archivo = request.FILES.get("archivo")

    if not finca_id:
        return _json_error("Falta la finca.")
    if modo not in constantes.MODOS_VALIDOS:
        return _json_error("Modo de importación inválido.")
    if not archivo:
        return _json_error("No se recibió ningún archivo.")

    nombre = (archivo.name or "").lower()
    if not nombre.endswith(EXTENSIONES_OK):
        return _json_error("Formato no permitido. Subí un .xlsx o .csv.")
    if archivo.size > MAX_MB * 1024 * 1024:
        return _json_error(f"El archivo supera el máximo de {MAX_MB} MB.")

    try:
        finca = validar_finca(usuario, finca_id)
    except Exception as exc:
        return _json_error(str(exc), status=403)
    if not puede_administrar_finca(usuario, finca_id):
        return _json_error("No tiene permiso para importar en esta finca.", status=403)

    resultado = servicios.previsualizar(
        finca, usuario, archivo, modo, modo_estricto, opciones
    )
    status = 200 if resultado.get("ok") else 400
    return JsonResponse(resultado, status=status)


def _importacion_para_usuario(request, importacion_id):
    """Carga la importación y valida acceso. Devuelve (importacion, usuario)
    o lanza para que el caller responda el error."""
    usuario = _autenticar(request)
    importacion = ImportacionGanadera.objects.filter(id=importacion_id).first()
    if not importacion:
        raise LookupError("Importación no encontrada.")
    validar_finca(usuario, importacion.finca_id)
    if not puede_administrar_finca(usuario, importacion.finca_id):
        raise PermissionError("No tiene permiso sobre esta finca.")
    return importacion, usuario


def _leer_body_id(request):
    try:
        cuerpo = json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        cuerpo = {}
    return cuerpo.get("importacion_id") or request.POST.get("importacion_id")


@csrf_exempt
@require_http_methods(["POST"])
def confirmar(request):
    importacion_id = _leer_body_id(request)
    if not importacion_id:
        return _json_error("Falta el id de la importación.")
    try:
        importacion, _ = _importacion_para_usuario(request, importacion_id)
    except NoAutenticado as exc:
        return _json_error(str(exc), status=401)
    except LookupError as exc:
        return _json_error(str(exc), status=404)
    except PermissionError as exc:
        return _json_error(str(exc), status=403)
    except Exception as exc:
        return _json_error(str(exc), status=403)

    resultado = servicios.confirmar(importacion)
    return JsonResponse(resultado, status=200 if resultado.get("ok") else 400)


@csrf_exempt
@require_http_methods(["POST"])
def cancelar(request):
    importacion_id = _leer_body_id(request)
    if not importacion_id:
        return _json_error("Falta el id de la importación.")
    try:
        importacion, _ = _importacion_para_usuario(request, importacion_id)
    except NoAutenticado as exc:
        return _json_error(str(exc), status=401)
    except LookupError as exc:
        return _json_error(str(exc), status=404)
    except (PermissionError, Exception) as exc:
        return _json_error(str(exc), status=403)

    resultado = servicios.cancelar(importacion)
    return JsonResponse(resultado, status=200 if resultado.get("ok") else 400)


@csrf_exempt
@require_http_methods(["GET"])
def descargar_errores(request, importacion_id):
    try:
        importacion, _ = _importacion_para_usuario(request, importacion_id)
    except NoAutenticado as exc:
        return _json_error(str(exc), status=401)
    except LookupError as exc:
        return _json_error(str(exc), status=404)
    except (PermissionError, Exception) as exc:
        return _json_error(str(exc), status=403)

    errores = [
        {
            "hoja": e.hoja,
            "numero_fila": e.numero_fila,
            "campo": e.campo,
            "valor": e.valor,
            "codigo_error": e.codigo_error,
            "mensaje": e.mensaje,
            "nro_arete": "",
        }
        for e in importacion.errores.all()
    ]
    contenido = reportes.generar_reporte_errores(errores)
    return _xlsx_response(contenido, f"errores_importacion_{importacion.id}.xlsx")
