# backend/alertas/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.db.models import Sum, Q
from decimal import Decimal

from .models import Gasto, Alerta
from .services import generar_alertas_automaticas


# ==========================================
# TYPES
# ==========================================

class GastoType(DjangoObjectType):
    tipoGasto = graphene.String()
    centroCosto = graphene.String()
    metodoPago = graphene.String()

    class Meta:
        model = Gasto
        fields = "__all__"

    def resolve_tipoGasto(self, info):
        return self.tipo_gasto

    def resolve_centroCosto(self, info):
        return self.centro_costo

    def resolve_metodoPago(self, info):
        return self.metodo_pago


class AlertaType(DjangoObjectType):
    fechaAlerta = graphene.String()
    fechaVencimiento = graphene.String()
    fechaResolucion = graphene.String()
    moduloOrigen = graphene.String()
    accionRecomendada = graphene.String()
    vencida = graphene.Boolean()

    class Meta:
        model = Alerta
        fields = "__all__"

    def resolve_fechaAlerta(self, info):
        return self.fecha_alerta.isoformat() if self.fecha_alerta else None

    def resolve_fechaVencimiento(self, info):
        return self.fecha_vencimiento.isoformat() if self.fecha_vencimiento else None

    def resolve_fechaResolucion(self, info):
        return self.fecha_resolucion.isoformat() if self.fecha_resolucion else None

    def resolve_moduloOrigen(self, info):
        return self.modulo_origen

    def resolve_accionRecomendada(self, info):
        return self.accion_recomendada

    def resolve_vencida(self, info):
        return self.vencida


class ResumenAlertasType(graphene.ObjectType):
    pendientes = graphene.Int()
    criticas = graphene.Int()
    vencidas = graphene.Int()
    resueltas = graphene.Int()


class GeneracionAlertasType(graphene.ObjectType):
    success = graphene.Boolean()
    total = graphene.Int()
    vacunas_proximas = graphene.Int()
    vacunas_vencidas = graphene.Int()
    partos_proximos = graphene.Int()
    stock_bajo_medicamento = graphene.Int()
    stock_bajo_alimento = graphene.Int()
    pesajes_pendientes = graphene.Int()
    transferencias_pendientes = graphene.Int()


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    gastos = graphene.List(GastoType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    alertas = graphene.List(
        AlertaType,
        finca_id=graphene.ID(required=True),
        estado=graphene.String(),
        prioridad=graphene.String(),
        modulo_origen=graphene.String(),
        tipo=graphene.String(),
    )
    alertas_pendientes = graphene.List(AlertaType, finca_id=graphene.ID(required=True))
    resumen_alertas = graphene.Field(ResumenAlertasType, finca_id=graphene.ID(required=True))
    total_gastos = graphene.Float(finca_id=graphene.ID(required=True), anio=graphene.Int())

    def resolve_gastos(self, info, finca_id, animal_id=None):
        queryset = Gasto.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_alertas(self, info, finca_id, estado=None, prioridad=None,
                        modulo_origen=None, tipo=None):
        queryset = Alerta.objects.filter(finca_id=finca_id)
        if estado:
            queryset = queryset.filter(estado=estado)
        if prioridad:
            queryset = queryset.filter(prioridad=prioridad)
        if modulo_origen:
            queryset = queryset.filter(modulo_origen=modulo_origen)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        return queryset

    def resolve_alertas_pendientes(self, info, finca_id):
        return Alerta.objects.filter(finca_id=finca_id, leida=False)

    def resolve_resumen_alertas(self, info, finca_id):
        from django.utils import timezone
        hoy = timezone.now().date()
        base = Alerta.objects.filter(finca_id=finca_id)
        return ResumenAlertasType(
            pendientes=base.filter(estado="PENDIENTE").count(),
            criticas=base.filter(prioridad="CRITICA").exclude(
                estado__in=["RESUELTA", "DESCARTADA"]
            ).count(),
            vencidas=base.filter(
                fecha_vencimiento__lt=hoy
            ).exclude(estado__in=["RESUELTA", "DESCARTADA"]).count(),
            resueltas=base.filter(estado="RESUELTA").count(),
        )

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
        centro_costo = graphene.String()
        metodo_pago = graphene.String()
        parcela_id = graphene.ID()
        proveedor = graphene.String()
        comprobante = graphene.String()
        observaciones = graphene.String()

    gasto = graphene.Field(GastoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, fecha, tipo_gasto, descripcion, cantidad, precio_unitario, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal, Parcela

            finca = Finca.objects.get(id=finca_id)
            animal = None
            animal_id = kwargs.get('animal_id')
            if animal_id:
                animal = Animal.objects.filter(id=animal_id).first()

            parcela = None
            parcela_id = kwargs.get('parcela_id')
            if parcela_id:
                parcela = Parcela.objects.filter(id=parcela_id).first()

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
                centro_costo=kwargs.get('centro_costo'),
                metodo_pago=kwargs.get('metodo_pago'),
                parcela=parcela,
                proveedor=kwargs.get('proveedor'),
                comprobante=kwargs.get('comprobante'),
                observaciones=kwargs.get('observaciones'),
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
        centro_costo = graphene.String()
        metodo_pago = graphene.String()
        parcela_id = graphene.ID()
        proveedor = graphene.String()
        comprobante = graphene.String()
        observaciones = graphene.String()

    gasto = graphene.Field(GastoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            from animales.models import Animal, Parcela

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
            if 'centro_costo' in kwargs:
                gasto.centro_costo = kwargs['centro_costo']
            if 'metodo_pago' in kwargs:
                gasto.metodo_pago = kwargs['metodo_pago']
            if kwargs.get('parcela_id'):
                gasto.parcela = Parcela.objects.filter(id=kwargs['parcela_id']).first()
            if 'proveedor' in kwargs:
                gasto.proveedor = kwargs['proveedor']
            if 'comprobante' in kwargs:
                gasto.comprobante = kwargs['comprobante']
            if 'observaciones' in kwargs:
                gasto.observaciones = kwargs['observaciones']

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

class CrearAlerta(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        tipo = graphene.String(required=True)
        mensaje = graphene.String(required=True)
        fecha_alerta = graphene.Date(required=True)
        dias_restantes = graphene.Int()
        animal_id = graphene.ID()
        prioridad = graphene.String()
        modulo_origen = graphene.String()
        accion_recomendada = graphene.String()

    alerta = graphene.Field(AlertaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, tipo, mensaje, fecha_alerta, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = None
            animal_id = kwargs.get('animal_id')
            if animal_id:
                animal = Animal.objects.filter(id=animal_id).first()

            alerta = Alerta.objects.create(
                finca=finca,
                animal=animal,
                tipo=tipo,
                mensaje=mensaje,
                fecha_alerta=fecha_alerta,
                dias_restantes=kwargs.get('dias_restantes') or 0,
                prioridad=kwargs.get('prioridad') or "MEDIA",
                modulo_origen=kwargs.get('modulo_origen') or "SISTEMA",
                accion_recomendada=kwargs.get('accion_recomendada'),
            )
            return CrearAlerta(alerta=alerta, success=True, message="Alerta creada")
        except Exception as e:
            return CrearAlerta(alerta=None, success=False, message=str(e))


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


class MarcarAlertaEnProceso(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            alerta = Alerta.objects.get(id=id)
            alerta.marcar_en_proceso()
            return MarcarAlertaEnProceso(success=True, message="Alerta marcada en proceso")
        except Exception as e:
            return MarcarAlertaEnProceso(success=False, message=str(e))


class ResolverAlerta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        observacion = graphene.String()

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, observacion=None):
        try:
            alerta = Alerta.objects.get(id=id)
            alerta.resolver(usuario=info.context.user, observacion=observacion)
            return ResolverAlerta(success=True, message="Alerta resuelta")
        except Exception as e:
            return ResolverAlerta(success=False, message=str(e))


class DescartarAlerta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        observacion = graphene.String()

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, observacion=None):
        try:
            alerta = Alerta.objects.get(id=id)
            alerta.descartar(usuario=info.context.user, observacion=observacion)
            return DescartarAlerta(success=True, message="Alerta descartada")
        except Exception as e:
            return DescartarAlerta(success=False, message=str(e))


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


class GenerarAlertasAutomaticas(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)

    Output = GeneracionAlertasType

    @login_required
    def mutate(self, info, finca_id):
        try:
            c = generar_alertas_automaticas(finca_id)
            return GeneracionAlertasType(
                success=True,
                total=c.get("total", 0),
                vacunas_proximas=c.get("vacunas_proximas", 0),
                vacunas_vencidas=c.get("vacunas_vencidas", 0),
                partos_proximos=c.get("partos_proximos", 0),
                stock_bajo_medicamento=c.get("stock_bajo_medicamento", 0),
                stock_bajo_alimento=c.get("stock_bajo_alimento", 0),
                pesajes_pendientes=c.get("pesajes_pendientes", 0),
                transferencias_pendientes=c.get("transferencias_pendientes", 0),
            )
        except Exception:
            return GeneracionAlertasType(success=False, total=0)


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    crear_gasto = CrearGasto.Field()
    actualizar_gasto = ActualizarGasto.Field()
    eliminar_gasto = EliminarGasto.Field()
    crear_alerta = CrearAlerta.Field()
    marcar_alerta_leida = MarcarAlertaLeida.Field()
    marcar_alerta_en_proceso = MarcarAlertaEnProceso.Field()
    resolver_alerta = ResolverAlerta.Field()
    descartar_alerta = DescartarAlerta.Field()
    eliminar_alerta = EliminarAlerta.Field()
    generar_alertas_automaticas = GenerarAlertasAutomaticas.Field()
