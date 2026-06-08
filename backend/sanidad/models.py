from datetime import timedelta

from django.conf import settings
from django.db import models

from fincas.models import Finca
from animales.models import Animal
from catalogos.models import Medicamento, Veterinario, Vacuna


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
# VACUNACION
# ==========================================

class Vacunacion(models.Model):
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
    vacuna = models.ForeignKey(
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
    
    fecha_aplicacion = models.DateField()
    campana = models.CharField(max_length=150, blank=True, null=True)
    lote = models.CharField(max_length=100, blank=True, null=True)
    dosis_aplicada = models.CharField(max_length=100, blank=True, null=True)
    via_aplicacion = models.CharField(max_length=100, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_proxima = models.DateField(blank=True, null=True)
    
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
        if self.fecha_aplicacion and self.vacuna and self.vacuna.intervalo_dias:
            return self.fecha_aplicacion + timedelta(days=self.vacuna.intervalo_dias)
        return None

    def save(self, *args, **kwargs):
        if not self.fecha_proxima:
            self.fecha_proxima = self.calcular_proxima_fecha()
        super().save(*args, **kwargs)


# ==========================================
# TRATAMIENTO
# ==========================================

class Tratamiento(EventoSanitario):
    diagnostico = models.CharField(max_length=200, blank=True, null=True)
    tipo = models.CharField(max_length=100, blank=True, null=True)
    dias_retiro = models.IntegerField(default=0)
    fecha_inicio = models.DateField(blank=True, null=True)
    fecha_fin = models.DateField(blank=True, null=True)
    costo_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    en_tratamiento = models.BooleanField(default=True)
    
    # Nuevo campo para relacionar con enfermedad
    enfermedad = models.ForeignKey(
        'Enfermedad',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tratamientos"
    )

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


# ==========================================
# DESPARASITACION
# ==========================================

class Desparasitacion(EventoSanitario):
    tipo_parasiticida = models.CharField(max_length=150, blank=True, null=True)
    producto = models.CharField(max_length=200, blank=True, null=True)
    dosis = models.CharField(max_length=100, blank=True, null=True)
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


# ==========================================
# TRATAMIENTO MEDICAMENTO (Detalle)
# ==========================================

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


# ==========================================
# ANIMAL MEDICAMENTO
# ==========================================

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


# ==========================================
# DIAGNOSTICO
# ==========================================

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
    
    # Relación con enfermedad
    enfermedad = models.ForeignKey(
        'Enfermedad',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagnosticos"
    )

    class Meta:
        db_table = 'sanidad_diagnostico'
        verbose_name = 'Diagnóstico'
        verbose_name_plural = 'Diagnósticos'
        ordering = ['-fecha']

    def __str__(self):
        return f"Diagnóstico - {self.animal} - {self.fecha}"


# ==========================================
# OBSERVACION
# ==========================================

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


# ==========================================
# NUEVOS MODELOS AGREGADOS
# ==========================================

class Enfermedad(models.Model):
    """Catálogo de enfermedades"""
    CATEGORIAS = [
        ('INFECCIOSA', 'Infecciosa'),
        ('PARASITARIA', 'Parasitaria'),
        ('METABOLICA', 'Metabólica'),
        ('REPRODUCTIVA', 'Reproductiva'),
        ('RESPIRATORIA', 'Respiratoria'),
        ('DIGESTIVA', 'Digestiva'),
        ('OTRA', 'Otra'),
    ]
    
    nombre = models.CharField(max_length=150, unique=True)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS, default='OTRA')
    sintomas = models.TextField()
    causa = models.TextField(blank=True, null=True)
    tratamiento_recomendado = models.TextField(blank=True, null=True)
    tiempo_recuperacion_dias = models.IntegerField(default=0)
    es_zoonotica = models.BooleanField(default=False)
    mortalidad_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sanidad_enfermedad'
        verbose_name = 'Enfermedad'
        verbose_name_plural = 'Enfermedades'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class ExamenLaboratorio(models.Model):
    """Exámenes clínicos de laboratorio"""
    TIPO_EXAMEN = [
        ('SANGRE', 'Análisis de Sangre'),
        ('HECES', 'Examen de Heces'),
        ('LECHE', 'Análisis de Leche'),
        ('ORINA', 'Análisis de Orina'),
        ('BIOPSIA', 'Biopsia'),
        ('CULTIVO', 'Cultivo Bacteriano'),
        ('PCR', 'PCR'),
        ('OTRO', 'Otro'),
    ]
    
    finca = models.ForeignKey(Finca, on_delete=models.CASCADE, related_name='examenes_laboratorio')
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='examenes_laboratorio')
    tipo_examen = models.CharField(max_length=20, choices=TIPO_EXAMEN)
    laboratorio = models.CharField(max_length=200)
    fecha_toma = models.DateField()
    fecha_resultado = models.DateField(null=True, blank=True)
    resultado = models.TextField()
    es_normal = models.BooleanField(default=True)
    observaciones = models.TextField(blank=True, null=True)
    archivo_pdf = models.FileField(upload_to='examenes_laboratorio/', null=True, blank=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='examenes_registrados'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sanidad_examen_laboratorio'
        verbose_name = 'Examen de Laboratorio'
        verbose_name_plural = 'Exámenes de Laboratorio'
        ordering = ['-fecha_toma']

    def __str__(self):
        return f"{self.animal} - {self.get_tipo_examen_display()} - {self.fecha_toma}"


class RegistroMastitis(models.Model):
    """Registro específico de casos de mastitis"""
    CUARTOS = [
        ('DI', 'Derecho Izquierdo'),
        ('DD', 'Derecho Derecho'),
        ('TI', 'Trasero Izquierdo'),
        ('TD', 'Trasero Derecho'),
        ('MULTIPLE', 'Múltiples'),
    ]
    
    TIPO_MASTITIS = [
        ('CLINICA', 'Clínica'),
        ('SUBCLINICA', 'Subclínica'),
        ('CRONICA', 'Crónica'),
    ]
    
    finca = models.ForeignKey(Finca, on_delete=models.CASCADE, related_name='mastitis_registros')
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='mastitis_registros')
    fecha = models.DateField()
    cuarto_afectado = models.CharField(max_length=10, choices=CUARTOS)
    tipo = models.CharField(max_length=20, choices=TIPO_MASTITIS)
    bacteria = models.CharField(max_length=150, blank=True, null=True)
    recuento_cels_somaticas = models.IntegerField(null=True, blank=True)
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.SET_NULL, null=True, blank=True, related_name='mastitis_casos')
    se_curo = models.BooleanField(default=False)
    fecha_curacion = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mastitis_registrados'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sanidad_registro_mastitis'
        verbose_name = 'Registro de Mastitis'
        verbose_name_plural = 'Registros de Mastitis'
        ordering = ['-fecha']

    def __str__(self):
        return f"Mastitis {self.tipo} - {self.animal} - {self.fecha}"


class TiempoRetiro(models.Model):
    """Registro de animales en período de retiro (carne/leche)"""
    TIPO_RETIRO = [
        ('CARNE', 'Retiro de Carne'),
        ('LECHE', 'Retiro de Leche'),
        ('AMBOS', 'Ambos'),
    ]
    
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='tiempos_retiro')
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.CASCADE, related_name='tiempos_retiro')
    tipo_retiro = models.CharField(max_length=10, choices=TIPO_RETIRO)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    dias_retiro = models.IntegerField()
    activo = models.BooleanField(default=True)
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tiempos_retiro_registrados'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sanidad_tiempo_retiro'
        verbose_name = 'Tiempo de Retiro'
        verbose_name_plural = 'Tiempos de Retiro'
        ordering = ['-fecha_inicio']

    def __str__(self):
        estado = "Activo" if self.activo else "Completado"
        return f"{self.animal} - {self.get_tipo_retiro_display()} - {estado} - {self.fecha_fin}"
    
    @property
    def dias_restantes(self):
        """Calcula días restantes del período de retiro"""
        from datetime import date
        if self.activo and self.fecha_fin >= date.today():
            return (self.fecha_fin - date.today()).days
        return 0
    
    @property
    def esta_en_retiro(self):
        """Verifica si el animal está actualmente en período de retiro"""
        from datetime import date
        return self.activo and self.fecha_inicio <= date.today() <= self.fecha_fin