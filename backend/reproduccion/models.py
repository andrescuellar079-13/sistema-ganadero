from datetime import timedelta

from django.conf import settings
from django.db import models

from fincas.models import Finca
from animales.models import Animal
from catalogos.models import Reproductor, Veterinario


class EventoReproductivo(models.Model):
    RESULTADO_SERVICIO_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("PRENADA", "Preñada"),
        ("VACIA", "Vacía"),
        ("REPETIR", "Repetir servicio"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="%(class)s_eventos_reproductivos"
    )

    hembra = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="%(class)s_eventos_reproductivos"
    )

    fecha = models.DateField()
    numero_servicio = models.IntegerField(default=1)
    fecha_probable_parto = models.DateField(blank=True, null=True)

    resultado = models.CharField(
        max_length=30,
        choices=RESULTADO_SERVICIO_CHOICES,
        default="PENDIENTE"
    )

    observaciones = models.TextField(blank=True, null=True)

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_eventos_reproductivos_registrados"
    )

    class Meta:
        abstract = True

    def calcular_fecha_probable_parto(self):
        if self.fecha:
            return self.fecha + timedelta(days=283)
        return None


class InseminacionArtificial(EventoReproductivo):
    reproductor = models.ForeignKey(
        Reproductor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inseminaciones_artificiales"
    )

    numero_pajuela = models.CharField(max_length=100, blank=True, null=True)
    lote_nitrogeno = models.CharField(max_length=100, blank=True, null=True)
    tecnico_inseminador = models.CharField(max_length=150, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.fecha_probable_parto:
            self.fecha_probable_parto = self.calcular_fecha_probable_parto()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"IA - {self.hembra} - {self.fecha}"


class MontaNatural(EventoReproductivo):
    reproductor = models.ForeignKey(
        Reproductor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="montas_naturales_reproduccion"
    )

    duracion_dias = models.IntegerField(default=1)

    def save(self, *args, **kwargs):
        if not self.fecha_probable_parto:
            self.fecha_probable_parto = self.calcular_fecha_probable_parto()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Monta natural - {self.hembra} - {self.fecha}"


class DiagnosticoPrenez(EventoReproductivo):
    RESULTADO_PRENEZ_CHOICES = [
        ("POSITIVO", "Positivo"),
        ("NEGATIVO", "Negativo"),
        ("DUDOSO", "Dudoso"),
    ]

    resultado_prenez = models.CharField(
        max_length=30,
        choices=RESULTADO_PRENEZ_CHOICES,
        default="DUDOSO"
    )

    dias_gestacion = models.IntegerField(default=0)
    metodo = models.CharField(max_length=100, blank=True, null=True)

    veterinario = models.ForeignKey(
        Veterinario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagnosticos_prenez_reproduccion"
    )

    fecha_confirmacion = models.DateField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.fecha and self.dias_gestacion > 0:
            dias_restantes = 283 - self.dias_gestacion
            self.fecha_probable_parto = self.fecha + timedelta(days=dias_restantes)
        elif not self.fecha_probable_parto:
            self.fecha_probable_parto = self.calcular_fecha_probable_parto()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Diagnóstico preñez - {self.hembra} - {self.resultado_prenez}"


class Reproduccion(models.Model):
    TIPO_PARTO_CHOICES = [
        ("NORMAL", "Normal"),
        ("DISTOCICO", "Distócico"),
        ("ABORTO", "Aborto"),
        ("MULTIPLE", "Múltiple"),
    ]

    ESTADO_REPRODUCCION_CHOICES = [
        ("SERVIDA", "Servida"),
        ("PRENADA", "Preñada"),
        ("PARIDA", "Parida"),
        ("ABORTO", "Aborto"),
        ("VACIA", "Vacía"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="reproducciones"
    )

    madre = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="reproducciones_como_madre"
    )

    padre = models.ForeignKey(
        Animal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reproducciones_como_padre"
    )

    inseminacion = models.ForeignKey(
        InseminacionArtificial,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reproducciones_originadas"
    )

    monta = models.ForeignKey(
        MontaNatural,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reproducciones_originadas"
    )

    fecha_servicio = models.DateField(blank=True, null=True)
    fecha_parto_esperado = models.DateField(blank=True, null=True)
    fecha_parto_real = models.DateField(blank=True, null=True)

    tipo_parto = models.CharField(
        max_length=30,
        choices=TIPO_PARTO_CHOICES,
        default="NORMAL"
    )

    num_crias = models.IntegerField(default=1)

    crias = models.ManyToManyField(
        Animal,
        blank=True,
        related_name="reproducciones_como_cria"
    )

    estado = models.CharField(
        max_length=30,
        choices=ESTADO_REPRODUCCION_CHOICES,
        default="SERVIDA"
    )

    peso_total_crias = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observaciones = models.TextField(blank=True, null=True)

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reproducciones_registradas"
    )

    fecha_registro = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.fecha_parto_esperado and self.fecha_servicio:
            self.fecha_parto_esperado = self.fecha_servicio + timedelta(days=283)

        if self.fecha_parto_real:
            self.estado = "PARIDA"

        super().save(*args, **kwargs)

    def get_dias_desviacion_parto(self):
        if self.fecha_parto_real and self.fecha_parto_esperado:
            return (self.fecha_parto_real - self.fecha_parto_esperado).days
        return None

    def __str__(self):
        return f"Parto/Reproducción - {self.madre} - {self.estado}"