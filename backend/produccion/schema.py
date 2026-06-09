# backend/produccion/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.db.models import Sum, Avg
from decimal import Decimal
from datetime import date

from .models import (
    RegistroPeso,
    Lactancia,
    ProduccionLeche,
    AlimentoAnimal,
    EngordeAnimal,
)


# ==========================================
# TYPES
# ==========================================

class RegistroPesoType(DjangoObjectType):
    class Meta:
        model = RegistroPeso
        fields = "__all__"


class LactanciaType(DjangoObjectType):
    class Meta:
        model = Lactancia
        fields = "__all__"


class ProduccionLecheType(DjangoObjectType):
    class Meta:
        model = ProduccionLeche
        fields = "__all__"


class AlimentoAnimalType(DjangoObjectType):
    class Meta:
        model = AlimentoAnimal
        fields = "__all__"


class EngordeAnimalType(DjangoObjectType):
    # Datos derivados expuestos al frontend (propiedades del modelo)
    peso_actual = graphene.Decimal()
    dias_en_engorde = graphene.Int()
    ganancia_diaria = graphene.Decimal()
    peso_faltante = graphene.Decimal()
    ultimo_pesaje_fecha = graphene.Date()

    class Meta:
        model = EngordeAnimal
        fields = "__all__"

    def resolve_peso_actual(self, info):
        return self.peso_actual

    def resolve_dias_en_engorde(self, info):
        return self.dias_en_engorde

    def resolve_ganancia_diaria(self, info):
        return self.ganancia_diaria

    def resolve_peso_faltante(self, info):
        return self.peso_faltante

    def resolve_ultimo_pesaje_fecha(self, info):
        return self.ultimo_pesaje_fecha


class ResumenProduccionType(graphene.ObjectType):
    """Resumen consolidado del módulo de Producción.

    Fuente única de los indicadores productivos: lo consume la pestaña
    "Resumen Productivo" del módulo y puede reutilizarse en el Dashboard
    principal sin duplicar los cálculos.
    """
    produccion_leche_hoy = graphene.Decimal()
    promedio_litros_vaca = graphene.Decimal()
    lactancias_activas = graphene.Int()
    animales_engorde = graphene.Int()
    ganancia_diaria_promedio = graphene.Decimal()
    animales_sin_pesaje = graphene.Int()
    animales_listos_venta = graphene.Int()


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    registros_peso = graphene.List(RegistroPesoType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    lactancias = graphene.List(LactanciaType, finca_id=graphene.ID(required=True))
    lactancias_activas = graphene.List(LactanciaType, finca_id=graphene.ID(required=True))
    producciones_leche = graphene.List(ProduccionLecheType, finca_id=graphene.ID(required=True))
    producciones_hoy = graphene.List(ProduccionLecheType, finca_id=graphene.ID(required=True))
    alimentaciones_animales = graphene.List(AlimentoAnimalType, finca_id=graphene.ID(required=True))
    
    produccion_leche_por_animal = graphene.List(
        ProduccionLecheType,
        animal_id=graphene.ID(required=True)
    )
    
    produccion_leche_por_anio = graphene.List(
        ProduccionLecheType,
        anio=graphene.Int(required=True),
        finca_id=graphene.ID(),
    )
    
    produccion_total_hoy = graphene.Decimal(finca_id=graphene.ID(required=True))
    top_5_vacas_produccion = graphene.List(ProduccionLecheType, finca_id=graphene.ID(required=True))

    # Resumen consolidado del módulo (KPIs de la pestaña "Resumen Productivo")
    resumen_produccion = graphene.Field(
        ResumenProduccionType,
        finca_id=graphene.ID(required=True),
        peso_venta=graphene.Decimal(default_value=Decimal('450')),
    )

    # Engorde / producción de carne
    engordes = graphene.List(EngordeAnimalType, finca_id=graphene.ID(required=True))
    engordes_activos = graphene.List(EngordeAnimalType, finca_id=graphene.ID(required=True))

    def resolve_engordes(self, info, finca_id):
        return EngordeAnimal.objects.filter(
            finca_id=finca_id
        ).select_related('animal', 'animal__raza', 'animal__categoria')

    def resolve_engordes_activos(self, info, finca_id):
        return EngordeAnimal.objects.filter(
            finca_id=finca_id, estado__in=EngordeAnimal.ESTADOS_ACTIVOS
        ).select_related('animal', 'animal__raza', 'animal__categoria')

    def resolve_registros_peso(self, info, finca_id, animal_id=None):
        queryset = RegistroPeso.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_lactancias(self, info, finca_id):
        return Lactancia.objects.filter(finca_id=finca_id)

    def resolve_lactancias_activas(self, info, finca_id):
        return Lactancia.objects.filter(finca_id=finca_id, estado='ACTIVA')

    def resolve_producciones_leche(self, info, finca_id):
        return ProduccionLeche.objects.filter(finca_id=finca_id)

    def resolve_producciones_hoy(self, info, finca_id):
        return ProduccionLeche.objects.filter(finca_id=finca_id, fecha=date.today())

    def resolve_alimentaciones_animales(self, info, finca_id):
        return AlimentoAnimal.objects.filter(finca_id=finca_id)

    @login_required
    def resolve_produccion_leche_por_animal(self, info, animal_id):
        from accounts.permissions import ids_fincas_visibles
        return ProduccionLeche.objects.filter(
            vaca_id=animal_id, finca_id__in=ids_fincas_visibles(info.context.user)
        )

    @login_required
    def resolve_produccion_leche_por_anio(self, info, anio, finca_id=None):
        from accounts.permissions import scope_ids
        return ProduccionLeche.objects.filter(
            fecha__year=anio, finca_id__in=scope_ids(info.context.user, finca_id)
        )
    
    def resolve_produccion_total_hoy(self, info, finca_id):
        total = ProduccionLeche.objects.filter(
            finca_id=finca_id, 
            fecha=date.today()
        ).aggregate(total=Sum('litros'))['total']
        return total or Decimal('0')
    
    def resolve_top_5_vacas_produccion(self, info, finca_id):
        from django.db.models import Sum
        resultados = []
        vacas = ProduccionLeche.objects.filter(
            finca_id=finca_id, 
            fecha=date.today()
        ).values('vaca_id').annotate(total=Sum('litros')).order_by('-total')[:5]
        
        for item in vacas:
            producciones = ProduccionLeche.objects.filter(
                finca_id=finca_id,
                fecha=date.today(),
                vaca_id=item['vaca_id']
            )
            for prod in producciones:
                resultados.append(prod)
        return resultados

    def resolve_resumen_produccion(self, info, finca_id, peso_venta=Decimal('450')):
        """Calcula en un solo lugar los indicadores del módulo de Producción.

        - Leche: producción total de hoy y promedio diario por vaca en lactancia.
        - Carne / engorde: animales en engorde, ganancia diaria media y listos
          para venta (peso actual >= umbral, configurable vía `peso_venta`).
        - Pesaje: animales activos sin ningún registro de peso.

        El campo `tipo_produccion` del animal decide qué cuenta como engorde:
        CARNE y DOBLE_PROPOSITO participan en carne/engorde y pesajes.
        """
        from animales.models import Animal

        hoy = date.today()

        # --- Leche ---
        leche_hoy = ProduccionLeche.objects.filter(
            finca_id=finca_id, fecha=hoy
        ).aggregate(total=Sum('litros'))['total'] or Decimal('0')

        activas = Lactancia.objects.filter(finca_id=finca_id, estado='ACTIVA')
        promedio_litros_vaca = activas.aggregate(p=Avg('promedio_diario'))['p'] or Decimal('0')

        # --- Carne / engorde (a partir del control de engorde activo) ---
        animales_activos = Animal.objects.filter(finca_id=finca_id, estado='ACTIVO')
        engordes_activos = EngordeAnimal.objects.filter(
            finca_id=finca_id, estado__in=EngordeAnimal.ESTADOS_ACTIVOS
        ).select_related('animal')

        animales_engorde = engordes_activos.count()
        animales_listos_venta = engordes_activos.filter(estado='LISTO_VENTA').count()

        # Ganancia diaria promedio: media de la ganancia derivada de cada engorde
        # activo (propiedad calculada a partir del último pesaje).
        ganancias = [e.ganancia_diaria for e in engordes_activos]
        ganancia_diaria_promedio = (
            sum(ganancias) / len(ganancias) if ganancias else Decimal('0')
        )

        # --- Pesaje: animales activos sin ningún registro de peso ---
        animales_sin_pesaje = animales_activos.filter(
            registros_peso__isnull=True
        ).count()

        return ResumenProduccionType(
            produccion_leche_hoy=leche_hoy,
            promedio_litros_vaca=promedio_litros_vaca,
            lactancias_activas=activas.count(),
            animales_engorde=animales_engorde,
            ganancia_diaria_promedio=ganancia_diaria_promedio,
            animales_sin_pesaje=animales_sin_pesaje,
            animales_listos_venta=animales_listos_venta,
        )


# ==========================================
# MUTATIONS - REGISTRO PESO
# ==========================================

class CrearRegistroPeso(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        peso_kg = graphene.Decimal(required=True)
        fecha_pesaje = graphene.Date(required=True)
        condicion_corporal = graphene.Decimal()
        observacion = graphene.String()

    registro = graphene.Field(RegistroPesoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, peso_kg, fecha_pesaje, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            # --- Validaciones básicas (Fase 1) ---
            if peso_kg is None or peso_kg < 0:
                return CrearRegistroPeso(
                    registro=None, success=False,
                    message="El peso no puede ser negativo"
                )

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

            estados_no_validos = ("VENDIDO", "MUERTO", "BAJA", "MATADERO", "DESCARTE")
            if animal.estado in estados_no_validos:
                return CrearRegistroPeso(
                    registro=None, success=False,
                    message=f"No se puede registrar peso a un animal en estado {animal.get_estado_display()}"
                )

            registro = RegistroPeso.objects.create(
                finca=finca,
                animal=animal,
                fecha_pesaje=fecha_pesaje,
                peso_kg=peso_kg,
                condicion_corporal=kwargs.get('condicion_corporal', 0),
                observacion=kwargs.get('observacion', ''),
                registrado_por=info.context.user
            )

            return CrearRegistroPeso(
                registro=registro, 
                success=True, 
                message=f"Peso registrado para {animal.nro_arete}"
            )
        except Exception as e:
            return CrearRegistroPeso(registro=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - LACTANCIA
# ==========================================

class CrearLactancia(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        vaca_id = graphene.ID(required=True)
        numero_lactancia = graphene.Int()
        fecha_inicio = graphene.Date(required=True)
        reproduccion_id = graphene.ID()
        observaciones = graphene.String()

    lactancia = graphene.Field(LactanciaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, vaca_id, fecha_inicio, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            vaca = Animal.objects.get(id=vaca_id)

            lactancia = Lactancia.objects.create(
                finca=finca,
                vaca=vaca,
                numero_lactancia=kwargs.get('numero_lactancia', 1),
                fecha_inicio=fecha_inicio,
                reproduccion_id=kwargs.get('reproduccion_id'),
                observaciones=kwargs.get('observaciones', '')
            )

            return CrearLactancia(
                lactancia=lactancia, 
                success=True, 
                message=f"Lactancia iniciada para {vaca.nro_arete}"
            )
        except Exception as e:
            return CrearLactancia(lactancia=None, success=False, message=str(e))


class SecarLactancia(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_secado = graphene.Date(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, fecha_secado):
        try:
            lactancia = Lactancia.objects.get(id=id)
            lactancia.fecha_secado = fecha_secado
            lactancia.estado = 'SECADA'
            lactancia.save()
            return SecarLactancia(success=True, message="Lactancia finalizada")
        except Exception as e:
            return SecarLactancia(success=False, message=str(e))


# ==========================================
# MUTATIONS - PRODUCCION LECHE
# ==========================================

class CrearProduccionLeche(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        vaca_id = graphene.ID(required=True)
        turno = graphene.String(required=True)
        litros = graphene.Decimal(required=True)
        observaciones = graphene.String()

    produccion = graphene.Field(ProduccionLecheType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, vaca_id, turno, litros, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            vaca = Animal.objects.get(id=vaca_id)
            
            # Buscar lactancia activa
            lactancia = Lactancia.objects.filter(
                finca_id=finca_id, 
                vaca_id=vaca_id, 
                estado='ACTIVA'
            ).first()
            
            if not lactancia:
                return CrearProduccionLeche(
                    produccion=None, 
                    success=False, 
                    message="La vaca no tiene una lactancia activa"
                )

            produccion = ProduccionLeche.objects.create(
                finca=finca,
                vaca=vaca,
                lactancia=lactancia,
                fecha=date.today(),
                turno=turno,
                litros=litros,
                observaciones=kwargs.get('observaciones', ''),
                registrado_por=info.context.user
            )

            return CrearProduccionLeche(
                produccion=produccion, 
                success=True, 
                message=f"Producción registrada: {litros} L"
            )
        except Exception as e:
            return CrearProduccionLeche(produccion=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - ENGORDE / CARNE
# ==========================================

class IniciarEngorde(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha_inicio = graphene.Date(required=True)
        peso_inicial = graphene.Decimal(required=True)
        peso_objetivo = graphene.Decimal(required=True)
        tipo_engorde = graphene.String()
        lote_grupo = graphene.String()
        observaciones = graphene.String()

    engorde = graphene.Field(EngordeAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha_inicio,
               peso_inicial, peso_objetivo, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            animal = Animal.objects.get(id=animal_id)

            # --- Validaciones ---
            if animal.estado != "ACTIVO":
                return IniciarEngorde(
                    engorde=None, success=False,
                    message=f"No se puede iniciar engorde de un animal en estado {animal.get_estado_display()}"
                )

            if animal.tipo_produccion not in ("CARNE", "DOBLE_PROPOSITO"):
                return IniciarEngorde(
                    engorde=None, success=False,
                    message="Solo los animales de tipo Carne o Doble propósito pueden entrar en engorde"
                )

            if peso_inicial is None or peso_inicial < 0:
                return IniciarEngorde(
                    engorde=None, success=False,
                    message="El peso inicial no puede ser negativo"
                )

            if peso_objetivo is None or peso_objetivo < peso_inicial:
                return IniciarEngorde(
                    engorde=None, success=False,
                    message="El peso objetivo no puede ser menor al peso inicial"
                )

            existe_activo = EngordeAnimal.objects.filter(
                animal=animal, estado__in=EngordeAnimal.ESTADOS_ACTIVOS
            ).exists()
            if existe_activo:
                return IniciarEngorde(
                    engorde=None, success=False,
                    message="El animal ya tiene un engorde activo"
                )

            finca = Finca.objects.get(id=finca_id)

            engorde = EngordeAnimal.objects.create(
                finca=finca,
                animal=animal,
                fecha_inicio=fecha_inicio,
                peso_inicial=peso_inicial,
                peso_objetivo=peso_objetivo,
                tipo_engorde=kwargs.get('tipo_engorde') or 'SEMI_INTENSIVO',
                lote_grupo=kwargs.get('lote_grupo', ''),
                observaciones=kwargs.get('observaciones', ''),
                registrado_por=info.context.user,
            )
            # Si el peso actual ya supera el objetivo, marcar listo de inmediato
            engorde.actualizar_estado()

            return IniciarEngorde(
                engorde=engorde, success=True,
                message=f"Engorde iniciado para {animal.nro_arete}"
            )
        except Exception as e:
            return IniciarEngorde(engorde=None, success=False, message=str(e))


class CambiarEstadoEngorde(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        estado = graphene.String(required=True)

    engorde = graphene.Field(EngordeAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, estado):
        try:
            estados_validos = dict(EngordeAnimal.ESTADO_CHOICES)
            if estado not in estados_validos:
                return CambiarEstadoEngorde(
                    engorde=None, success=False,
                    message="Estado de engorde no válido"
                )

            engorde = EngordeAnimal.objects.get(id=id)
            engorde.estado = estado
            engorde.save(update_fields=["estado"])

            return CambiarEstadoEngorde(
                engorde=engorde, success=True,
                message=f"Engorde actualizado a {estados_validos[estado]}"
            )
        except Exception as e:
            return CambiarEstadoEngorde(engorde=None, success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    crear_registro_peso = CrearRegistroPeso.Field()
    crear_lactancia = CrearLactancia.Field()
    secar_lactancia = SecarLactancia.Field()
    crear_produccion_leche = CrearProduccionLeche.Field()
    iniciar_engorde = IniciarEngorde.Field()
    cambiar_estado_engorde = CambiarEstadoEngorde.Field()