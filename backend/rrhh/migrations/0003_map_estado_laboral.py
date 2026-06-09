# Mapea el estado legacy (operativo) al nuevo estado_laboral canónico
# para los empleados existentes antes de Fase 1.
from django.db import migrations


# estado (legacy) -> estado_laboral (canónico)
MAPA = {
    'ACTIVO': 'ACTIVO',
    'LICENCIA': 'LICENCIA',
    'VACACIONES': 'LICENCIA',
    'INACTIVO': 'SUSPENDIDO',
}


def aplicar(apps, schema_editor):
    Empleado = apps.get_model('rrhh', 'Empleado')
    for emp in Empleado.objects.all():
        nuevo = MAPA.get(emp.estado, 'ACTIVO')
        if emp.estado_laboral != nuevo:
            emp.estado_laboral = nuevo
            emp.save(update_fields=['estado_laboral'])


def revertir(apps, schema_editor):
    # No-op: el campo legacy `estado` se conserva intacto.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('rrhh', '0002_empleado_contrato_empleado_documento_ci_and_more'),
    ]

    operations = [
        migrations.RunPython(aplicar, revertir),
    ]
