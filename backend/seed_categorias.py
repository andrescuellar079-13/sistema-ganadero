"""
Actualiza las reglas ganaderas de CategoriaAnimal en la BD existente.
Ejecutar desde la carpeta backend/:
    python seed_categorias.py
"""
import os
import sys
import django
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalogos.models import CategoriaAnimal

CATEGORIAS = [
    dict(nombre="Ternero",    descripcion="Cría macho de 0 a 12 meses",                          sexo_aplica="MACHO",  edad_min_meses=0,  edad_max_meses=12,  peso_min_kg=0,   peso_max_kg=180, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=False, orden=1),
    dict(nombre="Ternera",    descripcion="Cría hembra de 0 a 12 meses",                          sexo_aplica="HEMBRA", edad_min_meses=0,  edad_max_meses=12,  peso_min_kg=0,   peso_max_kg=180, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=False, orden=2),
    dict(nombre="Novillo",    descripcion="Macho castrado en engorde (12 a 36 meses)",            sexo_aplica="MACHO",  edad_min_meses=12, edad_max_meses=36,  peso_min_kg=150, peso_max_kg=450, tipo_produccion="CARNE", permite_lactancia=False, permite_reproduccion=False, orden=3),
    dict(nombre="Novilla",    descripcion="Hembra de 12 a 30 meses, apta para reproducción",     sexo_aplica="HEMBRA", edad_min_meses=12, edad_max_meses=30,  peso_min_kg=150, peso_max_kg=400, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=True,  orden=4),
    dict(nombre="Vaquillona", descripcion="Hembra de 18 a 36 meses, primera gestación",          sexo_aplica="HEMBRA", edad_min_meses=18, edad_max_meses=36,  peso_min_kg=220, peso_max_kg=450, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=True,  orden=5),
    dict(nombre="Vaca",       descripcion="Hembra adulta en producción",                          sexo_aplica="HEMBRA", edad_min_meses=24, edad_max_meses=None, peso_min_kg=250, peso_max_kg=None, tipo_produccion="TODOS", permite_lactancia=True,  permite_reproduccion=True,  orden=6),
    dict(nombre="Vaca Seca",  descripcion="Hembra adulta sin producción activa de leche",         sexo_aplica="HEMBRA", edad_min_meses=24, edad_max_meses=None, peso_min_kg=250, peso_max_kg=None, tipo_produccion="LECHE", permite_lactancia=False, permite_reproduccion=True,  orden=7),
    dict(nombre="Toro",       descripcion="Macho reproductor adulto",                             sexo_aplica="MACHO",  edad_min_meses=24, edad_max_meses=None, peso_min_kg=300, peso_max_kg=None, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=True,  orden=8),
    dict(nombre="Descarte",   descripcion="Animal en proceso de descarte o baja productividad",  sexo_aplica="AMBOS",  edad_min_meses=0,  edad_max_meses=None, peso_min_kg=0,   peso_max_kg=None, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=False, orden=99),
]

print("Actualizando categorías ganaderas...")
created_count = 0
updated_count = 0

for data in CATEGORIAS:
    nombre = data["nombre"]
    defaults = {k: v for k, v in data.items() if k != "nombre"}
    obj, created = CategoriaAnimal.objects.update_or_create(nombre=nombre, defaults=defaults)
    if created:
        created_count += 1
        print(f"  [CREADA]    {nombre}")
    else:
        updated_count += 1
        print(f"  [ACTUALIZADA] {nombre}")

print(f"\nResumen: {created_count} creadas, {updated_count} actualizadas.")
print("\nVerificación:")
for cat in CategoriaAnimal.objects.order_by('orden', 'nombre'):
    sexo = cat.sexo_aplica
    lactancia = "Sí" if cat.permite_lactancia else "No"
    reproduccion = "Sí" if cat.permite_reproduccion else "No"
    e_min = cat.edad_min_meses
    e_max = cat.edad_max_meses if cat.edad_max_meses is not None else "inf"
    print(f"  [{cat.orden:>2}] {cat.nombre:<12} | {sexo:<6} | {e_min}-{e_max} m | lactancia={lactancia} | reprod={reproduccion}")
