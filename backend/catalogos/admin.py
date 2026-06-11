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
    list_display = ("nombre", "sexo_aplica", "edad_min_meses", "edad_max_meses", "tipo_produccion", "permite_lactancia", "permite_reproduccion", "orden", "activo")
    list_filter = ("activo", "sexo_aplica", "tipo_produccion", "permite_lactancia", "permite_reproduccion")
    search_fields = ("nombre",)
    fieldsets = (
        ("Datos básicos", {
            "fields": ("nombre", "descripcion", "orden", "activo")
        }),
        ("Reglas de clasificación", {
            "fields": ("sexo_aplica", "edad_min_meses", "edad_max_meses", "peso_min_kg", "peso_max_kg", "tipo_produccion")
        }),
        ("Permisos ganaderos", {
            "fields": ("permite_lactancia", "permite_reproduccion")
        }),
    )


@admin.register(TipoMedicamento)
class TipoMedicamentoAdmin(admin.ModelAdmin):
    list_display = ("nombre",)
    search_fields = ("nombre",)


@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "laboratorio", "principio_activo", "stock_cantidad", "stock_minimo", "precio_compra", "fecha_vencimiento", "activo")
    list_filter = ("activo", "tipo", "laboratorio", "fecha_vencimiento")
    search_fields = ("nombre", "laboratorio", "principio_activo")
    fieldsets = (
        ("Identificación", {
            "fields": ("finca", "tipo", "nombre", "laboratorio", "principio_activo", "presentacion")
        }),
        ("Inventario", {
            "fields": ("unidad_medida", "contenido_neto", "stock_cantidad", "stock_minimo", "precio_compra", "fecha_vencimiento")
        }),
        ("Uso sanitario", {
            "fields": ("dosis_recomendada", "via_aplicacion", "dias_retiro_carne", "dias_retiro_leche", "intervalo_dias")
        }),
        ("Estado y descripción", {
            "fields": ("activo", "imagen", "descripcion")
        }),
    )


@admin.register(Veterinario)
class VeterinarioAdmin(admin.ModelAdmin):
    list_display = ("nombre", "apellidos", "matricula_profesional", "especialidad", "tipo_servicio", "telefono", "costo_visita", "activo")
    list_filter = ("activo", "tipo_servicio", "especialidad")
    search_fields = ("nombre", "apellidos", "ci", "matricula_profesional", "especialidad")
    fieldsets = (
        ("Datos personales", {
            "fields": ("finca", "nombre", "apellidos", "ci", "telefono", "email", "direccion", "activo")
        }),
        ("Datos profesionales", {
            "fields": ("matricula_profesional", "especialidad", "tipo_servicio", "costo_visita", "firma_imagen")
        }),
        ("Observaciones", {
            "fields": ("observaciones",)
        }),
    )


@admin.register(Alimento)
class AlimentoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo_alimento", "stock_cantidad", "stock_minimo", "precio_referencia", "costo_por_kg", "proteina_porcentaje", "fecha_vencimiento", "activo")
    list_filter = ("activo", "tipo_alimento", "unidad_medida")
    search_fields = ("nombre", "uso_recomendado")
    fieldsets = (
        ("Datos básicos", {
            "fields": ("finca", "nombre", "tipo_alimento", "unidad_medida", "uso_recomendado", "activo")
        }),
        ("Inventario", {
            "fields": ("stock_cantidad", "stock_minimo", "contenido_neto", "precio_referencia", "costo_por_kg", "fecha_vencimiento")
        }),
        ("Valor nutricional", {
            "fields": ("materia_seca_porcentaje", "proteina_porcentaje", "fibra_porcentaje", "energia")
        }),
    )


@admin.register(Reproductor)
class ReproductorAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "raza", "tipo_origen", "tipo_reproductor", "stock_pajuelas", "costo_pajuela", "activo")
    list_filter = ("activo", "tipo_origen", "tipo_reproductor", "raza")
    search_fields = ("codigo", "nombre", "laboratorio")
    raw_id_fields = ("animal_interno",)
    fieldsets = (
        ("Datos básicos", {
            "fields": ("finca", "codigo", "nombre", "raza", "tipo_origen", "tipo_reproductor", "activo")
        }),
        ("Toro interno", {
            "fields": ("animal_interno",),
            "classes": ("collapse",)
        }),
        ("Semen / Pajuela", {
            "fields": ("codigo_pajuela", "laboratorio", "stock_pajuelas", "costo_pajuela"),
            "classes": ("collapse",)
        }),
        ("Datos genéticos", {
            "fields": ("facilidad_parto", "valor_genetico", "observaciones"),
            "classes": ("collapse",)
        }),
    )


@admin.register(Vacuna)
class VacunaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "enfermedad_previene", "dosis_recomendada", "via_aplicacion", "stock_cantidad", "stock_minimo", "fecha_vencimiento", "activo")
    list_filter = ("activo", "via_aplicacion", "finca")
    search_fields = ("nombre", "descripcion", "enfermedad_previene")
    list_editable = ("activo",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Datos básicos", {
            "fields": ("finca", "nombre", "descripcion", "enfermedad_previene", "lote", "activo")
        }),
        ("Aplicación", {
            "fields": ("dosis_recomendada", "via_aplicacion", "intervalo_dias", "edad_minima_meses")
        }),
        ("Inventario", {
            "fields": ("stock_cantidad", "stock_minimo", "fecha_vencimiento")
        }),
        ("Auditoría", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
