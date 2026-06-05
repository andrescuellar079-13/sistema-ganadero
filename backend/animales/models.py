from django.conf import settings
from django.db import models
from fincas.models import Finca
from catalogos.models import Raza, CategoriaAnimal


class Parcela(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="parcelas"
    )
    nombre = models.CharField(max_length=150)
    estado = models.CharField(max_length=50, default="ACTIVA")
    imagen = models.ImageField(upload_to="parcelas/", blank=True, null=True)
    tamano = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    capacidad_maxima = models.IntegerField(default=0)
    tipo_pastura = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['finca'], name='par_finca_idx'),
            models.Index(fields=['finca', 'estado'], name='par_finca_estado_idx'),
        ]

    def __str__(self):
        return self.nombre


class Animal(models.Model):
    SEXO_CHOICES = [
        ("MACHO", "Macho"),
        ("HEMBRA", "Hembra"),
    ]

    TIPO_PRODUCCION_CHOICES = [
        ("CARNE", "Carne"),
        ("LECHE", "Leche"),
        ("DOBLE_PROPOSITO", "Doble propósito"),
    ]

    ESTADO_CHOICES = [
        ("ACTIVO",    "Activo"),
        ("VENDIDO",   "Vendido"),
        ("MUERTO",    "Muerto"),
        ("DESCARTE",  "Descarte"),
        ("MATADERO",  "Matadero"),
        ("BAJA",      "Baja"),      # ← agregado
    ]

    ORIGEN_CHOICES = [
        ("NACIDO_FINCA", "Nacido en finca"),
        ("COMPRADO",     "Comprado"),
        ("DONADO",       "Donado"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="animales"
    )
    raza = models.ForeignKey(
        Raza,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    categoria = models.ForeignKey(
        CategoriaAnimal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    padre = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hijos_como_padre"
    )
    madre = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hijos_como_madre"
    )

    nombre = models.CharField(max_length=150, blank=True, null=True)
    nro_arete = models.CharField(max_length=100, unique=True)
    sexo = models.CharField(max_length=20, choices=SEXO_CHOICES)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    edad_ingreso_meses = models.IntegerField(default=0)
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES, default="ACTIVO")
    imagen = models.ImageField(upload_to="animales/", blank=True, null=True)
    peso = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    peso_nacimiento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_ingreso = models.DateField(blank=True, null=True)
    tipo_produccion = models.CharField(
        max_length=30,
        choices=TIPO_PRODUCCION_CHOICES,
        default="DOBLE_PROPOSITO"
    )
    origen = models.CharField(max_length=30, choices=ORIGEN_CHOICES, default="NACIDO_FINCA")
    color = models.CharField(max_length=100, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
       indexes = [
        models.Index(fields=['nombre']),
        models.Index(fields=['nro_arete']),
        models.Index(fields=['fecha_nacimiento']),
        models.Index(fields=['fecha_ingreso']),
        models.Index(fields=['fecha_registro']),
        models.Index(fields=['estado']),
        models.Index(fields=['sexo']),
        models.Index(fields=['tipo_produccion']),
        models.Index(fields=['origen']),

        # Índices compuestos para consultas grandes por finca
        models.Index(fields=['finca', 'estado'], name='ani_finca_estado_idx'),
        models.Index(fields=['finca', 'fecha_registro'], name='ani_finca_freg_idx'),
        models.Index(fields=['finca', 'fecha_nacimiento'], name='ani_finca_fnac_idx'),
        models.Index(fields=['finca', 'fecha_ingreso'], name='ani_finca_fing_idx'),
        models.Index(fields=['finca', 'sexo'], name='ani_finca_sexo_idx'),
        models.Index(fields=['finca', 'tipo_produccion'], name='ani_finca_tipo_idx'),
        models.Index(fields=['finca', 'origen'], name='ani_finca_origen_idx'),
        models.Index(fields=['finca', 'raza', 'categoria'], name='ani_finca_raza_cat_idx'),
        models.Index(fields=['finca', 'peso'], name='ani_finca_peso_idx'),
    ]

    def __str__(self):
        return f"{self.nro_arete} - {self.nombre or ''}"


class AnimalParcela(models.Model):
    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name="historial_parcelas"
    )
    parcela = models.ForeignKey(
        Parcela,
        on_delete=models.CASCADE,
        related_name="historial_animales"
    )
    fecha_ingreso = models.DateField()
    fecha_salida = models.DateField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['animal', 'fecha_salida'], name='ap_animal_salida_idx'),
            models.Index(fields=['parcela', 'fecha_salida'], name='ap_parcela_salida_idx'),
        ]

    def __str__(self):
        return f"{self.animal} - {self.parcela}"


class MovimientoAnimal(models.Model):
    MOTIVO_CHOICES = [
        ('ROTACION',     'Rotación de potrero'),
        ('SANIDAD',      'Razones sanitarias'),
        ('ALIMENTACION', 'Manejo de alimentación'),
        ('SEPARACION',   'Separación por gestación/cría'),
        ('VENTA',        'Preparación para venta'),
        ('MANTENIMIENTO','Mantenimiento de parcela'),
        ('OTRO',         'Otro'),
    ]

    finca = models.ForeignKey(
        Finca, on_delete=models.CASCADE,
        related_name='movimientos_animales'
    )
    animal = models.ForeignKey(
        Animal, on_delete=models.CASCADE,
        related_name='movimientos'
    )
    parcela_origen = models.ForeignKey(
        Parcela, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='salidas_animales'
    )
    parcela_destino = models.ForeignKey(
        Parcela, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='entradas_animales'
    )
    fecha_movimiento = models.DateField()
    motivo = models.CharField(
        max_length=100, blank=True, null=True,
        choices=MOTIVO_CHOICES
    )
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='movimientos_registrados'
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_movimiento', '-fecha_registro']
        indexes = [
            models.Index(fields=['animal', 'fecha_movimiento'], name='mov_animal_fecha_idx'),
            models.Index(fields=['finca', 'fecha_movimiento'],  name='mov_finca_fecha_idx'),
            models.Index(fields=['parcela_origen'],             name='mov_origen_idx'),
            models.Index(fields=['parcela_destino'],            name='mov_destino_idx'),
        ]

    def __str__(self):
        origen = self.parcela_origen.nombre if self.parcela_origen else 'Sin parcela'
        destino = self.parcela_destino.nombre if self.parcela_destino else 'Sin parcela'
        return f"{self.animal} | {origen} → {destino} ({self.fecha_movimiento})"