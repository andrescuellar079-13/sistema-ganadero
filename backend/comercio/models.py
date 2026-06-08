# backend/comercio/models.py
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


class CorrallVenta(models.Model):
    """Agrupa animales para venta en lote/corral"""
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="corrales_venta"
    )
    nombre = models.CharField(max_length=100, help_text="Ej: Corral A, Lote Norte")
    descripcion = models.TextField(blank=True, null=True)
    fecha_formacion = models.DateField()
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_formacion"]
        verbose_name = "Corral de Venta"
        verbose_name_plural = "Corrales de Venta"

    def __str__(self):
        return f"{self.nombre} ({self.fecha_formacion})"

    @property
    def total_animales(self):
        return self.animales.count()

    @property
    def peso_total(self):
        return sum(a.peso or 0 for a in self.animales.all())


class AnimalCorral(models.Model):
    """Animal asignado a un corral de venta"""
    corral = models.ForeignKey(
        CorrallVenta,
        on_delete=models.CASCADE,
        related_name="animales"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="corrales"
    )
    peso_entrada = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_ingreso = models.DateField()
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = [['corral', 'animal']]
        verbose_name = "Animal en Corral"
        verbose_name_plural = "Animales en Corral"

    def __str__(self):
        return f"{self.animal.nro_arete} → {self.corral.nombre}"


class NotaVenta(models.Model):
    MODALIDAD_CHOICES = [
        ("POR_KILO", "Por Kilo"),
        ("POR_CABEZA", "Por Cabeza"),
        ("MIXTO", "Mixto"),
    ]

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
    corral = models.ForeignKey(
        CorrallVenta,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ventas"
    )

    modalidad_venta = models.CharField(
        max_length=20,
        choices=MODALIDAD_CHOICES,
        default="POR_KILO"
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
    MODALIDAD_CHOICES = [
        ("POR_KILO", "Por Kilo"),
        ("POR_CABEZA", "Por Cabeza"),
    ]

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

    modalidad = models.CharField(
        max_length=20,
        choices=MODALIDAD_CHOICES,
        default="POR_KILO"
    )
    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Precio por kilo o precio por cabeza según modalidad"
    )
    peso_venta_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Utilidad
    costo_estimado = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Costo de adquisición del animal"
    )
    utilidad = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="sub_total - costo_estimado"
    )

    class Meta:
        verbose_name = "Detalle de venta"
        verbose_name_plural = "Detalles de venta"

    def save(self, *args, **kwargs):
        if self.modalidad == "POR_KILO":
            self.sub_total = self.precio_unitario * self.peso_venta_kg
        else:  # POR_CABEZA
            self.sub_total = self.precio_unitario

        self.utilidad = self.sub_total - self.costo_estimado

        if self.animal:
            self.animal.estado = "VENDIDO"
            if self.modalidad == "POR_KILO" and self.peso_venta_kg:
                self.animal.peso = self.peso_venta_kg
            self.animal.save(update_fields=["estado", "peso"])

        super().save(*args, **kwargs)

        if self.nota_venta:
            self.nota_venta.calcular_total()

    def __str__(self):
        return f"{self.animal} - {self.modalidad} - Bs {self.sub_total}"


class MuerteBaja(models.Model):
    TIPO_BAJA_CHOICES = [
        ("MUERTE", "Muerte"),
        ("ROBO", "Robo"),
        ("SACRIFICIO", "Sacrificio"),
        ("DESCARTE", "Descarte"),
        ("PERDIDA", "Pérdida"),
        ("OTRO", "Otro"),
    ]

    MOTIVO_DESCARTE_CHOICES = [
        ("EDAD_AVANZADA", "Edad avanzada"),
        ("BAJA_PRODUCCION", "Baja producción"),
        ("PROBLEMAS_REPRODUCTIVOS", "Problemas reproductivos"),
        ("ENFERMEDAD_CRONICA", "Enfermedad crónica"),
        ("LESION_PERMANENTE", "Lesión permanente"),
        ("MAL_CARACTER", "Mal carácter"),
        ("DECISION_ECONOMICA", "Decisión económica"),
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
    motivo_descarte = models.CharField(
        max_length=50,
        choices=MOTIVO_DESCARTE_CHOICES,
        blank=True, null=True,
        help_text="Solo aplica cuando tipo=DESCARTE"
    )
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