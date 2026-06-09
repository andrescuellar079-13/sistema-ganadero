# backend/animales/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from datetime import date

from .models import Raza, CategoriaAnimal, Animal, Parcela, AnimalParcela, MovimientoAnimal
from accounts.permissions import ids_fincas_visibles, ids_para_listado, validar_finca, puede_acceder_finca
from graphql import GraphQLError


def _get_registro_peso_type():
    from produccion.schema import RegistroPesoType
    return RegistroPesoType

def _get_lactancia_type():
    from produccion.schema import LactanciaType
    return LactanciaType

def _get_produccion_leche_type():
    from produccion.schema import ProduccionLecheType
    return ProduccionLecheType

def _get_inseminacion_type():
    from reproduccion.schema import InseminacionArtificialType
    return InseminacionArtificialType

def _get_diagnostico_prenez_type():
    from reproduccion.schema import DiagnosticoPrenezType
    return DiagnosticoPrenezType

def _get_reproduccion_type():
    from reproduccion.schema import ReproduccionType
    return ReproduccionType

def _get_vacunacion_type():
    from sanidad.schema import VacunacionType
    return VacunacionType

def _get_tratamiento_type():
    from sanidad.schema import TratamientoType
    return TratamientoType

def _get_detalle_venta_type():
    from comercio.schema import DetalleVentaType
    return DetalleVentaType

def _get_muerte_baja_type():
    from comercio.schema import MuerteBajaType
    return MuerteBajaType

def _get_detalle_transferencia_type():
    from fincas.schema import DetalleTransferenciaType
    return DetalleTransferenciaType


# ==========================================
# TYPES
# ==========================================

class AnimalesPaginadosType(graphene.ObjectType):
    animales = graphene.List(lambda: AnimalType)
    total = graphene.Int()
    paginas = graphene.Int()
    pagina_actual = graphene.Int()
    tiene_siguiente = graphene.Boolean()
    tiene_anterior = graphene.Boolean()


class RazaType(DjangoObjectType):
    class Meta:
        model = Raza
        fields = "__all__"


class CategoriaAnimalType(DjangoObjectType):
    class Meta:
        model = CategoriaAnimal
        fields = "__all__"


class AnimalType(DjangoObjectType):
    descendencia = graphene.List(lambda: AnimalType)

    registros_peso = graphene.List(lambda: _get_registro_peso_type())
    lactancias = graphene.List(lambda: _get_lactancia_type())
    producciones_leche = graphene.List(lambda: _get_produccion_leche_type())

    inseminaciones = graphene.List(lambda: _get_inseminacion_type())
    diagnosticos_prenez = graphene.List(lambda: _get_diagnostico_prenez_type())
    partos = graphene.List(lambda: _get_reproduccion_type())

    vacunaciones = graphene.List(lambda: _get_vacunacion_type())
    tratamientos = graphene.List(lambda: _get_tratamiento_type())

    movimientos_parcela = graphene.List(lambda: AnimalParcelaType)

    ventas = graphene.List(lambda: _get_detalle_venta_type())
    bajas = graphene.List(lambda: _get_muerte_baja_type())

    movimientos = graphene.List(lambda: MovimientoAnimalType)
    transferencias_animal = graphene.List(lambda: _get_detalle_transferencia_type())

    class Meta:
        model = Animal
        fields = "__all__"

    def resolve_descendencia(self, info):
        from django.db.models import Q
        return Animal.objects.filter(
            Q(padre_id=self.id) | Q(madre_id=self.id)
        ).select_related('raza', 'categoria')

    def resolve_registros_peso(self, info):
        return self.registros_peso.all().order_by('-fecha_pesaje')

    def resolve_lactancias(self, info):
        return self.lactancias.all().order_by('-fecha_inicio')

    def resolve_producciones_leche(self, info):
        return self.producciones_leche.all().order_by('-fecha')

    def resolve_inseminaciones(self, info):
        return self.inseminacionartificial_eventos_reproductivos.all().select_related(
            'reproductor'
        ).order_by('-fecha')

    def resolve_diagnosticos_prenez(self, info):
        return self.diagnosticoprenez_eventos_reproductivos.all().select_related(
            'veterinario'
        ).order_by('-fecha')

    def resolve_partos(self, info):
        return self.reproducciones_como_madre.all().prefetch_related(
            'crias'
        ).order_by('-fecha_parto_real')

    def resolve_vacunaciones(self, info):
        return self.vacunaciones.all().select_related(
            'vacuna', 'veterinario'
        ).order_by('-fecha_aplicacion')

    def resolve_tratamientos(self, info):
        return self.tratamiento_eventos_sanitarios.all().select_related(
            'medicamento', 'veterinario'
        ).order_by('-fecha_inicio')

    def resolve_movimientos_parcela(self, info):
        return self.historial_parcelas.all().select_related(
            'parcela'
        ).order_by('-fecha_ingreso')

    def resolve_ventas(self, info):
        return self.detalles_venta.all().select_related(
            'nota_venta', 'nota_venta__cliente'
        ).order_by('-nota_venta__fecha_venta')

    def resolve_bajas(self, info):
        return self.muertes_bajas.all().order_by('-fecha_baja')

    def resolve_movimientos(self, info):
        return self.movimientos.all().select_related(
            'parcela_origen', 'parcela_destino', 'registrado_por',
            'finca', 'finca_destino',
        ).order_by('-fecha_movimiento', '-fecha_registro')[:100]

    def resolve_transferencias_animal(self, info):
        return self.transferencias_detalle.all().select_related(
            'transferencia__finca_origen',
            'transferencia__finca_destino',
            'parcela_origen',
            'parcela_destino',
        ).order_by('-transferencia__fecha_transferencia')


class ParcelaType(DjangoObjectType):
    animalesActuales = graphene.List('animales.schema.AnimalParcelaType')
    ocupacionActual = graphene.Int()

    class Meta:
        model = Parcela
        fields = "__all__"

    def resolve_animalesActuales(self, info):
        return self.historial_animales.filter(fecha_salida__isnull=True)

    def resolve_ocupacionActual(self, info):
        if hasattr(self, 'ocupacion_actual'):
            return self.ocupacion_actual
        return self.historial_animales.filter(fecha_salida__isnull=True).count()


class AnimalParcelaType(DjangoObjectType):
    class Meta:
        model = AnimalParcela
        fields = "__all__"


class MovimientoAnimalType(DjangoObjectType):
    registrado_por_nombre = graphene.String()
    motivo_display = graphene.String()
    tipo = graphene.String()  # 'FINCA' | 'PARCELA'

    class Meta:
        model = MovimientoAnimal
        fields = "__all__"

    def resolve_registrado_por_nombre(self, info):
        if self.registrado_por:
            nombre = f"{self.registrado_por.first_name} {self.registrado_por.last_name}".strip()
            return nombre or self.registrado_por.username
        return None

    def resolve_motivo_display(self, info):
        return self.get_motivo_display() if self.motivo else None

    def resolve_tipo(self, info):
        return 'FINCA' if self.motivo == 'TRANSFERENCIA_FINCA' else 'PARCELA'


class ConteoAnimalGrupoType(graphene.ObjectType):
    id = graphene.ID()
    nombre = graphene.String()
    total = graphene.Int()


class ReporteAnimalGrupalType(graphene.ObjectType):
    total = graphene.Int()
    machos = graphene.Int()
    hembras = graphene.Int()
    activos = graphene.Int()
    vendidos = graphene.Int()
    muertos = graphene.Int()
    descarte = graphene.Int()
    matadero = graphene.Int()
    baja = graphene.Int()
    peso_promedio = graphene.Decimal()
    peso_total = graphene.Decimal()
    peso_minimo = graphene.Decimal()
    peso_maximo = graphene.Decimal()
    por_estado = graphene.List(ConteoAnimalGrupoType)
    por_sexo = graphene.List(ConteoAnimalGrupoType)
    por_raza = graphene.List(ConteoAnimalGrupoType)
    por_categoria = graphene.List(ConteoAnimalGrupoType)
    descripcion = graphene.String()


class ReporteAnimalIndividualType(graphene.ObjectType):
    animal = graphene.Field(AnimalType)
    parcela_actual = graphene.Field(ParcelaType)
    movimiento_actual = graphene.Field(AnimalParcelaType)
    edad_meses = graphene.Int()
    dias_en_finca = graphene.Int()
    total_movimientos_parcela = graphene.Int()
    descripcion = graphene.String()


class ParcelasPaginadasType(graphene.ObjectType):
    results = graphene.List(ParcelaType)
    count = graphene.Int()
    page = graphene.Int()
    page_size = graphene.Int()
    total_pages = graphene.Int()
    has_next = graphene.Boolean()
    has_previous = graphene.Boolean()


class AnimalExportItemType(graphene.ObjectType):
    nro_arete = graphene.String()
    nombre = graphene.String()
    sexo = graphene.String()
    raza_nombre = graphene.String()
    categoria_nombre = graphene.String()
    peso = graphene.Decimal()
    fecha_nacimiento = graphene.Date()
    edad_meses = graphene.Int()
    tipo_produccion = graphene.String()
    origen = graphene.String()
    estado = graphene.String()
    parcela_actual = graphene.String()
    fecha_ingreso = graphene.Date()
    padre_arete = graphene.String()
    madre_arete = graphene.String()
    observaciones = graphene.String()
    # Campos para reporte de vendidos
    fecha_venta = graphene.Date()
    cliente_nombre = graphene.String()
    peso_venta = graphene.Decimal()
    precio_unitario = graphene.Decimal()
    sub_total = graphene.Decimal()
    guia_salida = graphene.String()
    # Campos para reporte de bajas/muertes
    fecha_baja = graphene.Date()
    tipo_baja = graphene.String()
    causa_baja = graphene.String()
    peso_estimado_baja = graphene.Decimal()
    descripcion_baja = graphene.String()


class ExportarAnimalesResultType(graphene.ObjectType):
    items = graphene.List(AnimalExportItemType)
    total = graphene.Int()
    mensaje = graphene.String()


# ==========================================
# HELPER DE FILTROS (función auxiliar fuera de la clase)
# ==========================================

def aplicar_filtros_animales(
    qs,
    finca_id=None,
    buscar=None,
    estado=None,
    raza_id=None,
    categoria_id=None,
    sexo=None,
    tipo_produccion=None,
    origen=None,
    peso_min=None,
    peso_max=None,
    fecha_nacimiento_desde=None,
    fecha_nacimiento_hasta=None,
    fecha_ingreso_desde=None,
    fecha_ingreso_hasta=None,
    fecha_registro_desde=None,
    fecha_registro_hasta=None,
):
    from django.db.models import Q
    from datetime import datetime, time
    from django.conf import settings
    from django.utils import timezone

    def inicio_dia(fecha):
        dt = datetime.combine(fecha, time.min)
        if settings.USE_TZ:
            return timezone.make_aware(dt, timezone.get_current_timezone())
        return dt

    def fin_dia(fecha):
        dt = datetime.combine(fecha, time.max)
        if settings.USE_TZ:
            return timezone.make_aware(dt, timezone.get_current_timezone())
        return dt

    if finca_id:
        qs = qs.filter(finca_id=finca_id)

    if buscar:
        qs = qs.filter(
            Q(nombre__icontains=buscar) |
            Q(nro_arete__icontains=buscar) |
            Q(raza__nombre__icontains=buscar) |
            Q(categoria__nombre__icontains=buscar) |
            Q(estado__icontains=buscar) |
            Q(sexo__icontains=buscar) |
            Q(tipo_produccion__icontains=buscar) |
            Q(origen__icontains=buscar) |
            Q(observaciones__icontains=buscar)
        )

    if estado and estado not in ('', 'TODOS'):
        qs = qs.filter(estado=estado)

    if raza_id:
        qs = qs.filter(raza_id=raza_id)

    if categoria_id:
        qs = qs.filter(categoria_id=categoria_id)

    if sexo and sexo not in ('', 'TODOS'):
        qs = qs.filter(sexo=sexo)

    if tipo_produccion and tipo_produccion not in ('', 'TODOS'):
        qs = qs.filter(tipo_produccion=tipo_produccion)

    if origen and origen not in ('', 'TODOS'):
        qs = qs.filter(origen=origen)

    if peso_min is not None:
        qs = qs.filter(peso__gte=peso_min)

    if peso_max is not None:
        qs = qs.filter(peso__lte=peso_max)

    if fecha_nacimiento_desde:
        qs = qs.filter(fecha_nacimiento__gte=fecha_nacimiento_desde)

    if fecha_nacimiento_hasta:
        qs = qs.filter(fecha_nacimiento__lte=fecha_nacimiento_hasta)

    if fecha_ingreso_desde:
        qs = qs.filter(fecha_ingreso__gte=fecha_ingreso_desde)

    if fecha_ingreso_hasta:
        qs = qs.filter(fecha_ingreso__lte=fecha_ingreso_hasta)

    if fecha_registro_desde:
        qs = qs.filter(fecha_registro__gte=inicio_dia(fecha_registro_desde))

    if fecha_registro_hasta:
        qs = qs.filter(fecha_registro__lte=fin_dia(fecha_registro_hasta))

    return qs


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    # --- Animales básicos ---
    razas = graphene.List(RazaType)
    categorias_animales = graphene.List(CategoriaAnimalType)
    all_animales = graphene.List(AnimalType)
    animal_by_id = graphene.Field(AnimalType, id=graphene.ID(required=True))
    animal_by_arete = graphene.Field(AnimalType, nro_arete=graphene.String(required=True))
    animales_activos = graphene.List(AnimalType, finca_id=graphene.ID(required=True))

    # --- Genealogía ---
    animal_detalle = graphene.Field(AnimalType, id=graphene.ID(required=True))
    animales_machos_para_padre = graphene.List(
        AnimalType,
        finca_id=graphene.ID(required=True),
        excluir_id=graphene.ID(),
    )
    animales_hembras_para_madre = graphene.List(
        AnimalType,
        finca_id=graphene.ID(required=True),
        excluir_id=graphene.ID(),
    )

    # --- Animales paginados con filtros completos ---
    animales_paginados = graphene.Field(
        AnimalesPaginadosType,
        finca_id=graphene.ID(),
        pagina=graphene.Int(),
        por_pagina=graphene.Int(),
        buscar=graphene.String(),
        estado=graphene.String(),
        ordenar=graphene.String(),
        raza_id=graphene.ID(),
        categoria_id=graphene.ID(),
        sexo=graphene.String(),
        tipo_produccion=graphene.String(),
        origen=graphene.String(),
        peso_min=graphene.Decimal(),
        peso_max=graphene.Decimal(),
        fecha_nacimiento_desde=graphene.Date(),
        fecha_nacimiento_hasta=graphene.Date(),
        fecha_ingreso_desde=graphene.Date(),
        fecha_ingreso_hasta=graphene.Date(),
        fecha_registro_desde=graphene.Date(),
        fecha_registro_hasta=graphene.Date(),
    )

    # --- Parcelas ---
    parcelas = graphene.List(ParcelaType, finca_id=graphene.ID(required=True))
    parcela = graphene.Field(ParcelaType, id=graphene.ID(required=True))
    animales_en_parcela = graphene.List(AnimalParcelaType, parcela_id=graphene.ID(required=True))
    animales_actuales_parcela = graphene.List(AnimalParcelaType, parcela_id=graphene.ID(required=True))
    parcelas_paginadas = graphene.Field(
        ParcelasPaginadasType,
        finca_id=graphene.ID(required=True),
        search=graphene.String(),
        estado=graphene.String(),
        temporal=graphene.String(),
        ordering=graphene.String(),
        page=graphene.Int(),
        page_size=graphene.Int(),
    )
    parcelas_disponibles_para_movimiento = graphene.List(
        ParcelaType,
        finca_id=graphene.ID(required=True),
        animal_id=graphene.ID(required=True),
    )

    # --- Movimientos ---
    movimientos_animal = graphene.List(
        MovimientoAnimalType,
        animal_id=graphene.ID(required=True),
        limit=graphene.Int(),
    )
    movimientos_finca = graphene.List(
        MovimientoAnimalType,
        finca_id=graphene.ID(required=True),
        animal_id=graphene.ID(),
        desde=graphene.Date(),
        hasta=graphene.Date(),
        motivo=graphene.String(),
    )

    # --- Reportes ---
    reporte_animal_individual = graphene.Field(
        ReporteAnimalIndividualType,
        id=graphene.ID(required=True),
    )
    reporte_animales_grupal = graphene.Field(
        ReporteAnimalGrupalType,
        finca_id=graphene.ID(required=True),
        buscar=graphene.String(),
        estado=graphene.String(),
        raza_id=graphene.ID(),
        categoria_id=graphene.ID(),
        sexo=graphene.String(),
        tipo_produccion=graphene.String(),
        origen=graphene.String(),
        peso_min=graphene.Decimal(),
        peso_max=graphene.Decimal(),
        fecha_nacimiento_desde=graphene.Date(),
        fecha_nacimiento_hasta=graphene.Date(),
        fecha_ingreso_desde=graphene.Date(),
        fecha_ingreso_hasta=graphene.Date(),
        fecha_registro_desde=graphene.Date(),
        fecha_registro_hasta=graphene.Date(),
    )
    exportar_animales = graphene.Field(
        ExportarAnimalesResultType,
        finca_id=graphene.ID(required=True),
        tipo_reporte=graphene.String(),
        estado=graphene.String(),
        sexo=graphene.String(),
        raza_id=graphene.ID(),
        categoria_id=graphene.ID(),
        tipo_produccion=graphene.String(),
        origen=graphene.String(),
        parcela_id=graphene.ID(),
        fecha_nacimiento_desde=graphene.Date(),
        fecha_nacimiento_hasta=graphene.Date(),
        fecha_ingreso_desde=graphene.Date(),
        fecha_ingreso_hasta=graphene.Date(),
        fecha_venta_desde=graphene.Date(),
        fecha_venta_hasta=graphene.Date(),
        fecha_baja_desde=graphene.Date(),
        fecha_baja_hasta=graphene.Date(),
        limite=graphene.Int(),
        orden=graphene.String(),
    )

    # ---- resolvers ----

    def resolve_razas(self, info):
        return Raza.objects.all()

    def resolve_categorias_animales(self, info):
        return CategoriaAnimal.objects.all()

    @login_required
    def resolve_all_animales(self, info):
        return Animal.objects.filter(finca_id__in=ids_para_listado(info.context.user))

    @login_required
    def resolve_animal_by_id(self, info, id):
        animal = Animal.objects.filter(id=id).first()
        if animal and not puede_acceder_finca(info.context.user, animal.finca_id):
            raise GraphQLError("No tiene acceso a este animal.")
        return animal

    @login_required
    def resolve_animal_by_arete(self, info, nro_arete):
        animal = Animal.objects.filter(
            nro_arete=nro_arete, finca_id__in=ids_fincas_visibles(info.context.user)
        ).first()
        return animal

    @login_required
    def resolve_animales_activos(self, info, finca_id):
        validar_finca(info.context.user, finca_id)
        return Animal.objects.filter(finca_id=finca_id, estado='ACTIVO')

    @login_required
    def resolve_animal_detalle(self, info, id):
        if not Animal.objects.filter(
            id=id, finca_id__in=ids_fincas_visibles(info.context.user)
        ).exists():
            raise GraphQLError("No tiene acceso a este animal.")
        return Animal.objects.select_related(
            'raza', 'categoria',
            'padre', 'padre__raza', 'padre__categoria',
            'madre', 'madre__raza', 'madre__categoria',
        ).prefetch_related(
            'registros_peso',
            'lactancias',
            'producciones_leche',
            'inseminacionartificial_eventos_reproductivos',
            'inseminacionartificial_eventos_reproductivos__reproductor',
            'diagnosticoprenez_eventos_reproductivos',
            'diagnosticoprenez_eventos_reproductivos__veterinario',
            'reproducciones_como_madre',
            'reproducciones_como_madre__crias',
            'vacunaciones',
            'vacunaciones__vacuna',
            'vacunaciones__veterinario',
            'tratamiento_eventos_sanitarios',
            'tratamiento_eventos_sanitarios__medicamento',
            'tratamiento_eventos_sanitarios__veterinario',
            'historial_parcelas',
            'historial_parcelas__parcela',
            'detalles_venta',
            'detalles_venta__nota_venta',
            'detalles_venta__nota_venta__cliente',
            'muertes_bajas',
            'transferencias_detalle',
            'transferencias_detalle__transferencia',
            'transferencias_detalle__transferencia__finca_origen',
            'transferencias_detalle__transferencia__finca_destino',
            'transferencias_detalle__parcela_origen',
            'transferencias_detalle__parcela_destino',
        ).get(id=id)

    @login_required
    def resolve_animales_machos_para_padre(self, info, finca_id, excluir_id=None):
        validar_finca(info.context.user, finca_id)
        qs = Animal.objects.filter(
            finca_id=finca_id, sexo='MACHO'
        ).select_related('raza', 'categoria')
        if excluir_id:
            qs = qs.exclude(id=excluir_id)
        return qs.order_by('nro_arete')

    @login_required
    def resolve_animales_hembras_para_madre(self, info, finca_id, excluir_id=None):
        validar_finca(info.context.user, finca_id)
        qs = Animal.objects.filter(
            finca_id=finca_id, sexo='HEMBRA'
        ).select_related('raza', 'categoria')
        if excluir_id:
            qs = qs.exclude(id=excluir_id)
        return qs.order_by('nro_arete')

    def resolve_animales_paginados(
        self, info,
        finca_id=None, pagina=1, por_pagina=10,
        buscar=None, estado=None, ordenar=None,
        raza_id=None, categoria_id=None,
        sexo=None, tipo_produccion=None, origen=None,
        peso_min=None, peso_max=None,
        fecha_nacimiento_desde=None, fecha_nacimiento_hasta=None,
        fecha_ingreso_desde=None, fecha_ingreso_hasta=None,
        fecha_registro_desde=None, fecha_registro_hasta=None,
    ):
        from django.db.models import IntegerField, Value, Case, When

        user = info.context.user
        if finca_id:
            validar_finca(user, finca_id)
            qs = Animal.objects.select_related('finca', 'raza', 'categoria', 'padre', 'madre')
        else:
            qs = Animal.objects.filter(
                finca_id__in=ids_fincas_visibles(user)
            ).select_related('finca', 'raza', 'categoria', 'padre', 'madre')

        qs = aplicar_filtros_animales(
            qs,
            finca_id=finca_id,
            buscar=buscar,
            estado=estado,
            raza_id=raza_id,
            categoria_id=categoria_id,
            sexo=sexo,
            tipo_produccion=tipo_produccion,
            origen=origen,
            peso_min=peso_min,
            peso_max=peso_max,
            fecha_nacimiento_desde=fecha_nacimiento_desde,
            fecha_nacimiento_hasta=fecha_nacimiento_hasta,
            fecha_ingreso_desde=fecha_ingreso_desde,
            fecha_ingreso_hasta=fecha_ingreso_hasta,
            fecha_registro_desde=fecha_registro_desde,
            fecha_registro_hasta=fecha_registro_hasta,
        )

        if ordenar == 'arete_az':
            qs = qs.order_by('nro_arete')
        elif ordenar == 'arete_za':
            qs = qs.order_by('-nro_arete')
        elif ordenar == 'nombre_az':
            qs = qs.order_by('nombre')
        elif ordenar == 'nombre_za':
            qs = qs.order_by('-nombre')
        elif ordenar == 'mayor_peso':
            qs = qs.order_by('-peso', '-fecha_registro')
        elif ordenar == 'menor_peso':
            qs = qs.order_by('peso', '-fecha_registro')
        elif ordenar == 'mayor_edad':
            qs = qs.order_by('fecha_nacimiento', '-fecha_registro')
        elif ordenar == 'menor_edad':
            qs = qs.order_by('-fecha_nacimiento', '-fecha_registro')
        elif ordenar in ('activos_primero', 'bajas_final'):
            qs = qs.annotate(
                orden_estado=Case(
                    When(estado='ACTIVO', then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            ).order_by('orden_estado', '-fecha_registro')
        elif ordenar == 'antiguos':
            qs = qs.order_by('fecha_registro')
        else:
            qs = qs.order_by('-fecha_registro')

        por_pagina = max(1, min(por_pagina or 10, 200))
        total = qs.count()
        paginas = max(1, (total + por_pagina - 1) // por_pagina)
        pagina = max(1, min(pagina or 1, paginas))
        offset = (pagina - 1) * por_pagina

        return AnimalesPaginadosType(
            animales=list(qs[offset:offset + por_pagina]),
            total=total,
            paginas=paginas,
            pagina_actual=pagina,
            tiene_siguiente=pagina < paginas,
            tiene_anterior=pagina > 1,
        )

    @login_required
    def resolve_parcelas(self, info, finca_id):
        validar_finca(info.context.user, finca_id)
        return Parcela.objects.filter(finca_id=finca_id)

    @login_required
    def resolve_parcela(self, info, id):
        parcela = Parcela.objects.filter(id=id).first()
        if parcela and not puede_acceder_finca(info.context.user, parcela.finca_id):
            raise GraphQLError("No tiene acceso a esta parcela.")
        return parcela

    @login_required
    def resolve_animales_en_parcela(self, info, parcela_id):
        if not Parcela.objects.filter(
            id=parcela_id, finca_id__in=ids_fincas_visibles(info.context.user)
        ).exists():
            raise GraphQLError("No tiene acceso a esta parcela.")
        return AnimalParcela.objects.filter(parcela_id=parcela_id)

    def resolve_animales_actuales_parcela(self, info, parcela_id):
        return AnimalParcela.objects.filter(
            parcela_id=parcela_id, fecha_salida__isnull=True
        )

    @login_required
    def resolve_parcelas_paginadas(
        self, info,
        finca_id,
        search=None,
        estado=None,
        temporal=None,
        ordering=None,
        page=1,
        page_size=10,
    ):
        validar_finca(info.context.user, finca_id)
        from django.db.models import Count, Q, OuterRef, Subquery, IntegerField, Value
        from django.db.models.functions import Coalesce

        ocupacion_sq = AnimalParcela.objects.filter(
            parcela=OuterRef('pk'),
            fecha_salida__isnull=True,
        ).values('parcela').annotate(cnt=Count('id')).values('cnt')

        qs = Parcela.objects.filter(finca_id=finca_id).annotate(
            ocupacion_actual=Coalesce(
                Subquery(ocupacion_sq, output_field=IntegerField()),
                Value(0),
            )
        )

        if search:
            qs = qs.filter(
                Q(nombre__icontains=search) |
                Q(tipo_pastura__icontains=search)
            )

        if estado and estado not in ('', 'TODOS'):
            qs = qs.filter(estado=estado)

        if ordering == 'nombre_az':
            qs = qs.order_by('nombre')
        elif ordering == 'nombre_za':
            qs = qs.order_by('-nombre')
        elif ordering == 'mayor_capacidad':
            qs = qs.order_by('-capacidad_maxima')
        elif ordering == 'menor_capacidad':
            qs = qs.order_by('capacidad_maxima')
        else:
            qs = qs.order_by('nombre')

        page_size = max(1, min(page_size or 10, 100))
        count = qs.count()
        total_pages = max(1, (count + page_size - 1) // page_size)
        page = max(1, min(page or 1, total_pages))
        offset = (page - 1) * page_size

        return ParcelasPaginadasType(
            results=list(qs[offset:offset + page_size]),
            count=count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        )

    @login_required
    def resolve_parcelas_disponibles_para_movimiento(self, info, finca_id, animal_id):
        validar_finca(info.context.user, finca_id)
        from django.db.models import Count, Q, OuterRef, Subquery, IntegerField, Value, F
        from django.db.models.functions import Coalesce

        parcela_actual_id = AnimalParcela.objects.filter(
            animal_id=animal_id,
            fecha_salida__isnull=True,
        ).values_list('parcela_id', flat=True).first()

        ocupacion_sq = AnimalParcela.objects.filter(
            parcela=OuterRef('pk'),
            fecha_salida__isnull=True,
        ).values('parcela').annotate(cnt=Count('id')).values('cnt')

        qs = Parcela.objects.filter(
            finca_id=finca_id,
            estado__in=['LIBRE', 'OCUPADO'],
        ).annotate(
            ocupacion_actual=Coalesce(
                Subquery(ocupacion_sq, output_field=IntegerField()),
                Value(0),
            )
        ).filter(
            Q(capacidad_maxima=0) | Q(ocupacion_actual__lt=F('capacidad_maxima'))
        )

        if parcela_actual_id:
            qs = qs.exclude(id=parcela_actual_id)

        return qs.order_by('nombre')

    @login_required
    def resolve_movimientos_animal(self, info, animal_id, limit=50):
        if not Animal.objects.filter(
            id=animal_id, finca_id__in=ids_fincas_visibles(info.context.user)
        ).exists():
            raise GraphQLError("No tiene acceso a este animal.")
        qs = MovimientoAnimal.objects.filter(
            animal_id=animal_id
        ).select_related(
            'parcela_origen', 'parcela_destino', 'registrado_por', 'animal'
        ).order_by('-fecha_movimiento', '-fecha_registro')
        if limit:
            qs = qs[:limit]
        return qs

    @login_required
    def resolve_movimientos_finca(
        self, info, finca_id,
        animal_id=None, desde=None, hasta=None, motivo=None,
    ):
        validar_finca(info.context.user, finca_id)
        qs = MovimientoAnimal.objects.filter(
            finca_id=finca_id
        ).select_related(
            'animal', 'parcela_origen', 'parcela_destino', 'registrado_por'
        )
        if animal_id:
            qs = qs.filter(animal_id=animal_id)
        if desde:
            qs = qs.filter(fecha_movimiento__gte=desde)
        if hasta:
            qs = qs.filter(fecha_movimiento__lte=hasta)
        if motivo:
            qs = qs.filter(motivo=motivo)
        return qs.order_by('-fecha_movimiento', '-fecha_registro')

    @login_required
    def resolve_reporte_animal_individual(self, info, id):
        from datetime import date as hoy_date

        animal = Animal.objects.select_related(
            'raza', 'categoria', 'padre', 'madre'
        ).get(id=id)
        if not puede_acceder_finca(info.context.user, animal.finca_id):
            raise GraphQLError("No tiene acceso a este animal.")

        movimiento_actual = AnimalParcela.objects.filter(
            animal=animal,
            fecha_salida__isnull=True,
        ).select_related('parcela').order_by('-fecha_ingreso').first()

        parcela_actual = movimiento_actual.parcela if movimiento_actual else None

        hoy = hoy_date.today()

        edad_meses = None
        if animal.fecha_nacimiento:
            edad_meses = (hoy - animal.fecha_nacimiento).days // 30

        dias_en_finca = None
        if animal.fecha_ingreso:
            dias_en_finca = (hoy - animal.fecha_ingreso).days
        elif animal.fecha_registro:
            dias_en_finca = (hoy - animal.fecha_registro.date()).days

        total_movimientos_parcela = AnimalParcela.objects.filter(animal=animal).count()

        descripcion = (
            f"Ficha individual del animal {animal.nro_arete}"
            + (f" ({animal.nombre})" if animal.nombre else "")
            + f". Estado: {animal.estado}."
            + (f" Edad aproximada: {edad_meses} meses." if edad_meses is not None else "")
            + (f" Parcela actual: {parcela_actual.nombre}." if parcela_actual else " Sin parcela asignada.")
        )

        return ReporteAnimalIndividualType(
            animal=animal,
            parcela_actual=parcela_actual,
            movimiento_actual=movimiento_actual,
            edad_meses=edad_meses,
            dias_en_finca=dias_en_finca,
            total_movimientos_parcela=total_movimientos_parcela,
            descripcion=descripcion,
        )

    @login_required
    def resolve_reporte_animales_grupal(
        self, info,
        finca_id,
        buscar=None,
        estado=None,
        raza_id=None,
        categoria_id=None,
        sexo=None,
        tipo_produccion=None,
        origen=None,
        peso_min=None,
        peso_max=None,
        fecha_nacimiento_desde=None,
        fecha_nacimiento_hasta=None,
        fecha_ingreso_desde=None,
        fecha_ingreso_hasta=None,
        fecha_registro_desde=None,
        fecha_registro_hasta=None,
    ):
        validar_finca(info.context.user, finca_id)
        from django.db.models import Count, Avg, Sum, Min, Max
        from decimal import Decimal

        qs = Animal.objects.select_related('raza', 'categoria')

        qs = aplicar_filtros_animales(
            qs,
            finca_id=finca_id,
            buscar=buscar,
            estado=estado,
            raza_id=raza_id,
            categoria_id=categoria_id,
            sexo=sexo,
            tipo_produccion=tipo_produccion,
            origen=origen,
            peso_min=peso_min,
            peso_max=peso_max,
            fecha_nacimiento_desde=fecha_nacimiento_desde,
            fecha_nacimiento_hasta=fecha_nacimiento_hasta,
            fecha_ingreso_desde=fecha_ingreso_desde,
            fecha_ingreso_hasta=fecha_ingreso_hasta,
            fecha_registro_desde=fecha_registro_desde,
            fecha_registro_hasta=fecha_registro_hasta,
        )

        total = qs.count()

        agg = qs.aggregate(
            peso_promedio=Avg('peso'),
            peso_total=Sum('peso'),
            peso_minimo=Min('peso'),
            peso_maximo=Max('peso'),
        )

        def contar_estado(valor):
            return qs.filter(estado=valor).count()

        machos = qs.filter(sexo='MACHO').count()
        hembras = qs.filter(sexo='HEMBRA').count()

        por_estado = [
            ConteoAnimalGrupoType(
                id=row['estado'],
                nombre=row['estado'] or 'Sin estado',
                total=row['total'],
            )
            for row in qs.values('estado').annotate(total=Count('id')).order_by('-total')
        ]

        por_sexo = [
            ConteoAnimalGrupoType(
                id=row['sexo'],
                nombre=row['sexo'] or 'Sin sexo',
                total=row['total'],
            )
            for row in qs.values('sexo').annotate(total=Count('id')).order_by('-total')
        ]

        por_raza = [
            ConteoAnimalGrupoType(
                id=row['raza_id'],
                nombre=row['raza__nombre'] or 'Sin raza',
                total=row['total'],
            )
            for row in qs.values('raza_id', 'raza__nombre').annotate(total=Count('id')).order_by('-total')
        ]

        por_categoria = [
            ConteoAnimalGrupoType(
                id=row['categoria_id'],
                nombre=row['categoria__nombre'] or 'Sin categoría',
                total=row['total'],
            )
            for row in qs.values('categoria_id', 'categoria__nombre').annotate(total=Count('id')).order_by('-total')
        ]

        descripcion = (
            f"El reporte contiene {total} animales filtrados. "
            f"Hay {machos} machos y {hembras} hembras. "
            f"El peso promedio es {agg['peso_promedio'] or 0} kg. "
            f"Este resumen se calcula directamente desde PostgreSQL, "
            f"sin cargar todos los animales en memoria."
        )

        return ReporteAnimalGrupalType(
            total=total,
            machos=machos,
            hembras=hembras,
            activos=contar_estado('ACTIVO'),
            vendidos=contar_estado('VENDIDO'),
            muertos=contar_estado('MUERTO'),
            descarte=contar_estado('DESCARTE'),
            matadero=contar_estado('MATADERO'),
            baja=contar_estado('BAJA'),
            peso_promedio=agg['peso_promedio'] or Decimal('0.00'),
            peso_total=agg['peso_total'] or Decimal('0.00'),
            peso_minimo=agg['peso_minimo'] or Decimal('0.00'),
            peso_maximo=agg['peso_maximo'] or Decimal('0.00'),
            por_estado=por_estado,
            por_sexo=por_sexo,
            por_raza=por_raza,
            por_categoria=por_categoria,
            descripcion=descripcion,
        )

    @login_required
    def resolve_exportar_animales(
        self, info,
        finca_id,
        tipo_reporte=None,
        estado=None,
        sexo=None,
        raza_id=None,
        categoria_id=None,
        tipo_produccion=None,
        origen=None,
        parcela_id=None,
        fecha_nacimiento_desde=None,
        fecha_nacimiento_hasta=None,
        fecha_ingreso_desde=None,
        fecha_ingreso_hasta=None,
        fecha_venta_desde=None,
        fecha_venta_hasta=None,
        fecha_baja_desde=None,
        fecha_baja_hasta=None,
        limite=None,
        orden=None,
    ):
        validar_finca(info.context.user, finca_id)
        from datetime import date as hoy_date
        from comercio.models import DetalleVenta, MuerteBaja

        limite = max(1, min(limite or 500, 5000))
        tipo_reporte = tipo_reporte or 'INVENTARIO'
        items = []

        def calcular_edad_meses(fecha_nac):
            if not fecha_nac:
                return None
            return (hoy_date.today() - fecha_nac).days // 30

        def _filtrar_animal_qs(qs):
            if sexo and sexo not in ('', 'TODOS'):
                qs = qs.filter(sexo=sexo)
            if raza_id:
                qs = qs.filter(raza_id=raza_id)
            if categoria_id:
                qs = qs.filter(categoria_id=categoria_id)
            if tipo_produccion and tipo_produccion not in ('', 'TODOS'):
                qs = qs.filter(tipo_produccion=tipo_produccion)
            if origen and origen not in ('', 'TODOS'):
                qs = qs.filter(origen=origen)
            if fecha_nacimiento_desde:
                qs = qs.filter(fecha_nacimiento__gte=fecha_nacimiento_desde)
            if fecha_nacimiento_hasta:
                qs = qs.filter(fecha_nacimiento__lte=fecha_nacimiento_hasta)
            if fecha_ingreso_desde:
                qs = qs.filter(fecha_ingreso__gte=fecha_ingreso_desde)
            if fecha_ingreso_hasta:
                qs = qs.filter(fecha_ingreso__lte=fecha_ingreso_hasta)
            return qs

        if tipo_reporte == 'VENDIDOS':
            qs = DetalleVenta.objects.filter(
                nota_venta__finca_id=finca_id
            ).select_related(
                'animal', 'animal__raza', 'animal__categoria',
                'animal__padre', 'animal__madre',
                'nota_venta', 'nota_venta__cliente'
            )
            if fecha_venta_desde:
                qs = qs.filter(nota_venta__fecha_venta__gte=fecha_venta_desde)
            if fecha_venta_hasta:
                qs = qs.filter(nota_venta__fecha_venta__lte=fecha_venta_hasta)
            if sexo and sexo not in ('', 'TODOS'):
                qs = qs.filter(animal__sexo=sexo)
            if raza_id:
                qs = qs.filter(animal__raza_id=raza_id)
            if categoria_id:
                qs = qs.filter(animal__categoria_id=categoria_id)
            if tipo_produccion and tipo_produccion not in ('', 'TODOS'):
                qs = qs.filter(animal__tipo_produccion=tipo_produccion)
            if origen and origen not in ('', 'TODOS'):
                qs = qs.filter(animal__origen=origen)
            if fecha_nacimiento_desde:
                qs = qs.filter(animal__fecha_nacimiento__gte=fecha_nacimiento_desde)
            if fecha_nacimiento_hasta:
                qs = qs.filter(animal__fecha_nacimiento__lte=fecha_nacimiento_hasta)
            qs = qs.order_by('-nota_venta__fecha_venta')[:limite]
            for dv in qs:
                a = dv.animal
                nv = dv.nota_venta
                cliente_str = None
                if nv.cliente:
                    cliente_str = f"{nv.cliente.nombre} {nv.cliente.apellidos or ''}".strip()
                items.append(AnimalExportItemType(
                    nro_arete=a.nro_arete, nombre=a.nombre, sexo=a.sexo,
                    raza_nombre=a.raza.nombre if a.raza else None,
                    categoria_nombre=a.categoria.nombre if a.categoria else None,
                    peso=a.peso, fecha_nacimiento=a.fecha_nacimiento,
                    edad_meses=calcular_edad_meses(a.fecha_nacimiento),
                    tipo_produccion=a.tipo_produccion, origen=a.origen, estado=a.estado,
                    parcela_actual=None, fecha_ingreso=a.fecha_ingreso,
                    padre_arete=a.padre.nro_arete if a.padre else None,
                    madre_arete=a.madre.nro_arete if a.madre else None,
                    observaciones=a.observaciones,
                    fecha_venta=nv.fecha_venta, cliente_nombre=cliente_str,
                    peso_venta=dv.peso_venta_kg, precio_unitario=dv.precio_unitario,
                    sub_total=dv.sub_total, guia_salida=nv.guia_salida,
                ))

        elif tipo_reporte in ('MUERTOS', 'BAJAS'):
            qs = MuerteBaja.objects.filter(finca_id=finca_id).select_related(
                'animal', 'animal__raza', 'animal__categoria',
                'animal__padre', 'animal__madre'
            )
            if tipo_reporte == 'MUERTOS':
                qs = qs.filter(tipo='MUERTE')
            if fecha_baja_desde:
                qs = qs.filter(fecha_baja__gte=fecha_baja_desde)
            if fecha_baja_hasta:
                qs = qs.filter(fecha_baja__lte=fecha_baja_hasta)
            if sexo and sexo not in ('', 'TODOS'):
                qs = qs.filter(animal__sexo=sexo)
            if raza_id:
                qs = qs.filter(animal__raza_id=raza_id)
            if categoria_id:
                qs = qs.filter(animal__categoria_id=categoria_id)
            if tipo_produccion and tipo_produccion not in ('', 'TODOS'):
                qs = qs.filter(animal__tipo_produccion=tipo_produccion)
            if origen and origen not in ('', 'TODOS'):
                qs = qs.filter(animal__origen=origen)
            if fecha_nacimiento_desde:
                qs = qs.filter(animal__fecha_nacimiento__gte=fecha_nacimiento_desde)
            if fecha_nacimiento_hasta:
                qs = qs.filter(animal__fecha_nacimiento__lte=fecha_nacimiento_hasta)
            qs = qs.order_by('-fecha_baja')[:limite]
            for mb in qs:
                a = mb.animal
                items.append(AnimalExportItemType(
                    nro_arete=a.nro_arete, nombre=a.nombre, sexo=a.sexo,
                    raza_nombre=a.raza.nombre if a.raza else None,
                    categoria_nombre=a.categoria.nombre if a.categoria else None,
                    peso=a.peso, fecha_nacimiento=a.fecha_nacimiento,
                    edad_meses=calcular_edad_meses(a.fecha_nacimiento),
                    tipo_produccion=a.tipo_produccion, origen=a.origen, estado=a.estado,
                    parcela_actual=None, fecha_ingreso=a.fecha_ingreso,
                    padre_arete=a.padre.nro_arete if a.padre else None,
                    madre_arete=a.madre.nro_arete if a.madre else None,
                    observaciones=a.observaciones,
                    fecha_baja=mb.fecha_baja, tipo_baja=mb.tipo, causa_baja=mb.causa,
                    peso_estimado_baja=mb.peso_estimado_kg, descripcion_baja=mb.descripcion,
                ))

        else:
            qs = Animal.objects.filter(finca_id=finca_id).select_related(
                'raza', 'categoria', 'padre', 'madre'
            ).prefetch_related('historial_parcelas__parcela')

            if tipo_reporte == 'ACTIVOS':
                qs = qs.filter(estado='ACTIVO')
            elif estado and estado not in ('', 'TODOS'):
                qs = qs.filter(estado=estado)

            qs = _filtrar_animal_qs(qs)

            if parcela_id:
                qs = qs.filter(
                    historial_parcelas__parcela_id=parcela_id,
                    historial_parcelas__fecha_salida__isnull=True
                ).distinct()

            if orden == 'arete_az':
                qs = qs.order_by('nro_arete')
            elif orden == 'nombre_az':
                qs = qs.order_by('nombre')
            elif orden == 'mayor_peso':
                qs = qs.order_by('-peso')
            elif orden == 'menor_peso':
                qs = qs.order_by('peso')
            else:
                qs = qs.order_by('-fecha_registro')

            qs = qs[:limite]

            for a in qs:
                parcela_act = None
                for hp in a.historial_parcelas.all():
                    if hp.fecha_salida is None and hp.parcela:
                        parcela_act = hp.parcela.nombre
                        break
                items.append(AnimalExportItemType(
                    nro_arete=a.nro_arete, nombre=a.nombre, sexo=a.sexo,
                    raza_nombre=a.raza.nombre if a.raza else None,
                    categoria_nombre=a.categoria.nombre if a.categoria else None,
                    peso=a.peso, fecha_nacimiento=a.fecha_nacimiento,
                    edad_meses=calcular_edad_meses(a.fecha_nacimiento),
                    tipo_produccion=a.tipo_produccion, origen=a.origen, estado=a.estado,
                    parcela_actual=parcela_act, fecha_ingreso=a.fecha_ingreso,
                    padre_arete=a.padre.nro_arete if a.padre else None,
                    madre_arete=a.madre.nro_arete if a.madre else None,
                    observaciones=a.observaciones,
                ))

        if not items:
            return ExportarAnimalesResultType(
                items=[], total=0,
                mensaje="No existen datos para los filtros seleccionados."
            )
        return ExportarAnimalesResultType(
            items=items, total=len(items),
            mensaje=f"Se encontraron {len(items)} registros."
        )


# ==========================================
# MUTATIONS
# ==========================================

class CrearRaza(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        orientacion = graphene.String()
        origen = graphene.String()
        descripcion = graphene.String()

    raza = graphene.Field(RazaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, **kwargs):
        try:
            raza = Raza.objects.create(
                nombre=nombre,
                orientacion=kwargs.get('orientacion', 'DOBLE_PROPOSITO'),
                origen=kwargs.get('origen', ''),
                descripcion=kwargs.get('descripcion', '')
            )
            return CrearRaza(raza=raza, success=True, message="Raza creada")
        except Exception as e:
            return CrearRaza(raza=None, success=False, message=str(e))


class ActualizarRaza(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        orientacion = graphene.String()
        origen = graphene.String()
        activo = graphene.Boolean()

    raza = graphene.Field(RazaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            raza = Raza.objects.get(id=id)
            if kwargs.get('nombre'):
                raza.nombre = kwargs['nombre']
            if kwargs.get('orientacion'):
                raza.orientacion = kwargs['orientacion']
            if kwargs.get('origen'):
                raza.origen = kwargs['origen']
            if kwargs.get('activo') is not None:
                raza.activo = kwargs['activo']
            raza.save()
            return ActualizarRaza(raza=raza, success=True, message="Raza actualizada")
        except Exception as e:
            return ActualizarRaza(raza=None, success=False, message=str(e))


class EliminarRaza(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            raza = Raza.objects.get(id=id)
            raza.delete()
            return EliminarRaza(success=True, message="Raza eliminada")
        except Exception as e:
            return EliminarRaza(success=False, message=str(e))


class CrearCategoriaAnimal(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        descripcion = graphene.String()

    categoria = graphene.Field(CategoriaAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, **kwargs):
        try:
            categoria = CategoriaAnimal.objects.create(
                nombre=nombre,
                descripcion=kwargs.get('descripcion', '')
            )
            return CrearCategoriaAnimal(categoria=categoria, success=True, message="Categoría creada")
        except Exception as e:
            return CrearCategoriaAnimal(categoria=None, success=False, message=str(e))


class ActualizarCategoriaAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        activo = graphene.Boolean()

    categoria = graphene.Field(CategoriaAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            categoria = CategoriaAnimal.objects.get(id=id)
            if kwargs.get('nombre'):
                categoria.nombre = kwargs['nombre']
            if kwargs.get('activo') is not None:
                categoria.activo = kwargs['activo']
            categoria.save()
            return ActualizarCategoriaAnimal(categoria=categoria, success=True, message="Categoría actualizada")
        except Exception as e:
            return ActualizarCategoriaAnimal(categoria=None, success=False, message=str(e))


class EliminarCategoriaAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            categoria = CategoriaAnimal.objects.get(id=id)
            categoria.delete()
            return EliminarCategoriaAnimal(success=True, message="Categoría eliminada")
        except Exception as e:
            return EliminarCategoriaAnimal(success=False, message=str(e))


class CrearAnimal(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        raza_id = graphene.ID()
        categoria_id = graphene.ID()
        padre_id = graphene.ID()
        madre_id = graphene.ID()
        nombre = graphene.String()
        nro_arete = graphene.String(required=True)
        sexo = graphene.String(required=True)
        fecha_nacimiento = graphene.Date()
        fecha_ingreso = graphene.Date()
        edad_ingreso_meses = graphene.Int()
        peso = graphene.Decimal()
        peso_nacimiento = graphene.Decimal()
        tipo_produccion = graphene.String()
        origen = graphene.String()
        color = graphene.String()
        observaciones = graphene.String()

    animal = graphene.Field(AnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, nro_arete, sexo, **kwargs):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.create(
                finca=finca,
                nro_arete=nro_arete,
                sexo=sexo,
                raza_id=kwargs.get('raza_id'),
                categoria_id=kwargs.get('categoria_id'),
                padre_id=kwargs.get('padre_id'),
                madre_id=kwargs.get('madre_id'),
                nombre=kwargs.get('nombre'),
                fecha_nacimiento=kwargs.get('fecha_nacimiento'),
                fecha_ingreso=kwargs.get('fecha_ingreso'),
                edad_ingreso_meses=kwargs.get('edad_ingreso_meses', 0),
                peso=kwargs.get('peso', 0),
                peso_nacimiento=kwargs.get('peso_nacimiento', 0),
                tipo_produccion=kwargs.get('tipo_produccion', 'DOBLE_PROPOSITO'),
                origen=kwargs.get('origen', 'NACIDO_FINCA'),
                color=kwargs.get('color'),
                observaciones=kwargs.get('observaciones')
            )
            return CrearAnimal(animal=animal, success=True, message="Animal creado")
        except Exception as e:
            return CrearAnimal(animal=None, success=False, message=str(e))


class ActualizarAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        raza_id = graphene.ID()
        categoria_id = graphene.ID()
        padre_id = graphene.ID()
        madre_id = graphene.ID()
        nombre = graphene.String()
        sexo = graphene.String()
        fecha_nacimiento = graphene.Date()
        fecha_ingreso = graphene.Date()
        edad_ingreso_meses = graphene.Int()
        peso = graphene.Decimal()
        peso_nacimiento = graphene.Decimal()
        estado = graphene.String()
        tipo_produccion = graphene.String()
        origen = graphene.String()
        observaciones = graphene.String()

    animal = graphene.Field(AnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            animal = Animal.objects.get(id=id)
            if kwargs.get('raza_id'):
                animal.raza_id = kwargs['raza_id']
            if kwargs.get('categoria_id'):
                animal.categoria_id = kwargs['categoria_id']
            if 'padre_id' in kwargs:
                animal.padre_id = kwargs['padre_id']
            if 'madre_id' in kwargs:
                animal.madre_id = kwargs['madre_id']
            if kwargs.get('nombre') is not None:
                animal.nombre = kwargs['nombre']
            if kwargs.get('sexo'):
                animal.sexo = kwargs['sexo']
            if kwargs.get('fecha_nacimiento'):
                animal.fecha_nacimiento = kwargs['fecha_nacimiento']
            if kwargs.get('fecha_ingreso'):
                animal.fecha_ingreso = kwargs['fecha_ingreso']
            if kwargs.get('edad_ingreso_meses') is not None:
                animal.edad_ingreso_meses = kwargs['edad_ingreso_meses']
            if kwargs.get('peso'):
                animal.peso = kwargs['peso']
            if kwargs.get('peso_nacimiento') is not None:
                animal.peso_nacimiento = kwargs['peso_nacimiento']
            if kwargs.get('estado'):
                animal.estado = kwargs['estado']
            if kwargs.get('tipo_produccion'):
                animal.tipo_produccion = kwargs['tipo_produccion']
            if kwargs.get('origen'):
                animal.origen = kwargs['origen']
            if kwargs.get('observaciones') is not None:
                animal.observaciones = kwargs['observaciones']
            animal.save()
            return ActualizarAnimal(animal=animal, success=True, message="Animal actualizado")
        except Exception as e:
            return ActualizarAnimal(animal=None, success=False, message=str(e))


class EliminarAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            animal = Animal.objects.get(id=id)
            animal.delete()
            return EliminarAnimal(success=True, message="Animal eliminado")
        except Exception as e:
            return EliminarAnimal(success=False, message=str(e))


class CrearParcela(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        tamano = graphene.Decimal()
        capacidad_maxima = graphene.Int()
        tipo_pastura = graphene.String()
        estado = graphene.String()

    parcela = graphene.Field(ParcelaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, nombre, **kwargs):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            parcela = Parcela.objects.create(
                finca=finca,
                nombre=nombre,
                tamano=kwargs.get('tamano', 0),
                capacidad_maxima=kwargs.get('capacidad_maxima', 0),
                tipo_pastura=kwargs.get('tipo_pastura', ''),
                estado=kwargs.get('estado', 'ACTIVA')
            )
            return CrearParcela(parcela=parcela, success=True, message="Parcela creada exitosamente")
        except Exception as e:
            return CrearParcela(parcela=None, success=False, message=str(e))


class ActualizarParcela(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        tamano = graphene.Decimal()
        capacidad_maxima = graphene.Int()
        tipo_pastura = graphene.String()
        estado = graphene.String()

    parcela = graphene.Field(ParcelaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            parcela = Parcela.objects.get(id=id)
            if kwargs.get('nombre'):
                parcela.nombre = kwargs['nombre']
            if kwargs.get('tamano'):
                parcela.tamano = kwargs['tamano']
            if kwargs.get('capacidad_maxima'):
                parcela.capacidad_maxima = kwargs['capacidad_maxima']
            if kwargs.get('tipo_pastura'):
                parcela.tipo_pastura = kwargs['tipo_pastura']
            if kwargs.get('estado'):
                parcela.estado = kwargs['estado']
            parcela.save()
            return ActualizarParcela(parcela=parcela, success=True, message="Parcela actualizada")
        except Exception as e:
            return ActualizarParcela(parcela=None, success=False, message=str(e))


class EliminarParcela(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            parcela = Parcela.objects.get(id=id)
            parcela.delete()
            return EliminarParcela(success=True, message="Parcela eliminada")
        except Exception as e:
            return EliminarParcela(success=False, message=str(e))


class MoverAnimalAParcela(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        parcela_id = graphene.ID(required=True)
        fecha_ingreso = graphene.Date(required=True)
        observaciones = graphene.String()

    movimiento = graphene.Field(AnimalParcelaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, parcela_id, fecha_ingreso, **kwargs):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id, finca=finca)
            parcela = Parcela.objects.get(id=parcela_id, finca=finca)

            if animal.estado != 'ACTIVO':
                return MoverAnimalAParcela(movimiento=None, success=False,
                    message="Solo se pueden mover animales con estado ACTIVO")

            if parcela.estado == 'DESCANSO':
                return MoverAnimalAParcela(movimiento=None, success=False,
                    message="La parcela destino está en descanso y no puede recibir animales")

            ocupacion_actual = AnimalParcela.objects.filter(
                parcela=parcela, fecha_salida__isnull=True
            ).count()
            if parcela.capacidad_maxima > 0 and ocupacion_actual >= parcela.capacidad_maxima:
                return MoverAnimalAParcela(movimiento=None, success=False,
                    message=f"La parcela destino está llena ({ocupacion_actual}/{parcela.capacidad_maxima})")

            movimiento_actual = AnimalParcela.objects.filter(
                animal=animal, fecha_salida__isnull=True
            ).select_related('parcela').first()
            parcela_origen = movimiento_actual.parcela if movimiento_actual else None

            AnimalParcela.objects.filter(
                animal=animal, fecha_salida__isnull=True
            ).update(fecha_salida=fecha_ingreso)

            movimiento = AnimalParcela.objects.create(
                animal=animal,
                parcela=parcela,
                fecha_ingreso=fecha_ingreso,
            )

            parcela.estado = 'OCUPADO'
            parcela.save(update_fields=['estado'])

            if parcela_origen and parcela_origen.id != parcela.id:
                animales_restantes = AnimalParcela.objects.filter(
                    parcela=parcela_origen, fecha_salida__isnull=True
                ).count()
                if parcela_origen.estado != 'DESCANSO':
                    parcela_origen.estado = 'LIBRE' if animales_restantes == 0 else 'OCUPADO'
                    parcela_origen.save(update_fields=['estado'])

            # Registrar en historial de movimientos
            user = info.context.user
            MovimientoAnimal.objects.create(
                finca=finca,
                animal=animal,
                parcela_origen=parcela_origen,
                parcela_destino=parcela,
                fecha_movimiento=fecha_ingreso,
                motivo='ROTACION',
                registrado_por=user if user.is_authenticated else None,
            )

            return MoverAnimalAParcela(movimiento=movimiento, success=True, message="Animal movido exitosamente")
        except Animal.DoesNotExist:
            return MoverAnimalAParcela(movimiento=None, success=False,
                message="Animal no encontrado o no pertenece a esta finca")
        except Parcela.DoesNotExist:
            return MoverAnimalAParcela(movimiento=None, success=False,
                message="Parcela no encontrada o no pertenece a esta finca")
        except Exception as e:
            return MoverAnimalAParcela(movimiento=None, success=False, message=str(e))


class CrearMovimientoAnimal(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha_movimiento = graphene.Date(required=True)
        parcela_origen_id = graphene.ID()
        parcela_destino_id = graphene.ID()
        motivo = graphene.String()
        observaciones = graphene.String()

    movimiento = graphene.Field(MovimientoAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha_movimiento, **kwargs):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id, finca=finca)
            user = info.context.user
            movimiento = MovimientoAnimal.objects.create(
                finca=finca,
                animal=animal,
                fecha_movimiento=fecha_movimiento,
                parcela_origen_id=kwargs.get('parcela_origen_id'),
                parcela_destino_id=kwargs.get('parcela_destino_id'),
                motivo=kwargs.get('motivo'),
                observaciones=kwargs.get('observaciones'),
                registrado_por=user if user.is_authenticated else None,
            )
            return CrearMovimientoAnimal(movimiento=movimiento, success=True, message="Movimiento registrado")
        except Exception as e:
            return CrearMovimientoAnimal(movimiento=None, success=False, message=str(e))


class ActualizarMovimientoAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_movimiento = graphene.Date()
        parcela_origen_id = graphene.ID()
        parcela_destino_id = graphene.ID()
        motivo = graphene.String()
        observaciones = graphene.String()

    movimiento = graphene.Field(MovimientoAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            movimiento = MovimientoAnimal.objects.get(id=id)
            if kwargs.get('fecha_movimiento'):
                movimiento.fecha_movimiento = kwargs['fecha_movimiento']
            if 'parcela_origen_id' in kwargs:
                movimiento.parcela_origen_id = kwargs['parcela_origen_id']
            if 'parcela_destino_id' in kwargs:
                movimiento.parcela_destino_id = kwargs['parcela_destino_id']
            if 'motivo' in kwargs:
                movimiento.motivo = kwargs['motivo']
            if 'observaciones' in kwargs:
                movimiento.observaciones = kwargs['observaciones']
            movimiento.save()
            return ActualizarMovimientoAnimal(movimiento=movimiento, success=True, message="Movimiento actualizado")
        except Exception as e:
            return ActualizarMovimientoAnimal(movimiento=None, success=False, message=str(e))


class EliminarMovimientoAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            MovimientoAnimal.objects.get(id=id).delete()
            return EliminarMovimientoAnimal(success=True, message="Movimiento eliminado")
        except Exception as e:
            return EliminarMovimientoAnimal(success=False, message=str(e))


class SacarAnimalDeParcela(graphene.Mutation):
    class Arguments:
        movimiento_id = graphene.ID(required=True)
        fecha_salida = graphene.Date(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, movimiento_id, fecha_salida):
        try:
            movimiento = AnimalParcela.objects.get(id=movimiento_id)
            movimiento.fecha_salida = fecha_salida
            movimiento.save()
            return SacarAnimalDeParcela(success=True, message="Animal retirado de la parcela")
        except Exception as e:
            return SacarAnimalDeParcela(success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    crear_raza = CrearRaza.Field()
    actualizar_raza = ActualizarRaza.Field()
    eliminar_raza = EliminarRaza.Field()

    crear_categoria_animal = CrearCategoriaAnimal.Field()
    actualizar_categoria_animal = ActualizarCategoriaAnimal.Field()
    eliminar_categoria_animal = EliminarCategoriaAnimal.Field()

    crear_animal = CrearAnimal.Field()
    actualizar_animal = ActualizarAnimal.Field()
    eliminar_animal = EliminarAnimal.Field()

    crear_parcela = CrearParcela.Field()
    actualizar_parcela = ActualizarParcela.Field()
    eliminar_parcela = EliminarParcela.Field()

    mover_animal_a_parcela = MoverAnimalAParcela.Field()
    sacar_animal_de_parcela = SacarAnimalDeParcela.Field()

    crear_movimiento_animal = CrearMovimientoAnimal.Field()
    actualizar_movimiento_animal = ActualizarMovimientoAnimal.Field()
    eliminar_movimiento_animal = EliminarMovimientoAnimal.Field()
