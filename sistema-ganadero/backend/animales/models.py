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
            models.Index(fields=['estado']),
            models.Index(fields=['finca', 'estado']),
            models.Index(fields=['finca', 'fecha_registro']),
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

    def __str__(self):
        return f"{self.animal} - {self.parcela}"