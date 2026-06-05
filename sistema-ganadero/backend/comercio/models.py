from django.conf import settings
from django.db import models

from fincas.models import Finca
from animales.models import Animal


class Cliente(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="clientes"
    )
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    ci = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        return f"{self.nombre} {self.apellidos or ''}"


class NotaVenta(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="notas_venta"
    )
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="compras"
    )

    monto_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_venta = models.DateField()
    guia_salida = models.CharField(max_length=100, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ventas_registradas"
    )

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_venta"]
        verbose_name = "Nota de venta"
        verbose_name_plural = "Notas de venta"

    def calcular_total(self):
        total = sum([detalle.sub_total for detalle in self.detalles.all()])
        self.monto_total = total
        self.save(update_fields=["monto_total"])
        return total

    def __str__(self):
        return f"Venta #{self.id} - {self.fecha_venta} - Bs {self.monto_total}"


class DetalleVenta(models.Model):
    nota_venta = models.ForeignKey(
        NotaVenta,
        on_delete=models.CASCADE,
        related_name="detalles"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.PROTECT,
        related_name="detalles_venta"
    )

    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Precio por kilo o precio unitario según la venta"
    )
    peso_venta_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Detalle de venta"
        verbose_name_plural = "Detalles de venta"

    def save(self, *args, **kwargs):
        self.sub_total = self.precio_unitario * self.peso_venta_kg

        if self.animal:
            self.animal.estado = "VENDIDO"
            self.animal.peso = self.peso_venta_kg
            self.animal.save(update_fields=["estado", "peso"])

        super().save(*args, **kwargs)

        if self.nota_venta:
            self.nota_venta.calcular_total()

    def __str__(self):
        return f"{self.animal} - Bs {self.sub_total}"


class MuerteBaja(models.Model):
    TIPO_BAJA_CHOICES = [
        ("MUERTE", "Muerte"),
        ("ROBO", "Robo"),
        ("SACRIFICIO", "Sacrificio"),
        ("DESCARTE", "Descarte"),
        ("PERDIDA", "Pérdida"),
        ("OTRO", "Otro"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="muertes_bajas"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="muertes_bajas"
    )

    fecha_baja = models.DateField()
    causa = models.CharField(max_length=200)
    tipo = models.CharField(max_length=30, choices=TIPO_BAJA_CHOICES)
    descripcion = models.TextField(blank=True, null=True)
    peso_estimado_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bajas_registradas"
    )

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_baja"]
        verbose_name = "Muerte o baja"
        verbose_name_plural = "Muertes y bajas"

    def save(self, *args, **kwargs):
        if self.tipo == "MUERTE":
            self.animal.estado = "MUERTO"
        elif self.tipo == "DESCARTE":
            self.animal.estado = "DESCARTE"
        elif self.tipo == "SACRIFICIO":
            self.animal.estado = "MATADERO"

        self.animal.save(update_fields=["estado"])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.animal} - {self.tipo} - {self.fecha_baja}"