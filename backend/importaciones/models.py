from django.conf import settings
from django.db import models

from fincas.models import Finca


class ImportacionGanadera(models.Model):
    """Registro de control de una importación masiva de datos ganaderos.

    Cada importación pertenece a UNA finca (la finca activa de la interfaz,
    nunca tomada del archivo) y guarda el archivo original más el resumen del
    procesamiento. El ciclo de vida es:

        CARGADO → VALIDANDO → LISTO → PROCESANDO
                → COMPLETADO | COMPLETADO_CON_ERRORES | FALLIDO
    """

    class Estado(models.TextChoices):
        CARGADO = "CARGADO", "Cargado"
        VALIDANDO = "VALIDANDO", "Validando"
        LISTO = "LISTO", "Listo para importar"
        PROCESANDO = "PROCESANDO", "Procesando"
        COMPLETADO = "COMPLETADO", "Completado"
        COMPLETADO_CON_ERRORES = "COMPLETADO_CON_ERRORES", "Completado con errores"
        FALLIDO = "FALLIDO", "Fallido"
        CANCELADO = "CANCELADO", "Cancelado"

    class Modo(models.TextChoices):
        SOLO_CREAR = "SOLO_CREAR", "Solo crear nuevos"
        ACTUALIZAR_EXISTENTES = "ACTUALIZAR_EXISTENTES", "Actualizar existentes"
        CREAR_O_ACTUALIZAR = "CREAR_O_ACTUALIZAR", "Crear o actualizar"

    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="importaciones",
    )
    archivo_original = models.FileField(upload_to="importaciones/%Y/%m/")
    nombre_archivo = models.CharField(max_length=255)

    estado = models.CharField(
        max_length=30, choices=Estado.choices, default=Estado.CARGADO
    )
    modo = models.CharField(
        max_length=30, choices=Modo.choices, default=Modo.SOLO_CREAR
    )
    # True = ESTRICTO (rollback total ante error bloqueante).
    # False = PARCIAL (guarda válidas, rechaza inválidas en el reporte).
    modo_estricto = models.BooleanField(default=True)

    total_filas = models.IntegerField(default=0)
    filas_validas = models.IntegerField(default=0)
    creados = models.IntegerField(default=0)
    actualizados = models.IntegerField(default=0)
    omitidos = models.IntegerField(default=0)
    total_errores = models.IntegerField(default=0)

    # Conteos por hoja, muestras de previsualización y demás detalle.
    resumen_json = models.JSONField(default=dict, blank=True)

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="importaciones_creadas",
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_finalizacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-fecha_creacion"]
        verbose_name = "Importación ganadera"
        verbose_name_plural = "Importaciones ganaderas"
        indexes = [
            models.Index(fields=["finca", "fecha_creacion"], name="imp_finca_fecha_idx"),
            models.Index(fields=["estado"], name="imp_estado_idx"),
            models.Index(fields=["creado_por"], name="imp_creado_por_idx"),
        ]

    def __str__(self):
        return f"Importación #{self.pk} - {self.nombre_archivo} ({self.estado})"


class ImportacionGanaderaError(models.Model):
    """Una incidencia detectada en una fila/celda durante validación o proceso."""

    importacion = models.ForeignKey(
        ImportacionGanadera,
        on_delete=models.CASCADE,
        related_name="errores",
    )
    hoja = models.CharField(max_length=50)
    numero_fila = models.IntegerField()
    campo = models.CharField(max_length=100, blank=True, null=True)
    valor = models.TextField(blank=True, null=True)
    codigo_error = models.CharField(max_length=60)
    mensaje = models.TextField()

    class Meta:
        ordering = ["hoja", "numero_fila"]
        verbose_name = "Error de importación"
        verbose_name_plural = "Errores de importación"
        indexes = [
            models.Index(
                fields=["importacion", "numero_fila"], name="imperr_imp_fila_idx"
            ),
        ]

    def __str__(self):
        return f"[{self.hoja}:{self.numero_fila}] {self.codigo_error}"
