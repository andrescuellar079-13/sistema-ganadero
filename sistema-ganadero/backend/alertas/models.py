from django.conf import settings
from django.db import models

from fincas.models import Finca
from animales.models import Animal


class Gasto(models.Model):
    TIPO_GASTO_CHOICES = [
        ("SANIDAD", "Sanidad"),
        ("REPRODUCCION", "Reproducción"),
        ("ALIMENTO", "Alimento"),
        ("MANO_DE_OBRA", "Mano de obra"),
        ("TRANSPORTE", "Transporte"),
        ("MANTENIMIENTO", "Mantenimiento"),
        ("COMBUSTIBLE", "Combustible"),
        ("OTRO", "Otro"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="gastos"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gastos"
    )

    fecha = models.DateField()
    tipo_gasto = models.CharField(max_length=30, choices=TIPO_GASTO_CHOICES)
    descripcion = models.TextField()
    cantidad = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gastos_registrados"
    )

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha"]
        verbose_name = "Gasto"
        verbose_name_plural = "Gastos"

    def save(self, *args, **kwargs):
        self.total = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tipo_gasto} - {self.fecha} - Bs {self.total}"


class Alerta(models.Model):
    TIPO_ALERTA_CHOICES = [
        ("VACUNA_PROXIMA", "Vacuna próxima"),
        ("VACUNA_VENCIDA", "Vacuna vencida"),
        ("PARTO_PROXIMO", "Parto próximo"),
        ("STOCK_BAJO_MEDICAMENTO", "Stock bajo de medicamento"),
        ("STOCK_BAJO_ALIMENTO", "Stock bajo de alimento"),
        ("PESAJE_PENDIENTE", "Pesaje pendiente"),
        ("OTRO", "Otro"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="alertas"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alertas"
    )

    tipo = models.CharField(max_length=50, choices=TIPO_ALERTA_CHOICES)
    mensaje = models.TextField()
    fecha_alerta = models.DateField()
    dias_restantes = models.IntegerField(default=0)
    leida = models.BooleanField(default=False)

    referencia_id = models.IntegerField(blank=True, null=True)
    referencia_tipo = models.CharField(max_length=100, blank=True, null=True)

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_alerta"]
        verbose_name = "Alerta"
        verbose_name_plural = "Alertas"

    def marcar_leida(self):
        self.leida = True
        self.save(update_fields=["leida"])

    def __str__(self):
        return f"{self.tipo} - {self.fecha_alerta}"