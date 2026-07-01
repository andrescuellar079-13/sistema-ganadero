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
    from sanidad.models import (
        Vacunacion,
        Desparasitacion,
        Tratamiento,
        RegistroMastitis,
        ExamenLaboratorio,
        TiempoRetiro,
    )
    from reproduccion.models import Reproduccion
    from catalogos.models import Medicamento, Alimento
    from produccion.models import RegistroPeso, EngordeAnimal
    from fincas.models import TransferenciaFinca
    from animales.models import Animal

    hoy = timezone.now().date()
    conteos = {
        "vacunas_proximas": 0,
        "vacunas_vencidas": 0,
        "desparasitaciones_proximas": 0,
        "desparasitaciones_vencidas": 0,
        "tratamientos_activos": 0,
        "tiempos_retiro_activos": 0,
        "mastitis_activas": 0,
        "examenes_pendientes": 0,
        "medicamentos_vencidos": 0,
        "partos_proximos": 0,
        "stock_bajo_medicamento": 0,
        "stock_bajo_alimento": 0,
        "pesajes_pendientes": 0,
        "animales_listos_venta": 0,
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

    # ---- Desparasitaciones próximas / vencidas (sanidad) ----
    # El campo real de la próxima fecha en EventoSanitario es `proxima_fecha`.
    desparasitaciones = (
        Desparasitacion.objects
        .filter(finca_id=finca_id, proxima_fecha__isnull=False)
        .select_related("animal")
    )
    limite_despar = hoy + timedelta(days=15)
    for d in desparasitaciones:
        dias = (d.proxima_fecha - hoy).days
        if d.proxima_fecha < hoy:
            if _crear_si_no_existe(
                finca_id,
                tipo="DESPARASITACION_VENCIDA",
                mensaje=f"Desparasitación vencida para {_label_animal(d.animal)} ({abs(dias)} días de atraso).",
                fecha_alerta=hoy,
                referencia_tipo="Desparasitacion",
                referencia_id=d.id,
                prioridad="ALTA",
                modulo_origen="SANIDAD",
                animal=d.animal,
                dias_restantes=dias,
                fecha_vencimiento=d.proxima_fecha,
                accion_recomendada="Realizar la desparasitación lo antes posible.",
            ):
                conteos["desparasitaciones_vencidas"] += 1
        elif d.proxima_fecha <= limite_despar:
            if _crear_si_no_existe(
                finca_id,
                tipo="DESPARASITACION_PROXIMA",
                mensaje=f"Desparasitación próxima para {_label_animal(d.animal)} en {dias} días.",
                fecha_alerta=d.proxima_fecha,
                referencia_tipo="Desparasitacion",
                referencia_id=d.id,
                prioridad="MEDIA",
                modulo_origen="SANIDAD",
                animal=d.animal,
                dias_restantes=dias,
                fecha_vencimiento=d.proxima_fecha,
                accion_recomendada="Programar la desparasitación.",
            ):
                conteos["desparasitaciones_proximas"] += 1

    # ---- Tratamientos activos (sanidad) ----
    tratamientos = (
        Tratamiento.objects
        .filter(finca_id=finca_id, en_tratamiento=True)
        .select_related("animal")
    )
    for t in tratamientos:
        inicio = t.fecha_inicio or t.fecha
        dias_activo = (hoy - inicio).days if inicio else 0
        diagnostico = t.diagnostico or "tratamiento"
        if _crear_si_no_existe(
            finca_id,
            tipo="TRATAMIENTO_ACTIVO",
            mensaje=f"Tratamiento activo de {_label_animal(t.animal)}: {diagnostico} ({dias_activo} días).",
            fecha_alerta=hoy,
            referencia_tipo="Tratamiento",
            referencia_id=t.id,
            prioridad="MEDIA",
            modulo_origen="SANIDAD",
            animal=t.animal,
            dias_restantes=-dias_activo,
            accion_recomendada="Dar seguimiento y finalizar el tratamiento cuando corresponda.",
        ):
            conteos["tratamientos_activos"] += 1

    # ---- Tiempos de retiro activos (sanidad): hoy dentro del período ----
    retiros = (
        TiempoRetiro.objects
        .filter(
            tratamiento__finca_id=finca_id,
            activo=True,
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy,
        )
        .select_related("animal")
    )
    for r in retiros:
        dias = (r.fecha_fin - hoy).days
        if _crear_si_no_existe(
            finca_id,
            tipo="TIEMPO_RETIRO_ACTIVO",
            mensaje=(
                f"{_label_animal(r.animal)} en tiempo de retiro "
                f"({r.get_tipo_retiro_display()}) hasta el {r.fecha_fin:%d/%m/%Y}."
            ),
            fecha_alerta=hoy,
            referencia_tipo="TiempoRetiro",
            referencia_id=r.id,
            prioridad="ALTA",
            modulo_origen="SANIDAD",
            animal=r.animal,
            dias_restantes=dias,
            fecha_vencimiento=r.fecha_fin,
            accion_recomendada="No destinar el animal a venta ni su leche/carne a consumo hasta finalizar el retiro.",
        ):
            conteos["tiempos_retiro_activos"] += 1

    # ---- Mastitis activas (sanidad): no curadas ----
    mastitis = (
        RegistroMastitis.objects
        .filter(finca_id=finca_id, se_curo=False)
        .select_related("animal")
    )
    for m in mastitis:
        if _crear_si_no_existe(
            finca_id,
            tipo="MASTITIS_ACTIVA",
            mensaje=(
                f"Mastitis {m.get_tipo_display()} activa en {_label_animal(m.animal)} "
                f"(cuarto {m.get_cuarto_afectado_display()})."
            ),
            fecha_alerta=hoy,
            referencia_tipo="RegistroMastitis",
            referencia_id=m.id,
            prioridad="ALTA",
            modulo_origen="SANIDAD",
            animal=m.animal,
            accion_recomendada="Tratar la mastitis y registrar la curación cuando corresponda.",
        ):
            conteos["mastitis_activas"] += 1

    # ---- Exámenes de laboratorio pendientes de resultado (sanidad) ----
    examenes = (
        ExamenLaboratorio.objects
        .filter(finca_id=finca_id, fecha_resultado__isnull=True)
        .select_related("animal")
    )
    for ex in examenes:
        if _crear_si_no_existe(
            finca_id,
            tipo="EXAMEN_PENDIENTE",
            mensaje=(
                f"Examen de {ex.get_tipo_examen_display()} pendiente de resultado "
                f"para {_label_animal(ex.animal)} ({ex.laboratorio})."
            ),
            fecha_alerta=ex.fecha_toma,
            referencia_tipo="ExamenLaboratorio",
            referencia_id=ex.id,
            prioridad="MEDIA",
            modulo_origen="SANIDAD",
            animal=ex.animal,
            accion_recomendada="Registrar el resultado del examen al recibirlo.",
        ):
            conteos["examenes_pendientes"] += 1

    # ---- Medicamentos vencidos (catalogos, contexto sanitario) ----
    for med in Medicamento.objects.filter(finca_id=finca_id, activo=True):
        if med.is_vencido():
            if _crear_si_no_existe(
                finca_id,
                tipo="MEDICAMENTO_VENCIDO",
                mensaje=f"Medicamento «{med.nombre}» vencido ({med.fecha_vencimiento:%d/%m/%Y}).",
                fecha_alerta=hoy,
                referencia_tipo="Medicamento",
                referencia_id=med.id,
                prioridad="ALTA",
                modulo_origen="SANIDAD",
                fecha_vencimiento=med.fecha_vencimiento,
                accion_recomendada="Retirar el medicamento vencido del inventario.",
            ):
                conteos["medicamentos_vencidos"] += 1

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

    # ---- Animal listo para venta (produccion): engorde que alcanzó el peso
    # objetivo. La lógica de estado vive en EngordeAnimal; aquí solo se notifica
    # de forma idempotente (una alerta PENDIENTE por engorde). ----
    engordes_listos = (
        EngordeAnimal.objects
        .filter(finca_id=finca_id, estado="LISTO_VENTA")
        .select_related("animal")
    )
    for e in engordes_listos:
        if _crear_si_no_existe(
            finca_id,
            tipo="ANIMAL_LISTO_VENTA",
            mensaje=(
                f"{_label_animal(e.animal)} alcanzó el peso objetivo "
                f"({e.peso_objetivo} kg) y está listo para venta."
            ),
            fecha_alerta=hoy,
            referencia_tipo="EngordeAnimal",
            referencia_id=e.id,
            prioridad="MEDIA",
            modulo_origen="PRODUCCION",
            animal=e.animal,
            accion_recomendada="Evaluar la venta o el retiro del animal del engorde.",
        ):
            conteos["animales_listos_venta"] += 1

    # ---- Transferencias pendientes (fincas): enviadas no recibidas ----
    from django.db.models import Q
    transferencias = TransferenciaFinca.objects.filter(
        Q(finca_origen_id=finca_id) | Q(finca_destino_id=finca_id),
        estado="PENDIENTE_RECEPCION",
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


# ===========================================================================
# Notificaciones de transferencias entre fincas (dirigidas por usuario destino)
# ===========================================================================

def notificar_transferencia(transferencia, tipo="PENDIENTE"):
    """
    Crea notificaciones (Alerta) dirigidas a los usuarios de la finca implicada.

    - tipo="PENDIENTE":  notifica a los usuarios de la finca DESTINO.
    - tipo="RECIBIDA":   notifica a los usuarios de la finca ORIGEN (confirmación).
    - tipo="RECHAZADA":  notifica a los usuarios de la finca ORIGEN (rechazo).

    Idempotente por (transferencia, usuario, tipo): no duplica si ya existe una
    alerta PENDIENTE para ese usuario y transferencia.
    """
    from accounts.permissions import usuarios_de_finca

    t = transferencia
    hoy = timezone.now().date()
    n = t.detalles.count()

    if tipo == "PENDIENTE":
        finca_objetivo = t.finca_destino
        finca_notif_id = t.finca_destino_id
        tipo_alerta = "TRANSFERENCIA_PENDIENTE"
        prioridad = "ALTA"
        mensaje = (
            f"Tiene una transferencia pendiente desde {t.finca_origen.nombre} "
            f"con {n} animal(es)."
        )
        accion = "Revisar y aceptar o rechazar la transferencia."
    elif tipo == "RECIBIDA":
        finca_objetivo = t.finca_origen
        finca_notif_id = t.finca_origen_id
        tipo_alerta = "TRANSFERENCIA_RECIBIDA"
        prioridad = "MEDIA"
        mensaje = (
            f"{t.finca_destino.nombre} recibió la transferencia de {n} animal(es)."
        )
        accion = None
    elif tipo == "RECHAZADA":
        finca_objetivo = t.finca_origen
        finca_notif_id = t.finca_origen_id
        tipo_alerta = "TRANSFERENCIA_RECIBIDA"
        prioridad = "ALTA"
        motivo = f" Motivo: {t.motivo_rechazo}." if t.motivo_rechazo else ""
        mensaje = (
            f"{t.finca_destino.nombre} rechazó la transferencia de {n} animal(es)."
            f"{motivo}"
        )
        accion = "Los animales permanecen en la finca origen."
    else:
        return 0

    creadas = 0
    for usuario in usuarios_de_finca(finca_notif_id):
        existe = Alerta.objects.filter(
            referencia_tipo="TransferenciaFinca",
            referencia_id=t.id,
            asignado_a=usuario,
            tipo=tipo_alerta,
            estado="PENDIENTE",
        ).exists()
        if existe:
            continue
        Alerta.objects.create(
            finca=finca_objetivo,
            tipo=tipo_alerta,
            mensaje=mensaje,
            fecha_alerta=hoy,
            referencia_tipo="TransferenciaFinca",
            referencia_id=t.id,
            prioridad=prioridad,
            modulo_origen="FINCAS",
            asignado_a=usuario,
            accion_recomendada=accion,
        )
        creadas += 1
    return creadas


def resolver_alertas_transferencia(transferencia, usuario=None):
    """
    Marca como RESUELTAS las alertas PENDIENTES asociadas a una transferencia
    (al aceptarla, rechazarla o cancelarla), para que dejen de aparecer.
    """
    pendientes = Alerta.objects.filter(
        referencia_tipo="TransferenciaFinca",
        referencia_id=transferencia.id,
        estado__in=["PENDIENTE", "LEIDA", "EN_PROCESO"],
    )
    for alerta in pendientes:
        alerta.resolver(usuario=usuario)
    return pendientes.count()
