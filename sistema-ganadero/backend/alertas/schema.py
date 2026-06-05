# backend/alertas/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.db.models import Sum
from decimal import Decimal

from .models import Gasto, Alerta


# ==========================================
# TYPES
# ==========================================

class GastoType(DjangoObjectType):
    tipoGasto = graphene.String()
    
    class Meta:
        model = Gasto
        fields = "__all__"
    
    def resolve_tipoGasto(self, info):
        return self.tipo_gasto


class AlertaType(DjangoObjectType):
    fechaAlerta = graphene.String()
    
    class Meta:
        model = Alerta
        fields = "__all__"
    
    def resolve_fechaAlerta(self, info):
        return self.fecha_alerta.isoformat() if self.fecha_alerta else None


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    gastos = graphene.List(GastoType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    alertas = graphene.List(AlertaType, finca_id=graphene.ID(required=True))
    alertas_pendientes = graphene.List(AlertaType, finca_id=graphene.ID(required=True))
    total_gastos = graphene.Float(finca_id=graphene.ID(required=True), anio=graphene.Int())

    def resolve_gastos(self, info, finca_id, animal_id=None):
        queryset = Gasto.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_alertas(self, info, finca_id):
        return Alerta.objects.filter(finca_id=finca_id)

    def resolve_alertas_pendientes(self, info, finca_id):
        return Alerta.objects.filter(finca_id=finca_id, leida=False)

    def resolve_total_gastos(self, info, finca_id, anio=None):
        queryset = Gasto.objects.filter(finca_id=finca_id)
        if anio:
            queryset = queryset.filter(fecha__year=anio)
        total = queryset.aggregate(total=Sum('total'))['total']
        return float(total) if total else 0.0


# ==========================================
# MUTATIONS - GASTOS
# ==========================================

class CrearGasto(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID()
        fecha = graphene.Date(required=True)
        tipo_gasto = graphene.String(required=True)
        descripcion = graphene.String(required=True)
        cantidad = graphene.Float()
        precio_unitario = graphene.Float()

    gasto = graphene.Field(GastoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, fecha, tipo_gasto, descripcion, cantidad, precio_unitario, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = None
            animal_id = kwargs.get('animal_id')
            if animal_id:
                animal = Animal.objects.filter(id=animal_id).first()

            # Convertir float a Decimal para la base de datos
            cantidad_decimal = Decimal(str(cantidad))
            precio_decimal = Decimal(str(precio_unitario))

            gasto = Gasto.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                tipo_gasto=tipo_gasto,
                descripcion=descripcion,
                cantidad=cantidad_decimal,
                precio_unitario=precio_decimal,
                registrado_por=info.context.user
            )

            return CrearGasto(gasto=gasto, success=True, message="Gasto registrado exitosamente")
        except Exception as e:
            return CrearGasto(gasto=None, success=False, message=str(e))


class ActualizarGasto(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha = graphene.Date()
        tipo_gasto = graphene.String()
        descripcion = graphene.String()
        cantidad = graphene.Float()
        precio_unitario = graphene.Float()
        animal_id = graphene.ID()

    gasto = graphene.Field(GastoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            from animales.models import Animal

            gasto = Gasto.objects.get(id=id)

            if kwargs.get('fecha'):
                gasto.fecha = kwargs['fecha']
            if kwargs.get('tipo_gasto'):
                gasto.tipo_gasto = kwargs['tipo_gasto']
            if kwargs.get('descripcion'):
                gasto.descripcion = kwargs['descripcion']
            if kwargs.get('cantidad'):
                gasto.cantidad = Decimal(str(kwargs['cantidad']))
            if kwargs.get('precio_unitario'):
                gasto.precio_unitario = Decimal(str(kwargs['precio_unitario']))
            if kwargs.get('animal_id'):
                gasto.animal = Animal.objects.filter(id=kwargs['animal_id']).first()

            gasto.save()

            return ActualizarGasto(gasto=gasto, success=True, message="Gasto actualizado exitosamente")
        except Exception as e:
            return ActualizarGasto(gasto=None, success=False, message=str(e))


class EliminarGasto(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            gasto = Gasto.objects.get(id=id)
            gasto.delete()
            return EliminarGasto(success=True, message="Gasto eliminado")
        except Exception as e:
            return EliminarGasto(success=False, message=str(e))


# ==========================================
# MUTATIONS - ALERTAS
# ==========================================

class MarcarAlertaLeida(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            alerta = Alerta.objects.get(id=id)
            alerta.marcar_leida()
            return MarcarAlertaLeida(success=True, message="Alerta marcada como leída")
        except Exception as e:
            return MarcarAlertaLeida(success=False, message=str(e))


class EliminarAlerta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            alerta = Alerta.objects.get(id=id)
            alerta.delete()
            return EliminarAlerta(success=True, message="Alerta eliminada")
        except Exception as e:
            return EliminarAlerta(success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    crear_gasto = CrearGasto.Field()
    actualizar_gasto = ActualizarGasto.Field()
    eliminar_gasto = EliminarGasto.Field()
    marcar_alerta_leida = MarcarAlertaLeida.Field()
    eliminar_alerta = EliminarAlerta.Field()