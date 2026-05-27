# backend/compras/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.db.models import Sum

from .models import (
    Proveedor,
    NotaCompra,
    DetalleCompra,
    DetalleCompraAlimento,
    DetalleCompraAnimal,
)


class ProveedorType(DjangoObjectType):
    id = graphene.ID()
    
    class Meta:
        model = Proveedor
        fields = "__all__"
    
    def resolve_id(self, info):
        return self.id


class NotaCompraType(DjangoObjectType):
    tipoCompra = graphene.String()
    
    class Meta:
        model = NotaCompra
        fields = "__all__"
    
    def resolve_tipoCompra(self, info):
        return self.tipo_compra


class DetalleCompraType(DjangoObjectType):
    class Meta:
        model = DetalleCompra
        fields = "__all__"


class DetalleCompraAlimentoType(DjangoObjectType):
    class Meta:
        model = DetalleCompraAlimento
        fields = "__all__"


class DetalleCompraAnimalType(DjangoObjectType):
    class Meta:
        model = DetalleCompraAnimal
        fields = "__all__"


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    proveedores = graphene.List(ProveedorType)
    notas_compra = graphene.List(NotaCompraType)
    detalles_compra = graphene.List(DetalleCompraType)
    detalles_compra_alimento = graphene.List(DetalleCompraAlimentoType)
    detalles_compra_animal = graphene.List(DetalleCompraAnimalType)

    compras_por_anio = graphene.List(
        NotaCompraType,
        anio=graphene.Int(required=True)
    )

    def resolve_proveedores(self, info):
        return Proveedor.objects.all()

    def resolve_notas_compra(self, info):
        return NotaCompra.objects.all()

    def resolve_detalles_compra(self, info):
        return DetalleCompra.objects.all()

    def resolve_detalles_compra_alimento(self, info):
        return DetalleCompraAlimento.objects.all()

    def resolve_detalles_compra_animal(self, info):
        return DetalleCompraAnimal.objects.all()

    def resolve_compras_por_anio(self, info, anio):
        return NotaCompra.objects.filter(fecha_compra__year=anio)


# ==========================================
# MUTATIONS - PROVEEDORES (sin cambios)
# ==========================================

class CrearProveedor(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        apellidos = graphene.String()
        direccion = graphene.String()
        telefono = graphene.String()
        nit = graphene.String()
        ci = graphene.String()

    proveedor = graphene.Field(ProveedorType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, nombre, **kwargs):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            proveedor = Proveedor.objects.create(
                finca=finca,
                nombre=nombre,
                apellidos=kwargs.get('apellidos'),
                direccion=kwargs.get('direccion'),
                telefono=kwargs.get('telefono'),
                nit=kwargs.get('nit'),
                ci=kwargs.get('ci')
            )
            return CrearProveedor(proveedor=proveedor, success=True, message=f"Proveedor {nombre} creado")
        except Exception as e:
            return CrearProveedor(proveedor=None, success=False, message=str(e))


class ActualizarProveedor(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        apellidos = graphene.String()
        direccion = graphene.String()
        telefono = graphene.String()
        nit = graphene.String()
        ci = graphene.String()

    proveedor = graphene.Field(ProveedorType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            proveedor = Proveedor.objects.get(pk=id)
            if kwargs.get('nombre'):
                proveedor.nombre = kwargs['nombre']
            if kwargs.get('apellidos'):
                proveedor.apellidos = kwargs['apellidos']
            if kwargs.get('direccion'):
                proveedor.direccion = kwargs['direccion']
            if kwargs.get('telefono'):
                proveedor.telefono = kwargs['telefono']
            if kwargs.get('nit'):
                proveedor.nit = kwargs['nit']
            if kwargs.get('ci'):
                proveedor.ci = kwargs['ci']
            proveedor.save()
            return ActualizarProveedor(proveedor=proveedor, success=True, message="Proveedor actualizado")
        except Exception as e:
            return ActualizarProveedor(proveedor=None, success=False, message=str(e))


class EliminarProveedor(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            proveedor = Proveedor.objects.get(pk=id)
            nombre = proveedor.nombre
            proveedor.delete()
            return EliminarProveedor(success=True, message=f"Proveedor {nombre} eliminado")
        except Exception as e:
            return EliminarProveedor(success=False, message=str(e))


# ==========================================
# MUTATIONS - NOTA COMPRA (ACTUALIZADO con tipo_compra)
# ==========================================

class CrearNotaCompra(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        proveedor_id = graphene.ID()
        tipo_compra = graphene.String()
        fecha_compra = graphene.Date(required=True)
        observaciones = graphene.String()

    nota_compra = graphene.Field(NotaCompraType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, fecha_compra, **kwargs):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            proveedor = Proveedor.objects.filter(id=kwargs.get('proveedor_id')).first() if kwargs.get('proveedor_id') else None
            nota_compra = NotaCompra.objects.create(
                finca=finca,
                proveedor=proveedor,
                tipo_compra=kwargs.get('tipo_compra', 'MEDICAMENTO'),
                fecha_compra=fecha_compra,
                observaciones=kwargs.get('observaciones')
            )
            return CrearNotaCompra(nota_compra=nota_compra, success=True, message="Nota de compra creada")
        except Exception as e:
            return CrearNotaCompra(nota_compra=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - DETALLE COMPRA MEDICAMENTO
# ==========================================

class CrearDetalleCompra(graphene.Mutation):
    class Arguments:
        nota_compra_id = graphene.ID(required=True)
        medicamento_id = graphene.ID(required=True)
        precio_unitario = graphene.Decimal(required=True)
        cantidad = graphene.Decimal(required=True)

    detalle_compra = graphene.Field(DetalleCompraType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nota_compra_id, medicamento_id, precio_unitario, cantidad):
        try:
            from catalogos.models import Medicamento
            nota_compra = NotaCompra.objects.get(id=nota_compra_id)
            medicamento = Medicamento.objects.get(id=medicamento_id)
            detalle = DetalleCompra.objects.create(
                nota_compra=nota_compra,
                medicamento=medicamento,
                precio_unitario=precio_unitario,
                cantidad=cantidad
            )
            return CrearDetalleCompra(detalle_compra=detalle, success=True, message="Detalle de compra creado")
        except Exception as e:
            return CrearDetalleCompra(detalle_compra=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - DETALLE COMPRA ALIMENTO
# ==========================================

class CrearDetalleCompraAlimento(graphene.Mutation):
    class Arguments:
        nota_compra_id = graphene.ID(required=True)
        alimento_id = graphene.ID(required=True)
        precio_unitario = graphene.Decimal(required=True)
        cantidad = graphene.Decimal(required=True)

    detalle_compra_alimento = graphene.Field(DetalleCompraAlimentoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nota_compra_id, alimento_id, precio_unitario, cantidad):
        try:
            from catalogos.models import Alimento
            nota_compra = NotaCompra.objects.get(id=nota_compra_id)
            alimento = Alimento.objects.get(id=alimento_id)
            detalle = DetalleCompraAlimento.objects.create(
                nota_compra=nota_compra,
                alimento=alimento,
                precio_unitario=precio_unitario,
                cantidad=cantidad
            )
            return CrearDetalleCompraAlimento(detalle_compra_alimento=detalle, success=True, message="Detalle de compra de alimento creado")
        except Exception as e:
            return CrearDetalleCompraAlimento(detalle_compra_alimento=None, success=False, message=str(e))


# ==========================================
# NUEVAS MUTATIONS - DETALLE COMPRA ANIMAL
# ==========================================

class CrearDetalleCompraAnimal(graphene.Mutation):
    class Arguments:
        nota_compra_id = graphene.ID(required=True)
        nro_arete = graphene.String(required=True)
        nombre = graphene.String()
        sexo = graphene.String(required=True)
        raza_id = graphene.ID()
        categoria_id = graphene.ID()
        peso = graphene.Decimal()
        precio_unitario = graphene.Decimal(required=True)
        fecha_nacimiento = graphene.Date()
        observaciones = graphene.String()

    detalle_compra_animal = graphene.Field(DetalleCompraAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nota_compra_id, nro_arete, sexo, precio_unitario, **kwargs):
        try:
            from animales.models import Animal
            from catalogos.models import Raza, CategoriaAnimal
            
            nota_compra = NotaCompra.objects.get(id=nota_compra_id)
            
            # Crear el animal en la base de datos
            animal = Animal.objects.create(
                finca=nota_compra.finca,
                nro_arete=nro_arete,
                nombre=kwargs.get('nombre'),
                sexo=sexo,
                raza_id=kwargs.get('raza_id'),
                categoria_id=kwargs.get('categoria_id'),
                peso=kwargs.get('peso', 0),
                fecha_nacimiento=kwargs.get('fecha_nacimiento'),
                observaciones=kwargs.get('observaciones'),
                origen='COMPRADO',
                estado='ACTIVO'
            )
            
            detalle = DetalleCompraAnimal.objects.create(
                nota_compra=nota_compra,
                nro_arete=nro_arete,
                nombre=kwargs.get('nombre'),
                sexo=sexo,
                raza_id=kwargs.get('raza_id'),
                categoria_id=kwargs.get('categoria_id'),
                peso=kwargs.get('peso', 0),
                precio_unitario=precio_unitario,
                fecha_nacimiento=kwargs.get('fecha_nacimiento'),
                observaciones=kwargs.get('observaciones')
            )
            
            return CrearDetalleCompraAnimal(detalle_compra_animal=detalle, success=True, message="Animal agregado a la compra")
        except Exception as e:
            return CrearDetalleCompraAnimal(detalle_compra_animal=None, success=False, message=str(e))


class EliminarDetalleCompraAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            from animales.models import Animal
            
            detalle = DetalleCompraAnimal.objects.get(id=id)
            nota_compra = detalle.nota_compra
            
            # Eliminar el animal asociado
            try:
                animal = Animal.objects.get(nro_arete=detalle.nro_arete, finca=nota_compra.finca)
                animal.delete()
            except Animal.DoesNotExist:
                pass
            
            detalle.delete()
            
            return EliminarDetalleCompraAnimal(success=True, message="Animal eliminado de la compra")
        except Exception as e:
            return EliminarDetalleCompraAnimal(success=False, message=str(e))


# ==========================================
# MUTATIONS - ACTUALIZAR/ELIMINAR NOTA COMPRA
# ==========================================

class ActualizarNotaCompra(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        proveedor_id = graphene.ID()
        fecha_compra = graphene.Date()
        observaciones = graphene.String()

    nota_compra = graphene.Field(NotaCompraType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            nota_compra = NotaCompra.objects.get(id=id)
            if kwargs.get('proveedor_id'):
                nota_compra.proveedor_id = kwargs['proveedor_id']
            if kwargs.get('fecha_compra'):
                nota_compra.fecha_compra = kwargs['fecha_compra']
            if kwargs.get('observaciones') is not None:
                nota_compra.observaciones = kwargs['observaciones']
            nota_compra.save()
            return ActualizarNotaCompra(nota_compra=nota_compra, success=True, message="Compra actualizada")
        except Exception as e:
            return ActualizarNotaCompra(nota_compra=None, success=False, message=str(e))


class EliminarNotaCompra(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            nota_compra = NotaCompra.objects.get(id=id)
            # Eliminar todos los detalles
            nota_compra.detalles_medicamentos.all().delete()
            nota_compra.detalles_alimentos.all().delete()
            nota_compra.detalles_animales.all().delete()
            nota_compra.delete()
            return EliminarNotaCompra(success=True, message="Compra eliminada")
        except Exception as e:
            return EliminarNotaCompra(success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    # Proveedores
    crear_proveedor = CrearProveedor.Field()
    actualizar_proveedor = ActualizarProveedor.Field()
    eliminar_proveedor = EliminarProveedor.Field()
    
    # Notas de Compra
    crear_nota_compra = CrearNotaCompra.Field()
    actualizar_nota_compra = ActualizarNotaCompra.Field()
    eliminar_nota_compra = EliminarNotaCompra.Field()
    
    # Detalle Compra Medicamentos
    crear_detalle_compra = CrearDetalleCompra.Field()
    
    # Detalle Compra Alimento
    crear_detalle_compra_alimento = CrearDetalleCompraAlimento.Field()
    
    # Detalle Compra Animal (NUEVO)
    crear_detalle_compra_animal = CrearDetalleCompraAnimal.Field()
    eliminar_detalle_compra_animal = EliminarDetalleCompraAnimal.Field()