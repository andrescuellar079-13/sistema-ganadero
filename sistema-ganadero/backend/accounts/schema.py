# backend/accounts/schema.py
import graphene
import graphql_jwt
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required
from django.contrib.auth.hashers import make_password

from .models import Usuario, Rol


# ==========================================
# DEFINICIÓN DE PERMISOS DEL SISTEMA
# ==========================================

PERMISOS_SISTEMA = {
    # Módulo Dashboard
    'dashboard_ver': 'Ver Dashboard',
    
    # Módulo Animales
    'animales_ver': 'Ver animales',
    'animales_crear': 'Crear animales',
    'animales_editar': 'Editar animales',
    'animales_eliminar': 'Eliminar animales',
    
    # Módulo Vacunas
    'vacunas_ver': 'Ver vacunas',
    'vacunas_crear': 'Crear vacunas',
    'vacunas_editar': 'Editar vacunas',
    'vacunas_eliminar': 'Eliminar vacunas',
    
    # Módulo Vacunaciones
    'vacunaciones_ver': 'Ver vacunaciones',
    'vacunaciones_crear': 'Registrar vacunaciones',
    
    # Módulo Reproducción
    'reproduccion_ver': 'Ver reproducción',
    'reproduccion_crear': 'Registrar eventos reproductivos',
    
    # Módulo Producción
    'produccion_ver': 'Ver producción',
    'produccion_crear': 'Registrar producción',
    
    # Módulo Sanidad
    'sanidad_ver': 'Ver sanidad',
    'sanidad_crear': 'Registrar eventos sanitarios',
    
    # Módulo Ventas
    'ventas_ver': 'Ver ventas',
    'ventas_crear': 'Registrar ventas',
    
    # Módulo Compras
    'compras_ver': 'Ver compras',
    'compras_crear': 'Registrar compras',
    
    # Módulo RRHH
    'rrhh_ver': 'Ver empleados',
    'rrhh_crear': 'Crear empleados',
    'rrhh_editar': 'Editar empleados',
    'rrhh_eliminar': 'Eliminar empleados',
    
    # Módulo Alertas
    'alertas_ver': 'Ver alertas',
    'alertas_crear': 'Crear alertas',
    
    # Módulo Parcelas
    'parcelas_ver': 'Ver parcelas',
    'parcelas_crear': 'Crear parcelas',
    'parcelas_editar': 'Editar parcelas',
    'parcelas_eliminar': 'Eliminar parcelas',
    
    # Módulo Configuración
    'configuracion_ver': 'Ver configuración',
    'configuracion_editar': 'Editar configuración',
    
    # Módulo Usuarios y Roles (solo administradores)
    'usuarios_ver': 'Ver usuarios',
    'usuarios_crear': 'Crear usuarios',
    'usuarios_editar': 'Editar usuarios',
    'usuarios_eliminar': 'Eliminar usuarios',
    'roles_ver': 'Ver roles',
    'roles_crear': 'Crear roles',
    'roles_editar': 'Editar roles',
    'roles_eliminar': 'Eliminar roles',
}


# ==========================================
# TYPES
# ==========================================

class RolType(DjangoObjectType):
    permisosLista = graphene.List(graphene.String)
    
    class Meta:
        model = Rol
        fields = "__all__"
    
    def resolve_permisosLista(self, info):
        if not self.permisos:
            return []
        if isinstance(self.permisos, list):
            return self.permisos
        if isinstance(self.permisos, dict):
            return [key for key, val in self.permisos.items() if val]
        return []


class UsuarioType(DjangoObjectType):
    nombre_completo = graphene.String()
    tienePermiso = graphene.Boolean(permiso=graphene.String(required=True))
    
    class Meta:
        model = Usuario
        fields = ("id", "username", "email", "first_name", "last_name", "rol", "is_active", "telefono", "finca")
    
    def resolve_nombre_completo(self, info):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    def resolve_tienePermiso(self, info, permiso):
        return self.tiene_permiso(permiso)


# ==========================================
# QUERIES
# ==========================================

class Query(graphene.ObjectType):
    roles = graphene.List(RolType)
    usuarios = graphene.List(UsuarioType)
    rol_por_id = graphene.Field(RolType, id=graphene.ID(required=True))
    rol_por_nombre = graphene.Field(RolType, nombre=graphene.String(required=True))
    usuario_por_id = graphene.Field(UsuarioType, id=graphene.ID(required=True))
    usuario_por_username = graphene.Field(UsuarioType, username=graphene.String(required=True))
    mi_usuario = graphene.Field(UsuarioType)
    
    # Permisos
    permisos_sistema = graphene.List(graphene.String)
    permisos_sistema_dict = graphene.JSONString()

    @login_required
    def resolve_roles(self, info):
        return Rol.objects.all()

    @login_required
    def resolve_usuarios(self, info):
        return Usuario.objects.all()
    
    @login_required
    def resolve_rol_por_id(self, info, id):
        try:
            return Rol.objects.get(id=id)
        except Rol.DoesNotExist:
            return None
    
    @login_required
    def resolve_rol_por_nombre(self, info, nombre):
        try:
            return Rol.objects.get(nombre=nombre)
        except Rol.DoesNotExist:
            return None
    
    @login_required
    def resolve_usuario_por_id(self, info, id):
        try:
            return Usuario.objects.get(id=id)
        except Usuario.DoesNotExist:
            return None
    
    @login_required
    def resolve_usuario_por_username(self, info, username):
        try:
            return Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            return None
    
    @login_required
    def resolve_mi_usuario(self, info):
        return info.context.user
    
    @login_required
    def resolve_permisos_sistema(self, info):
        return list(PERMISOS_SISTEMA.keys())
    
    @login_required
    def resolve_permisos_sistema_dict(self, info):
        return PERMISOS_SISTEMA


# ==========================================
# MUTATIONS - ROLES
# ==========================================

class CrearRolMutation(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        descripcion = graphene.String(required=False)
        permisos = graphene.List(graphene.String)

    rol = graphene.Field(RolType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, descripcion=None, permisos=None):
        try:
            if Rol.objects.filter(nombre=nombre).exists():
                return CrearRolMutation(
                    success=False,
                    message=f"El rol '{nombre}' ya existe",
                    rol=None
                )
            
            rol = Rol.objects.create(
                nombre=nombre,
                descripcion=descripcion or "",
                permisos=permisos or []
            )
            
            return CrearRolMutation(
                success=True,
                message="Rol creado exitosamente",
                rol=rol
            )
        except Exception as e:
            return CrearRolMutation(
                success=False,
                message=f"Error al crear rol: {str(e)}",
                rol=None
            )


class ActualizarRolMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String(required=False)
        descripcion = graphene.String(required=False)
        permisos = graphene.List(graphene.String)
        activo = graphene.Boolean()
    
    rol = graphene.Field(RolType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id, nombre=None, descripcion=None, permisos=None, activo=None):
        try:
            rol = Rol.objects.get(id=id)
            
            if nombre:
                if Rol.objects.filter(nombre=nombre).exclude(id=id).exists():
                    return ActualizarRolMutation(
                        success=False,
                        message=f"Ya existe un rol con el nombre '{nombre}'",
                        rol=None
                    )
                rol.nombre = nombre
            
            if descripcion is not None:
                rol.descripcion = descripcion
            if permisos is not None:
                rol.permisos = permisos
            if activo is not None:
                rol.activo = activo
            
            rol.save()
            
            return ActualizarRolMutation(
                success=True,
                message="Rol actualizado exitosamente",
                rol=rol
            )
        except Rol.DoesNotExist:
            return ActualizarRolMutation(
                success=False,
                message="Rol no encontrado",
                rol=None
            )
        except Exception as e:
            return ActualizarRolMutation(
                success=False,
                message=f"Error al actualizar rol: {str(e)}",
                rol=None
            )


class EliminarRolMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id):
        try:
            rol = Rol.objects.get(id=id)
            nombre = rol.nombre
            rol.delete()
            return EliminarRolMutation(
                success=True, 
                message=f"Rol '{nombre}' eliminado exitosamente"
            )
        except Rol.DoesNotExist:
            return EliminarRolMutation(
                success=False, 
                message="Rol no encontrado"
            )
        except Exception as e:
            return EliminarRolMutation(
                success=False,
                message=f"Error al eliminar rol: {str(e)}"
            )


# ==========================================
# MUTATIONS - USUARIOS
# ==========================================

class CrearUsuarioMutation(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String()
        password = graphene.String(required=True)
        first_name = graphene.String()
        last_name = graphene.String()
        rol_id = graphene.ID()
        finca_id = graphene.ID()
        telefono = graphene.String()
        is_active = graphene.Boolean()
    
    usuario = graphene.Field(UsuarioType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, username, password, email=None, first_name=None, last_name=None, rol_id=None, finca_id=None, telefono=None, is_active=True):
        try:
            from fincas.models import Finca
            
            if Usuario.objects.filter(username=username).exists():
                return CrearUsuarioMutation(
                    success=False,
                    message=f"El usuario '{username}' ya existe",
                    usuario=None
                )
            
            finca = None
            if finca_id:
                finca = Finca.objects.filter(id=finca_id).first()
            
            rol = None
            if rol_id:
                rol = Rol.objects.filter(id=rol_id).first()
            
            usuario = Usuario.objects.create(
                username=username,
                email=email or "",
                first_name=first_name or "",
                last_name=last_name or "",
                password=make_password(password),
                is_active=is_active,
                finca=finca,
                rol=rol,
                telefono=telefono or ""
            )
            
            return CrearUsuarioMutation(
                success=True,
                message=f"Usuario {username} creado exitosamente",
                usuario=usuario
            )
        except Exception as e:
            return CrearUsuarioMutation(
                success=False,
                message=f"Error: {str(e)}",
                usuario=None
            )


class ActualizarUsuarioMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        username = graphene.String()
        email = graphene.String()
        first_name = graphene.String()
        last_name = graphene.String()
        rol_id = graphene.ID()
        telefono = graphene.String()
        is_active = graphene.Boolean()
    
    usuario = graphene.Field(UsuarioType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id, username=None, email=None, first_name=None, last_name=None, rol_id=None, telefono=None, is_active=None):
        try:
            usuario = Usuario.objects.get(id=id)
            
            if username:
                usuario.username = username
            if email is not None:
                usuario.email = email
            if first_name is not None:
                usuario.first_name = first_name
            if last_name is not None:
                usuario.last_name = last_name
            if is_active is not None:
                usuario.is_active = is_active
            if telefono is not None:
                usuario.telefono = telefono
            if rol_id:
                rol = Rol.objects.filter(id=rol_id).first()
                if rol:
                    usuario.rol = rol
            
            usuario.save()
            
            return ActualizarUsuarioMutation(
                success=True,
                message="Usuario actualizado exitosamente",
                usuario=usuario
            )
        except Usuario.DoesNotExist:
            return ActualizarUsuarioMutation(
                success=False,
                message="Usuario no encontrado",
                usuario=None
            )
        except Exception as e:
            return ActualizarUsuarioMutation(
                success=False,
                message=f"Error: {str(e)}",
                usuario=None
            )


class EliminarUsuarioMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id):
        try:
            usuario = Usuario.objects.get(id=id)
            username = usuario.username
            usuario.delete()
            return EliminarUsuarioMutation(
                success=True,
                message=f"Usuario {username} eliminado exitosamente"
            )
        except Usuario.DoesNotExist:
            return EliminarUsuarioMutation(
                success=False,
                message="Usuario no encontrado"
            )
        except Exception as e:
            return EliminarUsuarioMutation(
                success=False,
                message=f"Error: {str(e)}"
            )


class AsignarRolAUsuarioMutation(graphene.Mutation):
    class Arguments:
        usuario_id = graphene.ID(required=True)
        rol_id = graphene.ID(required=True)
    
    usuario = graphene.Field(UsuarioType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, usuario_id, rol_id):
        try:
            usuario = Usuario.objects.get(id=usuario_id)
            rol = Rol.objects.get(id=rol_id)
            
            usuario.rol = rol
            usuario.save()
            
            return AsignarRolAUsuarioMutation(
                success=True,
                message=f"Rol '{rol.nombre}' asignado a {usuario.username}",
                usuario=usuario
            )
        except Usuario.DoesNotExist:
            return AsignarRolAUsuarioMutation(
                success=False,
                message="Usuario no encontrado",
                usuario=None
            )
        except Rol.DoesNotExist:
            return AsignarRolAUsuarioMutation(
                success=False,
                message="Rol no encontrado",
                usuario=None
            )
        except Exception as e:
            return AsignarRolAUsuarioMutation(
                success=False,
                message=f"Error: {str(e)}",
                usuario=None
            )


class LogoutMutation(graphene.Mutation):
    success = graphene.Boolean()

    def mutate(self, info):
        return LogoutMutation(success=True)


class CambiarPasswordMutation(graphene.Mutation):
    class Arguments:
        old_password = graphene.String(required=True)
        new_password = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, old_password, new_password):
        try:
            user = info.context.user
            
            if not user.check_password(old_password):
                return CambiarPasswordMutation(
                    success=False,
                    message="Contraseña actual incorrecta"
                )
            
            user.password = make_password(new_password)
            user.save()
            
            return CambiarPasswordMutation(
                success=True,
                message="Contraseña cambiada exitosamente"
            )
        except Exception as e:
            return CambiarPasswordMutation(
                success=False,
                message=f"Error: {str(e)}"
            )


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    # Autenticación JWT
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    delete_token_cookie = graphql_jwt.DeleteJSONWebTokenCookie.Field()
    logout = LogoutMutation.Field()

    # Roles
    crearRol = CrearRolMutation.Field()
    actualizarRol = ActualizarRolMutation.Field()
    eliminarRol = EliminarRolMutation.Field()
    
    # Usuarios
    crearUsuario = CrearUsuarioMutation.Field()
    actualizarUsuario = ActualizarUsuarioMutation.Field()
    eliminarUsuario = EliminarUsuarioMutation.Field()
    asignarRolAUsuario = AsignarRolAUsuarioMutation.Field()
    cambiarPassword = CambiarPasswordMutation.Field()