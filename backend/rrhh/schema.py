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
    cargoNombre = graphene.String()
    documentoCiUrl = graphene.String()
    contratoUrl = graphene.String()

    class Meta:
        model = Empleado
        fields = "__all__"
        convert_choices_to_enum = False

    def resolve_nombreCompleto(self, info):
        return self.nombre_completo

    def resolve_isActivo(self, info):
        return self.is_activo

    def resolve_cargoNombre(self, info):
        return self.cargo_nombre

    def resolve_documentoCiUrl(self, info):
        return self.documento_ci.url if self.documento_ci else None

    def resolve_contratoUrl(self, info):
        return self.contrato.url if self.contrato else None


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    tipos_empleado = graphene.List(TipoEmpleadoType, finca_id=graphene.ID(required=True))
    tipo_empleado = graphene.Field(TipoEmpleadoType, id=graphene.ID(required=True))
    
    empleados = graphene.List(
        EmpleadoType,
        finca_id=graphene.ID(required=True),
        estado=graphene.String(),
        estado_laboral=graphene.String(),
        tipo_id=graphene.ID(),
        tipo_empleado=graphene.String(),
    )
    empleado = graphene.Field(EmpleadoType, id=graphene.ID(required=True))
    empleados_activos = graphene.List(EmpleadoType, finca_id=graphene.ID(required=True))

    def resolve_tipos_empleado(self, info, finca_id):
        return TipoEmpleado.objects.filter(activo=True)
    
    def resolve_tipo_empleado(self, info, id):
        return TipoEmpleado.objects.get(id=id)
    
    def resolve_empleados(self, info, finca_id, estado=None, estado_laboral=None,
                          tipo_id=None, tipo_empleado=None):
        queryset = Empleado.objects.filter(finca_id=finca_id).select_related('tipo', 'usuario', 'finca')
        if estado:
            queryset = queryset.filter(estado=estado)
        if estado_laboral:
            queryset = queryset.filter(estado_laboral=estado_laboral)
        if tipo_id:
            queryset = queryset.filter(tipo_id=tipo_id)
        if tipo_empleado:
            queryset = queryset.filter(tipo_empleado=tipo_empleado)
        return queryset

    def resolve_empleado(self, info, id):
        from accounts.permissions import puede_acceder_finca
        from graphql import GraphQLError
        empleado = Empleado.objects.filter(id=id).first()
        if empleado and not puede_acceder_finca(info.context.user, empleado.finca_id):
            raise GraphQLError("No tiene acceso a este empleado.")
        return empleado

    def resolve_empleados_activos(self, info, finca_id):
        return Empleado.objects.filter(finca_id=finca_id, estado_laboral='ACTIVO')


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

def _validar_empleado(nombre, salario, estado_laboral, fecha_salida):
    """Validaciones de negocio compartidas (Fase 1)."""
    if not nombre or not nombre.strip():
        return "El nombre es obligatorio."
    if salario is not None and salario < 0:
        return "El salario no puede ser negativo."
    if estado_laboral == 'RETIRADO' and not fecha_salida:
        return "Si el estado es RETIRADO, debe indicar la fecha de salida."
    return None


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
        tipo_empleado = graphene.String()
        fecha_ingreso = graphene.Date(required=True)
        salario = graphene.Decimal()
        estado_laboral = graphene.String()
        fecha_salida = graphene.Date()
        motivo_salida = graphene.String()
        usuario_id = graphene.ID()
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

            # Regla 1: finca obligatoria. Cargo (tipo) obligatorio.
            finca = Finca.objects.get(id=finca_id)
            tipo = TipoEmpleado.objects.get(id=tipo_id)

            salario = kwargs.get('salario', 0) or 0
            estado_laboral = kwargs.get('estado_laboral', 'ACTIVO')
            fecha_salida = kwargs.get('fecha_salida')

            error = _validar_empleado(nombre, salario, estado_laboral, fecha_salida)
            if error:
                return CrearEmpleado(empleado=None, success=False, message=error)

            # Usuario relacionado (opcional, Regla 2/3).
            usuario = None
            usuario_id = kwargs.get('usuario_id')
            if usuario_id:
                from django.contrib.auth import get_user_model
                usuario = get_user_model().objects.get(id=usuario_id)

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
                tipo_empleado=kwargs.get('tipo_empleado', 'OTRO'),
                fecha_ingreso=fecha_ingreso,
                salario=salario,
                estado_laboral=estado_laboral,
                fecha_salida=fecha_salida,
                motivo_salida=kwargs.get('motivo_salida'),
                usuario=usuario,
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
        finca_id = graphene.ID()
        tipo_id = graphene.ID()
        nombre = graphene.String()
        apellidos = graphene.String()
        ci = graphene.String()
        sexo = graphene.String()
        fecha_nacimiento = graphene.Date()
        telefono = graphene.String()
        email = graphene.String()
        direccion = graphene.String()
        tipo_empleado = graphene.String()
        fecha_ingreso = graphene.Date()
        salario = graphene.Decimal()
        estado_laboral = graphene.String()
        fecha_salida = graphene.Date()
        motivo_salida = graphene.String()
        usuario_id = graphene.ID()
        estado = graphene.String()
        observaciones = graphene.String()

    empleado = graphene.Field(EmpleadoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            empleado = Empleado.objects.get(id=id)

            # Valores resultantes para validar antes de guardar.
            nombre = kwargs.get('nombre', empleado.nombre)
            salario = kwargs.get('salario', empleado.salario)
            estado_laboral = kwargs.get('estado_laboral', empleado.estado_laboral)
            fecha_salida = kwargs.get('fecha_salida', empleado.fecha_salida)

            error = _validar_empleado(nombre, salario, estado_laboral, fecha_salida)
            if error:
                return ActualizarEmpleado(empleado=None, success=False, message=error)

            if kwargs.get('finca_id'):
                empleado.finca_id = kwargs['finca_id']
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
            if kwargs.get('tipo_empleado'):
                empleado.tipo_empleado = kwargs['tipo_empleado']
            if kwargs.get('fecha_ingreso'):
                empleado.fecha_ingreso = kwargs['fecha_ingreso']
            if kwargs.get('salario') is not None:
                empleado.salario = kwargs['salario']
            if kwargs.get('estado_laboral'):
                empleado.estado_laboral = kwargs['estado_laboral']
            if kwargs.get('fecha_salida') is not None:
                empleado.fecha_salida = kwargs['fecha_salida']
            if kwargs.get('motivo_salida') is not None:
                empleado.motivo_salida = kwargs['motivo_salida']
            # Usuario relacionado (opcional): permite asignar o desvincular.
            if 'usuario_id' in kwargs:
                uid = kwargs.get('usuario_id')
                if uid:
                    from django.contrib.auth import get_user_model
                    empleado.usuario = get_user_model().objects.get(id=uid)
                else:
                    empleado.usuario = None
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
        from django.db.models import ProtectedError
        try:
            empleado = Empleado.objects.get(id=id)
            try:
                empleado.delete()
            except ProtectedError:
                # Regla 5: no eliminar empleados con historial/registros relacionados.
                return EliminarEmpleado(
                    success=False,
                    message=("No se puede eliminar: el empleado tiene registros "
                             "relacionados. Cámbielo a RETIRADO para conservar el historial.")
                )
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