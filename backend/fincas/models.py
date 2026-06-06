from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Finca(models.Model):
    nombre = models.CharField(max_length=150)
    propietario = models.CharField(max_length=150, blank=True, null=True)
    departamento = models.CharField(max_length=100, blank=True, null=True)
    municipio = models.CharField(max_length=100, blank=True, null=True)
    ubicacion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre


class TransferenciaFinca(models.Model):
    MOTIVO_CHOICES = [
        ('CAMBIO_FINCA',        'Cambio de finca'),
        ('ROTACION_GENERAL',    'Rotación general'),
        ('COMPRA_INTERNA',      'Compra interna'),
        ('REUBICACION',         'Reubicación'),
        ('MANEJO_SANITARIO',    'Manejo sanitario'),
        ('MANEJO_REPRODUCTIVO', 'Manejo reproductivo'),
        ('OTRO',                'Otro'),
    ]
    ESTADO_CHOICES = [
        ('BORRADOR',   'Borrador'),
        ('CONFIRMADA', 'Confirmada'),
        ('RECIBIDA',   'Recibida'),
        ('CANCELADA',  'Cancelada'),
    ]

    finca_origen = models.ForeignKey(
        Finca, on_delete=models.CASCADE,
        related_name='transferencias_salida'
    )
    finca_destino = models.ForeignKey(
        Finca, on_delete=models.CASCADE,
        related_name='transferencias_entrada'
    )
    fecha_transferencia = models.DateField()
    motivo = models.CharField(max_length=30, choices=MOTIVO_CHOICES, default='CAMBIO_FINCA')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    observaciones = models.TextField(blank=True, null=True)
    responsable = models.CharField(max_length=200, blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='transferencias_registradas'
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_confirmacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha_registro']
        indexes = [
            models.Index(fields=['finca_origen', 'estado'], name='tf_origen_estado_idx'),
            models.Index(fields=['finca_destino', 'estado'], name='tf_destino_estado_idx'),
            models.Index(fields=['fecha_transferencia'],     name='tf_fecha_idx'),
        ]

    def __str__(self):
        return f"Transferencia {self.finca_origen} → {self.finca_destino} ({self.fecha_transferencia})"

    def clean(self):
        if (
            self.finca_origen_id
            and self.finca_destino_id
            and self.finca_origen_id == self.finca_destino_id
        ):
            raise ValidationError("La finca origen no puede ser igual a la finca destino.")

    @property
    def total_animales(self):
        return self.detalles.count()


class DetalleTransferenciaFinca(models.Model):
    transferencia = models.ForeignKey(
        TransferenciaFinca, on_delete=models.CASCADE,
        related_name='detalles'
    )
    # String references to avoid circular imports (animales imports from fincas)
    animal = models.ForeignKey(
        'animales.Animal', on_delete=models.PROTECT,
        related_name='transferencias_detalle'
    )
    parcela_origen = models.ForeignKey(
        'animales.Parcela', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='detalles_transferencia_salida'
    )
    parcela_destino = models.ForeignKey(
        'animales.Parcela', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='detalles_transferencia_entrada'
    )
    estado_animal_antes = models.CharField(max_length=30, default='ACTIVO')
    estado_animal_despues = models.CharField(max_length=30, default='ACTIVO')
    peso_actual_transferencia = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    observaciones = models.TextField(blank=True, null=True)
    recibido = models.BooleanField(default=False)

    class Meta:
        unique_together = [['transferencia', 'animal']]

    def __str__(self):
        return f"{self.animal} → {self.transferencia.finca_destino}"
