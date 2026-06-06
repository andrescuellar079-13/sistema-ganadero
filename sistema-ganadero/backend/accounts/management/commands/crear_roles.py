# backend/accounts/management/commands/crear_roles.py
from django.core.management.base import BaseCommand
from accounts.models import Rol
from accounts.schema import PERMISOS_SISTEMA

class Command(BaseCommand):
    help = 'Crea los roles por defecto del sistema'
    
    def handle(self, *args, **options):
        roles = {
            'ADMINISTRADOR': {
                'descripcion': 'Acceso total al sistema',
                'permisos': list(PERMISOS_SISTEMA.keys())
            },
            'VETERINARIO': {
                'descripcion': 'Puede ver y gestionar sanidad, vacunaciones y reproducción',
                'permisos': [
                    'dashboard_ver',
                    'animales_ver', 'animales_crear', 'animales_editar',
                    'vacunas_ver', 'vacunas_crear', 'vacunas_editar',
                    'vacunaciones_ver', 'vacunaciones_crear',
                    'reproduccion_ver', 'reproduccion_crear',
                    'sanidad_ver', 'sanidad_crear',
                    'alertas_ver', 'alertas_crear',
                    'parcelas_ver',
                ]
            },
            'ENCARGADO_VENTAS': {
                'descripcion': 'Puede ver y gestionar ventas, clientes y proveedores',
                'permisos': [
                    'dashboard_ver',
                    'animales_ver',
                    'ventas_ver', 'ventas_crear',
                    'compras_ver', 'compras_crear',
                    'clientes_ver', 'clientes_crear', 'clientes_editar',
                    'proveedores_ver', 'proveedores_crear', 'proveedores_editar',
                    'reportes_ver',
                ]
            },
            'PRODUCCION': {
                'descripcion': 'Puede ver y gestionar producción lechera',
                'permisos': [
                    'dashboard_ver',
                    'animales_ver',
                    'produccion_ver', 'produccion_crear',
                    'reproduccion_ver',
                    'alertas_ver',
                ]
            },
            'USUARIO': {
                'descripcion': 'Acceso básico de solo lectura',
                'permisos': [
                    'dashboard_ver',
                    'animales_ver',
                    'vacunas_ver',
                    'vacunaciones_ver',
                    'reproduccion_ver',
                    'produccion_ver',
                    'sanidad_ver',
                    'alertas_ver',
                ]
            },
        }
        
        for nombre, data in roles.items():
            rol, created = Rol.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'descripcion': data['descripcion'],
                    'permisos': data['permisos'],
                    'activo': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Rol "{nombre}" creado'))
            else:
                self.stdout.write(self.style.WARNING(f'Rol "{nombre}" ya existe'))
        
        self.stdout.write(self.style.SUCCESS('Roles iniciales creados exitosamente'))