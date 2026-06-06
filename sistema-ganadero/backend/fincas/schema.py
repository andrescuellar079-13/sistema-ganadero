# backend/fincas/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required

from .models import Finca


class FincaType(DjangoObjectType):
    class Meta:
        model = Finca
        fields = "__all__"


class Query(graphene.ObjectType):
    fincas = graphene.List(FincaType)
    finca = graphene.Field(FincaType, id=graphene.ID(required=True))
    finca_actual = graphene.Field(FincaType)

    def resolve_fincas(self, info):
        return Finca.objects.all()

    def resolve_finca(self, info, id):
        try:
            return Finca.objects.get(id=id)
        except Finca.DoesNotExist:
            return None
    
    def resolve_finca_actual(self, info):
        user = info.context.user
        if user.is_authenticated and user.finca:
            return user.finca
        return None


class CrearFinca(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        propietario = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        ubicacion = graphene.String()
        telefono = graphene.String()

    finca = graphene.Field(FincaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, **kwargs):
        try:
            finca = Finca.objects.create(
                nombre=nombre,
                propietario=kwargs.get('propietario'),
                departamento=kwargs.get('departamento'),
                municipio=kwargs.get('municipio'),
                ubicacion=kwargs.get('ubicacion'),
                telefono=kwargs.get('telefono')
            )
            return CrearFinca(finca=finca, success=True, message="Finca creada exitosamente")
        except Exception as e:
            return CrearFinca(finca=None, success=False, message=str(e))


class ActualizarFinca(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        propietario = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        ubicacion = graphene.String()
        telefono = graphene.String()
        activo = graphene.Boolean()

    finca = graphene.Field(FincaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            finca = Finca.objects.get(id=id)
            
            if kwargs.get('nombre'):
                finca.nombre = kwargs['nombre']
            if kwargs.get('propietario') is not None:
                finca.propietario = kwargs['propietario']
            if kwargs.get('departamento') is not None:
                finca.departamento = kwargs['departamento']
            if kwargs.get('municipio') is not None:
                finca.municipio = kwargs['municipio']
            if kwargs.get('ubicacion') is not None:
                finca.ubicacion = kwargs['ubicacion']
            if kwargs.get('telefono') is not None:
                finca.telefono = kwargs['telefono']
            if kwargs.get('activo') is not None:
                finca.activo = kwargs['activo']
            
            finca.save()
            return ActualizarFinca(finca=finca, success=True, message="Finca actualizada exitosamente")
        except Exception as e:
            return ActualizarFinca(finca=None, success=False, message=str(e))


class EliminarFinca(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            finca = Finca.objects.get(id=id)
            nombre = finca.nombre
            finca.delete()
            return EliminarFinca(success=True, message=f"Finca '{nombre}' eliminada")
        except Exception as e:
            return EliminarFinca(success=False, message=str(e))


class Mutation(graphene.ObjectType):
    crear_finca = CrearFinca.Field()
    actualizar_finca = ActualizarFinca.Field()
    eliminar_finca = EliminarFinca.Field()