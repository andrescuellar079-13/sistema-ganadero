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
        anio=graphene.Int(required=True)
    )
    
    produccion_total_hoy = graphene.Decimal(finca_id=graphene.ID(required=True))
    top_5_vacas_produccion = graphene.List(ProduccionLecheType, finca_id=graphene.ID(required=True))

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

    def resolve_produccion_leche_por_animal(self, info, animal_id):
        return ProduccionLeche.objects.filter(vaca_id=animal_id)

    def resolve_produccion_leche_por_anio(self, info, anio):
        return ProduccionLeche.objects.filter(fecha__year=anio)
    
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

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

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
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    crear_registro_peso = CrearRegistroPeso.Field()
    crear_lactancia = CrearLactancia.Field()
    secar_lactancia = SecarLactancia.Field()
    crear_produccion_leche = CrearProduccionLeche.Field()