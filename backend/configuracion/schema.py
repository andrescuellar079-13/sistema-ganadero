import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required, staff_member_required
from django.core.exceptions import PermissionDenied
from django.conf import settings
from datetime import timedelta
from .models import ConfiguracionSistema, LogActividad

# ==========================================
# TYPES
# ==========================================

class ConfiguracionSistemaType(DjangoObjectType):
    class Meta:
        model = ConfiguracionSistema
        fields = "__all__"


class LogActividadType(DjangoObjectType):
    fecha = graphene.DateTime()
    
    class Meta:
        model = LogActividad
        fields = "__all__"
    
    def resolve_fecha(self, info):
        return self.created_at


# ==========================================
# QUERIES
# ==========================================

class Query(graphene.ObjectType):
    configuracion_sistema = graphene.Field(ConfiguracionSistemaType)
    logs_actividad = graphene.List(LogActividadType, limit=graphene.Int(), offset=graphene.Int())
    
    @login_required
    def resolve_configuracion_sistema(self, info):
        if not info.context.user.is_staff and not info.context.user.is_superuser:
            raise PermissionDenied("No tienes permiso para ver la configuración")
        return ConfiguracionSistema.load()
    
    @staff_member_required
    def resolve_logs_actividad(self, info, limit=None, offset=None):
        queryset = LogActividad.objects.all()
        if offset:
            queryset = queryset[offset:]
        if limit:
            queryset = queryset[:limit]
        return queryset


# ==========================================
# MUTATIONS
# ==========================================

class ActualizarConfiguracionSistema(graphene.Mutation):
    class Arguments:
        nombre_sistema = graphene.String()
        tema = graphene.String()
        idioma = graphene.String()
        moneda = graphene.String()
        simbolo_moneda = graphene.String()
        formato_fecha = graphene.String()
        intentos_login = graphene.Int()
        tiempo_bloqueo_min = graphene.Int()
        jwt_expiration_horas = graphene.Int()
        jwt_refresh_expiration_dias = graphene.Int()
        requerir_2fa = graphene.Boolean()
        complejidad_contrasena = graphene.String()
        caducidad_contrasena_dias = graphene.Int()
        registro_acciones = graphene.Boolean()
        email_smtp_host = graphene.String()
        email_smtp_port = graphene.Int()
        email_smtp_user = graphene.String()
        email_smtp_password = graphene.String()
        email_use_tls = graphene.Boolean()
        email_from = graphene.String()
        pie_pagina_reportes = graphene.String()
        formato_por_defecto = graphene.String()
        max_registros_reporte = graphene.Int()
        backup_automatico = graphene.Boolean()
        frecuencia_backup = graphene.String()
        hora_backup = graphene.Time()
        retencion_backup_dias = graphene.Int()
        modulo_sanidad = graphene.Boolean()
        modulo_reproduccion = graphene.Boolean()
        modulo_produccion = graphene.Boolean()
        modulo_rrhh = graphene.Boolean()
        modulo_compras = graphene.Boolean()
        modulo_ventas = graphene.Boolean()
        modulo_alertas = graphene.Boolean()
        modulo_proveedores = graphene.Boolean()
        modulo_clientes = graphene.Boolean()
        modulo_bajas = graphene.Boolean()
        dias_gestacion = graphene.Int()
        dias_lactancia = graphene.Int()
        edad_destete_dias = graphene.Int()
        peso_min_destete_kg = graphene.Decimal()

    configuracion = graphene.Field(ConfiguracionSistemaType)
    success = graphene.Boolean()
    message = graphene.String()

    @staff_member_required
    def mutate(self, info, **kwargs):
        try:
            config = ConfiguracionSistema.load()
            
            for key, value in kwargs.items():
                if value is not None:
                    setattr(config, key, value)
            
            config.actualizado_por = info.context.user
            config.save()
            
            # Registrar en log
            if config.registro_acciones:
                LogActividad.objects.create(
                    usuario=info.context.user,
                    accion='UPDATE',
                    modulo='ConfiguracionSistema',
                    descripcion="Actualizó la configuración del sistema",
                    ip=info.context.META.get('REMOTE_ADDR'),
                    user_agent=info.context.META.get('HTTP_USER_AGENT')
                )
            
            return ActualizarConfiguracionSistema(
                configuracion=config,
                success=True,
                message="Configuración actualizada exitosamente"
            )
        except Exception as e:
            return ActualizarConfiguracionSistema(
                configuracion=None,
                success=False,
                message=str(e)
            )


class RegistrarLogActividad(graphene.Mutation):
    class Arguments:
        accion = graphene.String(required=True)
        modulo = graphene.String(required=True)
        descripcion = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, accion, modulo, descripcion):
        try:
            config = ConfiguracionSistema.load()
            if config.registro_acciones:
                LogActividad.objects.create(
                    usuario=info.context.user,
                    accion=accion,
                    modulo=modulo,
                    descripcion=descripcion,
                    ip=info.context.META.get('REMOTE_ADDR'),
                    user_agent=info.context.META.get('HTTP_USER_AGENT')
                )
            return RegistrarLogActividad(success=True, message="Log registrado")
        except Exception as e:
            return RegistrarLogActividad(success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    actualizar_configuracion_sistema = ActualizarConfiguracionSistema.Field()
    registrar_log_actividad = RegistrarLogActividad.Field()