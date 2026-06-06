# backend/compras/models.py
from django.conf import settings
from django.db import models

from fincas.models import Finca
from catalogos.models import Medicamento, Alimento, Raza, CategoriaAnimal


class Proveedor(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="proveedores"
    )

    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    estado = models.BooleanField(default=True)
    nit = models.CharField(max_length=50, blank=True, null=True)
    ci = models.CharField(max_length=30, blank=True, null=True)

    class Meta:
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"

    def __str__(self):
        return f"{self.nombre} {self.apellidos or ''}"


class NotaCompra(models.Model):
    TIPO_COMPRA_CHOICES = [
        ("MEDICAMENTO", "Medicamento"),
        ("ALIMENTO", "Alimento"),
        ("ANIMAL", "Animal"),
        ("OTRO", "Otro"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="notas_compra"
    )
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="compras"
    )

    tipo_compra = models.CharField(
        max_length=30,
        choices=TIPO_COMPRA_CHOICES,
        default="MEDICAMENTO"
    )

    fecha_compra = models.DateField()
    monto_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    observaciones = models.TextField(blank=True, null=True)

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="compras_registradas"
    )

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_compra"]
        verbose_name = "Nota de compra"
        verbose_name_plural = "Notas de compra"

    def calcular_total(self):
        total_medicamentos = sum([detalle.sub_total for detalle in self.detalles_medicamentos.all()])
        total_alimentos = sum([detalle.sub_total for detalle in self.detalles_alimentos.all()])
        total_animales = sum([detalle.sub_total for detalle in self.detalles_animales.all()])
        self.monto_total = total_medicamentos + total_alimentos + total_animales
        self.save(update_fields=["monto_total"])
        return self.monto_total

    def __str__(self):
        return f"Compra #{self.id} - {self.fecha_compra} - Bs {self.monto_total}"


class DetalleCompra(models.Model):
    nota_compra = models.ForeignKey(
        NotaCompra,
        on_delete=models.CASCADE,
        related_name="detalles_medicamentos"
    )
    medicamento = models.ForeignKey(
        Medicamento,
        on_delete=models.PROTECT,
        related_name="detalles_compra"
    )

    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Detalle compra medicamento"
        verbose_name_plural = "Detalles compra medicamentos"

    def save(self, *args, **kwargs):
        self.sub_total = self.precio_unitario * self.cantidad

        if self.medicamento:
            self.medicamento.stock_cantidad += self.cantidad
            self.medicamento.precio_compra = self.precio_unitario
            self.medicamento.save(update_fields=["stock_cantidad", "precio_compra"])

        super().save(*args, **kwargs)

        if self.nota_compra:
            self.nota_compra.calcular_total()

    def __str__(self):
        return f"{self.medicamento} - {self.cantidad} - Bs {self.sub_total}"


class DetalleCompraAlimento(models.Model):
    nota_compra = models.ForeignKey(
        NotaCompra,
        on_delete=models.CASCADE,
        related_name="detalles_alimentos"
    )
    alimento = models.ForeignKey(
        Alimento,
        on_delete=models.PROTECT,
        related_name="detalles_compra"
    )

    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Detalle compra alimento"
        verbose_name_plural = "Detalles compra alimentos"

    def save(self, *args, **kwargs):
        self.sub_total = self.precio_unitario * self.cantidad

        if self.alimento:
            self.alimento.stock_cantidad += self.cantidad
            self.alimento.precio_referencia = self.precio_unitario
            self.alimento.save(update_fields=["stock_cantidad", "precio_referencia"])

        super().save(*args, **kwargs)

        if self.nota_compra:
            self.nota_compra.calcular_total()

    def __str__(self):
        return f"{self.alimento} - {self.cantidad} - Bs {self.sub_total}"


# ==========================================
# NUEVO MODELO - DETALLE COMPRA ANIMAL
# ==========================================

class DetalleCompraAnimal(models.Model):
    """Detalle para compra de animales vivos"""
    
    nota_compra = models.ForeignKey(
        NotaCompra,
        on_delete=models.CASCADE,
        related_name="detalles_animales"
    )
    
    nro_arete = models.CharField(max_length=100, help_text="Arete del animal comprado")
    nombre = models.CharField(max_length=150, blank=True, null=True)
    sexo = models.CharField(max_length=20, choices=[('MACHO', 'Macho'), ('HEMBRA', 'Hembra')])
    raza = models.ForeignKey(Raza, on_delete=models.SET_NULL, null=True, blank=True)
    categoria = models.ForeignKey(CategoriaAnimal, on_delete=models.SET_NULL, null=True, blank=True)
    peso = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Detalle compra animal"
        verbose_name_plural = "Detalles compra animales"

    def save(self, *args, **kwargs):
        self.sub_total = self.precio_unitario  # Precio por animal
        super().save(*args, **kwargs)
        
        if self.nota_compra:
            self.nota_compra.calcular_total()

    def __str__(self):
        return f"Animal: {self.nro_arete} - {self.nombre or ''}"
class MovimientoInventario(models.Model):
    TIPO_CHOICES = [
        ("ENTRADA_COMPRA", "Entrada por Compra"),
        ("SALIDA_USO", "Salida por Uso"),
        ("SALIDA_VENTA", "Salida por Venta"),
        ("AJUSTE_POSITIVO", "Ajuste Positivo"),
        ("AJUSTE_NEGATIVO", "Ajuste Negativo"),
        ("BAJA_VENCIMIENTO", "Baja por Vencimiento"),
        ("BAJA_PERDIDA", "Baja por Pérdida"),
    ]
    TIPO_PRODUCTO_CHOICES = [
        ("MEDICAMENTO", "Medicamento"),
        ("ALIMENTO", "Alimento"),
        ("VACUNA", "Vacuna"),
    ]

    finca = models.ForeignKey(Finca, on_delete=models.CASCADE, related_name="movimientos_inventario")
    tipo_movimiento = models.CharField(max_length=30, choices=TIPO_CHOICES)
    tipo_producto = models.CharField(max_length=20, choices=TIPO_PRODUCTO_CHOICES)
    medicamento = models.ForeignKey('catalogos.Medicamento', on_delete=models.SET_NULL, null=True, blank=True, related_name="movimientos")
    alimento = models.ForeignKey('catalogos.Alimento', on_delete=models.SET_NULL, null=True, blank=True, related_name="movimientos")
    vacuna = models.ForeignKey('catalogos.Vacuna', on_delete=models.SET_NULL, null=True, blank=True, related_name="movimientos")
    nota_compra = models.ForeignKey(NotaCompra, on_delete=models.SET_NULL, null=True, blank=True, related_name="movimientos_inventario")
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    stock_anterior = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_posterior = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha = models.DateField()
    motivo = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="movimientos_inventario")
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha", "-fecha_registro"]
        verbose_name = "Movimiento de Inventario"
        verbose_name_plural = "Movimientos de Inventario"

    def __str__(self):
        return f"{self.get_tipo_movimiento_display()} - {self.tipo_producto} - {self.cantidad} ({self.fecha})"

    @property
    def nombre_producto(self):
        if self.medicamento: return self.medicamento.nombre
        if self.alimento: return self.alimento.nombre
        if self.vacuna: return self.vacuna.nombre
        return "—"