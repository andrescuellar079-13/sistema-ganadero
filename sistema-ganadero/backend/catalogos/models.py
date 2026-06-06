from django.db import models
from fincas.models import Finca


class Raza(models.Model):
    TIPO_PRODUCCION_CHOICES = [
        ("CARNE", "Carne"),
        ("LECHE", "Leche"),
        ("DOBLE_PROPOSITO", "Doble propósito"),
    ]

    nombre = models.CharField(max_length=100)
    orientacion = models.CharField(
        max_length=30,
        choices=TIPO_PRODUCCION_CHOICES,
        default="DOBLE_PROPOSITO"
    )
    origen = models.CharField(max_length=100, blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_raza'
        verbose_name = 'Raza'
        verbose_name_plural = 'Razas'

    def __str__(self):
        return self.nombre


class CategoriaAnimal(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_categoria_animal'
        verbose_name = 'Categoría Animal'
        verbose_name_plural = 'Categorías Animales'

    def __str__(self):
        return self.nombre


class TipoMedicamento(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'catalogos_tipo_medicamento'
        verbose_name = 'Tipo de Medicamento'
        verbose_name_plural = 'Tipos de Medicamentos'

    def __str__(self):
        return self.nombre


class Medicamento(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="medicamentos"
    )
    tipo = models.ForeignKey(
        TipoMedicamento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    laboratorio = models.CharField(max_length=150, blank=True, null=True)
    unidad_medida = models.CharField(max_length=50, blank=True, null=True)
    stock_cantidad = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    contenido_neto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    intervalo_dias = models.IntegerField(default=0)
    imagen = models.ImageField(upload_to="medicamentos/", blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_medicamento'
        verbose_name = 'Medicamento'
        verbose_name_plural = 'Medicamentos'

    def __str__(self):
        return self.nombre


class Veterinario(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="veterinarios"
    )
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100, blank=True, null=True)
    ci = models.CharField(max_length=30, blank=True, null=True)
    especialidad = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_veterinario'
        verbose_name = 'Veterinario'
        verbose_name_plural = 'Veterinarios'

    def __str__(self):
        return f"{self.nombre} {self.apellidos or ''}".strip()


class Alimento(models.Model):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="alimentos"
    )
    nombre = models.CharField(max_length=150)
    contenido_neto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unidad_medida = models.CharField(max_length=50, blank=True, null=True)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    stock_cantidad = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_referencia = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_alimento'
        verbose_name = 'Alimento'
        verbose_name_plural = 'Alimentos'

    def __str__(self):
        return self.nombre


class Reproductor(models.Model):
    TIPO_ORIGEN_CHOICES = [
        ("INTERNO", "Interno"),
        ("EXTERNO", "Externo"),
        ("SEMEN", "Semen"),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="reproductores"
    )
    raza = models.ForeignKey(
        Raza,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reproductores"
    )

    codigo = models.CharField(max_length=100)
    nombre = models.CharField(max_length=150, blank=True, null=True)
    tipo_origen = models.CharField(max_length=30, choices=TIPO_ORIGEN_CHOICES)
    codigo_pajuela = models.CharField(max_length=100, blank=True, null=True)
    laboratorio = models.CharField(max_length=150, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_reproductor'
        verbose_name = 'Reproductor'
        verbose_name_plural = 'Reproductores'

    def __str__(self):
        return self.nombre or self.codigo


# ==========================================
# VACUNA - NUEVA TABLA AGREGADA
# ==========================================

class Vacuna(models.Model):
    """
    Catálogo de vacunas disponibles
    """
    VIA_APLICACION_CHOICES = [
        ('INTRAMUSCULAR', 'Intramuscular'),
        ('SUBCUTANEA', 'Subcutánea'),
        ('INTRADERMICA', 'Intradérmica'),
        ('ORAL', 'Oral'),
    ]
    
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="vacunas"
    )
    nombre = models.CharField(max_length=150, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    dosis_recomendada = models.CharField(max_length=50, help_text="Ej: 2 ml")
    via_aplicacion = models.CharField(max_length=20, choices=VIA_APLICACION_CHOICES, default='INTRAMUSCULAR')
    intervalo_dias = models.IntegerField(default=365, help_text="Días entre dosis (refuerzo)")
    edad_minima_meses = models.IntegerField(default=0, help_text="Edad mínima en meses para aplicar")
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalogos_vacuna'
        verbose_name = 'Vacuna'
        verbose_name_plural = 'Vacunas'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.dosis_recomendada})"
    
    def get_info(self):
        return f"{self.nombre} - Dosis: {self.dosis_recomendada} - Vía: {self.get_via_aplicacion_display()}"