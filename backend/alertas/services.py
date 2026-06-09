"""
Generación automática de alertas ganaderas.

Idempotente por finca: no duplica una alerta si ya existe una PENDIENTE con
la misma (finca, tipo, referencia_tipo, referencia_id). Todas las consultas
filtran por finca.
"""
from datetime import timedelta

from django.utils import timezone

from .models import Alerta


def _label_animal(animal):
    if not animal:
        return ""
    nombre = animal.nombre or "Sin nombre"
    return f"{animal.nro_arete} - {nombre}"


def _crear_si_no_existe(finca_id, *, tipo, mensaje, fecha_alerta, referencia_tipo,
                        referencia_id, prioridad, modulo_origen, animal=None,
                        dias_restantes=0, fecha_vencimiento=None,
                        accion_recomendada=None):
    """Crea la alerta solo si no hay otra PENDIENTE con la misma referencia."""
    existe = Alerta.objects.filter(
        finca_id=finca_id,
        tipo=tipo,
        referencia_tipo=referencia_tipo,
        referencia_id=referencia_id,
        estado="PENDIENTE",
    ).exists()
    if existe:
        return False

    Alerta.objects.create(
        finca_id=finca_id,
        animal=animal,
        tipo=tipo,
        mensaje=mensaje,
        fecha_alerta=fecha_alerta,
        dias_restantes=dias_restantes,
        referencia_tipo=referencia_tipo,
        referencia_id=referencia_id,
        prioridad=prioridad,
        modulo_origen=modulo_origen,
        fecha_vencimiento=fecha_vencimiento,
        accion_recomendada=accion_recomendada,
    )
    return True


def generar_alertas_automaticas(finca_id):
    """Recorre los módulos y crea alertas faltantes. Devuelve conteos."""
    # Imports diferidos para evitar dependencias circulares entre apps.
    from sanidad.models import Vacunacion
    from reproduccion.models import Reproduccion
    from catalogos.models import Medicamento, Alimento
    from produccion.models import RegistroPeso
    from fincas.models import TransferenciaFinca
    from animales.models import Animal

    hoy = timezone.now().date()
    conteos = {
        "vacunas_proximas": 0,
        "vacunas_vencidas": 0,
        "partos_proximos": 0,
        "stock_bajo_medicamento": 0,
        "stock_bajo_alimento": 0,
        "pesajes_pendientes": 0,
        "transferencias_pendientes": 0,
    }

    # ---- Vacunas próximas / vencidas (sanidad) ----
    vacunaciones = (
        Vacunacion.objects
        .filter(finca_id=finca_id, fecha_proxima__isnull=False)
        .select_related("animal", "vacuna")
    )
    limite_vacuna = hoy + timedelta(days=15)
    for v in vacunaciones:
        nombre_vac = v.vacuna.nombre if v.vacuna else "vacuna"
        dias = (v.fecha_proxima - hoy).days
        if v.fecha_proxima < hoy:
            if _crear_si_no_existe(
                finca_id,
                tipo="VACUNA_VENCIDA",
                mensaje=f"Refuerzo de {nombre_vac} vencido para {_label_animal(v.animal)} ({abs(dias)} días de atraso).",
                fecha_alerta=hoy,
                referencia_tipo="Vacunacion",
                referencia_id=v.id,
                prioridad="ALTA",
                modulo_origen="SANIDAD",
                animal=v.animal,
                dias_restantes=dias,
                fecha_vencimiento=v.fecha_proxima,
                accion_recomendada="Aplicar el refuerzo de la vacuna lo antes posible.",
            ):
                conteos["vacunas_vencidas"] += 1
        elif v.fecha_proxima <= limite_vacuna:
            if _crear_si_no_existe(
                finca_id,
                tipo="VACUNA_PROXIMA",
                mensaje=f"Refuerzo de {nombre_vac} próximo para {_label_animal(v.animal)} en {dias} días.",
                fecha_alerta=v.fecha_proxima,
                referencia_tipo="Vacunacion",
                referencia_id=v.id,
                prioridad="MEDIA",
                modulo_origen="SANIDAD",
                animal=v.animal,
                dias_restantes=dias,
                fecha_vencimiento=v.fecha_proxima,
                accion_recomendada="Programar la aplicación del refuerzo.",
            ):
                conteos["vacunas_proximas"] += 1

    # ---- Partos próximos (reproduccion) ----
    reproducciones = (
        Reproduccion.objects
        .filter(
            finca_id=finca_id,
            fecha_parto_real__isnull=True,
            fecha_parto_esperado__isnull=False,
            fecha_parto_esperado__gte=hoy,
            fecha_parto_esperado__lte=hoy + timedelta(days=30),
        )
        .select_related("madre")
    )
    for r in reproducciones:
        dias = (r.fecha_parto_esperado - hoy).days
        if _crear_si_no_existe(
            finca_id,
            tipo="PARTO_PROXIMO",
            mensaje=f"Parto próximo de {_label_animal(r.madre)} en {dias} días.",
            fecha_alerta=r.fecha_parto_esperado,
            referencia_tipo="Reproduccion",
            referencia_id=r.id,
            prioridad="ALTA",
            modulo_origen="REPRODUCCION",
            animal=r.madre,
            dias_restantes=dias,
            fecha_vencimiento=r.fecha_parto_esperado,
            accion_recomendada="Preparar el área de parto y monitorear a la madre.",
        ):
            conteos["partos_proximos"] += 1

    # ---- Stock bajo de medicamentos (catalogos) ----
    for m in Medicamento.objects.filter(finca_id=finca_id, activo=True):
        if m.is_stock_bajo():
            if _crear_si_no_existe(
                finca_id,
                tipo="STOCK_BAJO_MEDICAMENTO",
                mensaje=f"Stock bajo de medicamento «{m.nombre}»: {m.stock_cantidad} (mínimo {m.stock_minimo}).",
                fecha_alerta=hoy,
                referencia_tipo="Medicamento",
                referencia_id=m.id,
                prioridad="ALTA",
                modulo_origen="CATALOGOS",
                accion_recomendada="Reabastecer el medicamento.",
            ):
                conteos["stock_bajo_medicamento"] += 1

    # ---- Stock bajo de alimentos (catalogos) ----
    for a in Alimento.objects.filter(finca_id=finca_id, activo=True):
        if a.is_stock_bajo():
            if _crear_si_no_existe(
                finca_id,
                tipo="STOCK_BAJO_ALIMENTO",
                mensaje=f"Stock bajo de alimento «{a.nombre}»: {a.stock_cantidad} (mínimo {a.stock_minimo}).",
                fecha_alerta=hoy,
                referencia_tipo="Alimento",
                referencia_id=a.id,
                prioridad="MEDIA",
                modulo_origen="CATALOGOS",
                accion_recomendada="Reabastecer el alimento.",
            ):
                conteos["stock_bajo_alimento"] += 1

    # ---- Pesaje pendiente (produccion): animales ACTIVOS sin pesaje en >90 días ----
    limite_pesaje = hoy - timedelta(days=90)
    animales = Animal.objects.filter(finca_id=finca_id, estado="ACTIVO")
    for animal in animales:
        ultimo = (
            RegistroPeso.objects
            .filter(animal=animal)
            .order_by("-fecha_pesaje")
            .first()
        )
        if ultimo is None or ultimo.fecha_pesaje < limite_pesaje:
            dias_sin = (hoy - ultimo.fecha_pesaje).days if ultimo else None
            detalle = (
                f"último hace {dias_sin} días" if dias_sin is not None
                else "sin pesajes registrados"
            )
            if _crear_si_no_existe(
                finca_id,
                tipo="PESAJE_PENDIENTE",
                mensaje=f"Pesaje pendiente de {_label_animal(animal)} ({detalle}).",
                fecha_alerta=hoy,
                referencia_tipo="Animal",
                referencia_id=animal.id,
                prioridad="BAJA",
                modulo_origen="PRODUCCION",
                animal=animal,
                accion_recomendada="Registrar un nuevo pesaje del animal.",
            ):
                conteos["pesajes_pendientes"] += 1

    # ---- Transferencias pendientes (fincas): confirmadas no recibidas ----
    from django.db.models import Q
    transferencias = TransferenciaFinca.objects.filter(
        Q(finca_origen_id=finca_id) | Q(finca_destino_id=finca_id),
        estado="CONFIRMADA",
    ).select_related("finca_origen", "finca_destino")
    for t in transferencias:
        if _crear_si_no_existe(
            finca_id,
            tipo="TRANSFERENCIA_PENDIENTE",
            mensaje=f"Transferencia confirmada pendiente de recepción: {t.finca_origen} → {t.finca_destino} ({t.fecha_transferencia}).",
            fecha_alerta=t.fecha_transferencia,
            referencia_tipo="TransferenciaFinca",
            referencia_id=t.id,
            prioridad="MEDIA",
            modulo_origen="FINCAS",
            accion_recomendada="Confirmar la recepción de la transferencia.",
        ):
            conteos["transferencias_pendientes"] += 1

    conteos["total"] = sum(conteos.values())
    return conteos
