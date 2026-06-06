# backend/comercio/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.db.models import Sum

from .models import (
    Cliente,
    NotaVenta,
    DetalleVenta,
    MuerteBaja,
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

class Query(graphene.ObjectType):
    clientes = graphene.List(ClienteType)
    notas_venta = graphene.List(NotaVentaType)
    detalles_venta = graphene.List(DetalleVentaType)
    muertes_bajas = graphene.List(MuerteBajaType)
    animales_disponibles = graphene.List("animales.schema.AnimalType")
    ventas_por_anio = graphene.List(
        NotaVentaType,
        anio=graphene.Int(required=True)
    )

    def resolve_clientes(self, info):
        return Cliente.objects.all()

    def resolve_notas_venta(self, info):
        return NotaVenta.objects.all()

    def resolve_detalles_venta(self, info):
        return DetalleVenta.objects.all()

    def resolve_muertes_bajas(self, info):
        return MuerteBaja.objects.all()

    def resolve_animales_disponibles(self, info):
        from animales.models import Animal
        return Animal.objects.filter(
            estado='ACTIVO'
        ).select_related('raza')

    def resolve_ventas_por_anio(self, info, anio):
        return NotaVenta.objects.filter(fecha_venta__year=anio)


# ==========================================
# MUTATIONS - CREAR CLIENTE
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
    def mutate(self, info, finca_id, nombre, apellidos=None, telefono=None, direccion=None, ci=None, email=None):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            cliente = Cliente.objects.create(
                finca=finca,
                nombre=nombre,
                apellidos=apellidos,
                telefono=telefono,
                direccion=direccion,
                ci=ci,
                email=email
            )
            return CrearCliente(cliente=cliente, success=True, message=f"Cliente {nombre} creado exitosamente")
        except Exception as e:
            return CrearCliente(cliente=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - ACTUALIZAR CLIENTE
# ==========================================

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
    def mutate(self, info, id, nombre=None, apellidos=None, telefono=None, direccion=None, ci=None, email=None):
        try:
            cliente = Cliente.objects.get(pk=id)
            if nombre:
                cliente.nombre = nombre
            if apellidos:
                cliente.apellidos = apellidos
            if telefono:
                cliente.telefono = telefono
            if direccion:
                cliente.direccion = direccion
            if ci:
                cliente.ci = ci
            if email:
                cliente.email = email
            cliente.save()
            return ActualizarCliente(cliente=cliente, success=True, message="Cliente actualizado exitosamente")
        except Exception as e:
            return ActualizarCliente(cliente=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - ELIMINAR CLIENTE
# ==========================================

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
            return EliminarCliente(success=True, message=f"Cliente {nombre} eliminado exitosamente")
        except Exception as e:
            return EliminarCliente(success=False, message=str(e))


# ==========================================
# MUTATIONS - NOTA VENTA
# ==========================================

class CrearNotaVenta(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        cliente_id = graphene.ID()
        fecha_venta = graphene.Date(required=True)
        guia_salida = graphene.String()
        observaciones = graphene.String()

    nota_venta = graphene.Field(NotaVentaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, fecha_venta, cliente_id=None, guia_salida=None, observaciones=None):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            cliente = Cliente.objects.filter(id=cliente_id).first() if cliente_id else None
            nota_venta = NotaVenta.objects.create(
                finca=finca,
                cliente=cliente,
                fecha_venta=fecha_venta,
                guia_salida=guia_salida,
                observaciones=observaciones
            )
            return CrearNotaVenta(nota_venta=nota_venta, success=True, message="Nota de venta creada exitosamente")
        except Exception as e:
            return CrearNotaVenta(nota_venta=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - ACTUALIZAR NOTA VENTA (NUEVO)
# ==========================================

class ActualizarNotaVenta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        cliente_id = graphene.ID()
        fecha_venta = graphene.Date()
        observaciones = graphene.String()

    nota_venta = graphene.Field(NotaVentaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, cliente_id=None, fecha_venta=None, observaciones=None):
        try:
            nota_venta = NotaVenta.objects.get(pk=id)
            
            if cliente_id:
                cliente = Cliente.objects.filter(id=cliente_id).first()
                nota_venta.cliente = cliente
            if fecha_venta:
                nota_venta.fecha_venta = fecha_venta
            if observaciones is not None:
                nota_venta.observaciones = observaciones
            
            nota_venta.save()
            return ActualizarNotaVenta(
                nota_venta=nota_venta,
                success=True,
                message="Nota de venta actualizada exitosamente"
            )
        except Exception as e:
            return ActualizarNotaVenta(
                nota_venta=None,
                success=False,
                message=str(e)
            )


# ==========================================
# MUTATIONS - ELIMINAR NOTA VENTA (NUEVO)
# ==========================================

class EliminarNotaVenta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            nota_venta = NotaVenta.objects.get(pk=id)
            # Eliminar también los detalles
            nota_venta.detalles.all().delete()
            nota_venta.delete()
            return EliminarNotaVenta(
                success=True,
                message="Nota de venta eliminada exitosamente"
            )
        except Exception as e:
            return EliminarNotaVenta(
                success=False,
                message=str(e)
            )


# ==========================================
# MUTATIONS - ELIMINAR DETALLE VENTA (NUEVO)
# ==========================================

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
            
            # Actualizar el monto total de la nota de venta
            nuevo_total = nota_venta.detalles.aggregate(total=Sum('sub_total'))['total'] or 0
            nota_venta.monto_total = nuevo_total
            nota_venta.save()
            
            return EliminarDetalleVenta(
                success=True,
                message="Detalle de venta eliminado exitosamente"
            )
        except Exception as e:
            return EliminarDetalleVenta(
                success=False,
                message=str(e)
            )


# ==========================================
# MUTATIONS - DETALLE VENTA
# ==========================================

class CrearDetalleVenta(graphene.Mutation):
    class Arguments:
        nota_venta_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        precio_kg = graphene.Decimal(required=True)
        peso_venta_kg = graphene.Decimal(required=True)

    detalle_venta = graphene.Field(DetalleVentaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nota_venta_id, animal_id, precio_kg, peso_venta_kg):
        try:
            from animales.models import Animal
            nota_venta = NotaVenta.objects.get(id=nota_venta_id)
            animal = Animal.objects.get(id=animal_id)
            detalle = DetalleVenta.objects.create(
                nota_venta=nota_venta,
                animal=animal,
                precio_unitario=precio_kg,
                peso_venta_kg=peso_venta_kg
            )
            return CrearDetalleVenta(detalle_venta=detalle, success=True, message="Detalle de venta creado exitosamente")
        except Exception as e:
            return CrearDetalleVenta(detalle_venta=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - CREAR MUERTE BAJA
# ==========================================

class CrearMuerteBaja(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha_baja = graphene.Date(required=True)
        causa = graphene.String(required=True)
        tipo = graphene.String(required=True)
        descripcion = graphene.String()
        peso_estimado_kg = graphene.Decimal()

    muerte_baja = graphene.Field(MuerteBajaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha_baja, causa, tipo, descripcion=None, peso_estimado_kg=0):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

            tipos_validos = ['MUERTE', 'ROBO', 'PERDIDA', 'DESCARTE', 'OTRO']
            if tipo not in tipos_validos:
                return CrearMuerteBaja(
                    muerte_baja=None,
                    success=False,
                    message=f"Tipo inválido. Debe ser uno de: {', '.join(tipos_validos)}"
                )

            if animal.estado == 'BAJA':
                return CrearMuerteBaja(
                    muerte_baja=None,
                    success=False,
                    message=f"El animal '{animal.nombre}' ya tiene una baja registrada"
                )

            muerte_baja = MuerteBaja.objects.create(
                finca=finca,
                animal=animal,
                fecha_baja=fecha_baja,
                causa=causa,
                tipo=tipo,
                descripcion=descripcion,
                peso_estimado_kg=peso_estimado_kg
            )

            animal.estado = 'BAJA'
            animal.save(update_fields=['estado'])

            return CrearMuerteBaja(
                muerte_baja=muerte_baja,
                success=True,
                message=f"Baja del animal '{animal.nombre}' registrada exitosamente"
            )
        except Exception as e:
            return CrearMuerteBaja(muerte_baja=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - ACTUALIZAR MUERTE BAJA
# ==========================================

class ActualizarMuerteBaja(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_baja = graphene.Date()
        tipo = graphene.String()
        causa = graphene.String()
        descripcion = graphene.String()
        peso_estimado_kg = graphene.Decimal()

    muerte_baja = graphene.Field(MuerteBajaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, fecha_baja=None, tipo=None, causa=None, descripcion=None, peso_estimado_kg=None):
        try:
            muerte_baja = MuerteBaja.objects.get(pk=id)

            if fecha_baja:
                muerte_baja.fecha_baja = fecha_baja
            if tipo:
                tipos_validos = ['MUERTE', 'ROBO', 'PERDIDA', 'DESCARTE', 'OTRO']
                if tipo not in tipos_validos:
                    return ActualizarMuerteBaja(muerte_baja=None, success=False, message="Tipo inválido")
                muerte_baja.tipo = tipo
            if causa:
                muerte_baja.causa = causa
            if descripcion is not None:
                muerte_baja.descripcion = descripcion
            if peso_estimado_kg is not None:
                muerte_baja.peso_estimado_kg = peso_estimado_kg

            muerte_baja.save()
            return ActualizarMuerteBaja(
                muerte_baja=muerte_baja,
                success=True,
                message="Baja actualizada exitosamente"
            )
        except Exception as e:
            return ActualizarMuerteBaja(muerte_baja=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - ELIMINAR MUERTE BAJA
# ==========================================

class EliminarMuerteBaja(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            from animales.models import Animal

            muerte_baja = MuerteBaja.objects.get(pk=id)
            animal = muerte_baja.animal

            muerte_baja.delete()

            animal.estado = 'ACTIVO'
            animal.save(update_fields=['estado'])

            return EliminarMuerteBaja(
                success=True,
                message=f"Baja eliminada y animal '{animal.nombre}' reactivado exitosamente"
            )
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
    
    # Notas de Venta
    crear_nota_venta = CrearNotaVenta.Field()
    actualizar_nota_venta = ActualizarNotaVenta.Field()  # 👈 NUEVO
    eliminar_nota_venta = EliminarNotaVenta.Field()      # 👈 NUEVO
    
    # Detalles de Venta
    crear_detalle_venta = CrearDetalleVenta.Field()
    eliminar_detalle_venta = EliminarDetalleVenta.Field() # 👈 NUEVO
    
    # Muertes/Bajas
    crear_muerte_baja = CrearMuerteBaja.Field()
    actualizar_muerte_baja = ActualizarMuerteBaja.Field()
    eliminar_muerte_baja = EliminarMuerteBaja.Field()