# backend/sanidad/schema.py
from datetime import date, timedelta
from decimal import Decimal

import graphene
from django.db import transaction
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required

from .models import (
    Vacunacion,
    Tratamiento,
    Desparasitacion,
    TratamientoMedicamento,
    AnimalMedicamento,
    Diagnostico,
    Observacion,
    Enfermedad,
    ExamenLaboratorio,
    RegistroMastitis,
    TiempoRetiro,
)


# ==========================================
# HELPERS DE VACUNACIÓN
# ==========================================

def _edad_meses(animal, referencia):
    """Edad del animal (en meses) a la fecha `referencia`. None si no hay nacimiento."""
    if not animal.fecha_nacimiento:
        return None
    delta = (referencia.year - animal.fecha_nacimiento.year) * 12 + (
        referencia.month - animal.fecha_nacimiento.month
    )
    if referencia.day < animal.fecha_nacimiento.day:
        delta -= 1
    return max(delta, 0)


def _estado_proxima(fecha_proxima):
    """Estado de la próxima dosis: SIN_PROXIMA / VENCIDA / PROXIMA / VIGENTE."""
    if not fecha_proxima:
        return "SIN_PROXIMA"
    hoy = date.today()
    if fecha_proxima < hoy:
        return "VENCIDA"
    if fecha_proxima <= hoy + timedelta(days=30):
        return "PROXIMA"
    return "VIGENTE"


def _prioridad_por_dias(dias_restantes):
    if dias_restantes < 0:
        return "CRITICA"
    if dias_restantes <= 7:
        return "ALTA"
    if dias_restantes <= 30:
        return "MEDIA"
    return "BAJA"


def _generar_alerta_vacuna_proxima(vacunacion):
    """Crea (idempotente) la alerta VACUNA_PROXIMA para la próxima dosis."""
    from alertas.models import Alerta

    if not vacunacion.fecha_proxima:
        return None

    vacuna = vacunacion.vacuna
    anticipacion = getattr(vacuna, "dias_anticipacion_alerta", None) or 30
    fecha_alerta = vacunacion.fecha_proxima - timedelta(days=anticipacion)
    dias_restantes = (vacunacion.fecha_proxima - date.today()).days

    alerta, _ = Alerta.objects.get_or_create(
        finca=vacunacion.finca,
        animal=vacunacion.animal,
        tipo="VACUNA_PROXIMA",
        referencia_tipo="Vacunacion",
        referencia_id=vacunacion.id,
        fecha_vencimiento=vacunacion.fecha_proxima,
        defaults={
            "mensaje": (
                f"Próxima dosis de '{vacuna.nombre}' para {vacunacion.animal} "
                f"el {vacunacion.fecha_proxima:%d/%m/%Y}."
            ),
            "fecha_alerta": fecha_alerta,
            "dias_restantes": dias_restantes,
            "prioridad": _prioridad_por_dias(dias_restantes),
            "estado": "PENDIENTE",
            "modulo_origen": "SANIDAD",
            "accion_recomendada": "Programar y aplicar la próxima dosis de la vacuna.",
        },
    )
    return alerta


def _generar_alerta_stock_bajo(vacuna, finca):
    """Crea (idempotente) la alerta STOCK_BAJO_VACUNA si el stock quedó bajo."""
    from alertas.models import Alerta

    if not vacuna.is_stock_bajo():
        return None

    # Evitar duplicar una alerta de stock pendiente para la misma vacuna.
    alerta, _ = Alerta.objects.get_or_create(
        finca=finca,
        tipo="STOCK_BAJO_VACUNA",
        referencia_tipo="Vacuna",
        referencia_id=vacuna.id,
        estado="PENDIENTE",
        defaults={
            "mensaje": (
                f"Stock bajo de la vacuna '{vacuna.nombre}': "
                f"{vacuna.stock_cantidad} disponible(s) (mínimo {vacuna.stock_minimo})."
            ),
            "fecha_alerta": date.today(),
            "dias_restantes": 0,
            "prioridad": "ALTA",
            "modulo_origen": "SANIDAD",
            "accion_recomendada": "Reabastecer el stock de la vacuna.",
        },
    )
    return alerta


# ==========================================
# TYPES EXISTENTES (con campos correctos)
# ==========================================

class VacunacionType(DjangoObjectType):
    nombreVacuna = graphene.String()
    nombreVeterinario = graphene.String()
    fechaAplicacion = graphene.Date()
    fechaProxima = graphene.Date()
    estadoProxima = graphene.String()

    class Meta:
        model = Vacunacion
        fields = "__all__"

    def resolve_nombreVacuna(self, info):
        return self.vacuna.nombre if self.vacuna else None

    def resolve_nombreVeterinario(self, info):
        return str(self.veterinario) if self.veterinario else None

    def resolve_fechaAplicacion(self, info):
        return self.fecha_aplicacion

    def resolve_fechaProxima(self, info):
        return self.fecha_proxima

    def resolve_estadoProxima(self, info):
        return _estado_proxima(self.fecha_proxima)


class TratamientoType(DjangoObjectType):
    fechaInicio = graphene.Date()
    fechaFin = graphene.Date()
    costoTotal = graphene.Decimal()
    enTratamiento = graphene.Boolean()
    diasActivo = graphene.Int()
    nombreMedicamento = graphene.String()

    class Meta:
        model = Tratamiento
        fields = "__all__"

    def resolve_fechaInicio(self, info):
        return self.fecha_inicio

    def resolve_fechaFin(self, info):
        return self.fecha_fin

    def resolve_costoTotal(self, info):
        return self.costo_total

    def resolve_enTratamiento(self, info):
        return self.en_tratamiento

    def resolve_diasActivo(self, info):
        """Días transcurridos desde el inicio. Si ya finalizó, hasta fecha_fin."""
        inicio = self.fecha_inicio or self.fecha
        if not inicio:
            return None
        fin = self.fecha_fin or date.today()
        return max((fin - inicio).days, 0)

    def resolve_nombreMedicamento(self, info):
        return self.medicamento.nombre if self.medicamento else None


class DesparasitacionType(DjangoObjectType):
    tipoParasiticida = graphene.String()
    pesoAplicacion = graphene.Decimal()
    fechaProxima = graphene.Date()
    
    class Meta:
        model = Desparasitacion
        fields = "__all__"
    
    def resolve_tipoParasiticida(self, info):
        return self.tipo_parasiticida
    
    def resolve_pesoAplicacion(self, info):
        return self.peso_aplicacion

    def resolve_fechaProxima(self, info):
        # El campo real de EventoSanitario es `proxima_fecha`.
        return self.proxima_fecha


class TratamientoMedicamentoType(DjangoObjectType):
    viaAplicacion = graphene.String()
    diasRetiro = graphene.Int()
    
    class Meta:
        model = TratamientoMedicamento
        fields = "__all__"
    
    def resolve_viaAplicacion(self, info):
        return self.via_aplicacion
    
    def resolve_diasRetiro(self, info):
        return self.dias_retiro


class AnimalMedicamentoType(DjangoObjectType):
    fechaAdministracion = graphene.Date()
    fechaSiguiente = graphene.Date()
    
    class Meta:
        model = AnimalMedicamento
        fields = "__all__"
    
    def resolve_fechaAdministracion(self, info):
        return self.fecha_administracion
    
    def resolve_fechaSiguiente(self, info):
        return self.fecha_siguiente


class DiagnosticoType(DjangoObjectType):
    class Meta:
        model = Diagnostico
        fields = "__all__"


class ObservacionType(DjangoObjectType):
    class Meta:
        model = Observacion
        fields = "__all__"


# ==========================================
# NUEVOS TYPES
# ==========================================

class EnfermedadType(DjangoObjectType):
    tiempoRecuperacionDias = graphene.Int()
    esZoonotica = graphene.Boolean()
    mortalidadPorcentaje = graphene.Decimal()
    
    class Meta:
        model = Enfermedad
        fields = "__all__"
    
    def resolve_tiempoRecuperacionDias(self, info):
        return self.tiempo_recuperacion_dias
    
    def resolve_esZoonotica(self, info):
        return self.es_zoonotica
    
    def resolve_mortalidadPorcentaje(self, info):
        return self.mortalidad_porcentaje


class ExamenLaboratorioType(DjangoObjectType):
    fechaToma = graphene.Date()
    fechaResultado = graphene.Date()
    esNormal = graphene.Boolean()
    
    class Meta:
        model = ExamenLaboratorio
        fields = "__all__"
    
    def resolve_fechaToma(self, info):
        return self.fecha_toma
    
    def resolve_fechaResultado(self, info):
        return self.fecha_resultado
    
    def resolve_esNormal(self, info):
        return self.es_normal


class RegistroMastitisType(DjangoObjectType):
    cuartoAfectado = graphene.String()
    seCuro = graphene.Boolean()
    fechaCuracion = graphene.Date()
    recuentoCelsSomaticas = graphene.Int()
    
    class Meta:
        model = RegistroMastitis
        fields = "__all__"
    
    def resolve_cuartoAfectado(self, info):
        return self.cuarto_afectado
    
    def resolve_seCuro(self, info):
        return self.se_curo
    
    def resolve_fechaCuracion(self, info):
        return self.fecha_curacion
    
    def resolve_recuentoCelsSomaticas(self, info):
        return self.recuento_cels_somaticas


class TiempoRetiroType(DjangoObjectType):
    tipoRetiro = graphene.String()
    fechaInicio = graphene.Date()
    fechaFin = graphene.Date()
    diasRetiro = graphene.Int()
    diasRestantes = graphene.Int()
    estaEnRetiro = graphene.Boolean()
    
    class Meta:
        model = TiempoRetiro
        fields = "__all__"
    
    def resolve_tipoRetiro(self, info):
        return self.tipo_retiro
    
    def resolve_fechaInicio(self, info):
        return self.fecha_inicio
    
    def resolve_fechaFin(self, info):
        return self.fecha_fin
    
    def resolve_diasRetiro(self, info):
        return self.dias_retiro
    
    def resolve_diasRestantes(self, info):
        return self.dias_restantes
    
    def resolve_estaEnRetiro(self, info):
        return self.esta_en_retiro


# ==========================================
# TYPES VIRTUALES (Dashboard / Calendario)
# ==========================================

class ResumenSanidadType(graphene.ObjectType):
    """KPIs del dashboard interno de Sanidad, calculados en tiempo real."""
    tratamientos_activos = graphene.Int()
    vacunas_proximas = graphene.Int()
    vacunas_vencidas = graphene.Int()
    desparasitaciones_proximas = graphene.Int()
    desparasitaciones_vencidas = graphene.Int()
    mastitis_activas = graphene.Int()
    examenes_pendientes = graphene.Int()
    animales_en_retiro = graphene.Int()


class CalendarioSanitarioEventoType(graphene.ObjectType):
    """Evento del calendario sanitario (vista calculada, no se persiste)."""
    referencia_tipo = graphene.String()
    referencia_id = graphene.ID()
    fecha = graphene.Date()
    animal_id = graphene.ID()
    animal = graphene.String()
    tipo_evento = graphene.String()
    estado = graphene.String()
    prioridad = graphene.String()
    accion_recomendada = graphene.String()


def _label_animal(animal):
    if not animal:
        return ""
    return f"{animal.nro_arete} - {animal.nombre or 'Sin nombre'}"


# ==========================================
# QUERY COMPLETA
# ==========================================

class Query(graphene.ObjectType):
    # Queries existentes
    vacunaciones = graphene.List(
        VacunacionType,
        finca_id=graphene.ID(required=True),
        animal_id=graphene.ID(),
        vacuna_id=graphene.ID(),
        veterinario_id=graphene.ID(),
        campana=graphene.String(),
        fecha_desde=graphene.Date(),
        fecha_hasta=graphene.Date(),
    )
    tratamientos = graphene.List(TratamientoType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    tratamientos_activos = graphene.List(TratamientoType, finca_id=graphene.ID(required=True))
    desparasitaciones = graphene.List(DesparasitacionType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    tratamiento_medicamentos = graphene.List(TratamientoMedicamentoType, finca_id=graphene.ID(required=True))
    animal_medicamentos = graphene.List(AnimalMedicamentoType, finca_id=graphene.ID(required=True))
    diagnosticos = graphene.List(DiagnosticoType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    observaciones_sanitarias = graphene.List(ObservacionType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    vacunas_proximas = graphene.List(VacunacionType, finca_id=graphene.ID(), dias=graphene.Int(default_value=30))
    vacunas_vencidas = graphene.List(VacunacionType, finca_id=graphene.ID())
    
    # Nuevas queries
    enfermedades = graphene.List(EnfermedadType, enfermedad_id=graphene.ID())
    examenes_laboratorio = graphene.List(ExamenLaboratorioType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    registros_mastitis = graphene.List(RegistroMastitisType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    tiempos_retiro = graphene.List(TiempoRetiroType, finca_id=graphene.ID(required=True), animal_id=graphene.ID(), activos=graphene.Boolean())
    animales_en_retiro = graphene.List(TiempoRetiroType, finca_id=graphene.ID(required=True))

    # Dashboard interno y calendario sanitario (calculados en tiempo real)
    resumen_sanidad = graphene.Field(ResumenSanidadType, finca_id=graphene.ID(required=True))
    calendario_sanitario = graphene.List(
        CalendarioSanitarioEventoType,
        finca_id=graphene.ID(required=True),
        dias=graphene.Int(default_value=30),
    )
    
    def resolve_vacunaciones(self, info, finca_id, animal_id=None, vacuna_id=None,
                             veterinario_id=None, campana=None,
                             fecha_desde=None, fecha_hasta=None):
        queryset = Vacunacion.objects.filter(finca_id=finca_id).select_related(
            "animal", "vacuna", "veterinario"
        )
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        if vacuna_id:
            queryset = queryset.filter(vacuna_id=vacuna_id)
        if veterinario_id:
            queryset = queryset.filter(veterinario_id=veterinario_id)
        if campana:
            queryset = queryset.filter(campana__icontains=campana)
        if fecha_desde:
            queryset = queryset.filter(fecha_aplicacion__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_aplicacion__lte=fecha_hasta)
        return queryset

    def resolve_tratamientos(self, info, finca_id, animal_id=None):
        queryset = Tratamiento.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_tratamientos_activos(self, info, finca_id):
        return Tratamiento.objects.filter(finca_id=finca_id, en_tratamiento=True)

    def resolve_desparasitaciones(self, info, finca_id, animal_id=None):
        queryset = Desparasitacion.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_tratamiento_medicamentos(self, info, finca_id):
        return TratamientoMedicamento.objects.filter(tratamiento__finca_id=finca_id)

    def resolve_animal_medicamentos(self, info, finca_id):
        return AnimalMedicamento.objects.filter(animal__finca_id=finca_id)

    def resolve_diagnosticos(self, info, finca_id, animal_id=None):
        queryset = Diagnostico.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_observaciones_sanitarias(self, info, finca_id, animal_id=None):
        queryset = Observacion.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_vacunas_proximas(self, info, finca_id=None, dias=30):
        hoy = date.today()
        limite = hoy + timedelta(days=dias)
        queryset = Vacunacion.objects.filter(
            fecha_proxima__gte=hoy, fecha_proxima__lte=limite
        ).select_related("animal", "vacuna")
        if finca_id:
            queryset = queryset.filter(finca_id=finca_id)
        return queryset

    def resolve_vacunas_vencidas(self, info, finca_id=None):
        hoy = date.today()
        queryset = Vacunacion.objects.filter(fecha_proxima__lt=hoy).select_related(
            "animal", "vacuna"
        )
        if finca_id:
            queryset = queryset.filter(finca_id=finca_id)
        return queryset
    
    def resolve_enfermedades(self, info, enfermedad_id=None):
        queryset = Enfermedad.objects.all()
        if enfermedad_id:
            queryset = queryset.filter(id=enfermedad_id)
        return queryset
    
    def resolve_examenes_laboratorio(self, info, finca_id, animal_id=None):
        queryset = ExamenLaboratorio.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset
    
    def resolve_registros_mastitis(self, info, finca_id, animal_id=None):
        queryset = RegistroMastitis.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset
    
    def resolve_tiempos_retiro(self, info, finca_id, animal_id=None, activos=None):
        queryset = TiempoRetiro.objects.filter(tratamiento__finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        if activos is True:
            queryset = queryset.filter(activo=True)
        return queryset
    
    def resolve_animales_en_retiro(self, info, finca_id):
        from datetime import date
        hoy = date.today()
        return TiempoRetiro.objects.filter(
            tratamiento__finca_id=finca_id,
            activo=True,
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy
        )

    def resolve_resumen_sanidad(self, info, finca_id):
        hoy = date.today()
        limite = hoy + timedelta(days=30)
        return ResumenSanidadType(
            tratamientos_activos=Tratamiento.objects.filter(
                finca_id=finca_id, en_tratamiento=True
            ).count(),
            vacunas_proximas=Vacunacion.objects.filter(
                finca_id=finca_id, fecha_proxima__gte=hoy, fecha_proxima__lte=limite
            ).count(),
            vacunas_vencidas=Vacunacion.objects.filter(
                finca_id=finca_id, fecha_proxima__lt=hoy
            ).count(),
            desparasitaciones_proximas=Desparasitacion.objects.filter(
                finca_id=finca_id, proxima_fecha__gte=hoy, proxima_fecha__lte=limite
            ).count(),
            desparasitaciones_vencidas=Desparasitacion.objects.filter(
                finca_id=finca_id, proxima_fecha__lt=hoy
            ).count(),
            mastitis_activas=RegistroMastitis.objects.filter(
                finca_id=finca_id, se_curo=False
            ).count(),
            examenes_pendientes=ExamenLaboratorio.objects.filter(
                finca_id=finca_id, fecha_resultado__isnull=True
            ).count(),
            animales_en_retiro=TiempoRetiro.objects.filter(
                tratamiento__finca_id=finca_id, activo=True,
                fecha_inicio__lte=hoy, fecha_fin__gte=hoy,
            ).count(),
        )

    def resolve_calendario_sanitario(self, info, finca_id, dias=30):
        hoy = date.today()
        limite = hoy + timedelta(days=dias)
        eventos = []

        def _agregar(*, referencia_tipo, referencia_id, fecha, animal,
                     tipo_evento, estado, prioridad, accion):
            eventos.append(CalendarioSanitarioEventoType(
                referencia_tipo=referencia_tipo,
                referencia_id=referencia_id,
                fecha=fecha,
                animal_id=animal.id if animal else None,
                animal=_label_animal(animal),
                tipo_evento=tipo_evento,
                estado=estado,
                prioridad=prioridad,
                accion_recomendada=accion,
            ))

        # --- Vacunas (próximas dentro de la ventana o vencidas) ---
        vacunas = Vacunacion.objects.filter(
            finca_id=finca_id, fecha_proxima__isnull=False, fecha_proxima__lte=limite,
        ).select_related("animal", "vacuna")
        for v in vacunas:
            dias_rest = (v.fecha_proxima - hoy).days
            vencida = v.fecha_proxima < hoy
            _agregar(
                referencia_tipo="Vacunacion", referencia_id=v.id,
                fecha=v.fecha_proxima, animal=v.animal,
                tipo_evento=f"Vacuna: {v.vacuna.nombre}" if v.vacuna else "Vacuna",
                estado="Vencida" if vencida else "Próxima",
                prioridad=_prioridad_por_dias(dias_rest),
                accion="Aplicar el refuerzo de la vacuna." if vencida
                else "Programar la aplicación del refuerzo.",
            )

        # --- Desparasitaciones ---
        despars = Desparasitacion.objects.filter(
            finca_id=finca_id, proxima_fecha__isnull=False, proxima_fecha__lte=limite,
        ).select_related("animal")
        for d in despars:
            dias_rest = (d.proxima_fecha - hoy).days
            vencida = d.proxima_fecha < hoy
            _agregar(
                referencia_tipo="Desparasitacion", referencia_id=d.id,
                fecha=d.proxima_fecha, animal=d.animal,
                tipo_evento="Desparasitación",
                estado="Vencida" if vencida else "Próxima",
                prioridad=_prioridad_por_dias(dias_rest),
                accion="Realizar la desparasitación lo antes posible." if vencida
                else "Programar la desparasitación.",
            )

        # --- Tratamientos activos ---
        tratamientos = Tratamiento.objects.filter(
            finca_id=finca_id, en_tratamiento=True,
        ).select_related("animal")
        for t in tratamientos:
            _agregar(
                referencia_tipo="Tratamiento", referencia_id=t.id,
                fecha=t.fecha_inicio or t.fecha, animal=t.animal,
                tipo_evento=f"Tratamiento: {t.diagnostico}" if t.diagnostico else "Tratamiento",
                estado="Activo", prioridad="MEDIA",
                accion="Dar seguimiento y finalizar cuando corresponda.",
            )

        # --- Tiempos de retiro activos ---
        retiros = TiempoRetiro.objects.filter(
            tratamiento__finca_id=finca_id, activo=True,
            fecha_inicio__lte=hoy, fecha_fin__gte=hoy,
        ).select_related("animal")
        for r in retiros:
            _agregar(
                referencia_tipo="TiempoRetiro", referencia_id=r.id,
                fecha=r.fecha_fin, animal=r.animal,
                tipo_evento=f"Tiempo de retiro ({r.get_tipo_retiro_display()})",
                estado="Activo", prioridad="ALTA",
                accion="No destinar a venta ni leche/carne a consumo hasta finalizar el retiro.",
            )

        # --- Mastitis activas ---
        mastitis = RegistroMastitis.objects.filter(
            finca_id=finca_id, se_curo=False,
        ).select_related("animal")
        for m in mastitis:
            _agregar(
                referencia_tipo="RegistroMastitis", referencia_id=m.id,
                fecha=m.fecha, animal=m.animal,
                tipo_evento=f"Mastitis {m.get_tipo_display()}",
                estado="Activa", prioridad="ALTA",
                accion="Tratar la mastitis y registrar la curación.",
            )

        # --- Exámenes pendientes de resultado ---
        examenes = ExamenLaboratorio.objects.filter(
            finca_id=finca_id, fecha_resultado__isnull=True,
        ).select_related("animal")
        for ex in examenes:
            _agregar(
                referencia_tipo="ExamenLaboratorio", referencia_id=ex.id,
                fecha=ex.fecha_toma, animal=ex.animal,
                tipo_evento=f"Examen: {ex.get_tipo_examen_display()}",
                estado="Pendiente", prioridad="MEDIA",
                accion="Registrar el resultado del examen al recibirlo.",
            )

        eventos.sort(key=lambda e: e.fecha or hoy)
        return eventos


# ==========================================
# MUTATIONS EXISTENTES
# ==========================================

class CrearVacunacion(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        vacuna_id = graphene.ID(required=True)
        fecha_aplicacion = graphene.Date(required=True)
        veterinario_id = graphene.ID()
        campana = graphene.String()
        lote = graphene.String()
        dosis_aplicada = graphene.String()
        via_aplicacion = graphene.String()
        observaciones = graphene.String()
        fecha_proxima = graphene.Date()

    vacunacion = graphene.Field(VacunacionType)
    success = graphene.Boolean()
    message = graphene.String()
    advertencia = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, vacuna_id, fecha_aplicacion, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal
            from catalogos.models import Vacuna, Veterinario

            if not fecha_aplicacion:
                return CrearVacunacion(success=False, message="La fecha de aplicación es obligatoria")

            finca = Finca.objects.get(id=finca_id)

            # --- Pertenencia a la finca activa ---
            try:
                animal = Animal.objects.get(id=animal_id, finca=finca)
            except Animal.DoesNotExist:
                return CrearVacunacion(success=False, message="El animal no pertenece a la finca activa")

            try:
                vacuna = Vacuna.objects.get(id=vacuna_id, finca=finca)
            except Vacuna.DoesNotExist:
                return CrearVacunacion(success=False, message="La vacuna no pertenece a la finca activa")

            veterinario = None
            veterinario_id = kwargs.get('veterinario_id')
            if veterinario_id:
                try:
                    veterinario = Veterinario.objects.get(id=veterinario_id, finca=finca)
                except Veterinario.DoesNotExist:
                    return CrearVacunacion(success=False, message="El veterinario no pertenece a la finca activa")

            # --- Validaciones de la vacuna ---
            if not vacuna.activo:
                return CrearVacunacion(success=False, message=f"La vacuna '{vacuna.nombre}' está inactiva")
            if vacuna.is_vencida():
                return CrearVacunacion(
                    success=False,
                    message=f"La vacuna '{vacuna.nombre}' está vencida ({vacuna.fecha_vencimiento:%d/%m/%Y})",
                )
            if Decimal(str(vacuna.stock_cantidad or 0)) < Decimal("1"):
                return CrearVacunacion(
                    success=False,
                    message=f"Stock insuficiente de la vacuna '{vacuna.nombre}' (disponible: {vacuna.stock_cantidad})",
                )

            # --- No duplicar misma vacuna/animal/fecha ---
            if Vacunacion.objects.filter(
                animal=animal, vacuna=vacuna, fecha_aplicacion=fecha_aplicacion
            ).exists():
                return CrearVacunacion(
                    success=False,
                    message="Ya existe una vacunación de esta vacuna para este animal en la misma fecha",
                )

            # --- Autocompletado desde el catálogo de la vacuna ---
            dosis_aplicada = kwargs.get('dosis_aplicada') or vacuna.dosis_recomendada
            via_aplicacion = kwargs.get('via_aplicacion') or vacuna.via_aplicacion

            fecha_proxima = kwargs.get('fecha_proxima')
            if not fecha_proxima and vacuna.intervalo_dias:
                fecha_proxima = fecha_aplicacion + timedelta(days=vacuna.intervalo_dias)

            # --- Advertencia de edad mínima (no bloqueante) ---
            advertencia = None
            edad = _edad_meses(animal, fecha_aplicacion)
            if edad is not None and vacuna.edad_minima_meses and edad < vacuna.edad_minima_meses:
                advertencia = (
                    f"El animal tiene {edad} mes(es) y la vacuna requiere una edad mínima de "
                    f"{vacuna.edad_minima_meses}. Se registró igualmente."
                )

            with transaction.atomic():
                usuario = info.context.user
                vacunacion = Vacunacion.objects.create(
                    finca=finca,
                    animal=animal,
                    vacuna=vacuna,
                    veterinario=veterinario,
                    fecha_aplicacion=fecha_aplicacion,
                    campana=kwargs.get('campana'),
                    lote=kwargs.get('lote'),
                    dosis_aplicada=dosis_aplicada,
                    via_aplicacion=via_aplicacion,
                    observaciones=kwargs.get('observaciones'),
                    fecha_proxima=fecha_proxima,
                    registrado_por=usuario if getattr(usuario, "is_authenticated", False) else None,
                )

                # --- Descontar stock (sin quedar negativo) ---
                vacuna.stock_cantidad = Decimal(str(vacuna.stock_cantidad or 0)) - Decimal("1")
                vacuna.save(update_fields=["stock_cantidad", "updated_at"])

                # --- Alertas ---
                _generar_alerta_vacuna_proxima(vacunacion)
                _generar_alerta_stock_bajo(vacuna, finca)

            mensaje = "Vacunación registrada exitosamente"
            if advertencia:
                mensaje += f". Advertencia: {advertencia}"
            return CrearVacunacion(
                vacunacion=vacunacion, success=True, message=mensaje, advertencia=advertencia
            )
        except Finca.DoesNotExist:
            return CrearVacunacion(success=False, message="Finca no encontrada")
        except Exception as e:
            return CrearVacunacion(vacunacion=None, success=False, message=str(e))


class CrearTratamiento(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        diagnostico = graphene.String()
        tipo = graphene.String()
        dosis = graphene.String()
        costo_total = graphene.Decimal()
        medicamento_id = graphene.ID()
        enfermedad_id = graphene.ID()

    tratamiento = graphene.Field(TratamientoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)
            
            enfermedad = None
            if kwargs.get('enfermedad_id'):
                enfermedad = Enfermedad.objects.filter(id=kwargs['enfermedad_id']).first()

            tratamiento = Tratamiento.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                fecha_inicio=fecha,
                diagnostico=kwargs.get('diagnostico'),
                tipo=kwargs.get('tipo'),
                dosis=kwargs.get('dosis'),
                costo_total=kwargs.get('costo_total', 0),
                medicamento_id=kwargs.get('medicamento_id'),
                enfermedad=enfermedad,
                en_tratamiento=True
            )

            return CrearTratamiento(tratamiento=tratamiento, success=True, message="Tratamiento registrado exitosamente")
        except Exception as e:
            return CrearTratamiento(tratamiento=None, success=False, message=str(e))


class FinalizarTratamiento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_fin = graphene.Date(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, fecha_fin):
        try:
            tratamiento = Tratamiento.objects.get(id=id)
            tratamiento.fecha_fin = fecha_fin
            tratamiento.en_tratamiento = False
            tratamiento.save()
            return FinalizarTratamiento(success=True, message="Tratamiento finalizado")
        except Exception as e:
            return FinalizarTratamiento(success=False, message=str(e))


class CrearDesparasitacion(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        tipo_parasiticida = graphene.String(required=True)
        producto = graphene.String(required=True)
        dosis = graphene.String(required=True)
        peso_aplicacion = graphene.Decimal()
        lote = graphene.String()
        fecha_proxima = graphene.Date()
        observaciones = graphene.String()
        veterinario_id = graphene.ID()

    desparasitacion = graphene.Field(DesparasitacionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha, tipo_parasiticida, producto, dosis, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

            veterinario = None
            if kwargs.get('veterinario_id'):
                from catalogos.models import Veterinario
                veterinario = Veterinario.objects.filter(id=kwargs['veterinario_id']).first()

            desparasitacion = Desparasitacion.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                tipo_parasiticida=tipo_parasiticida,
                producto=producto,
                dosis=dosis,
                peso_aplicacion=kwargs.get('peso_aplicacion', 0),
                lote=kwargs.get('lote', ''),
                proxima_fecha=kwargs.get('fecha_proxima'),
                observaciones=kwargs.get('observaciones', ''),
                veterinario=veterinario
            )

            return CrearDesparasitacion(desparasitacion=desparasitacion, success=True, message="Desparasitación registrada exitosamente")
        except Exception as e:
            return CrearDesparasitacion(desparasitacion=None, success=False, message=str(e))


class CrearDiagnostico(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        descripcion = graphene.String(required=True)
        veterinario_id = graphene.ID()
        enfermedad_id = graphene.ID()

    diagnostico = graphene.Field(DiagnosticoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha, descripcion, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

            veterinario = None
            if kwargs.get('veterinario_id'):
                from catalogos.models import Veterinario
                veterinario = Veterinario.objects.filter(id=kwargs['veterinario_id']).first()
            
            enfermedad = None
            if kwargs.get('enfermedad_id'):
                enfermedad = Enfermedad.objects.filter(id=kwargs['enfermedad_id']).first()

            diagnostico = Diagnostico.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                descripcion=descripcion,
                veterinario=veterinario,
                enfermedad=enfermedad
            )

            return CrearDiagnostico(diagnostico=diagnostico, success=True, message="Diagnóstico registrado exitosamente")
        except Exception as e:
            return CrearDiagnostico(diagnostico=None, success=False, message=str(e))


class CrearObservacion(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        descripcion = graphene.String(required=True)

    observacion = graphene.Field(ObservacionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha, descripcion):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

            observacion = Observacion.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                descripcion=descripcion,
                registrado_por=info.context.user
            )

            return CrearObservacion(observacion=observacion, success=True, message="Observación registrada exitosamente")
        except Exception as e:
            return CrearObservacion(observacion=None, success=False, message=str(e))


# ==========================================
# NUEVAS MUTATIONS
# ==========================================

class CrearEnfermedad(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        categoria = graphene.String(required=True)
        sintomas = graphene.String(required=True)
        causa = graphene.String()
        tratamiento_recomendado = graphene.String()
        tiempo_recuperacion_dias = graphene.Int()
        es_zoonotica = graphene.Boolean()
        mortalidad_porcentaje = graphene.Decimal()

    enfermedad = graphene.Field(EnfermedadType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, categoria, sintomas, **kwargs):
        try:
            enfermedad = Enfermedad.objects.create(
                nombre=nombre,
                categoria=categoria,
                sintomas=sintomas,
                causa=kwargs.get('causa'),
                tratamiento_recomendado=kwargs.get('tratamiento_recomendado'),
                tiempo_recuperacion_dias=kwargs.get('tiempo_recuperacion_dias', 0),
                es_zoonotica=kwargs.get('es_zoonotica', False),
                mortalidad_porcentaje=kwargs.get('mortalidad_porcentaje', 0)
            )
            return CrearEnfermedad(enfermedad=enfermedad, success=True, message="Enfermedad creada exitosamente")
        except Exception as e:
            return CrearEnfermedad(enfermedad=None, success=False, message=str(e))


class CrearExamenLaboratorio(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        tipo_examen = graphene.String(required=True)
        laboratorio = graphene.String(required=True)
        fecha_toma = graphene.Date(required=True)
        resultado = graphene.String(required=True)
        es_normal = graphene.Boolean()
        observaciones = graphene.String()
        fecha_resultado = graphene.Date()

    examen = graphene.Field(ExamenLaboratorioType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, tipo_examen, laboratorio, fecha_toma, resultado, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal
            
            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)
            
            examen = ExamenLaboratorio.objects.create(
                finca=finca,
                animal=animal,
                tipo_examen=tipo_examen,
                laboratorio=laboratorio,
                fecha_toma=fecha_toma,
                resultado=resultado,
                es_normal=kwargs.get('es_normal', True),
                observaciones=kwargs.get('observaciones'),
                fecha_resultado=kwargs.get('fecha_resultado'),
                registrado_por=info.context.user
            )
            return CrearExamenLaboratorio(examen=examen, success=True, message="Examen registrado exitosamente")
        except Exception as e:
            return CrearExamenLaboratorio(examen=None, success=False, message=str(e))


class CrearRegistroMastitis(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        cuarto_afectado = graphene.String(required=True)
        tipo = graphene.String(required=True)
        bacteria = graphene.String()
        recuento_cels_somaticas = graphene.Int()
        tratamiento_id = graphene.ID()
        observaciones = graphene.String()

    registro = graphene.Field(RegistroMastitisType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha, cuarto_afectado, tipo, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal
            
            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)
            
            tratamiento = None
            if kwargs.get('tratamiento_id'):
                tratamiento = Tratamiento.objects.filter(id=kwargs['tratamiento_id']).first()
            
            registro = RegistroMastitis.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                cuarto_afectado=cuarto_afectado,
                tipo=tipo,
                bacteria=kwargs.get('bacteria'),
                recuento_cels_somaticas=kwargs.get('recuento_cels_somaticas'),
                tratamiento=tratamiento,
                observaciones=kwargs.get('observaciones'),
                registrado_por=info.context.user
            )
            return CrearRegistroMastitis(registro=registro, success=True, message="Registro de mastitis creado exitosamente")
        except Exception as e:
            return CrearRegistroMastitis(registro=None, success=False, message=str(e))


class CurarMastitis(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_curacion = graphene.Date(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, fecha_curacion):
        try:
            registro = RegistroMastitis.objects.get(id=id)
            registro.se_curo = True
            registro.fecha_curacion = fecha_curacion
            registro.save()
            return CurarMastitis(success=True, message="Mastitis marcada como curada")
        except Exception as e:
            return CurarMastitis(success=False, message=str(e))


class CrearTiempoRetiro(graphene.Mutation):
    class Arguments:
        tratamiento_id = graphene.ID(required=True)
        tipo_retiro = graphene.String(required=True)
        fecha_inicio = graphene.Date(required=True)
        dias_retiro = graphene.Int(required=True)

    tiempo_retiro = graphene.Field(TiempoRetiroType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, tratamiento_id, tipo_retiro, fecha_inicio, dias_retiro):
        try:
            tratamiento = Tratamiento.objects.get(id=tratamiento_id)
            
            fecha_fin = fecha_inicio + timedelta(days=dias_retiro)
            
            tiempo_retiro = TiempoRetiro.objects.create(
                animal=tratamiento.animal,
                tratamiento=tratamiento,
                tipo_retiro=tipo_retiro,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                dias_retiro=dias_retiro,
                activo=True,
                registrado_por=info.context.user
            )
            return CrearTiempoRetiro(tiempo_retiro=tiempo_retiro, success=True, message="Período de retiro registrado exitosamente")
        except Exception as e:
            return CrearTiempoRetiro(tiempo_retiro=None, success=False, message=str(e))


class FinalizarTiempoRetiro(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            tiempo_retiro = TiempoRetiro.objects.get(id=id)
            tiempo_retiro.activo = False
            tiempo_retiro.save()
            return FinalizarTiempoRetiro(success=True, message="Período de retiro finalizado")
        except Exception as e:
            return FinalizarTiempoRetiro(success=False, message=str(e))

# ==========================================
# MUTATIONS DE ACTUALIZACIÓN Y ELIMINACIÓN
# ==========================================

# ===== VACUNACIONES =====
class ActualizarVacunacion(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_aplicacion = graphene.Date()
        veterinario_id = graphene.ID()
        campana = graphene.String()
        lote = graphene.String()
        dosis_aplicada = graphene.String()
        via_aplicacion = graphene.String()
        observaciones = graphene.String()
        fecha_proxima = graphene.Date()

    vacunacion = graphene.Field(VacunacionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            from catalogos.models import Veterinario

            vacunacion = Vacunacion.objects.get(id=id)

            recalcular = False
            if kwargs.get('fecha_aplicacion') is not None:
                vacunacion.fecha_aplicacion = kwargs['fecha_aplicacion']
                recalcular = True
            if 'veterinario_id' in kwargs:
                vet_id = kwargs.get('veterinario_id')
                if vet_id:
                    try:
                        vacunacion.veterinario = Veterinario.objects.get(
                            id=vet_id, finca=vacunacion.finca
                        )
                    except Veterinario.DoesNotExist:
                        return ActualizarVacunacion(
                            vacunacion=None, success=False,
                            message="El veterinario no pertenece a la finca activa",
                        )
                else:
                    vacunacion.veterinario = None
            if kwargs.get('campana') is not None:
                vacunacion.campana = kwargs['campana']
            if kwargs.get('lote') is not None:
                vacunacion.lote = kwargs['lote']
            if kwargs.get('dosis_aplicada') is not None:
                vacunacion.dosis_aplicada = kwargs['dosis_aplicada']
            if kwargs.get('via_aplicacion') is not None:
                vacunacion.via_aplicacion = kwargs['via_aplicacion']
            if kwargs.get('observaciones') is not None:
                vacunacion.observaciones = kwargs['observaciones']

            if kwargs.get('fecha_proxima') is not None:
                vacunacion.fecha_proxima = kwargs['fecha_proxima']
            elif recalcular and vacunacion.vacuna and vacunacion.vacuna.intervalo_dias:
                vacunacion.fecha_proxima = vacunacion.fecha_aplicacion + timedelta(
                    days=vacunacion.vacuna.intervalo_dias
                )

            vacunacion.save()
            _generar_alerta_vacuna_proxima(vacunacion)
            return ActualizarVacunacion(
                vacunacion=vacunacion, success=True, message="Vacunación actualizada exitosamente"
            )
        except Vacunacion.DoesNotExist:
            return ActualizarVacunacion(vacunacion=None, success=False, message="Vacunación no encontrada")
        except Exception as e:
            return ActualizarVacunacion(vacunacion=None, success=False, message=str(e))


class EliminarVacunacion(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            from alertas.models import Alerta

            vacunacion = Vacunacion.objects.get(id=id)
            vacuna = vacunacion.vacuna

            with transaction.atomic():
                # Devolver la unidad descontada al stock de la vacuna.
                if vacuna is not None:
                    vacuna.stock_cantidad = Decimal(str(vacuna.stock_cantidad or 0)) + Decimal("1")
                    vacuna.save(update_fields=["stock_cantidad", "updated_at"])

                # Limpiar la alerta de próxima dosis asociada.
                Alerta.objects.filter(
                    tipo="VACUNA_PROXIMA",
                    referencia_tipo="Vacunacion",
                    referencia_id=vacunacion.id,
                ).delete()

                vacunacion.delete()

            return EliminarVacunacion(success=True, message="Vacunación eliminada exitosamente")
        except Vacunacion.DoesNotExist:
            return EliminarVacunacion(success=False, message="Vacunación no encontrada")
        except Exception as e:
            return EliminarVacunacion(success=False, message=str(e))


# ===== TRATAMIENTOS =====
class ActualizarTratamiento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        diagnostico = graphene.String()
        tipo = graphene.String()
        dosis = graphene.String()
        costo_total = graphene.Decimal()
        observaciones = graphene.String()
        enfermedad_id = graphene.ID()

    tratamiento = graphene.Field(TratamientoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            tratamiento = Tratamiento.objects.get(id=id)
            if kwargs.get('diagnostico') is not None:
                tratamiento.diagnostico = kwargs['diagnostico']
            if kwargs.get('tipo') is not None:
                tratamiento.tipo = kwargs['tipo']
            if kwargs.get('dosis') is not None:
                tratamiento.dosis = kwargs['dosis']
            if kwargs.get('costo_total') is not None:
                tratamiento.costo_total = kwargs['costo_total']
            if kwargs.get('observaciones') is not None:
                tratamiento.observaciones = kwargs['observaciones']
            if kwargs.get('enfermedad_id') is not None:
                tratamiento.enfermedad_id = kwargs['enfermedad_id']
            tratamiento.save()
            return ActualizarTratamiento(tratamiento=tratamiento, success=True, message="Tratamiento actualizado exitosamente")
        except Exception as e:
            return ActualizarTratamiento(tratamiento=None, success=False, message=str(e))

class EliminarTratamiento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            tratamiento = Tratamiento.objects.get(id=id)
            tratamiento.delete()
            return EliminarTratamiento(success=True, message="Tratamiento eliminado exitosamente")
        except Exception as e:
            return EliminarTratamiento(success=False, message=str(e))

# ===== DESPARASITACIONES =====
class ActualizarDesparasitacion(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        tipo_parasiticida = graphene.String()
        producto = graphene.String()
        dosis = graphene.String()
        peso_aplicacion = graphene.Decimal()
        lote = graphene.String()
        fecha_proxima = graphene.Date()
        observaciones = graphene.String()

    desparasitacion = graphene.Field(DesparasitacionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            desparasitacion = Desparasitacion.objects.get(id=id)
            # `fecha_proxima` es el nombre del argumento; el campo real es `proxima_fecha`.
            if kwargs.get('fecha_proxima') is not None:
                desparasitacion.proxima_fecha = kwargs['fecha_proxima']
            if kwargs.get('tipo_parasiticida') is not None:
                desparasitacion.tipo_parasiticida = kwargs['tipo_parasiticida']
            if kwargs.get('producto') is not None:
                desparasitacion.producto = kwargs['producto']
            if kwargs.get('dosis') is not None:
                desparasitacion.dosis = kwargs['dosis']
            if kwargs.get('peso_aplicacion') is not None:
                desparasitacion.peso_aplicacion = kwargs['peso_aplicacion']
            if kwargs.get('lote') is not None:
                desparasitacion.lote = kwargs['lote']
            if kwargs.get('observaciones') is not None:
                desparasitacion.observaciones = kwargs['observaciones']
            desparasitacion.save()
            return ActualizarDesparasitacion(desparasitacion=desparasitacion, success=True, message="Desparasitación actualizada exitosamente")
        except Exception as e:
            return ActualizarDesparasitacion(desparasitacion=None, success=False, message=str(e))

class EliminarDesparasitacion(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            desparasitacion = Desparasitacion.objects.get(id=id)
            desparasitacion.delete()
            return EliminarDesparasitacion(success=True, message="Desparasitación eliminada exitosamente")
        except Exception as e:
            return EliminarDesparasitacion(success=False, message=str(e))

# ===== DIAGNÓSTICOS =====
class ActualizarDiagnostico(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        descripcion = graphene.String()
        enfermedad_id = graphene.ID()

    diagnostico = graphene.Field(DiagnosticoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            diagnostico = Diagnostico.objects.get(id=id)
            if kwargs.get('descripcion') is not None:
                diagnostico.descripcion = kwargs['descripcion']
            if kwargs.get('enfermedad_id') is not None:
                diagnostico.enfermedad_id = kwargs['enfermedad_id']
            diagnostico.save()
            return ActualizarDiagnostico(diagnostico=diagnostico, success=True, message="Diagnóstico actualizado exitosamente")
        except Exception as e:
            return ActualizarDiagnostico(diagnostico=None, success=False, message=str(e))

class EliminarDiagnostico(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            diagnostico = Diagnostico.objects.get(id=id)
            diagnostico.delete()
            return EliminarDiagnostico(success=True, message="Diagnóstico eliminado exitosamente")
        except Exception as e:
            return EliminarDiagnostico(success=False, message=str(e))

# ===== OBSERVACIONES =====
class ActualizarObservacion(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        descripcion = graphene.String()

    observacion = graphene.Field(ObservacionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            observacion = Observacion.objects.get(id=id)
            if kwargs.get('descripcion') is not None:
                observacion.descripcion = kwargs['descripcion']
            observacion.save()
            return ActualizarObservacion(observacion=observacion, success=True, message="Observación actualizada exitosamente")
        except Exception as e:
            return ActualizarObservacion(observacion=None, success=False, message=str(e))

class EliminarObservacion(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            observacion = Observacion.objects.get(id=id)
            observacion.delete()
            return EliminarObservacion(success=True, message="Observación eliminada exitosamente")
        except Exception as e:
            return EliminarObservacion(success=False, message=str(e))

# ===== EXÁMENES DE LABORATORIO =====
class ActualizarExamenLaboratorio(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        tipo_examen = graphene.String()
        laboratorio = graphene.String()
        fecha_toma = graphene.Date()
        resultado = graphene.String()
        es_normal = graphene.Boolean()
        observaciones = graphene.String()
        fecha_resultado = graphene.Date()

    examen = graphene.Field(ExamenLaboratorioType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            examen = ExamenLaboratorio.objects.get(id=id)
            if kwargs.get('tipo_examen') is not None:
                examen.tipo_examen = kwargs['tipo_examen']
            if kwargs.get('laboratorio') is not None:
                examen.laboratorio = kwargs['laboratorio']
            if kwargs.get('fecha_toma') is not None:
                examen.fecha_toma = kwargs['fecha_toma']
            if kwargs.get('resultado') is not None:
                examen.resultado = kwargs['resultado']
            if kwargs.get('es_normal') is not None:
                examen.es_normal = kwargs['es_normal']
            if kwargs.get('observaciones') is not None:
                examen.observaciones = kwargs['observaciones']
            if kwargs.get('fecha_resultado') is not None:
                examen.fecha_resultado = kwargs['fecha_resultado']
            examen.save()
            return ActualizarExamenLaboratorio(examen=examen, success=True, message="Examen actualizado exitosamente")
        except Exception as e:
            return ActualizarExamenLaboratorio(examen=None, success=False, message=str(e))

class EliminarExamenLaboratorio(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            examen = ExamenLaboratorio.objects.get(id=id)
            examen.delete()
            return EliminarExamenLaboratorio(success=True, message="Examen eliminado exitosamente")
        except Exception as e:
            return EliminarExamenLaboratorio(success=False, message=str(e))

# ===== MASTITIS =====
class ActualizarRegistroMastitis(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha = graphene.Date()
        cuarto_afectado = graphene.String()
        tipo = graphene.String()
        bacteria = graphene.String()
        recuento_cels_somaticas = graphene.Int()
        observaciones = graphene.String()

    registro = graphene.Field(RegistroMastitisType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            registro = RegistroMastitis.objects.get(id=id)
            if kwargs.get('fecha') is not None:
                registro.fecha = kwargs['fecha']
            if kwargs.get('cuarto_afectado') is not None:
                registro.cuarto_afectado = kwargs['cuarto_afectado']
            if kwargs.get('tipo') is not None:
                registro.tipo = kwargs['tipo']
            if kwargs.get('bacteria') is not None:
                registro.bacteria = kwargs['bacteria']
            if kwargs.get('recuento_cels_somaticas') is not None:
                registro.recuento_cels_somaticas = kwargs['recuento_cels_somaticas']
            if kwargs.get('observaciones') is not None:
                registro.observaciones = kwargs['observaciones']
            registro.save()
            return ActualizarRegistroMastitis(registro=registro, success=True, message="Registro de mastitis actualizado exitosamente")
        except Exception as e:
            return ActualizarRegistroMastitis(registro=None, success=False, message=str(e))

class EliminarRegistroMastitis(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            registro = RegistroMastitis.objects.get(id=id)
            registro.delete()
            return EliminarRegistroMastitis(success=True, message="Registro de mastitis eliminado exitosamente")
        except Exception as e:
            return EliminarRegistroMastitis(success=False, message=str(e))

# ===== TIEMPO RETIRO =====
class ActualizarTiempoRetiro(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        tipo_retiro = graphene.String()
        fecha_inicio = graphene.Date()
        dias_retiro = graphene.Int()

    tiempo_retiro = graphene.Field(TiempoRetiroType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            tiempo_retiro = TiempoRetiro.objects.get(id=id)
            if kwargs.get('tipo_retiro') is not None:
                tiempo_retiro.tipo_retiro = kwargs['tipo_retiro']
            if kwargs.get('fecha_inicio') is not None:
                tiempo_retiro.fecha_inicio = kwargs['fecha_inicio']
                tiempo_retiro.fecha_fin = kwargs['fecha_inicio'] + timedelta(days=tiempo_retiro.dias_retiro)
            if kwargs.get('dias_retiro') is not None:
                tiempo_retiro.dias_retiro = kwargs['dias_retiro']
                tiempo_retiro.fecha_fin = tiempo_retiro.fecha_inicio + timedelta(days=kwargs['dias_retiro'])
            tiempo_retiro.save()
            return ActualizarTiempoRetiro(tiempo_retiro=tiempo_retiro, success=True, message="Período de retiro actualizado exitosamente")
        except Exception as e:
            return ActualizarTiempoRetiro(tiempo_retiro=None, success=False, message=str(e))

class EliminarTiempoRetiro(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            tiempo_retiro = TiempoRetiro.objects.get(id=id)
            tiempo_retiro.delete()
            return EliminarTiempoRetiro(success=True, message="Período de retiro eliminado exitosamente")
        except Exception as e:
            return EliminarTiempoRetiro(success=False, message=str(e))
# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    # Mutations existentes
    crear_vacunacion = CrearVacunacion.Field()
    actualizar_vacunacion = ActualizarVacunacion.Field()
    eliminar_vacunacion = EliminarVacunacion.Field()
    crear_tratamiento = CrearTratamiento.Field()
    finalizar_tratamiento = FinalizarTratamiento.Field()
    crear_desparasitacion = CrearDesparasitacion.Field()
    crear_diagnostico = CrearDiagnostico.Field()
    crear_observacion = CrearObservacion.Field()
    
    # Nuevas mutations de creación
    crear_enfermedad = CrearEnfermedad.Field()
    crear_examen_laboratorio = CrearExamenLaboratorio.Field()
    crear_registro_mastitis = CrearRegistroMastitis.Field()
    curar_mastitis = CurarMastitis.Field()
    crear_tiempo_retiro = CrearTiempoRetiro.Field()
    finalizar_tiempo_retiro = FinalizarTiempoRetiro.Field()
    
    # ===== NUEVAS MUTATIONS DE ACTUALIZACIÓN Y ELIMINACIÓN =====
    actualizar_tratamiento = ActualizarTratamiento.Field()
    eliminar_tratamiento = EliminarTratamiento.Field()
    actualizar_desparasitacion = ActualizarDesparasitacion.Field()
    eliminar_desparasitacion = EliminarDesparasitacion.Field()
    actualizar_diagnostico = ActualizarDiagnostico.Field()
    eliminar_diagnostico = EliminarDiagnostico.Field()
    actualizar_observacion = ActualizarObservacion.Field()
    eliminar_observacion = EliminarObservacion.Field()
    actualizar_examen_laboratorio = ActualizarExamenLaboratorio.Field()
    eliminar_examen_laboratorio = EliminarExamenLaboratorio.Field()
    actualizar_registro_mastitis = ActualizarRegistroMastitis.Field()
    eliminar_registro_mastitis = EliminarRegistroMastitis.Field()
    actualizar_tiempo_retiro = ActualizarTiempoRetiro.Field()
    eliminar_tiempo_retiro = EliminarTiempoRetiro.Field()