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
    
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('INACTIVO', 'Inactivo'),
        ('LICENCIA', 'Licencia'),
        ('VACACIONES', 'Vacaciones'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    finca = models.ForeignKey('fincas.Finca', on_delete=models.CASCADE, related_name='empleados')
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
    fecha_ingreso = models.DateField()
    fecha_retiro = models.DateField(blank=True, null=True)
    salario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Usuario del sistema (si tiene acceso)
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='empleado_profile'
    )
    
    # Estado
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')
    
    # Foto
    imagen = models.ImageField(upload_to='empleados/', blank=True, null=True)
    
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
        return f"{self.nombre} {self.apellidos}".strip()
    
    @property
    def is_activo(self):
        return self.estado == 'ACTIVO'
    
    def __str__(self):
        return self.nombre_completo or self.nombre