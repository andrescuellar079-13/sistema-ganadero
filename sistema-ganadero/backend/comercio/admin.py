from django.contrib import admin

from .models import (
    Cliente,
    NotaVenta,
    DetalleVenta,
    MuerteBaja,
)


class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    extra = 1


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "apellidos",
        "telefono",
        "ci",
        "email",
        "finca",
    )
    list_filter = ("finca",)
    search_fields = ("nombre", "apellidos", "ci", "telefono")


@admin.register(NotaVenta)
class NotaVentaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "cliente",
        "fecha_venta",
        "monto_total",
        "guia_salida",
        "finca",
    )
    list_filter = ("fecha_venta", "finca")
    search_fields = (
        "cliente__nombre",
        "cliente__apellidos",
        "guia_salida",
    )
    inlines = [DetalleVentaInline]


@admin.register(DetalleVenta)
class DetalleVentaAdmin(admin.ModelAdmin):
    list_display = (
        "nota_venta",
        "animal",
        "peso_venta_kg",
        "precio_unitario",
        "sub_total",
    )
    search_fields = (
        "animal__nro_arete",
        "animal__nombre",
    )


@admin.register(MuerteBaja)
class MuerteBajaAdmin(admin.ModelAdmin):
    list_display = (
        "animal",
        "fecha_baja",
        "tipo",
        "causa",
        "peso_estimado_kg",
        "finca",
    )
    list_filter = ("tipo", "fecha_baja", "finca")
    search_fields = (
        "animal__nro_arete",
        "animal__nombre",
        "causa",
    )