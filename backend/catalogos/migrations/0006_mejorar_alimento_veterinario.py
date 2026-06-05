from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0005_fix_categoria_animal_fields'),
    ]

    operations = [
        # ─── ALIMENTO ───────────────────────────────────────────────────────────
        migrations.AddField(
            model_name='alimento',
            name='tipo_alimento',
            field=models.CharField(
                blank=True,
                choices=[
                    ('CONCENTRADO', 'Concentrado'),
                    ('HENO', 'Heno'),
                    ('SILO', 'Silo/Silaje'),
                    ('SAL_MINERAL', 'Sal Mineral'),
                    ('SUPLEMENTO', 'Suplemento'),
                    ('PASTO', 'Pasto'),
                    ('OTRO', 'Otro'),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='alimento',
            name='stock_minimo',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='alimento',
            name='costo_por_kg',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='alimento',
            name='materia_seca_porcentaje',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='alimento',
            name='proteina_porcentaje',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='alimento',
            name='fibra_porcentaje',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='alimento',
            name='energia',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='alimento',
            name='uso_recomendado',
            field=models.TextField(blank=True, null=True),
        ),
        # ─── VETERINARIO ────────────────────────────────────────────────────────
        migrations.AddField(
            model_name='veterinario',
            name='matricula_profesional',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='veterinario',
            name='tipo_servicio',
            field=models.CharField(
                blank=True,
                choices=[
                    ('SANIDAD', 'Sanidad'),
                    ('REPRODUCCION', 'Reproducción'),
                    ('CIRUGIA', 'Cirugía'),
                    ('DIAGNOSTICO', 'Diagnóstico'),
                    ('GENERAL', 'General'),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='veterinario',
            name='costo_visita',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='veterinario',
            name='direccion',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='veterinario',
            name='firma_imagen',
            field=models.ImageField(blank=True, null=True, upload_to='veterinarios/'),
        ),
        migrations.AddField(
            model_name='veterinario',
            name='observaciones',
            field=models.TextField(blank=True, null=True),
        ),
    ]
