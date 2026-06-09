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
    list_display = ['nombre', 'apellidos', 'tipo', 'tipo_empleado', 'finca',
                    'ci', 'telefono', 'salario', 'estado_laboral']
    search_fields = ['nombre', 'apellidos', 'ci']
    list_filter = ['finca', 'tipo', 'tipo_empleado', 'estado_laboral', 'sexo']
    autocomplete_fields = []
    raw_id_fields = ['usuario']