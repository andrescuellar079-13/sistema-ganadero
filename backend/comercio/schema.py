# backend/comercio/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.db.models import Sum

from accounts.permissions import ids_fincas_visibles, ids_para_listado, validar_finca
from .models import (
    Cliente,
    NotaVenta,
    DetalleVenta,
    MuerteBaja,
    CorrallVenta,
    AnimalCorral,
)


# ==========================================
# TYPES
# ==========================================

class ClienteType(DjangoObjectType):
    id = graphene.ID()

    class Meta:
        model = Cliente
        fields = "__all__"

    def resolve_id(self, info):
        return self.id


class CorrallVentaType(DjangoObjectType):
    total_animales = graphene.Int()
    peso_total = graphene.Float()

    class Meta:
        model = CorrallVenta
        fields = "__all__"

    def resolve_total_animales(self, info):
        return self.total_animales

    def resolve_peso_total(self, info):
        return float(self.peso_total)


class AnimalCorralType(DjangoObjectType):
    class Meta:
        model = AnimalCorral
        fields = "__all__"


class NotaVentaType(DjangoObjectType):
    class Meta:
        model = NotaVenta
        fields = "__all__"


class DetalleVentaType(DjangoObjectType):
    class Meta:
        model = DetalleVenta
        fields = "__all__"


class MuerteBajaType(DjangoObjectType):
    class Meta:
        model = MuerteBaja
        fields = "__all__"


# ==========================================
# QUERY
# ==========================================

def _fincas_scope(info, finca_id):
    """IDs de fincas a aplicar: la indicada (validada) o la finca activa."""
    user = info.context.user
    if finca_id:
        validar_finca(user, finca_id)
        return [int(finca_id)]
    return ids_para_listado(user)


class Query(graphene.ObjectType):
    clientes = graphene.List(ClienteType, finca_id=graphene.ID())
    notas_venta = graphene.List(NotaVentaType, finca_id=graphene.ID())
    detalles_venta = graphene.List(DetalleVentaType, finca_id=graphene.ID())
    muertes_bajas = graphene.List(MuerteBajaType, finca_id=graphene.ID())
    animales_disponibles = graphene.List("animales.schema.AnimalType", finca_id=graphene.ID())
    corrales_venta = graphene.List(CorrallVentaType, finca_id=graphene.ID())
    animales_corral = graphene.List(AnimalCorralType, corral_id=graphene.ID())
    ventas_por_anio = graphene.List(NotaVentaType, anio=graphene.Int(required=True), finca_id=graphene.ID())
    utilidad_por_venta = graphene.JSONString(nota_venta_id=graphene.ID(required=True))

    @login_required
    def resolve_clientes(self, info, finca_id=None):
        return Cliente.objects.filter(finca_id__in=_fincas_scope(info, finca_id))

    @login_required
    def resolve_notas_venta(self, info, finca_id=None):
        return NotaVenta.objects.filter(finca_id__in=_fincas_scope(info, finca_id))

    @login_required
    def resolve_detalles_venta(self, info, finca_id=None):
        return DetalleVenta.objects.filter(nota_venta__finca_id__in=_fincas_scope(info, finca_id))

    @login_required
    def resolve_muertes_bajas(self, info, finca_id=None):
        return MuerteBaja.objects.filter(finca_id__in=_fincas_scope(info, finca_id))

    @login_required
    def resolve_animales_disponibles(self, info, finca_id=None):
        from animales.models import Animal
        return Animal.objects.filter(
            estado='ACTIVO', finca_id__in=_fincas_scope(info, finca_id)
        ).select_related('raza')

    @login_required
    def resolve_corrales_venta(self, info, finca_id=None):
        return CorrallVenta.objects.filter(finca_id__in=_fincas_scope(info, finca_id))

    @login_required
    def resolve_animales_corral(self, info, corral_id=None):
        qs = AnimalCorral.objects.select_related('animal').filter(
            corral__finca_id__in=ids_fincas_visibles(info.context.user)
        )
        if corral_id:
            qs = qs.filter(corral_id=corral_id)
        return qs

    @login_required
    def resolve_ventas_por_anio(self, info, anio, finca_id=None):
        return NotaVenta.objects.filter(
            fecha_venta__year=anio, finca_id__in=_fincas_scope(info, finca_id)
        )

    @login_required
    def resolve_utilidad_por_venta(self, info, nota_venta_id):
        import json
        try:
            nota = NotaVenta.objects.get(id=nota_venta_id)
            validar_finca(info.context.user, nota.finca_id)
            detalles = nota.detalles.select_related('animal').all()
            resultado = {
                "venta_id": nota_venta_id,
                "monto_total": float(nota.monto_total),
                "costo_total": float(sum(d.costo_estimado for d in detalles)),
                "utilidad_total": float(sum(d.utilidad for d in detalles)),
                "animales": [
                    {
                        "animal": d.animal.nro_arete,
                        "nombre": d.animal.nombre or "—",
                        "modalidad": d.modalidad,
                        "precio_unitario": float(d.precio_unitario),
                        "peso_kg": float(d.peso_venta_kg),
                        "sub_total": float(d.sub_total),
                        "costo": float(d.costo_estimado),
                        "utilidad": float(d.utilidad),
                    }
                    for d in detalles
                ]
            }
            return json.dumps(resultado)
        except Exception as e:
            return json.dumps({"error": str(e)})


# ==========================================
# MUTATIONS - CLIENTES
# ==========================================

class CrearCliente(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        apellidos = graphene.String()
        telefono = graphene.String()
        direccion = graphene.String()
        ci = graphene.String()
        email = graphene.String()

    cliente = graphene.Field(ClienteType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, nombre, **kwargs):
        try:
            finca = validar_finca(info.context.user, finca_id)
            cliente = Cliente.objects.create(finca=finca, nombre=nombre, **kwargs)
            return CrearCliente(cliente=cliente, success=True, message=f"Cliente {nombre} creado exitosamente")
        except Exception as e:
            return CrearCliente(cliente=None, success=False, message=str(e))


class ActualizarCliente(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        apellidos = graphene.String()
        telefono = graphene.String()
        direccion = graphene.String()
        ci = graphene.String()
        email = graphene.String()

    cliente = graphene.Field(ClienteType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            cliente = Cliente.objects.get(pk=id)
            for k, v in kwargs.items():
                if v is not None:
                    setattr(cliente, k, v)
            cliente.save()
            return ActualizarCliente(cliente=cliente, success=True, message="Cliente actualizado exitosamente")
        except Exception as e:
            return ActualizarCliente(cliente=None, success=False, message=str(e))


class EliminarCliente(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            cliente = Cliente.objects.get(pk=id)
            nombre = cliente.nombre
            cliente.delete()
            return EliminarCliente(success=True, message=f"Cliente {nombre} eliminado")
        except Exception as e:
            return EliminarCliente(success=False, message=str(e))


# ==========================================
# MUTATIONS - CORRAL DE VENTA
# ==========================================

class CrearCorralVenta(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        descripcion = graphene.String()
        fecha_formacion = graphene.Date(required=True)

    corral = graphene.Field(CorrallVentaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, nombre, fecha_formacion, **kwargs):
        try:
            finca = validar_finca(info.context.user, finca_id)
            corral = CorrallVenta.objects.create(
                finca=finca, nombre=nombre, fecha_formacion=fecha_formacion,
                descripcion=kwargs.get('descripcion')
            )
            return CrearCorralVenta(corral=corral, success=True, message=f"Corral '{nombre}' creado")
        except Exception as e:
            return CrearCorralVenta(corral=None, success=False, message=str(e))


class AgregarAnimalCorral(graphene.Mutation):
    class Arguments:
        corral_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        peso_entrada = graphene.Decimal()
        fecha_ingreso = graphene.Date(required=True)
        observaciones = graphene.String()

    animal_corral = graphene.Field(AnimalCorralType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, corral_id, animal_id, fecha_ingreso, **kwargs):
        try:
            from animales.models import Animal
            corral = CorrallVenta.objects.get(id=corral_id)
            animal = Animal.objects.get(id=animal_id)
            ac = AnimalCorral.objects.create(
                corral=corral, animal=animal,
                fecha_ingreso=fecha_ingreso,
                peso_entrada=kwargs.get('peso_entrada', 0),
                observaciones=kwargs.get('observaciones'),
            )
            return AgregarAnimalCorral(animal_corral=ac, success=True, message="Animal agregado al corral")
        except Exception as e:
            return AgregarAnimalCorral(animal_corral=None, success=False, message=str(e))


class EliminarCorralVenta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            corral = CorrallVenta.objects.get(id=id)
            nombre = corral.nombre
            corral.delete()
            return EliminarCorralVenta(success=True, message=f"Corral '{nombre}' eliminado")
        except Exception as e:
            return EliminarCorralVenta(success=False, message=str(e))


# ==========================================
# MUTATIONS - NOTA VENTA
# ==========================================

class CrearNotaVenta(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        cliente_id = graphene.ID()
        corral_id = graphene.ID()
        modalidad_venta = graphene.String()
        fecha_venta = graphene.Date(required=True)
        guia_salida = graphene.String()
        observaciones = graphene.String()

    nota_venta = graphene.Field(NotaVentaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, fecha_venta, **kwargs):
        try:
            finca = validar_finca(info.context.user, finca_id)
            cliente = Cliente.objects.filter(id=kwargs.get('cliente_id')).first() if kwargs.get('cliente_id') else None
            corral = CorrallVenta.objects.filter(id=kwargs.get('corral_id')).first() if kwargs.get('corral_id') else None
            nota_venta = NotaVenta.objects.create(
                finca=finca,
                cliente=cliente,
                corral=corral,
                modalidad_venta=kwargs.get('modalidad_venta', 'POR_KILO'),
                fecha_venta=fecha_venta,
                guia_salida=kwargs.get('guia_salida'),
                observaciones=kwargs.get('observaciones'),
                registrado_por=info.context.user,
            )
            return CrearNotaVenta(nota_venta=nota_venta, success=True, message="Nota de venta creada exitosamente")
        except Exception as e:
            return CrearNotaVenta(nota_venta=None, success=False, message=str(e))


class ActualizarNotaVenta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        cliente_id = graphene.ID()
        corral_id = graphene.ID()
        modalidad_venta = graphene.String()
        fecha_venta = graphene.Date()
        observaciones = graphene.String()

    nota_venta = graphene.Field(NotaVentaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            nota_venta = NotaVenta.objects.get(pk=id)
            if kwargs.get('cliente_id'):
                nota_venta.cliente = Cliente.objects.filter(id=kwargs['cliente_id']).first()
            if kwargs.get('corral_id'):
                nota_venta.corral = CorrallVenta.objects.filter(id=kwargs['corral_id']).first()
            if kwargs.get('modalidad_venta'):
                nota_venta.modalidad_venta = kwargs['modalidad_venta']
            if kwargs.get('fecha_venta'):
                nota_venta.fecha_venta = kwargs['fecha_venta']
            if kwargs.get('observaciones') is not None:
                nota_venta.observaciones = kwargs['observaciones']
            nota_venta.save()
            return ActualizarNotaVenta(nota_venta=nota_venta, success=True, message="Venta actualizada")
        except Exception as e:
            return ActualizarNotaVenta(nota_venta=None, success=False, message=str(e))


class EliminarNotaVenta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            nota_venta = NotaVenta.objects.get(pk=id)
            nota_venta.detalles.all().delete()
            nota_venta.delete()
            return EliminarNotaVenta(success=True, message="Nota de venta eliminada")
        except Exception as e:
            return EliminarNotaVenta(success=False, message=str(e))


# ==========================================
# MUTATIONS - DETALLE VENTA
# ==========================================

class CrearDetalleVenta(graphene.Mutation):
    class Arguments:
        nota_venta_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        modalidad = graphene.String()
        precio_kg = graphene.Decimal(required=True)
        peso_venta_kg = graphene.Decimal()
        costo_estimado = graphene.Decimal()

    detalle_venta = graphene.Field(DetalleVentaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nota_venta_id, animal_id, precio_kg, **kwargs):
        try:
            from animales.models import Animal
            nota_venta = NotaVenta.objects.get(id=nota_venta_id)
            animal = Animal.objects.get(id=animal_id)
            modalidad = kwargs.get('modalidad', nota_venta.modalidad_venta or 'POR_KILO')
            detalle = DetalleVenta.objects.create(
                nota_venta=nota_venta,
                animal=animal,
                modalidad=modalidad,
                precio_unitario=precio_kg,
                peso_venta_kg=kwargs.get('peso_venta_kg', 0),
                costo_estimado=kwargs.get('costo_estimado', 0),
            )
            return CrearDetalleVenta(detalle_venta=detalle, success=True, message="Detalle creado")
        except Exception as e:
            return CrearDetalleVenta(detalle_venta=None, success=False, message=str(e))


class EliminarDetalleVenta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            detalle = DetalleVenta.objects.get(pk=id)
            nota_venta = detalle.nota_venta
            detalle.delete()
            nuevo_total = nota_venta.detalles.aggregate(total=Sum('sub_total'))['total'] or 0
            nota_venta.monto_total = nuevo_total
            nota_venta.save()
            return EliminarDetalleVenta(success=True, message="Detalle eliminado")
        except Exception as e:
            return EliminarDetalleVenta(success=False, message=str(e))


# ==========================================
# MUTATIONS - MUERTE/BAJA
# ==========================================

class CrearMuerteBaja(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha_baja = graphene.Date(required=True)
        causa = graphene.String(required=True)
        tipo = graphene.String(required=True)
        motivo_descarte = graphene.String()
        descripcion = graphene.String()
        peso_estimado_kg = graphene.Decimal()

    muerte_baja = graphene.Field(MuerteBajaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha_baja, causa, tipo, **kwargs):
        try:
            from animales.models import Animal

            finca = validar_finca(info.context.user, finca_id)
            animal = Animal.objects.get(id=animal_id)

            tipos_validos = ['MUERTE', 'ROBO', 'PERDIDA', 'DESCARTE', 'SACRIFICIO', 'OTRO']
            if tipo not in tipos_validos:
                return CrearMuerteBaja(muerte_baja=None, success=False, message=f"Tipo inválido: {tipo}")

            if animal.estado == 'BAJA':
                return CrearMuerteBaja(muerte_baja=None, success=False, message=f"El animal ya tiene una baja registrada")

            muerte_baja = MuerteBaja.objects.create(
                finca=finca,
                animal=animal,
                fecha_baja=fecha_baja,
                causa=causa,
                tipo=tipo,
                motivo_descarte=kwargs.get('motivo_descarte'),
                descripcion=kwargs.get('descripcion'),
                peso_estimado_kg=kwargs.get('peso_estimado_kg', 0),
                registrado_por=info.context.user,
            )

            animal.estado = 'BAJA'
            animal.save(update_fields=['estado'])

            return CrearMuerteBaja(muerte_baja=muerte_baja, success=True, message=f"Baja registrada exitosamente")
        except Exception as e:
            return CrearMuerteBaja(muerte_baja=None, success=False, message=str(e))


class ActualizarMuerteBaja(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_baja = graphene.Date()
        tipo = graphene.String()
        causa = graphene.String()
        motivo_descarte = graphene.String()
        descripcion = graphene.String()
        peso_estimado_kg = graphene.Decimal()

    muerte_baja = graphene.Field(MuerteBajaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            muerte_baja = MuerteBaja.objects.get(pk=id)
            if kwargs.get('fecha_baja'):
                muerte_baja.fecha_baja = kwargs['fecha_baja']
            if kwargs.get('tipo'):
                tipos_validos = ['MUERTE', 'ROBO', 'PERDIDA', 'DESCARTE', 'SACRIFICIO', 'OTRO']
                if kwargs['tipo'] not in tipos_validos:
                    return ActualizarMuerteBaja(muerte_baja=None, success=False, message="Tipo inválido")
                muerte_baja.tipo = kwargs['tipo']
            if kwargs.get('causa'):
                muerte_baja.causa = kwargs['causa']
            if kwargs.get('motivo_descarte') is not None:
                muerte_baja.motivo_descarte = kwargs['motivo_descarte']
            if kwargs.get('descripcion') is not None:
                muerte_baja.descripcion = kwargs['descripcion']
            if kwargs.get('peso_estimado_kg') is not None:
                muerte_baja.peso_estimado_kg = kwargs['peso_estimado_kg']
            muerte_baja.save()
            return ActualizarMuerteBaja(muerte_baja=muerte_baja, success=True, message="Baja actualizada")
        except Exception as e:
            return ActualizarMuerteBaja(muerte_baja=None, success=False, message=str(e))


class EliminarMuerteBaja(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            muerte_baja = MuerteBaja.objects.get(pk=id)
            animal = muerte_baja.animal
            muerte_baja.delete()
            animal.estado = 'ACTIVO'
            animal.save(update_fields=['estado'])
            return EliminarMuerteBaja(success=True, message=f"Baja eliminada y animal reactivado")
        except Exception as e:
            return EliminarMuerteBaja(success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    # Clientes
    crear_cliente = CrearCliente.Field()
    actualizar_cliente = ActualizarCliente.Field()
    eliminar_cliente = EliminarCliente.Field()

    # Corrales
    crear_corral_venta = CrearCorralVenta.Field()
    agregar_animal_corral = AgregarAnimalCorral.Field()
    eliminar_corral_venta = EliminarCorralVenta.Field()

    # Notas de Venta
    crear_nota_venta = CrearNotaVenta.Field()
    actualizar_nota_venta = ActualizarNotaVenta.Field()
    eliminar_nota_venta = EliminarNotaVenta.Field()

    # Detalles de Venta
    crear_detalle_venta = CrearDetalleVenta.Field()
    eliminar_detalle_venta = EliminarDetalleVenta.Field()

    # Muertes/Bajas
    crear_muerte_baja = CrearMuerteBaja.Field()
    actualizar_muerte_baja = ActualizarMuerteBaja.Field()
    eliminar_muerte_baja = EliminarMuerteBaja.Field()