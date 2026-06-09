# backend/rrhh/models.py
from django.db import models
from django.conf import settings
import uuid


class TipoEmpleado(models.Model):
    """Cargos o tipos de empleados"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    salario_base = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'rrhh_tipo_empleado'
        verbose_name = 'Tipo de Empleado'
        verbose_name_plural = 'Tipos de Empleados'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Empleado(models.Model):
    """Empleados de la finca"""
    
    SEXO_CHOICES = [
        ('MASCULINO', 'Masculino'),
        ('FEMENINO', 'Femenino'),
        ('OTRO', 'Otro'),
    ]
    
    # Estado legacy (operativo). Se mantiene por compatibilidad; el estado laboral
    # canónico para Fase 1 en adelante es `estado_laboral`.
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('INACTIVO', 'Inactivo'),
        ('LICENCIA', 'Licencia'),
        ('VACACIONES', 'Vacaciones'),
    ]

    # Tipo de empleado: define el rol operativo del personal dentro de la finca.
    # Sirve de base para relacionar luego con Sanidad, Producción, Compras, etc.
    # Nota: el valor se almacena en ASCII (ORDENADOR) para evitar problemas de
    # codificación en GraphQL/JS; la etiqueta visible sí usa "Ordeñador".
    TIPO_EMPLEADO_CHOICES = [
        ('ADMINISTRADOR', 'Administrador'),
        ('VAQUERO', 'Vaquero'),
        ('VETERINARIO', 'Veterinario'),
        ('ORDENADOR', 'Ordeñador'),
        ('ENCARGADO_COMPRAS', 'Encargado de Compras'),
        ('ENCARGADO_SANIDAD', 'Encargado de Sanidad'),
        ('ENCARGADO_PRODUCCION', 'Encargado de Producción'),
        ('OTRO', 'Otro'),
    ]

    ESTADO_LABORAL_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('LICENCIA', 'Licencia'),
        ('SUSPENDIDO', 'Suspendido'),
        ('RETIRADO', 'Retirado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Regla 1: cada empleado pertenece obligatoriamente a una finca.
    finca = models.ForeignKey('fincas.Finca', on_delete=models.CASCADE, related_name='empleados')
    # `tipo` es el CARGO del empleado (catálogo TipoEmpleado). Obligatorio.
    tipo = models.ForeignKey(TipoEmpleado, on_delete=models.PROTECT, related_name='empleados')
    
    # Datos personales
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100, blank=True, null=True)
    ci = models.CharField(max_length=30, unique=True, blank=True, null=True)
    sexo = models.CharField(max_length=20, choices=SEXO_CHOICES, default='MASCULINO')
    fecha_nacimiento = models.DateField(blank=True, null=True)
    
    # Contacto
    telefono = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    
    # Datos laborales
    tipo_empleado = models.CharField(
        max_length=30, choices=TIPO_EMPLEADO_CHOICES, default='OTRO',
        help_text='Rol operativo del empleado dentro de la finca.'
    )
    fecha_ingreso = models.DateField()
    salario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Estado laboral canónico (Fase 1+).
    estado_laboral = models.CharField(
        max_length=20, choices=ESTADO_LABORAL_CHOICES, default='ACTIVO'
    )
    # Salida del empleado. Si estado_laboral=RETIRADO, fecha_salida es obligatoria.
    fecha_salida = models.DateField(blank=True, null=True)
    motivo_salida = models.TextField(blank=True, null=True)
    # Campo legacy mantenido por compatibilidad con migraciones previas.
    fecha_retiro = models.DateField(blank=True, null=True)

    # Usuario del sistema relacionado (OPCIONAL). Permite usar al empleado para
    # permisos o auditoría. No todo empleado necesita iniciar sesión (Regla 3).
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='empleado_profile'
    )

    # Estado legacy (operativo). Mantener; usar estado_laboral como canónico.
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')

    # Foto
    imagen = models.ImageField(upload_to='empleados/', blank=True, null=True)

    # Documentos (OPCIONALES). Subibles desde el panel de administración;
    # quedan preparados para gestión documental futura.
    documento_ci = models.FileField(upload_to='empleados/documentos/', blank=True, null=True)
    contrato = models.FileField(upload_to='empleados/contratos/', blank=True, null=True)

    # Auditoría
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='empleados_registrados'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rrhh_empleado'
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'
        ordering = ['apellidos', 'nombre']
    
    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellidos or ''}".strip()

    @property
    def is_activo(self):
        return self.estado_laboral == 'ACTIVO'

    @property
    def cargo_nombre(self):
        """Nombre del cargo (catálogo TipoEmpleado)."""
        return self.tipo.nombre if self.tipo_id else None

    def __str__(self):
        return self.nombre_completo or self.nombre