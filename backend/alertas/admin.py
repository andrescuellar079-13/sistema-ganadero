from django.contrib import admin

from .models import Gasto, Alerta


@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    list_display = (
        "fecha",
        "tipo_gasto",
        "centro_costo",
        "descripcion",
        "cantidad",
        "precio_unitario",
        "total",
        "metodo_pago",
        "proveedor",
        "animal",
        "finca",
    )
    list_filter = ("tipo_gasto", "centro_costo", "metodo_pago", "fecha", "finca")
    search_fields = (
        "descripcion",
        "proveedor",
        "comprobante",
        "animal__nro_arete",
        "animal__nombre",
    )


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = (
        "tipo",
        "prioridad",
        "estado",
        "modulo_origen",
        "mensaje",
        "fecha_alerta",
        "fecha_vencimiento",
        "dias_restantes",
        "leida",
        "animal",
        "finca",
    )
    list_filter = (
        "tipo",
        "prioridad",
        "estado",
        "modulo_origen",
        "leida",
        "fecha_alerta",
        "finca",
    )
    search_fields = (
        "mensaje",
        "animal__nro_arete",
        "animal__nombre",
    )
