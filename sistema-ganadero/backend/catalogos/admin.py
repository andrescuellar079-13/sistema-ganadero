from django.contrib import admin
from .models import (
    Raza,
    CategoriaAnimal,
    TipoMedicamento,
    Medicamento,
    Veterinario,
    Alimento,
    Reproductor,
    Vacuna,
)


@admin.register(Raza)
class RazaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "orientacion", "origen", "activo")
    list_filter = ("activo", "orientacion")
    search_fields = ("nombre", "origen")


@admin.register(CategoriaAnimal)
class CategoriaAnimalAdmin(admin.ModelAdmin):
    list_display = ("nombre", "activo")
    list_filter = ("activo",)
    search_fields = ("nombre",)


@admin.register(TipoMedicamento)
class TipoMedicamentoAdmin(admin.ModelAdmin):
    list_display = ("nombre",)
    search_fields = ("nombre",)


@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "laboratorio", "stock_cantidad", "fecha_vencimiento", "activo")
    list_filter = ("activo", "tipo")
    search_fields = ("nombre", "laboratorio")


@admin.register(Veterinario)
class VeterinarioAdmin(admin.ModelAdmin):
    list_display = ("nombre", "apellidos", "ci", "especialidad", "telefono", "activo")
    list_filter = ("activo", "especialidad")
    search_fields = ("nombre", "apellidos", "ci")


@admin.register(Alimento)
class AlimentoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "stock_cantidad", "precio_referencia", "fecha_vencimiento", "activo")
    list_filter = ("activo", "unidad_medida")
    search_fields = ("nombre",)


@admin.register(Reproductor)
class ReproductorAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "raza", "tipo_origen", "activo")
    list_filter = ("activo", "tipo_origen", "raza")
    search_fields = ("codigo", "nombre", "laboratorio")


@admin.register(Vacuna)
class VacunaAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "dosis_recomendada", "via_aplicacion", "intervalo_dias", "edad_minima_meses", "activo")
    list_filter = ("activo", "via_aplicacion")
    search_fields = ("nombre", "descripcion")
    list_editable = ("activo",)
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        ("Información de la Vacuna", {
            "fields": ("finca", "nombre", "descripcion")
        }),
        ("Dosificación", {
            "fields": ("dosis_recomendada", "via_aplicacion", "intervalo_dias", "edad_minima_meses")
        }),
        ("Estado", {
            "fields": ("activo",)
        }),
        ("Auditoría", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )