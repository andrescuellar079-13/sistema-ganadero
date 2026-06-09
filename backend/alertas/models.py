from django.conf import settings
from django.db import models
from django.utils import timezone

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

    CENTRO_COSTO_CHOICES = [
        ("SANIDAD", "Sanidad"),
        ("REPRODUCCION", "Reproducción"),
        ("ALIMENTACION", "Alimentación"),
        ("MANO_DE_OBRA", "Mano de obra"),
        ("PARCELA", "Parcela"),
        ("FINCA", "Finca"),
        ("COMERCIO", "Comercio"),
        ("OTRO", "Otro"),
    ]

    METODO_PAGO_CHOICES = [
        ("EFECTIVO", "Efectivo"),
        ("TRANSFERENCIA", "Transferencia"),
        ("CREDITO", "Crédito"),
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

    # --- Campos opcionales agregados (registro básico de egresos) ---
    centro_costo = models.CharField(
        max_length=20, choices=CENTRO_COSTO_CHOICES, blank=True, null=True
    )
    metodo_pago = models.CharField(
        max_length=20, choices=METODO_PAGO_CHOICES, blank=True, null=True
    )
    parcela = models.ForeignKey(
        "animales.Parcela",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gastos"
    )
    proveedor = models.CharField(max_length=150, blank=True, null=True)
    comprobante = models.CharField(max_length=100, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

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
        ("STOCK_BAJO_VACUNA", "Stock bajo de vacuna"),
        ("PESAJE_PENDIENTE", "Pesaje pendiente"),
        ("TRANSFERENCIA_PENDIENTE", "Transferencia pendiente"),
        ("OTRO", "Otro"),
    ]

    PRIORIDAD_CHOICES = [
        ("BAJA", "Baja"),
        ("MEDIA", "Media"),
        ("ALTA", "Alta"),
        ("CRITICA", "Crítica"),
    ]

    ESTADO_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("LEIDA", "Leída"),
        ("EN_PROCESO", "En proceso"),
        ("RESUELTA", "Resuelta"),
        ("DESCARTADA", "Descartada"),
    ]

    MODULO_CHOICES = [
        ("SANIDAD", "Sanidad"),
        ("REPRODUCCION", "Reproducción"),
        ("PRODUCCION", "Producción"),
        ("FINCAS", "Fincas"),
        ("PARCELAS", "Parcelas"),
        ("COMERCIO", "Comercio"),
        ("CATALOGOS", "Catálogos"),
        ("SISTEMA", "Sistema"),
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

    # --- Campos agregados (centro de notificaciones) ---
    prioridad = models.CharField(
        max_length=10, choices=PRIORIDAD_CHOICES, default="MEDIA"
    )
    estado = models.CharField(
        max_length=12, choices=ESTADO_CHOICES, default="PENDIENTE"
    )
    modulo_origen = models.CharField(
        max_length=15, choices=MODULO_CHOICES, default="SISTEMA"
    )
    fecha_vencimiento = models.DateField(blank=True, null=True)
    accion_recomendada = models.TextField(blank=True, null=True)

    asignado_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alertas_asignadas"
    )
    resuelta_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alertas_resueltas"
    )
    fecha_resolucion = models.DateTimeField(blank=True, null=True)
    observacion_resolucion = models.TextField(blank=True, null=True)

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_alerta"]
        verbose_name = "Alerta"
        verbose_name_plural = "Alertas"

    # --- Acciones (mantienen `leida` sincronizado para compatibilidad) ---
    def marcar_leida(self):
        self.leida = True
        if self.estado == "PENDIENTE":
            self.estado = "LEIDA"
        self.save(update_fields=["leida", "estado"])

    def marcar_en_proceso(self):
        self.leida = True
        self.estado = "EN_PROCESO"
        self.save(update_fields=["leida", "estado"])

    def resolver(self, usuario=None, observacion=None):
        self.estado = "RESUELTA"
        self.leida = True
        self.resuelta_por = usuario if usuario and usuario.is_authenticated else None
        self.fecha_resolucion = timezone.now()
        if observacion:
            self.observacion_resolucion = observacion
        self.save(update_fields=[
            "estado", "leida", "resuelta_por",
            "fecha_resolucion", "observacion_resolucion",
        ])

    def descartar(self, usuario=None, observacion=None):
        self.estado = "DESCARTADA"
        self.leida = True
        self.resuelta_por = usuario if usuario and usuario.is_authenticated else None
        self.fecha_resolucion = timezone.now()
        if observacion:
            self.observacion_resolucion = observacion
        self.save(update_fields=[
            "estado", "leida", "resuelta_por",
            "fecha_resolucion", "observacion_resolucion",
        ])

    @property
    def vencida(self):
        if not self.fecha_vencimiento:
            return False
        if self.estado in ("RESUELTA", "DESCARTADA"):
            return False
        return self.fecha_vencimiento < timezone.now().date()

    def __str__(self):
        return f"{self.tipo} - {self.fecha_alerta}"
