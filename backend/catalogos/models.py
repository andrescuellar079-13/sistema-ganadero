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
    SEXO_APLICA_CHOICES = [
        ("MACHO", "Macho"),
        ("HEMBRA", "Hembra"),
        ("AMBOS", "Ambos"),
    ]
    TIPO_PRODUCCION_CHOICES = [
        ("CARNE", "Carne"),
        ("LECHE", "Leche"),
        ("DOBLE_PROPOSITO", "Doble propósito"),
        ("TODOS", "Todos"),
    ]

    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    sexo_aplica = models.CharField(
        max_length=10,
        choices=SEXO_APLICA_CHOICES,
        default="AMBOS"
    )
    edad_min_meses = models.IntegerField(default=0)
    edad_max_meses = models.IntegerField(blank=True, null=True)
    peso_min_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    peso_max_kg = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    tipo_produccion = models.CharField(
        max_length=20,
        choices=TIPO_PRODUCCION_CHOICES,
        default="TODOS"
    )
    permite_lactancia = models.BooleanField(default=False)
    permite_reproduccion = models.BooleanField(default=False)
    orden = models.IntegerField(default=0)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_categoria_animal'
        verbose_name = 'Categoría Animal'
        verbose_name_plural = 'Categorías Animales'
        ordering = ['orden', 'nombre']

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
    VIA_APLICACION_CHOICES = [
        ('INTRAMUSCULAR', 'Intramuscular'),
        ('SUBCUTANEA', 'Subcutánea'),
        ('INTRADERMICA', 'Intradérmica'),
        ('ORAL', 'Oral'),
        ('TOPICA', 'Tópica'),
        ('INTRAVENOSA', 'Intravenosa'),
    ]

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
    principio_activo = models.CharField(max_length=200, blank=True, null=True)
    presentacion = models.CharField(max_length=100, blank=True, null=True)
    unidad_medida = models.CharField(max_length=50, blank=True, null=True)
    stock_cantidad = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    contenido_neto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dosis_recomendada = models.CharField(max_length=100, blank=True, null=True)
    via_aplicacion = models.CharField(
        max_length=20,
        choices=VIA_APLICACION_CHOICES,
        blank=True,
        null=True
    )
    dias_retiro_carne = models.IntegerField(default=0)
    dias_retiro_leche = models.IntegerField(default=0)
    intervalo_dias = models.IntegerField(default=0)
    imagen = models.ImageField(upload_to="medicamentos/", blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_medicamento'
        verbose_name = 'Medicamento'
        verbose_name_plural = 'Medicamentos'

    def __str__(self):
        return self.nombre

    def is_stock_bajo(self):
        if not self.stock_minimo or float(self.stock_minimo) <= 0:
            return False
        return float(self.stock_cantidad or 0) <= float(self.stock_minimo)

    def is_vencido(self):
        if not self.fecha_vencimiento:
            return False
        from django.utils import timezone
        return self.fecha_vencimiento < timezone.now().date()

    def get_retiro_info(self):
        partes = []
        if self.dias_retiro_carne:
            partes.append(f"Carne: {self.dias_retiro_carne} días")
        if self.dias_retiro_leche:
            partes.append(f"Leche: {self.dias_retiro_leche} días")
        return " | ".join(partes) if partes else "Sin retiro"


class Veterinario(models.Model):
    TIPO_SERVICIO_CHOICES = [
        ('SANIDAD', 'Sanidad'),
        ('REPRODUCCION', 'Reproducción'),
        ('CIRUGIA', 'Cirugía'),
        ('DIAGNOSTICO', 'Diagnóstico'),
        ('GENERAL', 'General'),
    ]

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
    matricula_profesional = models.CharField(max_length=100, blank=True, null=True)
    tipo_servicio = models.CharField(
        max_length=20,
        choices=TIPO_SERVICIO_CHOICES,
        blank=True,
        null=True
    )
    costo_visita = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    direccion = models.TextField(blank=True, null=True)
    firma_imagen = models.ImageField(upload_to='veterinarios/', blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_veterinario'
        verbose_name = 'Veterinario'
        verbose_name_plural = 'Veterinarios'

    def __str__(self):
        return f"{self.nombre} {self.apellidos or ''}".strip()


class Alimento(models.Model):
    TIPO_ALIMENTO_CHOICES = [
        ('CONCENTRADO', 'Concentrado'),
        ('HENO', 'Heno'),
        ('SILO', 'Silo/Silaje'),
        ('SAL_MINERAL', 'Sal Mineral'),
        ('SUPLEMENTO', 'Suplemento'),
        ('PASTO', 'Pasto'),
        ('OTRO', 'Otro'),
    ]

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="alimentos"
    )
    nombre = models.CharField(max_length=150)
    tipo_alimento = models.CharField(
        max_length=20,
        choices=TIPO_ALIMENTO_CHOICES,
        blank=True,
        null=True
    )
    contenido_neto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unidad_medida = models.CharField(max_length=50, blank=True, null=True)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    stock_cantidad = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_referencia = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    costo_por_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    materia_seca_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    proteina_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    fibra_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    energia = models.CharField(max_length=50, blank=True, null=True)
    uso_recomendado = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_alimento'
        verbose_name = 'Alimento'
        verbose_name_plural = 'Alimentos'

    def __str__(self):
        return self.nombre

    def is_stock_bajo(self):
        if float(self.stock_minimo or 0) <= 0:
            return False
        return float(self.stock_cantidad or 0) <= float(self.stock_minimo)

    def is_vencido(self):
        if not self.fecha_vencimiento:
            return False
        from django.utils import timezone
        return self.fecha_vencimiento < timezone.now().date()


class Reproductor(models.Model):
    TIPO_ORIGEN_CHOICES = [
        ("INTERNO", "Interno"),
        ("EXTERNO", "Externo"),
        ("SEMEN", "Semen"),
    ]
    TIPO_REPRODUCTOR_CHOICES = [
        ("TORO", "Toro"),
        ("SEMEN_CONVENCIONAL", "Semen Convencional"),
        ("SEMEN_SEXADO", "Semen Sexado"),
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
    animal_interno = models.ForeignKey(
        'animales.Animal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="como_reproductor"
    )

    codigo = models.CharField(max_length=100)
    nombre = models.CharField(max_length=150, blank=True, null=True)
    tipo_origen = models.CharField(max_length=30, choices=TIPO_ORIGEN_CHOICES)
    tipo_reproductor = models.CharField(
        max_length=30,
        choices=TIPO_REPRODUCTOR_CHOICES,
        default="TORO",
        blank=True,
        null=True
    )
    codigo_pajuela = models.CharField(max_length=100, blank=True, null=True)
    laboratorio = models.CharField(max_length=150, blank=True, null=True)
    stock_pajuelas = models.IntegerField(default=0)
    costo_pajuela = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True, null=True)
    facilidad_parto = models.DecimalField(
        max_digits=4, decimal_places=2,
        blank=True, null=True,
        help_text="Puntaje de facilidad de parto (1-10)"
    )
    valor_genetico = models.DecimalField(
        max_digits=8, decimal_places=2,
        blank=True, null=True,
        help_text="DEP o valor genético estimado"
    )
    observaciones = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogos_reproductor'
        verbose_name = 'Reproductor'
        verbose_name_plural = 'Reproductores'

    def __str__(self):
        return self.nombre or self.codigo


class Vacuna(models.Model):
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
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    enfermedad_previene = models.CharField(max_length=200, blank=True, null=True)
    dosis_recomendada = models.CharField(max_length=50, help_text="Ej: 2 ml")
    via_aplicacion = models.CharField(max_length=20, choices=VIA_APLICACION_CHOICES, default='INTRAMUSCULAR')
    intervalo_dias = models.IntegerField(default=365, help_text="Días entre dosis (refuerzo)")
    edad_minima_meses = models.IntegerField(default=0, help_text="Edad mínima en meses para aplicar")
    stock_cantidad = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lote = models.CharField(max_length=100, blank=True, null=True)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'catalogos_vacuna'
        verbose_name = 'Vacuna'
        verbose_name_plural = 'Vacunas'
        ordering = ['nombre']
        unique_together = [['finca', 'nombre']]

    def __str__(self):
        return f"{self.nombre} ({self.dosis_recomendada})"

    def get_info(self):
        return f"{self.nombre} - Dosis: {self.dosis_recomendada} - Vía: {self.get_via_aplicacion_display()}"
