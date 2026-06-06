# backend/rrhh/admin.py
from django.contrib import admin
from .models import TipoEmpleado, Empleado

@admin.register(TipoEmpleado)
class TipoEmpleadoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'salario_base', 'activo']
    search_fields = ['nombre']
    list_filter = ['activo']

@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'apellidos', 'tipo', 'ci', 'telefono', 'estado']
    search_fields = ['nombre', 'apellidos', 'ci']
    list_filter = ['tipo', 'estado', 'sexo']