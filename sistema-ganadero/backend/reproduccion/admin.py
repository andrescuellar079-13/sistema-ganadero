from django.contrib import admin
from .models import (
    InseminacionArtificial,
    MontaNatural,
    DiagnosticoPrenez,
    Reproduccion,
)


@admin.register(InseminacionArtificial)
class InseminacionArtificialAdmin(admin.ModelAdmin):
    list_display = (
        "hembra",
        "reproductor",
        "fecha",
        "fecha_probable_parto",
        "resultado",
        "numero_servicio",
    )
    list_filter = ("resultado", "fecha", "finca")
    search_fields = ("hembra__nro_arete", "hembra__nombre", "reproductor__nombre")


@admin.register(MontaNatural)
class MontaNaturalAdmin(admin.ModelAdmin):
    list_display = (
        "hembra",
        "reproductor",
        "fecha",
        "fecha_probable_parto",
        "resultado",
        "numero_servicio",
    )
    list_filter = ("resultado", "fecha", "finca")
    search_fields = ("hembra__nro_arete", "hembra__nombre", "reproductor__nombre")


@admin.register(DiagnosticoPrenez)
class DiagnosticoPrenezAdmin(admin.ModelAdmin):
    list_display = (
        "hembra",
        "resultado_prenez",
        "dias_gestacion",
        "fecha",
        "fecha_probable_parto",
        "veterinario",
    )
    list_filter = ("resultado_prenez", "fecha", "finca")
    search_fields = ("hembra__nro_arete", "hembra__nombre", "veterinario__nombre")


@admin.register(Reproduccion)
class ReproduccionAdmin(admin.ModelAdmin):
    list_display = (
        "madre",
        "fecha_servicio",
        "fecha_parto_esperado",
        "fecha_parto_real",
        "tipo_parto",
        "num_crias",
        "estado",
    )
    list_filter = ("estado", "tipo_parto", "finca")
    search_fields = ("madre__nro_arete", "madre__nombre")
    filter_horizontal = ("crias",)