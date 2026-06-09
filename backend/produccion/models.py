from datetime import date
from decimal import Decimal

from django.conf import settings
from django.db import models

from fincas.models import Finca
from animales.models import Animal
from catalogos.models import Alimento
from reproduccion.models import Reproduccion


class RegistroPeso(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="registros_peso"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="registros_peso"
    )

    fecha_pesaje = models.DateField()
    peso_kg = models.DecimalField(max_digits=10, decimal_places=2)
    observacion = models.TextField(blank=True, null=True)

    ganancia_diaria = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    condicion_corporal = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        help_text="Escala corporal, por ejemplo 1 a 5"
    )

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registros_peso_creados"
    )

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_pesaje"]
        verbose_name = "Registro de peso"
        verbose_name_plural = "Registros de peso"

    def save(self, *args, **kwargs):
        peso_anterior = (
            RegistroPeso.objects
            .filter(animal=self.animal, fecha_pesaje__lt=self.fecha_pesaje)
            .order_by("-fecha_pesaje")
            .first()
        )

        if peso_anterior:
            dias = (self.fecha_pesaje - peso_anterior.fecha_pesaje).days
            if dias > 0:
                diferencia = self.peso_kg - peso_anterior.peso_kg
                self.ganancia_diaria = diferencia / dias

        super().save(*args, **kwargs)

        # El peso actual del animal refleja siempre el pesaje más reciente
        # (no se sobreescribe con un pesaje retroactivo más antiguo).
        ultimo = (
            RegistroPeso.objects
            .filter(animal=self.animal)
            .order_by("-fecha_pesaje", "-fecha_registro")
            .first()
        )
        if ultimo:
            self.animal.peso = ultimo.peso_kg
            self.animal.save(update_fields=["peso"])

        # Si el animal tiene un engorde activo, recalcular su estado productivo
        # (días, ganancia y peso faltante son propiedades derivadas; aquí solo
        # se actualiza el estado a LISTO_VENTA al alcanzar el peso objetivo).
        engorde = self.animal.engordes.filter(estado="EN_ENGORDE").first()
        if engorde:
            engorde.actualizar_estado()

    def __str__(self):
        return f"{self.animal} - {self.peso_kg} kg - {self.fecha_pesaje}"


class Lactancia(models.Model):
    ESTADO_LACTANCIA_CHOICES = [
        ("ACTIVA", "Activa"),
        ("SECADA", "Secada"),
        ("FINALIZADA", "Finalizada"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="lactancias"
    )
    vaca = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="lactancias"
    )
    reproduccion = models.ForeignKey(
        Reproduccion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lactancias"
    )

    numero_lactancia = models.IntegerField(default=1)
    fecha_inicio = models.DateField()
    fecha_secado = models.DateField(blank=True, null=True)

    dias_produccion = models.IntegerField(default=0)
    total_litros = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    promedio_diario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ajuste_305_dias = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    estado = models.CharField(
        max_length=30,
        choices=ESTADO_LACTANCIA_CHOICES,
        default="ACTIVA"
    )

    observaciones = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_inicio"]
        verbose_name = "Lactancia"
        verbose_name_plural = "Lactancias"

    def recalcular_totales(self):
        registros = self.producciones_leche.all()

        total = sum([registro.litros for registro in registros])
        self.total_litros = total

        if self.fecha_secado:
            self.dias_produccion = (self.fecha_secado - self.fecha_inicio).days + 1
            self.estado = "SECADA"
        else:
            ultima_produccion = registros.order_by("-fecha").first()
            if ultima_produccion:
                self.dias_produccion = (ultima_produccion.fecha - self.fecha_inicio).days + 1

        if self.dias_produccion > 0:
            self.promedio_diario = self.total_litros / self.dias_produccion
            self.ajuste_305_dias = self.promedio_diario * 305

        self.save(update_fields=[
            "total_litros",
            "dias_produccion",
            "promedio_diario",
            "ajuste_305_dias",
            "estado",
        ])

    def __str__(self):
        return f"Lactancia {self.numero_lactancia} - {self.vaca}"


class ProduccionLeche(models.Model):
    TURNO_CHOICES = [
        ("MANIANA", "Mañana"),
        ("TARDE", "Tarde"),
        ("NOCHE", "Noche"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="producciones_leche"
    )
    vaca = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="producciones_leche"
    )
    lactancia = models.ForeignKey(
        Lactancia,
        on_delete=models.CASCADE,
        related_name="producciones_leche"
    )

    fecha = models.DateField()
    turno = models.CharField(max_length=20, choices=TURNO_CHOICES)
    litros = models.DecimalField(max_digits=10, decimal_places=2)
    dias_en_lactancia = models.IntegerField(default=0)

    observaciones = models.TextField(blank=True, null=True)

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="producciones_leche_registradas"
    )

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha"]
        verbose_name = "Producción de leche"
        verbose_name_plural = "Producciones de leche"

    def save(self, *args, **kwargs):
        if self.lactancia and self.fecha:
            self.dias_en_lactancia = (
                self.fecha - self.lactancia.fecha_inicio
            ).days + 1

        super().save(*args, **kwargs)

        if self.lactancia:
            self.lactancia.recalcular_totales()

    def __str__(self):
        return f"{self.vaca} - {self.fecha} - {self.litros} L"


class AlimentoAnimal(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="alimentaciones_animales"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="alimentaciones"
    )
    alimento = models.ForeignKey(
        Alimento,
        on_delete=models.CASCADE,
        related_name="suministros_animales"
    )

    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_alimentacion = models.DateField()
    observaciones = models.TextField(blank=True, null=True)

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alimentaciones_registradas"
    )

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_alimentacion"]
        verbose_name = "Alimentación animal"
        verbose_name_plural = "Alimentaciones animales"

    def __str__(self):
        return f"{self.animal} - {self.alimento} - {self.cantidad}"


class EngordeAnimal(models.Model):
    """Control de engorde / producción de carne de un animal.

    Un animal CARNE o DOBLE_PROPOSITO entra en engorde con un peso inicial y
    un peso objetivo. Los días en engorde, la ganancia diaria y el peso
    faltante se derivan del último pesaje registrado (no se almacenan), de modo
    que el Registro de Peso alimenta automáticamente este control.
    """

    TIPO_ENGORDE_CHOICES = [
        ("INTENSIVO", "Intensivo"),
        ("EXTENSIVO", "Extensivo"),
        ("SEMI_INTENSIVO", "Semi-intensivo"),
    ]

    ESTADO_CHOICES = [
        ("EN_ENGORDE", "En engorde"),
        ("LISTO_VENTA", "Listo para venta"),
        ("RETIRADO", "Retirado"),
        ("VENDIDO", "Vendido"),
    ]

    # Estados productivos que mantienen el engorde "abierto"
    ESTADOS_ACTIVOS = ("EN_ENGORDE", "LISTO_VENTA")

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="engordes"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="engordes"
    )

    fecha_inicio = models.DateField()
    peso_inicial = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    peso_objetivo = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    tipo_engorde = models.CharField(
        max_length=20,
        choices=TIPO_ENGORDE_CHOICES,
        default="SEMI_INTENSIVO"
    )
    lote_grupo = models.CharField(max_length=100, blank=True, null=True)

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default="EN_ENGORDE"
    )

    observaciones = models.TextField(blank=True, null=True)

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="engordes_registrados"
    )

    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_inicio"]
        verbose_name = "Engorde de animal"
        verbose_name_plural = "Engordes de animales"
        indexes = [
            models.Index(fields=["finca", "estado"], name="eng_finca_estado_idx"),
            models.Index(fields=["animal", "estado"], name="eng_animal_estado_idx"),
        ]

    # --- Datos derivados (no se almacenan; dependen del último pesaje) ---
    @property
    def peso_actual(self):
        return self.animal.peso or Decimal("0")

    @property
    def ultimo_pesaje_fecha(self):
        ultimo = self.animal.registros_peso.order_by("-fecha_pesaje").first()
        return ultimo.fecha_pesaje if ultimo else None

    @property
    def dias_en_engorde(self):
        ref = self.ultimo_pesaje_fecha or date.today()
        dias = (ref - self.fecha_inicio).days
        return dias if dias > 0 else 0

    @property
    def ganancia_diaria(self):
        dias = self.dias_en_engorde
        if dias <= 0:
            return Decimal("0")
        return (self.peso_actual - self.peso_inicial) / dias

    @property
    def peso_faltante(self):
        faltante = self.peso_objetivo - self.peso_actual
        return faltante if faltante > 0 else Decimal("0")

    def actualizar_estado(self):
        """Pasa el engorde a LISTO_VENTA cuando alcanza el peso objetivo."""
        if self.estado == "EN_ENGORDE" and self.peso_actual >= self.peso_objetivo:
            self.estado = "LISTO_VENTA"
            self.save(update_fields=["estado"])

    def __str__(self):
        return f"Engorde {self.animal} ({self.estado})"