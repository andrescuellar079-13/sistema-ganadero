from django.contrib import admin

from .models import ImportacionGanadera, ImportacionGanaderaError


class ErrorInline(admin.TabularInline):
    model = ImportacionGanaderaError
    extra = 0
    can_delete = False
    readonly_fields = ("hoja", "numero_fila", "campo", "valor", "codigo_error", "mensaje")


@admin.register(ImportacionGanadera)
class ImportacionGanaderaAdmin(admin.ModelAdmin):
    list_display = (
        "id", "nombre_archivo", "finca", "estado", "modo",
        "total_filas", "creados", "actualizados", "total_errores",
        "fecha_creacion",
    )
    list_filter = ("estado", "modo", "finca")
    search_fields = ("nombre_archivo",)
    readonly_fields = ("fecha_creacion", "fecha_inicio", "fecha_finalizacion", "resumen_json")
    inlines = [ErrorInline]
