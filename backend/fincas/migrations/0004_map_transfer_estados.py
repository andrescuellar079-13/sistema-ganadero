# Data migration: mapear estados antiguos de transferencia al nuevo flujo.
#   CONFIRMADA -> PENDIENTE_RECEPCION   (animales aún no movidos definitivamente)
# Backfill fecha_envio desde fecha_confirmacion cuando exista.

from django.db import migrations


def forward(apps, schema_editor):
    TransferenciaFinca = apps.get_model('fincas', 'TransferenciaFinca')

    # CONFIRMADA -> PENDIENTE_RECEPCION
    for t in TransferenciaFinca.objects.filter(estado='CONFIRMADA').iterator():
        t.estado = 'PENDIENTE_RECEPCION'
        if not t.fecha_envio and t.fecha_confirmacion:
            t.fecha_envio = t.fecha_confirmacion
        t.save(update_fields=['estado', 'fecha_envio'])

    # RECIBIDA: backfill fecha_recepcion/fecha_envio si faltan
    for t in TransferenciaFinca.objects.filter(estado='RECIBIDA').iterator():
        cambios = []
        if not t.fecha_envio and t.fecha_confirmacion:
            t.fecha_envio = t.fecha_confirmacion
            cambios.append('fecha_envio')
        if not t.fecha_recepcion and t.fecha_confirmacion:
            t.fecha_recepcion = t.fecha_confirmacion
            cambios.append('fecha_recepcion')
        if cambios:
            t.save(update_fields=cambios)


def backward(apps, schema_editor):
    TransferenciaFinca = apps.get_model('fincas', 'TransferenciaFinca')
    TransferenciaFinca.objects.filter(estado='PENDIENTE_RECEPCION').update(estado='CONFIRMADA')


class Migration(migrations.Migration):

    dependencies = [
        ('fincas', '0003_transferenciafinca_fecha_envio_and_more'),
    ]

    operations = [
        migrations.RunPython(forward, backward),
    ]
