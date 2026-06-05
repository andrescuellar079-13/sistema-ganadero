# backend/animales/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from datetime import date

from .models import Raza, CategoriaAnimal, Animal, Parcela, AnimalParcela

# Importaciones diferidas de tipos de otras apps (se hacen lazy dentro de lambdas
# para evitar problemas de orden de registro en el arranque de graphene).
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


class AnimalesPaginadosType(graphene.ObjectType):
    animales = graphene.List(lambda: AnimalType)
    total = graphene.Int()
    paginas = graphene.Int()
    pagina_actual = graphene.Int()
    tiene_siguiente = graphene.Boolean()
    tiene_anterior = graphene.Boolean()


# ==========================================
# TYPES EXISTENTES
# ==========================================

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

    # Producción
    registros_peso = graphene.List(lambda: _get_registro_peso_type())
    lactancias = graphene.List(lambda: _get_lactancia_type())
    producciones_leche = graphene.List(lambda: _get_produccion_leche_type())

    # Reproducción
    inseminaciones = graphene.List(lambda: _get_inseminacion_type())
    diagnosticos_prenez = graphene.List(lambda: _get_diagnostico_prenez_type())
    partos = graphene.List(lambda: _get_reproduccion_type())

    # Sanidad
    vacunaciones = graphene.List(lambda: _get_vacunacion_type())
    tratamientos = graphene.List(lambda: _get_tratamiento_type())

    # Movimientos
    movimientos_parcela = graphene.List(lambda: AnimalParcelaType)

    # Comercio
    ventas = graphene.List(lambda: _get_detalle_venta_type())
    bajas = graphene.List(lambda: _get_muerte_baja_type())

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


# ==========================================
# NUEVOS TYPES - PARCELAS
# ==========================================

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


class ParcelasPaginadasType(graphene.ObjectType):
    results = graphene.List(ParcelaType)
    count = graphene.Int()
    page = graphene.Int()
    page_size = graphene.Int()
    total_pages = graphene.Int()
    has_next = graphene.Boolean()
    has_previous = graphene.Boolean()


# ==========================================
# QUERY ACTUALIZADO
# ==========================================

class Query(graphene.ObjectType):
    # Queries existentes
    razas = graphene.List(RazaType)
    categorias_animales = graphene.List(CategoriaAnimalType)
    all_animales = graphene.List(AnimalType)
    animal_by_id = graphene.Field(AnimalType, id=graphene.ID(required=True))
    animal_by_arete = graphene.Field(AnimalType, nro_arete=graphene.String(required=True))
    animales_activos = graphene.List(AnimalType, finca_id=graphene.ID(required=True))

    # Queries de genealogía
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

    # Query paginada con búsqueda y filtros
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
    )

    # Nuevas queries para parcelas
    parcelas = graphene.List(ParcelaType, finca_id=graphene.ID(required=True))
    parcela = graphene.Field(ParcelaType, id=graphene.ID(required=True))
    animales_en_parcela = graphene.List(AnimalParcelaType, parcela_id=graphene.ID(required=True))
    animales_actuales_parcela = graphene.List(AnimalParcelaType, parcela_id=graphene.ID(required=True))

    # Query paginada para parcelas con búsqueda, filtros y ordenamiento
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

    # Parcelas disponibles para mover un animal (LIBRE u OCUPADO con capacidad, excluyendo la actual)
    parcelas_disponibles_para_movimiento = graphene.List(
        ParcelaType,
        finca_id=graphene.ID(required=True),
        animal_id=graphene.ID(required=True),
    )

    def resolve_razas(self, info):
        return Raza.objects.all()

    def resolve_categorias_animales(self, info):
        return CategoriaAnimal.objects.all()

    def resolve_all_animales(self, info):
        return Animal.objects.all()

    def resolve_animal_by_id(self, info, id):
        return Animal.objects.get(id=id)

    def resolve_animal_by_arete(self, info, nro_arete):
        return Animal.objects.get(nro_arete=nro_arete)

    def resolve_animales_activos(self, info, finca_id):
        return Animal.objects.filter(finca_id=finca_id, estado='ACTIVO')

    def resolve_animal_detalle(self, info, id):
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
        ).get(id=id)

    def resolve_animales_machos_para_padre(self, info, finca_id, excluir_id=None):
        qs = Animal.objects.filter(finca_id=finca_id, sexo='MACHO').select_related('raza', 'categoria')
        if excluir_id:
            qs = qs.exclude(id=excluir_id)
        return qs.order_by('nro_arete')

    def resolve_animales_hembras_para_madre(self, info, finca_id, excluir_id=None):
        qs = Animal.objects.filter(finca_id=finca_id, sexo='HEMBRA').select_related('raza', 'categoria')
        if excluir_id:
            qs = qs.exclude(id=excluir_id)
        return qs.order_by('nro_arete')

    def resolve_animales_paginados(
        self, info,
        finca_id=None, pagina=1, por_pagina=10,
        buscar=None, estado=None, ordenar=None,
        raza_id=None, categoria_id=None,
    ):
        from django.db.models import Q, IntegerField, Value, Case, When

        qs = Animal.objects.select_related('raza', 'categoria')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)

        if buscar:
            qs = qs.filter(
                Q(nombre__icontains=buscar) |
                Q(nro_arete__icontains=buscar) |
                Q(raza__nombre__icontains=buscar) |
                Q(categoria__nombre__icontains=buscar) |
                Q(estado__icontains=buscar)
            )

        if estado and estado not in ('', 'TODOS'):
            qs = qs.filter(estado=estado)

        if raza_id:
            qs = qs.filter(raza_id=raza_id)

        if categoria_id:
            qs = qs.filter(categoria_id=categoria_id)

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
            # fecha_nacimiento más antigua = animal más viejo
            qs = qs.order_by('fecha_nacimiento', '-fecha_registro')
        elif ordenar == 'menor_edad':
            # fecha_nacimiento más reciente = animal más joven
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

        por_pagina = max(1, min(por_pagina, 100))
        total = qs.count()
        paginas = max(1, (total + por_pagina - 1) // por_pagina)
        pagina = max(1, min(pagina, paginas))
        offset = (pagina - 1) * por_pagina

        return AnimalesPaginadosType(
            animales=list(qs[offset:offset + por_pagina]),
            total=total,
            paginas=paginas,
            pagina_actual=pagina,
            tiene_siguiente=pagina < paginas,
            tiene_anterior=pagina > 1,
        )

    # Resolvers para parcelas
    def resolve_parcelas(self, info, finca_id):
        return Parcela.objects.filter(finca_id=finca_id)

    def resolve_parcela(self, info, id):
        return Parcela.objects.get(id=id)

    def resolve_animales_en_parcela(self, info, parcela_id):
        return AnimalParcela.objects.filter(parcela_id=parcela_id)

    def resolve_animales_actuales_parcela(self, info, parcela_id):
        return AnimalParcela.objects.filter(parcela_id=parcela_id, fecha_salida__isnull=True)

    def resolve_parcelas_disponibles_para_movimiento(self, info, finca_id, animal_id):
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

    def resolve_parcelas_paginadas(
        self, info, finca_id,
        search=None, estado=None, temporal=None, ordering=None,
        page=1, page_size=10,
    ):
        from django.db.models import Count, Q, OuterRef, Subquery, IntegerField, Value
        from django.db.models.functions import Coalesce
        from datetime import timedelta
        from django.utils import timezone

        hoy = timezone.now().date()

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
                Q(estado__icontains=search) |
                Q(tipo_pastura__icontains=search) |
                Q(historial_animales__animal__nombre__icontains=search,
                  historial_animales__fecha_salida__isnull=True) |
                Q(historial_animales__animal__nro_arete__icontains=search,
                  historial_animales__fecha_salida__isnull=True)
            ).distinct()

        if estado and estado not in ('', 'TODOS'):
            qs = qs.filter(estado=estado)

        if temporal == 'ULTIMOS_MOVIMIENTOS':
            qs = qs.filter(
                Q(historial_animales__fecha_ingreso__gte=hoy - timedelta(days=30)) |
                Q(historial_animales__fecha_salida__gte=hoy - timedelta(days=30))
            ).distinct()
        elif temporal == 'ANIMALES_RECIENTES':
            qs = qs.filter(
                historial_animales__fecha_ingreso__gte=hoy - timedelta(days=30),
                historial_animales__fecha_salida__isnull=True,
            ).distinct()
        elif temporal == 'MOVIMIENTOS_RECIENTES':
            qs = qs.filter(
                Q(historial_animales__fecha_ingreso__gte=hoy - timedelta(days=30)) |
                Q(historial_animales__fecha_salida__gte=hoy - timedelta(days=30))
            ).distinct()

        if ordering == 'mayor_ocupacion':
            qs = qs.order_by('-ocupacion_actual')
        elif ordering == 'menor_ocupacion':
            qs = qs.order_by('ocupacion_actual')
        elif ordering == 'mayor_capacidad':
            qs = qs.order_by('-capacidad_maxima')
        elif ordering == 'menor_capacidad':
            qs = qs.order_by('capacidad_maxima')
        elif ordering == 'mas_antiguas':
            qs = qs.order_by('id')
        else:
            qs = qs.order_by('-id')

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


# ==========================================
# MUTATIONS EXISTENTES (RAZAS, CATEGORIAS, ANIMALES)
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
            # padre/madre usan 'in kwargs' para poder limpiar con null
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


# ==========================================
# NUEVAS MUTATIONS - PARCELAS
# ==========================================

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


# ==========================================
# MUTATIONS - MOVIMIENTOS
# ==========================================

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

            # Guardar referencia a la parcela origen antes de cerrar el movimiento
            movimiento_actual = AnimalParcela.objects.filter(
                animal=animal, fecha_salida__isnull=True
            ).select_related('parcela').first()
            parcela_origen = movimiento_actual.parcela if movimiento_actual else None

            # Cerrar movimiento anterior
            AnimalParcela.objects.filter(
                animal=animal, fecha_salida__isnull=True
            ).update(fecha_salida=fecha_ingreso)

            # Crear nuevo movimiento
            movimiento = AnimalParcela.objects.create(
                animal=animal,
                parcela=parcela,
                fecha_ingreso=fecha_ingreso,
            )

            # Actualizar estado parcela destino
            parcela.estado = 'OCUPADO'
            parcela.save(update_fields=['estado'])

            # Actualizar estado parcela origen si es diferente a la destino
            if parcela_origen and parcela_origen.id != parcela.id:
                animales_restantes = AnimalParcela.objects.filter(
                    parcela=parcela_origen, fecha_salida__isnull=True
                ).count()
                if parcela_origen.estado != 'DESCANSO':
                    parcela_origen.estado = 'LIBRE' if animales_restantes == 0 else 'OCUPADO'
                    parcela_origen.save(update_fields=['estado'])

            return MoverAnimalAParcela(movimiento=movimiento, success=True, message="Animal movido exitosamente")
        except Animal.DoesNotExist:
            return MoverAnimalAParcela(movimiento=None, success=False,
                message="Animal no encontrado o no pertenece a esta finca")
        except Parcela.DoesNotExist:
            return MoverAnimalAParcela(movimiento=None, success=False,
                message="Parcela no encontrada o no pertenece a esta finca")
        except Exception as e:
            return MoverAnimalAParcela(movimiento=None, success=False, message=str(e))


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
    # Razas
    crear_raza = CrearRaza.Field()
    actualizar_raza = ActualizarRaza.Field()
    eliminar_raza = EliminarRaza.Field()

    # Categorías
    crear_categoria_animal = CrearCategoriaAnimal.Field()
    actualizar_categoria_animal = ActualizarCategoriaAnimal.Field()
    eliminar_categoria_animal = EliminarCategoriaAnimal.Field()

    # Animales
    crear_animal = CrearAnimal.Field()
    actualizar_animal = ActualizarAnimal.Field()
    eliminar_animal = EliminarAnimal.Field()

    # Parcelas
    crear_parcela = CrearParcela.Field()
    actualizar_parcela = ActualizarParcela.Field()
    eliminar_parcela = EliminarParcela.Field()

    # Movimientos
    mover_animal_a_parcela = MoverAnimalAParcela.Field()
    sacar_animal_de_parcela = SacarAnimalDeParcela.Field()
