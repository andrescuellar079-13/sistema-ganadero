from datetime import timedelta

from django.conf import settings
from django.db import models

from fincas.models import Finca
from animales.models import Animal
from catalogos.models import Medicamento, Veterinario, Vacuna  # ← AGREGADO Vacuna


class EventoSanitario(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="%(class)s_eventos_sanitarios"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="%(class)s_eventos_sanitarios"
    )
    medicamento = models.ForeignKey(
        Medicamento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_eventos_sanitarios"
    )
    veterinario = models.ForeignKey(
        Veterinario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_eventos_sanitarios"
    )
    fecha = models.DateField()
    dosis = models.CharField(max_length=100, blank=True, null=True)
    via_aplicacion = models.CharField(max_length=100, blank=True, null=True)
    costo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    proxima_fecha = models.DateField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_eventos_sanitarios_registrados"
    )

    class Meta:
        abstract = True

    def calcular_proxima_fecha(self):
        if self.fecha and self.medicamento and self.medicamento.intervalo_dias:
            return self.fecha + timedelta(days=self.medicamento.intervalo_dias)
        return None


# ==========================================
# VACUNACION - MODIFICADA con vacuna en lugar de medicamento
# ==========================================

class Vacunacion(models.Model):
    """
    Registro de vacunación aplicada a un animal
    MODIFICADO: ahora usa vacuna en lugar de medicamento
    Hereda algunos campos pero no usa EventoSanitario para mantener independencia
    """
    
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="vacunaciones"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="vacunaciones"
    )
    vacuna = models.ForeignKey(  # ← NUEVO: Cambiado de medicamento a vacuna
        Vacuna,
        on_delete=models.PROTECT,
        related_name="vacunaciones"
    )
    veterinario = models.ForeignKey(
        Veterinario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vacunaciones_realizadas"
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vacunaciones_registradas"
    )
    
    # Datos de la aplicación
    fecha_aplicacion = models.DateField()
    campana = models.CharField(max_length=150, blank=True, null=True, help_text="Campaña de vacunación")
    lote = models.CharField(max_length=100, blank=True, null=True)
    dosis_aplicada = models.CharField(max_length=100, blank=True, null=True, help_text="Dosis realmente aplicada")
    via_aplicacion = models.CharField(max_length=100, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    
    # Próxima dosis
    fecha_proxima = models.DateField(blank=True, null=True, help_text="Fecha de próxima dosis (refuerzo)")
    
    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sanidad_vacunacion'
        verbose_name = 'Vacunación'
        verbose_name_plural = 'Vacunaciones'
        ordering = ['-fecha_aplicacion']

    def __str__(self):
        nombre_vacuna = self.vacuna.nombre if self.vacuna else "Sin vacuna"
        return f"Vacunación - {self.animal} - {nombre_vacuna} - {self.fecha_aplicacion}"

    def calcular_proxima_fecha(self):
        """Calcula la fecha de próxima dosis basada en el intervalo de la vacuna"""
        if self.fecha_aplicacion and self.vacuna and self.vacuna.intervalo_dias:
            return self.fecha_aplicacion + timedelta(days=self.vacuna.intervalo_dias)
        return None

    def save(self, *args, **kwargs):
        # Auto-calcular próxima fecha si no se especificó
        if not self.fecha_proxima:
            self.fecha_proxima = self.calcular_proxima_fecha()
        super().save(*args, **kwargs)


class Tratamiento(EventoSanitario):
    diagnostico = models.CharField(max_length=200, blank=True, null=True)
    tipo = models.CharField(max_length=100, blank=True, null=True)
    dias_retiro = models.IntegerField(default=0)
    fecha_inicio = models.DateField(blank=True, null=True)
    fecha_fin = models.DateField(blank=True, null=True)
    costo_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    en_tratamiento = models.BooleanField(default=True)

    class Meta:
        db_table = 'sanidad_tratamiento'
        verbose_name = 'Tratamiento'
        verbose_name_plural = 'Tratamientos'

    def save(self, *args, **kwargs):
        if not self.proxima_fecha:
            self.proxima_fecha = self.calcular_proxima_fecha()

        if self.fecha_fin:
            self.en_tratamiento = False

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Tratamiento - {self.animal} - {self.diagnostico or self.fecha}"


# backend/sanidad/models.py - Busca la clase Desparasitacion y modifícala

class Desparasitacion(EventoSanitario):
    tipo_parasiticida = models.CharField(max_length=150, blank=True, null=True)
    producto = models.CharField(max_length=200, blank=True, null=True)  # 👈 AGREGA ESTA LÍNEA
    dosis = models.CharField(max_length=100, blank=True, null=True)  # 👈 TAMBIÉN ESTA
    peso_aplicacion = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lote = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'sanidad_desparasitacion'
        verbose_name = 'Desparasitación'
        verbose_name_plural = 'Desparasitaciones'

    def save(self, *args, **kwargs):
        if not self.proxima_fecha:
            self.proxima_fecha = self.calcular_proxima_fecha()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Desparasitación - {self.animal} - {self.fecha}"


class TratamientoMedicamento(models.Model):
    tratamiento = models.ForeignKey(
        Tratamiento,
        on_delete=models.CASCADE,
        related_name="medicamentos_aplicados"
    )
    medicamento = models.ForeignKey(
        Medicamento,
        on_delete=models.CASCADE,
        related_name="tratamientos_asociados"
    )
    dosis = models.CharField(max_length=100, blank=True, null=True)
    via_aplicacion = models.CharField(max_length=100, blank=True, null=True)
    dias_retiro = models.IntegerField(default=0)
    fecha = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'sanidad_tratamiento_medicamento'
        verbose_name = 'Tratamiento Medicamento'
        verbose_name_plural = 'Tratamientos Medicamentos'
        unique_together = ['tratamiento', 'medicamento']

    def __str__(self):
        return f"{self.tratamiento} - {self.medicamento}"


class AnimalMedicamento(models.Model):
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="medicamentos_directos"
    )
    medicamento = models.ForeignKey(
        Medicamento,
        on_delete=models.CASCADE,
        related_name="animales_medicados"
    )
    dosis = models.CharField(max_length=100, blank=True, null=True)
    fecha_administracion = models.DateField()
    fecha_siguiente = models.DateField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'sanidad_animal_medicamento'
        verbose_name = 'Animal Medicamento'
        verbose_name_plural = 'Animales Medicamentos'
        unique_together = ['animal', 'medicamento', 'fecha_administracion']

    def save(self, *args, **kwargs):
        if not self.fecha_siguiente and self.medicamento and self.medicamento.intervalo_dias:
            self.fecha_siguiente = self.fecha_administracion + timedelta(
                days=self.medicamento.intervalo_dias
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.animal} - {self.medicamento} - {self.fecha_administracion}"


class Diagnostico(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="diagnosticos"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="diagnosticos"
    )
    veterinario = models.ForeignKey(
        Veterinario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagnosticos_clinicos"
    )
    descripcion = models.TextField()
    resultado = models.TextField(blank=True, null=True)
    fecha = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'sanidad_diagnostico'
        verbose_name = 'Diagnóstico'
        verbose_name_plural = 'Diagnósticos'
        ordering = ['-fecha']

    def __str__(self):
        return f"Diagnóstico - {self.animal} - {self.fecha}"


class Observacion(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="observaciones_sanitarias"
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="observaciones_sanitarias"
    )
    descripcion = models.TextField()
    fecha = models.DateField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="observaciones_sanitarias_registradas"
    )

    class Meta:
        db_table = 'sanidad_observacion'
        verbose_name = 'Observación'
        verbose_name_plural = 'Observaciones'
        ordering = ['-fecha']

    def __str__(self):
        return f"Observación - {self.animal} - {self.fecha}"