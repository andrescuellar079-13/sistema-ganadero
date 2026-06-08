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


# ==========================================
# NUEVOS MODELOS PARA REPRODUCCIÓN
# ==========================================

class Celo(models.Model):
    """Registro de celo en hembras"""
    TIPO_CELO = [
        ('NATURAL', 'Celo Natural'),
        ('INDUCIDO', 'Celo Inducido'),
        ('SINCRONIZADO', 'Celo Sincronizado'),
    ]
    
    INTENSIDAD = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
    ]
    
    finca = models.ForeignKey(Finca, on_delete=models.CASCADE, related_name='celos')
    hembra = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='celos')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CELO, default='NATURAL')
    intensidad = models.CharField(max_length=20, choices=INTENSIDAD, default='MEDIA')
    detectado_por = models.CharField(max_length=150, blank=True)
    observaciones = models.TextField(blank=True)
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Celo - {self.hembra} - {self.fecha_inicio}"
    
    @property
    def duracion_horas(self):
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            return delta.days * 24
        return None


class Palpacion(models.Model):
    """Registro de palpación rectal para diagnóstico de preñez"""
    RESULTADO = [
        ('POSITIVO', 'Positivo (Preñada)'),
        ('NEGATIVO', 'Negativo (Vacía)'),
        ('SOSPECHOSO', 'Sospechoso'),
        ('QUISTE', 'Quiste'),
    ]
    
    finca = models.ForeignKey(Finca, on_delete=models.CASCADE, related_name='palpaciones')
    hembra = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='palpaciones')
    fecha = models.DateField()
    resultado = models.CharField(max_length=20, choices=RESULTADO)
    dias_gestacion_estimados = models.PositiveIntegerField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    veterinario = models.ForeignKey(Veterinario, on_delete=models.SET_NULL, null=True, blank=True)
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        # Si es positiva y hay días de gestación, crear/actualizar diagnóstico
        if self.resultado == 'POSITIVO' and self.dias_gestacion_estimados:
            from datetime import timedelta
            fecha_probable_parto = self.fecha + timedelta(days=283 - self.dias_gestacion_estimados)
            DiagnosticoPrenez.objects.update_or_create(
                finca=self.finca,
                hembra=self.hembra,
                fecha=self.fecha,
                defaults={
                    'resultado_prenez': 'POSITIVO',
                    'dias_gestacion': self.dias_gestacion_estimados,
                    'fecha_probable_parto': fecha_probable_parto,
                    'veterinario': self.veterinario,
                    'observaciones': self.observaciones
                }
            )
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Palpación - {self.hembra} - {self.fecha} - {self.resultado}"


class HembraRepetidora(models.Model):
    """Registro de hembras con problemas de fertilidad"""
    animal = models.OneToOneField(Animal, on_delete=models.CASCADE, related_name='repetidora')
    numero_servicios = models.PositiveIntegerField(default=0, help_text="Número de servicios sin preñez")
    fecha_ultimo_servicio = models.DateField(null=True, blank=True)
    servicios_fallidos = models.JSONField(default=list, blank=True, help_text="Lista de fechas de servicios fallidos")
    evaluada_veterinario = models.BooleanField(default=False)
    causa_presunta = models.TextField(blank=True)
    descartada = models.BooleanField(default=False)
    fecha_descarte = models.DateField(null=True, blank=True)
    motivo_descarte = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Hembra Repetidora - {self.animal} - {self.numero_servicios} servicios"
    
    def registrar_servicio_fallido(self, fecha):
        if self.servicios_fallidos:
            self.servicios_fallidos.append(str(fecha))
        else:
            self.servicios_fallidos = [str(fecha)]
        self.numero_servicios = len(self.servicios_fallidos)
        self.fecha_ultimo_servicio = fecha
        self.save()


class AbortoDetallado(models.Model):
    """Registro detallado de abortos"""
    CAUSA_ABORTO = [
        ('INFECCIOSO', 'Infeccioso (Brucelosis, Leptospira, etc.)'),
        ('TOXICO', 'Tóxico (Plantas, Micotoxinas)'),
        ('NUTRICIONAL', 'Nutricional (Deficiencias)'),
        ('TRAUMATICO', 'Traumático'),
        ('GENETICO', 'Genético'),
        ('HORMONAL', 'Hormonal'),
        ('ESTRES', 'Estrés'),
        ('DESCONOCIDO', 'Desconocido'),
    ]
    
    ESTADO_FETO = [
        ('MUMMIFIED', 'Momificado'),
        ('MACERADO', 'Macerado'),
        ('FRESCO', 'Fresco'),
        ('AUTOLIZADO', 'Autolizado'),
    ]
    
    reproduccion = models.OneToOneField(Reproduccion, on_delete=models.CASCADE, related_name='aborto_detalle')
    causa = models.CharField(max_length=20, choices=CAUSA_ABORTO)
    descripcion = models.TextField()
    estado_feto = models.CharField(max_length=20, choices=ESTADO_FETO, null=True, blank=True)
    semanas_gestacion = models.PositiveIntegerField(help_text="Semanas de gestación al abortar")
    tratamiento_aplicado = models.TextField(blank=True)
    medidas_preventivas = models.TextField(blank=True)
    costo_asociado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Aborto - {self.reproduccion.madre} - {self.semanas_gestacion} semanas"


class Destete(models.Model):
    """Registro de destete de crías"""
    TIPO_DESTETE = [
        ('NATURAL', 'Natural'),
        ('PRECOZ', 'Precoz'),
        ('FORZADO', 'Forzado'),
    ]
    
    finca = models.ForeignKey(Finca, on_delete=models.CASCADE, related_name='destetes')
    madre = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='destetes_como_madre')
    cria = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='destete_recibido')
    fecha_destete = models.DateField()
    tipo = models.CharField(max_length=20, choices=TIPO_DESTETE, default='NATURAL')
    edad_destete_dias = models.PositiveIntegerField(help_text="Edad de la cría en días")
    peso_cria = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Peso al destete (kg)")
    estado_cria = models.CharField(max_length=50, blank=True, help_text="Buena, Regular, Mala")
    observaciones = models.TextField(blank=True)
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Destete - {self.cria} - {self.fecha_destete}"