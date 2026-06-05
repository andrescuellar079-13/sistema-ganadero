# backend/rrhh/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required

from .models import TipoEmpleado, Empleado


# ==========================================
# TYPES
# ==========================================

class TipoEmpleadoType(DjangoObjectType):
    class Meta:
        model = TipoEmpleado
        fields = "__all__"


class EmpleadoType(DjangoObjectType):
    nombreCompleto = graphene.String()
    isActivo = graphene.Boolean()
    
    class Meta:
        model = Empleado
        fields = "__all__"
    
    def resolve_nombreCompleto(self, info):
        return self.nombre_completo
    
    def resolve_isActivo(self, info):
        return self.is_activo


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    tipos_empleado = graphene.List(TipoEmpleadoType, finca_id=graphene.ID(required=True))
    tipo_empleado = graphene.Field(TipoEmpleadoType, id=graphene.ID(required=True))
    
    empleados = graphene.List(EmpleadoType, finca_id=graphene.ID(required=True), estado=graphene.String(), tipo_id=graphene.ID())
    empleado = graphene.Field(EmpleadoType, id=graphene.ID(required=True))
    empleados_activos = graphene.List(EmpleadoType, finca_id=graphene.ID(required=True))

    def resolve_tipos_empleado(self, info, finca_id):
        return TipoEmpleado.objects.filter(activo=True)
    
    def resolve_tipo_empleado(self, info, id):
        return TipoEmpleado.objects.get(id=id)
    
    def resolve_empleados(self, info, finca_id, estado=None, tipo_id=None):
        queryset = Empleado.objects.filter(finca_id=finca_id)
        if estado:
            queryset = queryset.filter(estado=estado)
        if tipo_id:
            queryset = queryset.filter(tipo_id=tipo_id)
        return queryset
    
    def resolve_empleado(self, info, id):
        return Empleado.objects.get(id=id)
    
    def resolve_empleados_activos(self, info, finca_id):
        return Empleado.objects.filter(finca_id=finca_id, estado='ACTIVO')


# ==========================================
# MUTATIONS - TIPOS DE EMPLEADO
# ==========================================

class CrearTipoEmpleado(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        descripcion = graphene.String()
        salario_base = graphene.Decimal()

    tipo = graphene.Field(TipoEmpleadoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, **kwargs):
        try:
            tipo = TipoEmpleado.objects.create(
                nombre=nombre,
                descripcion=kwargs.get('descripcion', ''),
                salario_base=kwargs.get('salario_base', 0)
            )
            return CrearTipoEmpleado(tipo=tipo, success=True, message="Tipo de empleado creado")
        except Exception as e:
            return CrearTipoEmpleado(tipo=None, success=False, message=str(e))


class ActualizarTipoEmpleado(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        descripcion = graphene.String()
        salario_base = graphene.Decimal()
        activo = graphene.Boolean()

    tipo = graphene.Field(TipoEmpleadoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            tipo = TipoEmpleado.objects.get(id=id)
            if kwargs.get('nombre'):
                tipo.nombre = kwargs['nombre']
            if kwargs.get('descripcion') is not None:
                tipo.descripcion = kwargs['descripcion']
            if kwargs.get('salario_base'):
                tipo.salario_base = kwargs['salario_base']
            if kwargs.get('activo') is not None:
                tipo.activo = kwargs['activo']
            tipo.save()
            return ActualizarTipoEmpleado(tipo=tipo, success=True, message="Tipo actualizado")
        except Exception as e:
            return ActualizarTipoEmpleado(tipo=None, success=False, message=str(e))


class EliminarTipoEmpleado(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            tipo = TipoEmpleado.objects.get(id=id)
            tipo.delete()
            return EliminarTipoEmpleado(success=True, message="Tipo eliminado")
        except Exception as e:
            return EliminarTipoEmpleado(success=False, message=str(e))


# ==========================================
# MUTATIONS - EMPLEADOS
# ==========================================

class CrearEmpleado(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        tipo_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        apellidos = graphene.String()
        ci = graphene.String()
        sexo = graphene.String()
        fecha_nacimiento = graphene.Date()
        telefono = graphene.String()
        email = graphene.String()
        direccion = graphene.String()
        fecha_ingreso = graphene.Date(required=True)
        salario = graphene.Decimal()
        estado = graphene.String()
        observaciones = graphene.String()

    empleado = graphene.Field(EmpleadoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, tipo_id, nombre, fecha_ingreso, **kwargs):
        try:
            from fincas.models import Finca
            from .models import TipoEmpleado

            finca = Finca.objects.get(id=finca_id)
            tipo = TipoEmpleado.objects.get(id=tipo_id)

            empleado = Empleado.objects.create(
                finca=finca,
                tipo=tipo,
                nombre=nombre,
                apellidos=kwargs.get('apellidos', ''),
                ci=kwargs.get('ci'),
                sexo=kwargs.get('sexo', 'MASCULINO'),
                fecha_nacimiento=kwargs.get('fecha_nacimiento'),
                telefono=kwargs.get('telefono'),
                email=kwargs.get('email'),
                direccion=kwargs.get('direccion'),
                fecha_ingreso=fecha_ingreso,
                salario=kwargs.get('salario', 0),
                estado=kwargs.get('estado', 'ACTIVO'),
                observaciones=kwargs.get('observaciones'),
                registrado_por=info.context.user
            )

            return CrearEmpleado(empleado=empleado, success=True, message="Empleado registrado")
        except Exception as e:
            return CrearEmpleado(empleado=None, success=False, message=str(e))


class ActualizarEmpleado(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        tipo_id = graphene.ID()
        nombre = graphene.String()
        apellidos = graphene.String()
        ci = graphene.String()
        sexo = graphene.String()
        fecha_nacimiento = graphene.Date()
        telefono = graphene.String()
        email = graphene.String()
        direccion = graphene.String()
        fecha_ingreso = graphene.Date()
        fecha_retiro = graphene.Date()
        salario = graphene.Decimal()
        estado = graphene.String()
        observaciones = graphene.String()

    empleado = graphene.Field(EmpleadoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            empleado = Empleado.objects.get(id=id)

            if kwargs.get('tipo_id'):
                empleado.tipo_id = kwargs['tipo_id']
            if kwargs.get('nombre'):
                empleado.nombre = kwargs['nombre']
            if kwargs.get('apellidos') is not None:
                empleado.apellidos = kwargs['apellidos']
            if kwargs.get('ci'):
                empleado.ci = kwargs['ci']
            if kwargs.get('sexo'):
                empleado.sexo = kwargs['sexo']
            if kwargs.get('fecha_nacimiento'):
                empleado.fecha_nacimiento = kwargs['fecha_nacimiento']
            if kwargs.get('telefono'):
                empleado.telefono = kwargs['telefono']
            if kwargs.get('email'):
                empleado.email = kwargs['email']
            if kwargs.get('direccion'):
                empleado.direccion = kwargs['direccion']
            if kwargs.get('fecha_ingreso'):
                empleado.fecha_ingreso = kwargs['fecha_ingreso']
            if kwargs.get('fecha_retiro') is not None:
                empleado.fecha_retiro = kwargs['fecha_retiro']
            if kwargs.get('salario') is not None:
                empleado.salario = kwargs['salario']
            if kwargs.get('estado'):
                empleado.estado = kwargs['estado']
            if kwargs.get('observaciones') is not None:
                empleado.observaciones = kwargs['observaciones']

            empleado.save()

            return ActualizarEmpleado(empleado=empleado, success=True, message="Empleado actualizado")
        except Exception as e:
            return ActualizarEmpleado(empleado=None, success=False, message=str(e))


class EliminarEmpleado(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            empleado = Empleado.objects.get(id=id)
            empleado.delete()
            return EliminarEmpleado(success=True, message="Empleado eliminado")
        except Exception as e:
            return EliminarEmpleado(success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    crear_tipo_empleado = CrearTipoEmpleado.Field()
    actualizar_tipo_empleado = ActualizarTipoEmpleado.Field()
    eliminar_tipo_empleado = EliminarTipoEmpleado.Field()
    
    crear_empleado = CrearEmpleado.Field()
    actualizar_empleado = ActualizarEmpleado.Field()
    eliminar_empleado = EliminarEmpleado.Field()