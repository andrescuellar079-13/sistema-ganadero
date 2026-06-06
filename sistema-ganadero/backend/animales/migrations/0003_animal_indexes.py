from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('animales', '0002_alter_animal_estado'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='animal',
            index=models.Index(fields=['nombre'], name='animales_an_nombre_idx'),
        ),
        migrations.AddIndex(
            model_name='animal',
            index=models.Index(fields=['nro_arete'], name='animales_an_nro_are_idx'),
        ),
        migrations.AddIndex(
            model_name='animal',
            index=models.Index(fields=['fecha_nacimiento'], name='animales_an_fecha_n_idx'),
        ),
        migrations.AddIndex(
            model_name='animal',
            index=models.Index(fields=['estado'], name='animales_an_estado_idx'),
        ),
        migrations.AddIndex(
            model_name='animal',
            index=models.Index(fields=['finca', 'estado'], name='animales_an_finca_estado_idx'),
        ),
        migrations.AddIndex(
            model_name='animal',
            index=models.Index(fields=['finca', 'fecha_registro'], name='animales_an_finca_fecha_idx'),
        ),
    ]
