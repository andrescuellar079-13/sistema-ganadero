from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class ConfiguracionSistema(models.Model):
    """Configuración global del sistema - Singleton"""
    
    class Meta:
        verbose_name = "Configuración del Sistema"
        verbose_name_plural = "Configuraciones del Sistema"
    
    def save(self, *args, **kwargs):
        if not self.pk and ConfiguracionSistema.objects.exists():
            return  # No crear múltiples instancias
        super().save(*args, **kwargs)
    
    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    # ==========================================
    # 1. CONFIGURACIÓN GENERAL
    # ==========================================
    nombre_sistema = models.CharField(max_length=100, default='GanadoSoft')
    logo = models.ImageField(upload_to='sistema/logos/', null=True, blank=True)
    favicon = models.ImageField(upload_to='sistema/favicons/', null=True, blank=True)
    
    TEMA_CHOICES = [
        ('CLARO', 'Claro'),
        ('OSCURO', 'Oscuro'),
    ]
    tema = models.CharField(max_length=10, choices=TEMA_CHOICES, default='CLARO')
    
    IDIOMA_CHOICES = [
        ('es', 'Español'),
        ('en', 'English'),
        ('pt', 'Português'),
    ]
    idioma = models.CharField(max_length=5, choices=IDIOMA_CHOICES, default='es')
    
    moneda = models.CharField(max_length=10, default='Gs.')
    simbolo_moneda = models.CharField(max_length=5, default='₲')
    formato_fecha = models.CharField(max_length=20, default='DD/MM/YYYY')
    
    # ==========================================
    # 2. CONFIGURACIÓN DE SEGURIDAD (JWT)
    # ==========================================
    intentos_login = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(20)])
    tiempo_bloqueo_min = models.IntegerField(default=30, help_text="Minutos que se bloquea la cuenta")
    
    jwt_expiration_horas = models.IntegerField(default=8, help_text="Horas hasta que expira el token de acceso")
    jwt_refresh_expiration_dias = models.IntegerField(default=7, help_text="Días hasta que expira el token de refresco")
    
    requerir_2fa = models.BooleanField(default=False)
    
    COMPLEJIDAD_CONTRASENA_CHOICES = [
        ('BAJA', 'Baja - 6 caracteres'),
        ('MEDIA', 'Media - 8 caracteres, mayúscula, número'),
        ('ALTA', 'Alta - 10 caracteres, mayúscula, minúscula, número, símbolo'),
    ]
    complejidad_contrasena = models.CharField(max_length=10, choices=COMPLEJIDAD_CONTRASENA_CHOICES, default='MEDIA')
    caducidad_contrasena_dias = models.IntegerField(default=90)
    registro_acciones = models.BooleanField(default=True)
    
    # ==========================================
    # 3. CONFIGURACIÓN DE NOTIFICACIONES (Email)
    # ==========================================
    email_smtp_host = models.CharField(max_length=200, blank=True, null=True)
    email_smtp_port = models.IntegerField(default=587)
    email_smtp_user = models.CharField(max_length=200, blank=True, null=True)
    email_smtp_password = models.CharField(max_length=200, blank=True, null=True)
    email_use_tls = models.BooleanField(default=True)
    email_from = models.EmailField(blank=True, null=True)
    
    # ==========================================
    # 4. CONFIGURACIÓN DE REPORTES
    # ==========================================
    logo_reportes = models.ImageField(upload_to='sistema/reportes/', null=True, blank=True)
    pie_pagina_reportes = models.CharField(max_length=500, blank=True, null=True)
    
    FORMATO_REPORTE_CHOICES = [
        ('PDF', 'PDF'),
        ('EXCEL', 'Excel'),
    ]
    formato_por_defecto = models.CharField(max_length=10, choices=FORMATO_REPORTE_CHOICES, default='PDF')
    max_registros_reporte = models.IntegerField(default=1000)
    
    # ==========================================
    # 5. CONFIGURACIÓN DE BACKUP
    # ==========================================
    backup_automatico = models.BooleanField(default=False)
    
    FRECUENCIA_BACKUP_CHOICES = [
        ('DIARIO', 'Diario'),
        ('SEMANAL', 'Semanal'),
        ('MENSUAL', 'Mensual'),
    ]
    frecuencia_backup = models.CharField(max_length=10, choices=FRECUENCIA_BACKUP_CHOICES, default='SEMANAL')
    hora_backup = models.TimeField(null=True, blank=True)
    retencion_backup_dias = models.IntegerField(default=30)
    ubicacion_backup = models.CharField(max_length=500, blank=True, null=True)
    
    # ==========================================
    # 6. MÓDULOS ACTIVOS
    # ==========================================
    modulo_sanidad = models.BooleanField(default=True)
    modulo_reproduccion = models.BooleanField(default=True)
    modulo_produccion = models.BooleanField(default=True)
    modulo_rrhh = models.BooleanField(default=True)
    modulo_compras = models.BooleanField(default=True)
    modulo_ventas = models.BooleanField(default=True)
    modulo_alertas = models.BooleanField(default=True)
    modulo_proveedores = models.BooleanField(default=True)
    modulo_clientes = models.BooleanField(default=True)
    modulo_bajas = models.BooleanField(default=True)
    
    # ==========================================
    # 7. PARÁMETROS DE PRODUCCIÓN
    # ==========================================
    dias_gestacion = models.IntegerField(default=283, help_text="Días de gestación bovina")
    dias_lactancia = models.IntegerField(default=305, help_text="Duración promedio de lactancia")
    edad_destete_dias = models.IntegerField(default=210)
    peso_min_destete_kg = models.DecimalField(max_digits=10, decimal_places=2, default=180)
    
    # ==========================================
    # Auditoría
    # ==========================================
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    actualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='configuraciones_actualizadas'
    )

    def __str__(self):
        return f"Configuración - {self.nombre_sistema}"


class LogActividad(models.Model):
    """Registro de actividades de usuarios para auditoría"""
    
    ACCION_CHOICES = [
        ('CREATE', 'Creación'),
        ('UPDATE', 'Actualización'),
        ('DELETE', 'Eliminación'),
        ('LOGIN', 'Inicio de sesión'),
        ('LOGOUT', 'Cierre de sesión'),
        ('LOGIN_FAILED', 'Inicio de sesión fallido'),
        ('EXPORT', 'Exportación'),
        ('IMPORT', 'Importación'),
    ]
    
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='logs')
    accion = models.CharField(max_length=20, choices=ACCION_CHOICES)
    modulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log de Actividad"
        verbose_name_plural = "Logs de Actividades"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.usuario.username} - {self.accion} - {self.created_at}"