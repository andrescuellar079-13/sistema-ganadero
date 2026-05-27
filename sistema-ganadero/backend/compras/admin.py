from django.contrib import admin

from .models import (
    Proveedor,
    NotaCompra,
    DetalleCompra,
    DetalleCompraAlimento,
)


class DetalleCompraInline(admin.TabularInline):
    model = DetalleCompra
    extra = 1


class DetalleCompraAlimentoInline(admin.TabularInline):
    model = DetalleCompraAlimento
    extra = 1


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "apellidos",
        "telefono",
        "nit",
        "ci",
        "estado",
        "finca",
    )
    list_filter = ("estado", "finca")
    search_fields = ("nombre", "apellidos", "telefono", "nit", "ci")


@admin.register(NotaCompra)
class NotaCompraAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "proveedor",
        "tipo_compra",
        "fecha_compra",
        "monto_total",
        "finca",
    )
    list_filter = ("tipo_compra", "fecha_compra", "finca")
    search_fields = (
        "proveedor__nombre",
        "proveedor__apellidos",
        "proveedor__nit",
    )
    inlines = [
        DetalleCompraInline,
        DetalleCompraAlimentoInline,
    ]


@admin.register(DetalleCompra)
class DetalleCompraAdmin(admin.ModelAdmin):
    list_display = (
        "nota_compra",
        "medicamento",
        "cantidad",
        "precio_unitario",
        "sub_total",
    )
    search_fields = ("medicamento__nombre",)


@admin.register(DetalleCompraAlimento)
class DetalleCompraAlimentoAdmin(admin.ModelAdmin):
    list_display = (
        "nota_compra",
        "alimento",
        "cantidad",
        "precio_unitario",
        "sub_total",
    )
    search_fields = ("alimento__nombre",)