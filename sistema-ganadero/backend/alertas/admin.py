from django.contrib import admin

from .models import Gasto, Alerta


@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    list_display = (
        "fecha",
        "tipo_gasto",
        "descripcion",
        "cantidad",
        "precio_unitario",
        "total",
        "animal",
        "finca",
    )
    list_filter = ("tipo_gasto", "fecha", "finca")
    search_fields = (
        "descripcion",
        "animal__nro_arete",
        "animal__nombre",
    )


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = (
        "tipo",
        "mensaje",
        "fecha_alerta",
        "dias_restantes",
        "leida",
        "animal",
        "finca",
    )
    list_filter = ("tipo", "leida", "fecha_alerta", "finca")
    search_fields = (
        "mensaje",
        "animal__nro_arete",
        "animal__nombre",
    )