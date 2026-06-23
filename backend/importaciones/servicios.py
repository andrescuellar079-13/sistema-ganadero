"""Casos de uso de alto nivel: previsualizar y confirmar una importación.

Orquestan lectura → validación → (persistencia de errores) → procesamiento,
y mantienen el estado de ``ImportacionGanadera``. Las vistas solo se encargan
del transporte HTTP/multipart; toda la lógica vive aquí (reutilizable).
"""
from django.db import transaction
from django.utils import timezone

from . import constantes, contexto as contexto_mod, importador, lectores, validadores
from .models import ImportacionGanadera, ImportacionGanaderaError


def _contar_filas(datos):
    return sum(len(info["filas"]) for info in datos.values())


def _guardar_errores(importacion, errores):
    importacion.errores.all().delete()
    objs = [
        ImportacionGanaderaError(
            importacion=importacion,
            hoja=e["hoja"],
            numero_fila=e["numero_fila"],
            campo=e.get("campo"),
            valor=e.get("valor"),
            codigo_error=e["codigo_error"],
            mensaje=e["mensaje"],
        )
        for e in errores
    ]
    if objs:
        ImportacionGanaderaError.objects.bulk_create(objs, batch_size=500)


def _resumen_por_hoja(resultado):
    return {hoja: r["resumen"] for hoja, r in resultado["hojas"].items()}


def _validar_archivo(importacion):
    """Lee + valida el archivo de la importación. Devuelve (datos, contexto,
    resultado) o lanza lectores.ArchivoInvalidoError."""
    importacion.archivo_original.open("rb")
    try:
        contenido = importacion.archivo_original.read()
    finally:
        importacion.archivo_original.close()

    datos = lectores.leer_archivo(contenido, importacion.nombre_archivo)
    ctx = contexto_mod.construir_contexto(importacion.finca, datos)
    resultado = validadores.validar(datos, ctx, importacion.modo)
    return datos, ctx, resultado


def previsualizar(finca, usuario, archivo, modo, modo_estricto):
    """Crea la importación, valida y devuelve el resumen de previsualización."""
    importacion = ImportacionGanadera.objects.create(
        finca=finca,
        archivo_original=archivo,
        nombre_archivo=getattr(archivo, "name", "archivo"),
        modo=modo,
        modo_estricto=modo_estricto,
        creado_por=usuario,
        estado=ImportacionGanadera.Estado.VALIDANDO,
    )

    try:
        datos, _ctx, resultado = _validar_archivo(importacion)
    except lectores.ArchivoInvalidoError as exc:
        importacion.estado = ImportacionGanadera.Estado.FALLIDO
        importacion.resumen_json = {"error": str(exc)}
        importacion.save(update_fields=["estado", "resumen_json"])
        return {"ok": False, "importacion_id": importacion.id, "mensaje": str(exc)}

    errores = resultado["errores"]
    total_filas = _contar_filas(datos)
    filas_validas = sum(r["resumen"]["validas"] for r in resultado["hojas"].values())

    _guardar_errores(importacion, errores)

    resumen = {
        "por_hoja": _resumen_por_hoja(resultado),
        "muestra_errores": errores[:50],
    }
    importacion.total_filas = total_filas
    importacion.filas_validas = filas_validas
    importacion.total_errores = len(errores)
    importacion.resumen_json = resumen
    importacion.estado = ImportacionGanadera.Estado.LISTO
    importacion.save(update_fields=[
        "total_filas", "filas_validas", "total_errores", "resumen_json", "estado",
    ])

    return {
        "ok": True,
        "importacion_id": importacion.id,
        "estado": importacion.estado,
        "modo": modo,
        "modo_estricto": modo_estricto,
        "total_filas": total_filas,
        "filas_validas": filas_validas,
        "total_errores": len(errores),
        "por_hoja": resumen["por_hoja"],
        "muestra_errores": errores[:50],
    }


def confirmar(importacion):
    """Re-valida y, si procede, escribe en BD. Devuelve el resumen final."""
    if importacion.estado not in (
        ImportacionGanadera.Estado.LISTO,
        ImportacionGanadera.Estado.COMPLETADO_CON_ERRORES,
    ):
        return {"ok": False, "mensaje": f"La importación no está lista (estado: {importacion.estado})."}

    importacion.estado = ImportacionGanadera.Estado.PROCESANDO
    importacion.fecha_inicio = timezone.now()
    importacion.save(update_fields=["estado", "fecha_inicio"])

    try:
        _datos, ctx, resultado = _validar_archivo(importacion)
    except lectores.ArchivoInvalidoError as exc:
        importacion.estado = ImportacionGanadera.Estado.FALLIDO
        importacion.fecha_finalizacion = timezone.now()
        importacion.save(update_fields=["estado", "fecha_finalizacion"])
        return {"ok": False, "importacion_id": importacion.id, "mensaje": str(exc)}

    errores = resultado["errores"]
    _guardar_errores(importacion, errores)
    importacion.total_errores = len(errores)

    # Modo ESTRICTO: cualquier error bloqueante ⇒ rollback total (no se importa).
    if importacion.modo_estricto and errores:
        importacion.estado = ImportacionGanadera.Estado.FALLIDO
        importacion.fecha_finalizacion = timezone.now()
        importacion.resumen_json = {
            **(importacion.resumen_json or {}),
            "rollback": True,
            "motivo": "Modo estricto: se encontraron errores y no se importó nada.",
        }
        importacion.save(update_fields=[
            "estado", "total_errores", "fecha_finalizacion", "resumen_json"
        ])
        return {
            "ok": False,
            "importacion_id": importacion.id,
            "rollback": True,
            "total_errores": len(errores),
            "mensaje": "Modo estricto: la importación se canceló por errores. "
                       "No se guardó ningún registro.",
        }

    try:
        contadores = importador.procesar(
            importacion.finca, importacion.creado_por, resultado, ctx, importacion.modo
        )
    except Exception as exc:  # rollback automático por @transaction.atomic
        importacion.estado = ImportacionGanadera.Estado.FALLIDO
        importacion.fecha_finalizacion = timezone.now()
        importacion.resumen_json = {
            **(importacion.resumen_json or {}),
            "error_proceso": str(exc),
        }
        importacion.save(update_fields=["estado", "fecha_finalizacion", "resumen_json"])
        return {"ok": False, "importacion_id": importacion.id, "mensaje": str(exc)}

    importacion.creados = contadores["creados"]
    importacion.actualizados = contadores["actualizados"]
    importacion.omitidos = contadores["omitidos"] + contadores.get("pesos_omitidos", 0)
    importacion.estado = (
        ImportacionGanadera.Estado.COMPLETADO_CON_ERRORES
        if errores else ImportacionGanadera.Estado.COMPLETADO
    )
    importacion.fecha_finalizacion = timezone.now()
    importacion.resumen_json = {
        **(importacion.resumen_json or {}),
        "contadores": contadores,
        "por_hoja": _resumen_por_hoja(resultado),
    }
    importacion.save(update_fields=[
        "creados", "actualizados", "omitidos", "total_errores",
        "estado", "fecha_finalizacion", "resumen_json",
    ])

    return {
        "ok": True,
        "importacion_id": importacion.id,
        "estado": importacion.estado,
        "creados": importacion.creados,
        "actualizados": importacion.actualizados,
        "omitidos": importacion.omitidos,
        "total_errores": importacion.total_errores,
        "contadores": contadores,
    }


def cancelar(importacion):
    if importacion.estado in (
        ImportacionGanadera.Estado.COMPLETADO,
        ImportacionGanadera.Estado.COMPLETADO_CON_ERRORES,
    ):
        return {"ok": False, "mensaje": "La importación ya finalizó; no se puede cancelar."}
    importacion.estado = ImportacionGanadera.Estado.CANCELADO
    importacion.fecha_finalizacion = timezone.now()
    importacion.save(update_fields=["estado", "fecha_finalizacion"])
    return {"ok": True, "importacion_id": importacion.id, "estado": importacion.estado}
