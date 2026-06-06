from django.contrib import admin

from .models import (
    RegistroPeso,
    Lactancia,
    ProduccionLeche,
    AlimentoAnimal,
)


@admin.register(RegistroPeso)
class RegistroPesoAdmin(admin.ModelAdmin):
    list_display = (
        "animal",
        "fecha_pesaje",
        "peso_kg",
        "ganancia_diaria",
        "condicion_corporal",
        "finca",
    )
    list_filter = ("fecha_pesaje", "finca")
    search_fields = (
        "animal__nro_arete",
        "animal__nombre",
    )


@admin.register(Lactancia)
class LactanciaAdmin(admin.ModelAdmin):
    list_display = (
        "vaca",
        "numero_lactancia",
        "fecha_inicio",
        "fecha_secado",
        "dias_produccion",
        "total_litros",
        "promedio_diario",
        "ajuste_305_dias",
        "estado",
    )
    list_filter = ("estado", "fecha_inicio", "finca")
    search_fields = (
        "vaca__nro_arete",
        "vaca__nombre",
    )


@admin.register(ProduccionLeche)
class ProduccionLecheAdmin(admin.ModelAdmin):
    list_display = (
        "vaca",
        "lactancia",
        "fecha",
        "turno",
        "litros",
        "dias_en_lactancia",
        "finca",
    )
    list_filter = ("fecha", "turno", "finca")
    search_fields = (
        "vaca__nro_arete",
        "vaca__nombre",
    )


@admin.register(AlimentoAnimal)
class AlimentoAnimalAdmin(admin.ModelAdmin):
    list_display = (
        "animal",
        "alimento",
        "cantidad",
        "fecha_alimentacion",
        "finca",
    )
    list_filter = ("fecha_alimentacion", "finca")
    search_fields = (
        "animal__nro_arete",
        "animal__nombre",
        "alimento__nombre",
    )