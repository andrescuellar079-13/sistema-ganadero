from django.contrib import admin
from .models import Finca


@admin.register(Finca)
class FincaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'propietario', 'municipio', 'activo')
    search_fields = ('nombre', 'propietario', 'municipio')
    list_filter = ('activo',)
