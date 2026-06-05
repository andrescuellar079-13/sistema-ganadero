from django.contrib import admin
from .models import (
    Vacunacion,
    Tratamiento,
    Desparasitacion,
    TratamientoMedicamento,
    AnimalMedicamento,
    Diagnostico,
    Observacion,
)


@admin.register(Vacunacion)
class VacunacionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "animal",
        "vacuna",
        "fecha_aplicacion",
        "fecha_proxima",
        "campana",
        "lote",
    )
    list_filter = ("fecha_aplicacion", "fecha_proxima", "vacuna")
    search_fields = ("animal__nombre", "animal__codigo", "vacuna__nombre", "lote")
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        ("Información Básica", {
            "fields": ("finca", "animal", "vacuna", "veterinario")
        }),
        ("Datos de la Aplicación", {
            "fields": ("fecha_aplicacion", "campana", "lote", "dosis_aplicada", "via_aplicacion")
        }),
        ("Próxima Dosis", {
            "fields": ("fecha_proxima",)
        }),
        ("Observaciones", {
            "fields": ("observaciones",)
        }),
        ("Auditoría", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(Tratamiento)
class TratamientoAdmin(admin.ModelAdmin):
    list_display = (
        "animal",
        "diagnostico",
        "fecha_inicio",
        "fecha_fin",
        "en_tratamiento",
        "costo_total",
    )
    list_filter = ("en_tratamiento", "fecha_inicio", "finca")
    search_fields = ("animal__nro_arete", "animal__nombre", "diagnostico")


@admin.register(Desparasitacion)
class DesparasitacionAdmin(admin.ModelAdmin):
    list_display = (
        "animal",
        "medicamento",
        "fecha",
        "proxima_fecha",
        "tipo_parasiticida",
        "peso_aplicacion",
    )
    list_filter = ("fecha", "proxima_fecha", "finca")
    search_fields = ("animal__nro_arete", "animal__nombre", "medicamento__nombre")


@admin.register(TratamientoMedicamento)
class TratamientoMedicamentoAdmin(admin.ModelAdmin):
    list_display = (
        "tratamiento",
        "medicamento",
        "dosis",
        "via_aplicacion",
        "dias_retiro",
        "fecha",
    )
    search_fields = ("tratamiento__animal__nro_arete", "medicamento__nombre")


@admin.register(AnimalMedicamento)
class AnimalMedicamentoAdmin(admin.ModelAdmin):
    list_display = (
        "animal",
        "medicamento",
        "dosis",
        "fecha_administracion",
        "fecha_siguiente",
    )
    list_filter = ("fecha_administracion", "fecha_siguiente")
    search_fields = ("animal__nro_arete", "animal__nombre", "medicamento__nombre")


@admin.register(Diagnostico)
class DiagnosticoAdmin(admin.ModelAdmin):
    list_display = (
        "animal",
        "veterinario",
        "fecha",
        "descripcion",
    )
    list_filter = ("fecha", "finca")
    search_fields = ("animal__nro_arete", "animal__nombre", "descripcion")


@admin.register(Observacion)
class ObservacionAdmin(admin.ModelAdmin):
    list_display = (
        "animal",
        "fecha",
        "descripcion",
    )
    list_filter = ("fecha", "finca")
    search_fields = ("animal__nro_arete", "animal__nombre", "descripcion")