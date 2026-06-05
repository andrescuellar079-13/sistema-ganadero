from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0004_mejorar_vacuna_medicamento_categoria_reproductor'),
    ]

    operations = [
        # Rellenar nulls en edad_min_meses antes de quitar null=True
        migrations.RunSQL(
            "UPDATE catalogos_categoria_animal SET edad_min_meses = 0 WHERE edad_min_meses IS NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name='categoriaanimal',
            name='edad_min_meses',
            field=models.IntegerField(default=0),
        ),
        # Rellenar nulls en peso_min_kg antes de quitar null=True
        migrations.RunSQL(
            "UPDATE catalogos_categoria_animal SET peso_min_kg = 0 WHERE peso_min_kg IS NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name='categoriaanimal',
            name='peso_min_kg',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='categoriaanimal',
            name='peso_max_kg',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
