# Generated manually for Vacuna catalogo sanitario mejoras

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0007_alter_categoriaanimal_permite_reproduccion'),
    ]

    operations = [
        migrations.AddField(
            model_name='vacuna',
            name='laboratorio',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name='vacuna',
            name='requiere_refuerzo',
            field=models.BooleanField(default=False, help_text='Requiere dosis de refuerzo'),
        ),
        migrations.AddField(
            model_name='vacuna',
            name='dias_anticipacion_alerta',
            field=models.IntegerField(default=30, help_text='Días de anticipación para generar alertas'),
        ),
        migrations.AddField(
            model_name='vacuna',
            name='sexo_aplicable',
            field=models.CharField(
                choices=[('MACHO', 'Macho'), ('HEMBRA', 'Hembra'), ('AMBOS', 'Ambos')],
                default='AMBOS', max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='vacuna',
            name='tipo_produccion_aplicable',
            field=models.CharField(
                choices=[
                    ('CARNE', 'Carne'), ('LECHE', 'Leche'),
                    ('DOBLE_PROPOSITO', 'Doble propósito'), ('TODOS', 'Todos'),
                ],
                default='TODOS', max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='vacuna',
            name='observaciones_tecnicas',
            field=models.TextField(blank=True, null=True),
        ),
    ]
