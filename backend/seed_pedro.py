"""
Seeder de datos de prueba — Finca de Pedro (Hacienda Pedros)
Ejecutar desde la carpeta backend/:
    python seed_pedro.py   (o venv/Scripts/python.exe seed_pedro.py)

Crea ~130 animales y registros equivalentes por módulo para la finca
"Hacienda Pedros", cuyo propietario/usuario es `pedro`.

- Usa get_or_create scoped a la finca de Pedro para NO duplicar ni pisar
  los datos de otras fincas (ej. "Estancia La Providencia").
- Datos completamente diferentes: nombres de animales, aretes, clientes,
  proveedores, veterinarios y empleados distintos.
- Los bloques transaccionales (vacunaciones, ventas, etc.) tienen guardas
  de idempotencia: si ya existen registros para esta finca, no se recrean.
"""

import os
import sys
import django
from pathlib import Path

# ── Setup Django ──────────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import random
from datetime import date, timedelta
from decimal import Decimal

# ── Imports de modelos ────────────────────────────────────────────────────────
from fincas.models import Finca
from catalogos.models import (
    Raza, CategoriaAnimal, TipoMedicamento,
    Medicamento, Veterinario, Alimento, Reproductor, Vacuna,
)
from accounts.models import Rol, Usuario
from animales.models import Animal, Parcela, AnimalParcela
from sanidad.models import Vacunacion, Tratamiento, Desparasitacion
from reproduccion.models import Reproduccion
from produccion.models import RegistroPeso, ProduccionLeche, Lactancia
from comercio.models import Cliente, NotaVenta, DetalleVenta, MuerteBaja
from compras.models import Proveedor, NotaCompra, DetalleCompra
from rrhh.models import TipoEmpleado, Empleado
from alertas.models import Alerta, Gasto


# ── Helpers ───────────────────────────────────────────────────────────────────
def fecha_aleatoria(desde_dias=730, hasta_dias=0):
    delta = random.randint(hasta_dias, desde_dias)
    return date.today() - timedelta(days=delta)


def rand_decimal(lo, hi, dp=2):
    # Devuelve Decimal para evitar errores float/Decimal en save() de los modelos
    # (p.ej. RegistroPeso.ganancia_diaria o señales de Reproducción).
    return Decimal(str(round(random.uniform(lo, hi), dp)))


def pick(*items):
    return random.choice(items)


print("=" * 60)
print("  SEEDER — Hacienda Pedros (finca de Pedro)")
print("=" * 60)


# ════════════════════════════════════════════════════════════════
# 1. FINCA  (reusa la existente)
# ════════════════════════════════════════════════════════════════
print("\n[1/13] Finca...")

finca, _ = Finca.objects.get_or_create(
    nombre="Hacienda Pedros",
    defaults=dict(
        propietario="Pedro Cuellar",
        departamento="Itapúa",
        municipio="Encarnación",
        ubicacion="Ruta 1 km 28, Encarnación",
        telefono="0971-444-001",
        activo=True,
    ),
)
print(f"   Finca: {finca.nombre} (id={finca.pk})")

# Usuario propietario (debe existir)
owner = (
    Usuario.objects.filter(username="pedro").first()
    or Usuario.objects.filter(finca=finca).first()
    or Usuario.objects.filter(is_superuser=True).first()
)
if owner is None:
    raise SystemExit("No se encontró el usuario 'pedro' ni un superusuario. Crea el usuario primero.")
print(f"   Propietario/registrado_por: {owner.username} (id={owner.pk})")


# ════════════════════════════════════════════════════════════════
# 2. CATÁLOGOS BASE (globales — se reutilizan, no se duplican)
# ════════════════════════════════════════════════════════════════
print("\n[2/13] Catálogos (razas, categorías, tipos)...")

razas_data = [
    ("Nelore", "CARNE", "Brasil"),
    ("Brahman", "DOBLE_PROPOSITO", "India"),
    ("Hereford", "CARNE", "Gran Bretaña"),
    ("Angus", "CARNE", "Escocia"),
    ("Holando Argentino", "LECHE", "Países Bajos"),
    ("Simmental", "DOBLE_PROPOSITO", "Suiza"),
    ("Gyr", "LECHE", "India"),
    ("Brangus", "CARNE", "EE.UU."),
    ("Limousin", "CARNE", "Francia"),
    ("Senepol", "DOBLE_PROPOSITO", "Islas Vírgenes"),
]
razas = {}
for nombre, orientacion, origen in razas_data:
    r, _ = Raza.objects.get_or_create(nombre=nombre, defaults=dict(orientacion=orientacion, origen=origen, activo=True))
    razas[nombre] = r

cats_data = [
    dict(nombre="Ternero",    descripcion="Cría macho de 0 a 12 meses",                           sexo_aplica="MACHO",  edad_min_meses=0,  edad_max_meses=12,  peso_min_kg=0,   peso_max_kg=180, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=False, orden=1,  activo=True),
    dict(nombre="Ternera",    descripcion="Cría hembra de 0 a 12 meses",                           sexo_aplica="HEMBRA", edad_min_meses=0,  edad_max_meses=12,  peso_min_kg=0,   peso_max_kg=180, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=False, orden=2,  activo=True),
    dict(nombre="Novillo",    descripcion="Macho castrado en engorde (12 a 36 meses)",             sexo_aplica="MACHO",  edad_min_meses=12, edad_max_meses=36,  peso_min_kg=150, peso_max_kg=450, tipo_produccion="CARNE", permite_lactancia=False, permite_reproduccion=False, orden=3,  activo=True),
    dict(nombre="Novilla",    descripcion="Hembra de 12 a 30 meses, apta para reproducción",      sexo_aplica="HEMBRA", edad_min_meses=12, edad_max_meses=30,  peso_min_kg=150, peso_max_kg=400, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=True,  orden=4,  activo=True),
    dict(nombre="Vaquillona", descripcion="Hembra de 18 a 36 meses, primera gestación",           sexo_aplica="HEMBRA", edad_min_meses=18, edad_max_meses=36,  peso_min_kg=220, peso_max_kg=450, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=True,  orden=5,  activo=True),
    dict(nombre="Vaca",       descripcion="Hembra adulta en producción",                           sexo_aplica="HEMBRA", edad_min_meses=24, edad_max_meses=None, peso_min_kg=250, peso_max_kg=None, tipo_produccion="TODOS", permite_lactancia=True,  permite_reproduccion=True,  orden=6,  activo=True),
    dict(nombre="Vaca Seca",  descripcion="Hembra adulta sin producción activa de leche",          sexo_aplica="HEMBRA", edad_min_meses=24, edad_max_meses=None, peso_min_kg=250, peso_max_kg=None, tipo_produccion="LECHE", permite_lactancia=False, permite_reproduccion=True,  orden=7,  activo=True),
    dict(nombre="Toro",       descripcion="Macho reproductor adulto",                              sexo_aplica="MACHO",  edad_min_meses=24, edad_max_meses=None, peso_min_kg=300, peso_max_kg=None, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=True,  orden=8,  activo=True),
    dict(nombre="Descarte",   descripcion="Animal en proceso de descarte o baja productividad",   sexo_aplica="AMBOS",  edad_min_meses=0,  edad_max_meses=None, peso_min_kg=0,   peso_max_kg=None, tipo_produccion="TODOS", permite_lactancia=False, permite_reproduccion=False, orden=99, activo=True),
]
cats = {}
for cat_data in cats_data:
    nombre = cat_data["nombre"]
    defaults = {k: v for k, v in cat_data.items() if k != "nombre"}
    c, _ = CategoriaAnimal.objects.update_or_create(nombre=nombre, defaults=defaults)
    cats[nombre] = c

buey, _ = CategoriaAnimal.objects.get_or_create(
    nombre="Buey",
    defaults=dict(descripcion="Macho castrado adulto de trabajo", sexo_aplica="MACHO", edad_min_meses=36, tipo_produccion="CARNE", permite_lactancia=False, permite_reproduccion=False, orden=10, activo=True)
)
cats["Buey"] = buey

tipos_med_data = [
    ("Antibiótico", "Medicamentos para combatir infecciones bacterianas"),
    ("Antiparasitario", "Productos contra parásitos internos y externos"),
    ("Antiinflamatorio", "Reduce inflamación y dolor"),
    ("Vitamina/Mineral", "Suplementos nutricionales"),
    ("Hormona", "Reguladores hormonales para reproducción"),
]
tipos_med = []
for nombre, desc in tipos_med_data:
    t, _ = TipoMedicamento.objects.get_or_create(nombre=nombre, defaults=dict(descripcion=desc))
    tipos_med.append(t)

print(f"   Razas: {len(razas)} | Categorías: {len(cats)} | Tipos med: {len(tipos_med)}")


# ════════════════════════════════════════════════════════════════
# 3. VACUNAS (20) — scoped a la finca de Pedro
# ════════════════════════════════════════════════════════════════
print("\n[3/13] Vacunas...")

vacunas_data = [
    ("Aftosa", "Fiebre aftosa bivalente", "2 ml", "SUBCUTANEA", 180, 3),
    ("Brucelosis", "Brucelosis bovina RB51", "2 ml", "SUBCUTANEA", 365, 3),
    ("Rabia Bovina", "Rabia paresiante bovina", "2 ml", "SUBCUTANEA", 365, 6),
    ("Carbunco Sintomático", "Carbunco sintomático y edema maligno", "5 ml", "SUBCUTANEA", 365, 3),
    ("Clostridiosis", "Polivalente clostridiosis 8 cepas", "5 ml", "SUBCUTANEA", 365, 2),
    ("IBR/DVB", "Rinotraqueítis infecciosa y Diarrea viral bovina", "2 ml", "INTRAMUSCULAR", 365, 6),
    ("Leptospirosis", "Leptospirosis multivalente 7 serovariedades", "5 ml", "SUBCUTANEA", 180, 6),
    ("Pasteurelosis", "Pasteurelosis bovina", "5 ml", "INTRAMUSCULAR", 365, 3),
    ("Botulismo", "Toxoide botulínico C y D", "5 ml", "SUBCUTANEA", 365, 3),
    ("Hectoen", "Haemophilus somnus", "2 ml", "INTRAMUSCULAR", 365, 6),
    ("Campilobacteriosis", "Vibriosis / Campilobacteriosis bovina", "2 ml", "SUBCUTANEA", 365, 6),
    ("Anaplasmosis", "Anaplasma marginale vivo", "1 ml", "SUBCUTANEA", 365, 4),
    ("Neumoenteritis", "Rotavirus + Coronavirus + K99", "2 ml", "INTRAMUSCULAR", 365, 0),
    ("Sarna / Pediculosis", "Ivermectina 1% prevención ectoparásitos", "1 ml/50kg", "SUBCUTANEA", 90, 0),
    ("Mancha", "Carbunco bacteridiano", "1 ml", "SUBCUTANEA", 365, 3),
    ("Queratoconjuntivitis", "Moraxella bovis", "2 ml", "SUBCUTANEA", 365, 3),
    ("BVD Tipo 2", "Diarrea viral bovina tipo 2", "2 ml", "INTRAMUSCULAR", 365, 4),
    ("Hemoglobinuria", "Clostridium haemolyticum", "5 ml", "SUBCUTANEA", 365, 3),
    ("Hemobartonelosis", "Eperythrozoon wenyonii", "2 ml", "INTRAMUSCULAR", 365, 4),
    ("Tricomoniasis", "Tritrichomonas foetus", "2 ml", "SUBCUTANEA", 365, 18),
]

vacunas = []
for nombre, desc, dosis, via, intervalo, edad_min in vacunas_data:
    v, _ = Vacuna.objects.get_or_create(
        finca=finca, nombre=nombre,
        defaults=dict(
            descripcion=desc, dosis_recomendada=dosis,
            via_aplicacion=via, intervalo_dias=intervalo,
            edad_minima_meses=edad_min, activo=True,
        ),
    )
    vacunas.append(v)
print(f"   Vacunas: {len(vacunas)}")


# ════════════════════════════════════════════════════════════════
# 4. MEDICAMENTOS (25) — scoped a la finca de Pedro
# ════════════════════════════════════════════════════════════════
print("\n[4/13] Medicamentos...")

meds_data = [
    ("Oxitetraciclina LA 200", tipos_med[0], "ml", 500, "LA Pharma", 90),
    ("Penicilina G Procaína", tipos_med[0], "ml", 300, "Holliday", 30),
    ("Enrofloxacina 10%", tipos_med[0], "ml", 200, "Bayer", 45),
    ("Florfenicol 30%", tipos_med[0], "ml", 250, "Schering", 60),
    ("Tilmicosina 25%", tipos_med[0], "ml", 150, "Elanco", 90),
    ("Ivermectina 1%", tipos_med[1], "ml", 1000, "Merial", 365),
    ("Doramectina 1%", tipos_med[1], "ml", 500, "Pfizer", 365),
    ("Albendazol 10%", tipos_med[1], "g", 800, "Intervet", 180),
    ("Levamisol 15%", tipos_med[1], "ml", 600, "Vetoquinol", 180),
    ("Closantel 5%", tipos_med[1], "ml", 400, "Janssen", 180),
    ("Flunixin Meglumina", tipos_med[2], "ml", 300, "Schering", 90),
    ("Ketoprofeno 10%", tipos_med[2], "ml", 200, "Merial", 60),
    ("Meloxicam 0.5%", tipos_med[2], "ml", 150, "Boehringer", 90),
    ("Dexametasona 0.2%", tipos_med[2], "ml", 100, "Bayer", 60),
    ("AD3E Inyectable", tipos_med[3], "ml", 600, "Rhodia", 365),
    ("Complejo B 12", tipos_med[3], "ml", 400, "Intervet", 365),
    ("Calcio Gluconato 20%", tipos_med[3], "ml", 500, "Bayer", 180),
    ("Selenio + Vit E", tipos_med[3], "ml", 300, "Pfizer", 180),
    ("Hierro Dextrano 10%", tipos_med[3], "ml", 200, "Merial", 365),
    ("GnRH 50 mcg/ml", tipos_med[4], "ml", 100, "Ceva", 180),
    ("Progesterona 1%", tipos_med[4], "ml", 200, "Biogénesis", 90),
    ("PGF2alpha 5mg/ml", tipos_med[4], "ml", 150, "Pfizer", 90),
    ("Ocitocina 10 UI/ml", tipos_med[4], "ml", 100, "Merial", 180),
    ("PMSG 500 UI/vial", tipos_med[4], "vial", 50, "Intervet", 365),
    ("Cloruro de Sodio 0.9%", tipos_med[2], "ml", 2000, "Baxter", 365),
]
medicamentos = []
for nombre, tipo, unidad, stock, lab, vida_util in meds_data:
    venc = date.today() + timedelta(days=vida_util)
    m, _ = Medicamento.objects.get_or_create(
        finca=finca, nombre=nombre,
        defaults=dict(
            tipo=tipo, unidad_medida=unidad,
            stock_cantidad=stock, laboratorio=lab,
            fecha_vencimiento=venc, precio_compra=rand_decimal(5000, 150000),
            activo=True,
        ),
    )
    medicamentos.append(m)
print(f"   Medicamentos: {len(medicamentos)}")


# ════════════════════════════════════════════════════════════════
# 5. ALIMENTOS (10) — scoped a la finca de Pedro
# ════════════════════════════════════════════════════════════════
print("\n[5/13] Alimentos...")

alimentos_data = [
    ("Maíz molido", "kg", 2000),
    ("Soja desactivada", "kg", 1500),
    ("Heno de tifton", "kg", 5000),
    ("Silaje de maíz", "kg", 8000),
    ("Afrechillo de trigo", "kg", 1200),
    ("Núcleo mineral bovino", "kg", 300),
    ("Sal común", "kg", 400),
    ("Melaza de caña", "litros", 600),
    ("Concentrado engorde", "kg", 2500),
    ("Balanceado lechero", "kg", 1800),
]
alimentos = []
for nombre, unidad, stock in alimentos_data:
    a, _ = Alimento.objects.get_or_create(
        finca=finca, nombre=nombre,
        defaults=dict(
            unidad_medida=unidad, stock_cantidad=stock,
            precio_referencia=rand_decimal(500, 8000),
            fecha_vencimiento=date.today() + timedelta(days=365),
            activo=True,
        ),
    )
    alimentos.append(a)
print(f"   Alimentos: {len(alimentos)}")


# ════════════════════════════════════════════════════════════════
# 6. VETERINARIOS (6) — nombres y CI distintos
# ════════════════════════════════════════════════════════════════
print("\n[6/13] Veterinarios...")

vets_data = [
    ("Gustavo", "Acosta Benítez", "9100001", "Medicina Bovina", "0971-911-001", "gustavo.vet@pedros.com"),
    ("Silvia", "Cardozo Mendoza", "9100002", "Reproducción Animal", "0971-911-002", "silvia.vet@pedros.com"),
    ("Daniel", "Espinoza Ovelar", "9100003", "Sanidad Animal", "0971-911-003", "daniel.vet@pedros.com"),
    ("Verónica", "Gauto Riveros", "9100004", "Nutrición Bovina", "0971-911-004", "veronica.vet@pedros.com"),
    ("Marcelo", "Ibarra Coronel", "9100005", "Cirugía Bovina", "0971-911-005", "marcelo.vet@pedros.com"),
    ("Carolina", "Notario Recalde", "9100006", "Medicina Interna", "0971-911-006", "carolina.vet@pedros.com"),
]
veterinarios = []
for nombre, apellidos, ci, esp, tel, email in vets_data:
    v, _ = Veterinario.objects.get_or_create(
        finca=finca, ci=ci,
        defaults=dict(
            nombre=nombre, apellidos=apellidos,
            especialidad=esp, telefono=tel, email=email, activo=True,
        ),
    )
    veterinarios.append(v)
print(f"   Veterinarios: {len(veterinarios)}")


# ════════════════════════════════════════════════════════════════
# 7. REPRODUCTORES (8) — códigos distintos
# ════════════════════════════════════════════════════════════════
print("\n[7/13] Reproductores...")

reproductores = []
for i in range(1, 9):
    codigo = f"RPP-{i:03d}"
    r, _ = Reproductor.objects.get_or_create(
        finca=finca, codigo=codigo,
        defaults=dict(
            nombre=f"Semental Pedros {i}",
            raza=random.choice(list(razas.values())),
            tipo_origen=pick("INTERNO", "EXTERNO", "SEMEN"),
            codigo_pajuela=f"PJP-{i:04d}" if random.random() > 0.4 else None,
            laboratorio="ABS Global" if random.random() > 0.5 else "Sexing Technologies",
            activo=True,
        ),
    )
    reproductores.append(r)
print(f"   Reproductores: {len(reproductores)}")


# ════════════════════════════════════════════════════════════════
# 8. ROLES (globales, se reutilizan)
# ════════════════════════════════════════════════════════════════
print("\n[8/13] Roles...")
for nombre, desc, perms in [
    ("Administrador", "Acceso total al sistema", ["all"]),
    ("Ganadero", "Gestión de animales y sanidad", ["animales_ver", "animales_crear", "sanidad_ver"]),
    ("Comercial", "Ventas y compras", ["ventas_ver", "compras_ver", "clientes_ver"]),
    ("Supervisor", "Supervisión general", ["all"]),
]:
    Rol.objects.get_or_create(nombre=nombre, defaults=dict(descripcion=desc, permisos=perms, activo=True))
print(f"   Roles: {Rol.objects.count()}")


# ════════════════════════════════════════════════════════════════
# 9. PARCELAS (12) — nombres distintos
# ════════════════════════════════════════════════════════════════
print("\n[9/13] Parcelas y Animales...")

pasturas = ["Tifton 85", "Brachiaria brizantha", "Coastcross", "Tanzania", "Mombaça", "Panicum maximum"]
parcelas = []
for i in range(1, 13):
    p, _ = Parcela.objects.get_or_create(
        nombre=f"Lote {i}",
        finca=finca,
        defaults=dict(
            estado=pick("OCUPADO", "LIBRE", "DESCANSO"),
            tamano=rand_decimal(20, 150),
            capacidad_maxima=random.randint(15, 80),
            tipo_pastura=random.choice(pasturas),
        ),
    )
    parcelas.append(p)
print(f"   Parcelas: {len(parcelas)}")


# ════════════════════════════════════════════════════════════════
# 10. ANIMALES (130) — nombres y aretes distintos
# ════════════════════════════════════════════════════════════════
colores = ["Negro", "Rojo", "Blanco", "Bayo", "Gris", "Pinto", "Overo", "Castaño"]
origenes = ["NACIDO_FINCA", "COMPRADO", "DONADO"]

animales = []

nombres_hembra = [
    "Aurora", "Brisa", "Caramelo", "Damasco", "Esmeralda", "Frambuesa", "Galena", "Hada", "India", "Joya",
    "Kiara", "Lima", "Mandarina", "Ninfa", "Ondina", "Pampa", "Quena", "Reina", "Sirena", "Turquesa",
    "Uva", "Vainilla", "Wanda", "Xena", "Yara", "Zafira", "Almendra", "Bruma", "Cereza", "Duna",
    "Ebra", "Fresa", "Guinda", "Hiedra", "Isla", "Jirafa", "Kala", "Laguna", "Miel", "Naranja",
    "Ola", "Pera", "Quimera", "Ranita", "Salvia", "Tuna", "Ursula", "Vid", "Yegua", "Zarza",
]
nombres_macho = [
    "Acero", "Bronce", "Cobre", "Diamante", "Estaño", "Fierro", "Granito", "Hierro", "Imán", "Jade",
    "Kaiser", "Lingote", "Mármol", "Níquel", "Onix", "Platino", "Cuarzo", "Rubí", "Sílex", "Topacio",
    "Uranio", "Vulcano", "Wolfram", "Xenón", "Yunque", "Zinc", "Aluminio", "Basalto", "Carbón", "Dolmen",
    "Ámbar", "Fósil", "Geiser", "Hormigón", "Iridio", "Jaspe", "Kripton", "Lava", "Magma", "Pedernal",
]

# 80 hembras
hembras = []
for i in range(80):
    arete = f"PGH{i + 1:04d}"  # determinístico → get_or_create idempotente
    nac = fecha_aleatoria(desde_dias=2555, hasta_dias=365)
    a, _ = Animal.objects.get_or_create(
        nro_arete=arete,
        defaults=dict(
            finca=finca,
            nombre=nombres_hembra[i % len(nombres_hembra)],
            sexo="HEMBRA",
            fecha_nacimiento=nac,
            estado=pick("ACTIVO", "ACTIVO", "ACTIVO", "BAJA"),
            raza=random.choice(list(razas.values())),
            categoria=cats.get(pick("Vaca", "Vaquillona", "Ternera", "Vaca Seca")),
            peso=rand_decimal(250, 560),
            peso_nacimiento=rand_decimal(28, 42),
            fecha_ingreso=nac + timedelta(days=random.randint(0, 30)),
            tipo_produccion=pick("LECHE", "DOBLE_PROPOSITO", "CARNE"),
            origen=random.choice(origenes),
            color=random.choice(colores),
        ),
    )
    hembras.append(a)
    animales.append(a)

# 50 machos
machos = []
for i in range(50):
    arete = f"PGM{i + 1:04d}"  # determinístico → get_or_create idempotente
    nac = fecha_aleatoria(desde_dias=2190, hasta_dias=180)
    a, _ = Animal.objects.get_or_create(
        nro_arete=arete,
        defaults=dict(
            finca=finca,
            nombre=nombres_macho[i % len(nombres_macho)],
            sexo="MACHO",
            fecha_nacimiento=nac,
            estado=pick("ACTIVO", "ACTIVO", "DESCARTE"),
            raza=random.choice(list(razas.values())),
            categoria=cats.get(pick("Novillo", "Toro", "Ternero", "Buey")),
            peso=rand_decimal(300, 650),
            peso_nacimiento=rand_decimal(30, 46),
            fecha_ingreso=nac + timedelta(days=random.randint(0, 30)),
            tipo_produccion=pick("CARNE", "DOBLE_PROPOSITO"),
            origen=random.choice(origenes),
            color=random.choice(colores),
        ),
    )
    machos.append(a)
    animales.append(a)

print(f"   Animales: {len(animales)} (hembras={len(hembras)}, machos={len(machos)})")

# AnimalParcela — asigna ~100 animales a parcelas una sola vez (idempotente por guarda)
if not AnimalParcela.objects.filter(animal__finca=finca, animal__nro_arete__startswith="PG").exists():
    for animal in random.sample(animales, min(100, len(animales))):
        parcela = random.choice(parcelas)
        AnimalParcela.objects.get_or_create(
            animal=animal, parcela=parcela,
            defaults=dict(fecha_ingreso=fecha_aleatoria(365, 30)),
        )
print(f"   AnimalParcela: {AnimalParcela.objects.filter(animal__finca=finca).count()}")


# ════════════════════════════════════════════════════════════════
# 11. RRHH (5 tipos globales + 25 empleados distintos)
# ════════════════════════════════════════════════════════════════
print("\n[10/13] RRHH...")

tipos_emp_data = [
    ("Peón Rural", "Trabajador general de campo", 1_800_000),
    ("Capataz", "Supervisión de personal y tareas de campo", 3_200_000),
    ("Ordeñador", "Responsable del ordeño y sala de leche", 2_200_000),
    ("Tractorista", "Operación de maquinaria agrícola", 2_800_000),
    ("Administrador de Finca", "Gestión administrativa de la finca", 4_500_000),
]
tipos_emp = []
for nombre, desc, salario in tipos_emp_data:
    t, _ = TipoEmpleado.objects.get_or_create(nombre=nombre, defaults=dict(descripcion=desc, salario_base=salario, activo=True))
    tipos_emp.append(t)

nombres_emp = [
    ("Aníbal", "Caballero Britez"), ("Bernardo", "Duarte Ferreira"), ("Crispín", "Estigarribia Roa"),
    ("Damián", "Franco Verón"), ("Eladio", "Gómez Adorno"), ("Fermín", "Heyn Vázquez"),
    ("Genaro", "Irala Brizuela"), ("Hilario", "Jacquet Caceres"), ("Isidoro", "Krauer Domínguez"),
    ("Jacinto", "Larroza Espínola"), ("Lisandro", "Maidana Fariña"), ("Marcial", "Noguera Garay"),
    ("Nazario", "Ortiz Hermosilla"), ("Onésimo", "Penayo Isasi"), ("Plácido", "Quintana Jiménez"),
    ("Saturnino", "Rojas Krause"), ("Teodoro", "Servín Ledesma"), ("Ubaldo", "Toñánez Martínez"),
    ("Brígida", "Aquino Núñez"), ("Catalina", "Bareiro Ortega"), ("Delicia", "Coronel Páez"),
    ("Eugenia", "Dávalos Quintana"), ("Filomena", "Escurra Rolón"), ("Gricelda", "Florentín Sánchez"),
    ("Herminia", "Gauto Talavera"),
]

empleados = []
ci_usados = set(Empleado.objects.values_list("ci", flat=True))
for i, (nombre, apellidos) in enumerate(nombres_emp):
    ci = f"{4_200_000 + i * 111_119}"
    if ci in ci_usados:
        continue
    ci_usados.add(ci)
    nac = fecha_aleatoria(desde_dias=18250, hasta_dias=7300)
    e, _ = Empleado.objects.get_or_create(
        ci=ci,
        defaults=dict(
            finca=finca,
            nombre=nombre, apellidos=apellidos,
            sexo=pick("MASCULINO", "MASCULINO", "FEMENINO"),
            fecha_nacimiento=nac,
            telefono=f"09{random.randint(71, 99)}-{random.randint(100, 999)}-{random.randint(100, 999)}",
            email=f"{nombre.lower()}.{apellidos.split()[0].lower()}@pedros.com",
            tipo=random.choice(tipos_emp),
            fecha_ingreso=fecha_aleatoria(desde_dias=1825, hasta_dias=30),
            salario=rand_decimal(1_500_000, 5_000_000, dp=0),
            estado=pick("ACTIVO", "ACTIVO", "DESCARTE"),
            registrado_por=owner,
        ),
    )
    empleados.append(e)
print(f"   TipoEmpleado: {len(tipos_emp)} | Empleados: {len(empleados)}")


# ════════════════════════════════════════════════════════════════
# 12. CLIENTES Y PROVEEDORES — nombres distintos
# ════════════════════════════════════════════════════════════════
print("\n[11/13] Clientes y Proveedores...")

clientes_data = [
    ("Frigorífico", "Sur SRL", "0971-500-001", "Encarnación"),
    ("Supermercado", "Stock Pedros", "0972-500-002", "Ciudad del Este"),
    ("Carnicería", "El Buen Corte", "0973-500-003", "Encarnación"),
    ("Exportadora", "Itapúa Beef SA", "0971-500-004", "Encarnación"),
    ("Estancia", "Doña Rufina", "0974-500-005", "Coronel Bogado"),
    ("Frigorífico", "Paraná SA", "0975-500-006", "Ciudad del Este"),
    ("Cooperativa", "Colonias Unidas", "0976-500-007", "Hohenau"),
    ("Mercado", "Abasto Encarnación", "0977-500-008", "Encarnación"),
    ("Restaurant", "La Costanera", "0978-500-009", "Encarnación"),
    ("Tambo", "Santa Rosa", "0979-500-010", "Obligado"),
    ("Empresa", "Lácteos del Sur", "0971-500-011", "Bella Vista"),
    ("Exportadora", "Mercosur Carnes", "0972-500-012", "Ciudad del Este"),
    ("Frigorífico", "Yguazú SA", "0973-500-013", "Encarnación"),
    ("Mercado", "Feria Capitán Miranda", "0974-500-014", "Capitán Miranda"),
    ("Carnicería", "El Asador", "0975-500-015", "Cambyretá"),
    ("Estancia", "Tres Fronteras", "0976-500-016", "Carmen del Paraná"),
    ("Tambo", "La Holanda", "0977-500-017", "Hohenau"),
    ("Empresa", "Friolac SRL", "0978-500-018", "Encarnación"),
    ("Mercado", "Central de Encarnación", "0979-500-019", "Encarnación"),
    ("Exportadora", "Pampa Verde PY", "0971-500-020", "Ciudad del Este"),
]
clientes = []
for nombre, apellidos, tel, dir_ in clientes_data:
    c, _ = Cliente.objects.get_or_create(
        finca=finca, nombre=nombre, apellidos=apellidos,
        defaults=dict(telefono=tel, direccion=dir_),
    )
    clientes.append(c)

proveedores_data = [
    ("Agro", "Itapúa SA", "0971-600-001", "Encarnación"),
    ("Veterinaria", "San Pedro", "0972-600-002", "Encarnación"),
    ("Distribuidora", "Sur Agropecuaria", "0973-600-003", "Ciudad del Este"),
    ("Farmacia", "Veterinaria Paraná", "0974-600-004", "Encarnación"),
    ("Ferretería", "Construagro SA", "0975-600-005", "Hohenau"),
    ("Semillas", "Colonias Seed", "0976-600-006", "Obligado"),
    ("Agroquímicos", "Campo Fértil SRL", "0977-600-007", "Bella Vista"),
    ("Combustibles", "Petrosur SA", "0978-600-008", "Encarnación"),
    ("Forrajes", "El Trébol Ltda.", "0979-600-009", "Coronel Bogado"),
    ("Maquinarias", "TractoSur PY", "0971-600-010", "Ciudad del Este"),
    ("Balanceados", "NutriPedros SA", "0972-600-011", "Hohenau"),
    ("Insumos", "AgroSur PY", "0973-600-012", "Encarnación"),
    ("Minerales", "MineralCamp SRL", "0974-600-013", "Cambyretá"),
    ("Repuestos", "MecaAgro SA", "0975-600-014", "Ciudad del Este"),
    ("Suplementos", "VitaGan Ltda.", "0976-600-015", "Encarnación"),
]
proveedores = []
for nombre, apellidos, tel, dir_ in proveedores_data:
    p, _ = Proveedor.objects.get_or_create(
        finca=finca, nombre=nombre, apellidos=apellidos,
        defaults=dict(telefono=tel, direccion=dir_, estado=True),
    )
    proveedores.append(p)
print(f"   Clientes: {len(clientes)} | Proveedores: {len(proveedores)}")


# ════════════════════════════════════════════════════════════════
# 13. SANIDAD — Vacunaciones (120), Desparasitaciones (60), Tratamientos (30)
# ════════════════════════════════════════════════════════════════
print("\n[12/13] Sanidad...")

vacs_creadas = 0
if not Vacunacion.objects.filter(finca=finca).exists():
    for _ in range(120):
        animal = random.choice(animales)
        vacuna = random.choice(vacunas)
        fecha_ap = fecha_aleatoria(365, 1)
        Vacunacion.objects.create(
            finca=finca,
            animal=animal,
            vacuna=vacuna,
            veterinario=random.choice(veterinarios),
            registrado_por=owner,
            fecha_aplicacion=fecha_ap,
            campana=f"Campaña {random.randint(1, 4)}/2024",
            lote=f"LT{random.randint(1000, 9999)}",
            dosis_aplicada=vacuna.dosis_recomendada or "2 ml",
            via_aplicacion=vacuna.via_aplicacion or "SUBCUTANEA",
            observaciones="Sin novedad" if random.random() > 0.3 else "Animal nervioso durante aplicación",
            fecha_proxima=fecha_ap + timedelta(days=vacuna.intervalo_dias or 180),
        )
        vacs_creadas += 1

despar_creadas = 0
if not Desparasitacion.objects.filter(finca=finca).exists():
    for _ in range(60):
        animal = random.choice(animales)
        med = random.choice([m for m in medicamentos if "Ivermectina" in m.nombre or "Albendazol" in m.nombre or "Doramectina" in m.nombre] or medicamentos)
        fecha_d = fecha_aleatoria(365, 1)
        Desparasitacion.objects.create(
            finca=finca,
            animal=animal,
            medicamento=med,
            veterinario=random.choice(veterinarios),
            registrado_por=owner,
            fecha=fecha_d,
            tipo_parasiticida=pick("INTERNO", "EXTERNO", "DOBLE"),
            producto=med.nombre,
            dosis=f"{rand_decimal(1, 10)} ml",
            peso_aplicacion=rand_decimal(150, 600),
            lote=f"LT{random.randint(1000, 9999)}",
            proxima_fecha=fecha_d + timedelta(days=90),
            costo=rand_decimal(15000, 90000),
        )
        despar_creadas += 1

trat_creados = 0
diagnosticos = ["Neumonía bovina", "Diarrea neonatal", "Mastitis", "Retención de placenta",
                "Queratoconjuntivitis", "Fiebre", "Parasitosis severa", "Cetosis", "Hipocalcemia"]
if not Tratamiento.objects.filter(finca=finca).exists():
    for _ in range(30):
        animal = random.choice(animales)
        fecha_ini = fecha_aleatoria(365, 7)
        duracion = random.randint(3, 14)
        fecha_fin = fecha_ini + timedelta(days=duracion)
        Tratamiento.objects.create(
            finca=finca,
            animal=animal,
            medicamento=random.choice(medicamentos),
            veterinario=random.choice(veterinarios),
            registrado_por=owner,
            fecha=fecha_ini,
            diagnostico=random.choice(diagnosticos),
            tipo=pick("MEDICO", "QUIRURGICO", "PREVENTIVO"),
            dias_retiro=random.randint(0, 30),
            fecha_inicio=fecha_ini,
            fecha_fin=fecha_fin,
            costo=rand_decimal(50000, 500000),
            costo_total=rand_decimal(100000, 800000),
            en_tratamiento=False,
            dosis=f"{rand_decimal(1, 20)} ml",
            via_aplicacion=pick("INTRAMUSCULAR", "SUBCUTANEA", "INTRAVENOSA", "ORAL"),
            observaciones="Evolución favorable",
        )
        trat_creados += 1

print(f"   Vacunaciones: {vacs_creadas} | Desparasitaciones: {despar_creadas} | Tratamientos: {trat_creados}")


# ════════════════════════════════════════════════════════════════
# 14. REPRODUCCIÓN, PRODUCCIÓN, VENTAS, COMPRAS, ALERTAS
# ════════════════════════════════════════════════════════════════
print("\n[13/13] Reproducción, Producción, Ventas, Compras, Alertas...")

repros_creadas = 0
if not Reproduccion.objects.filter(finca=finca).exists():
    for _ in range(50):
        madre = random.choice(hembras)
        padre_animal = random.choice(machos) if random.random() > 0.5 else None
        fecha_serv = fecha_aleatoria(730, 60)
        dias_gest = random.randint(270, 285)
        fecha_parto_esp = fecha_serv + timedelta(days=dias_gest)
        tiene_parto = fecha_parto_esp <= date.today()
        try:
            Reproduccion.objects.create(
                finca=finca,
                madre=madre,
                padre=padre_animal,
                registrado_por=owner,
                fecha_servicio=fecha_serv,
                fecha_parto_esperado=fecha_parto_esp,
                fecha_parto_real=fecha_parto_esp + timedelta(days=random.randint(-3, 5)) if tiene_parto else None,
                tipo_parto=pick("NORMAL", "DISTOCICO", "MULTIPLE") if tiene_parto else "",  # col NOT NULL
                num_crias=pick(1, 1, 1, 2) if tiene_parto else 0,
                estado=pick("PARIDA", "PRENADA", "VACIA") if tiene_parto else "PRENADA",
                peso_total_crias=rand_decimal(28, 88) if tiene_parto else Decimal("0"),  # col NOT NULL
                observaciones="Sin complicaciones",
            )
            repros_creadas += 1
        except Exception:
            pass

# ── Lactancias + Producción de leche (~200) ──────────────────────────────────
# ProduccionLeche requiere una Lactancia (FK obligatorio): creamos una lactancia
# activa por vaca lechera y le colgamos los registros diarios de ordeño.
prod_creadas = 0
lact_creadas = 0
if not ProduccionLeche.objects.filter(finca=finca).exists():
    vacas_lecheras = [h for h in hembras if h.tipo_produccion in ("LECHE", "DOBLE_PROPOSITO")][:40]
    if not vacas_lecheras:
        vacas_lecheras = hembras[:20]
    for vaca in vacas_lecheras:
        lactancia = Lactancia.objects.create(
            finca=finca,
            vaca=vaca,
            numero_lactancia=random.randint(1, 5),
            fecha_inicio=fecha_aleatoria(305, 30),
            estado="ACTIVA",
            observaciones="",
        )
        lact_creadas += 1
        for _ in range(5):
            fecha_p = fecha_aleatoria(180, 1)
            try:
                ProduccionLeche.objects.create(
                    finca=finca,
                    vaca=vaca,
                    lactancia=lactancia,
                    registrado_por=owner,
                    fecha=fecha_p,
                    turno=pick("MANIANA", "TARDE", "NOCHE"),
                    litros=rand_decimal(4, 22),
                    dias_en_lactancia=random.randint(1, 305),
                    observaciones="",
                )
                prod_creadas += 1
            except Exception:
                pass

# ── Registros de Peso (110) ───────────────────────────────────────────────────
pesos_creados = 0
if not RegistroPeso.objects.filter(finca=finca).exists():
    for _ in range(110):
        animal = random.choice(animales)
        try:
            RegistroPeso.objects.create(
                finca=finca,
                animal=animal,
                registrado_por=owner,
                fecha_pesaje=fecha_aleatoria(365, 1),
                peso_kg=rand_decimal(80, 650),
                observacion="Pesaje rutinario",
                condicion_corporal=pick("1", "2", "3", "4", "5"),
            )
            pesos_creados += 1
        except Exception:
            pass

# ── Ventas (25) ───────────────────────────────────────────────────────────────
ventas_creadas = 0
if not NotaVenta.objects.filter(finca=finca).exists():
    animales_vendidos = random.sample([a for a in animales if a.estado == "ACTIVO"], min(25, len([a for a in animales if a.estado == "ACTIVO"])))
    i_venta = 0
    for _ in range(25):
        cliente = random.choice(clientes)
        fecha_v = fecha_aleatoria(365, 1)
        nota = NotaVenta.objects.create(
            finca=finca, cliente=cliente, registrado_por=owner,
            monto_total=0, fecha_venta=fecha_v,
            guia_salida=f"GS-{random.randint(10000, 99999)}",
            observaciones="Venta de ganado en pie",
        )
        total = Decimal("0")
        n_animales = random.randint(1, 3)
        for _ in range(n_animales):
            if i_venta >= len(animales_vendidos):
                break
            a = animales_vendidos[i_venta]; i_venta += 1
            precio = rand_decimal(800000, 3500000)
            peso = rand_decimal(200, 600)
            sub = round(Decimal(str(precio)), 2)
            DetalleVenta.objects.create(
                nota_venta=nota, animal=a,
                precio_unitario=precio, peso_venta_kg=peso, sub_total=sub,
            )
            total += sub
        nota.monto_total = total; nota.save(update_fields=["monto_total"])
        ventas_creadas += 1

# ── Compras (20) ──────────────────────────────────────────────────────────────
compras_creadas = 0
if not NotaCompra.objects.filter(finca=finca).exists():
    for _ in range(20):
        proveedor = random.choice(proveedores)
        fecha_c = fecha_aleatoria(365, 1)
        nota = NotaCompra.objects.create(
            finca=finca, proveedor=proveedor, registrado_por=owner,
            tipo_compra=pick("MEDICAMENTO", "ALIMENTO", "INSUMO"),
            fecha_compra=fecha_c, monto_total=0,
            observaciones="Compra de insumos",
        )
        total = Decimal("0")
        for med in random.sample(medicamentos, random.randint(1, 4)):
            cant = random.randint(1, 10)
            precio = rand_decimal(5000, 120000)
            sub = round(Decimal(str(precio)) * cant, 2)
            DetalleCompra.objects.create(
                nota_compra=nota, medicamento=med,
                precio_unitario=precio, cantidad=cant, sub_total=sub,
            )
            total += sub
        nota.monto_total = total; nota.save(update_fields=["monto_total"])
        compras_creadas += 1

# ── Muertes / Bajas (15) ─────────────────────────────────────────────────────
bajas_creadas = 0
causas = ["Neumonía", "Timpanismo", "Accidente", "Parto distócico", "Serpiente", "Vejez", "Enfermedad desconocida"]
if not MuerteBaja.objects.filter(finca=finca).exists():
    for _ in range(15):
        animal = random.choice(animales)
        try:
            MuerteBaja.objects.create(
                finca=finca, animal=animal, registrado_por=owner,
                fecha_baja=fecha_aleatoria(365, 1),
                causa=random.choice(causas),
                tipo=pick("MUERTE", "BAJA"),
                descripcion="Registrado por el capataz de campo",
                peso_estimado_kg=rand_decimal(100, 500),
            )
            bajas_creadas += 1
        except Exception:
            pass

# ── Alertas (60) ─────────────────────────────────────────────────────────────
tipos_alerta = ["VACUNACION", "PARTO", "TRATAMIENTO", "PESAJE", "REPRODUCCION", "VENCIMIENTO"]
mensajes = {
    "VACUNACION": "Animal pendiente de vacunación",
    "PARTO": "Parto esperado próximamente",
    "TRATAMIENTO": "Animal en tratamiento activo",
    "PESAJE": "Animal sin pesaje en 90 días",
    "REPRODUCCION": "Hembra lista para servicio",
    "VENCIMIENTO": "Medicamento próximo a vencer",
}
alertas_creadas = 0
# Guarda por tipo: ignora alertas auto-generadas de otro tipo (p.ej. PESAJE_PENDIENTE)
if not Alerta.objects.filter(finca=finca, tipo__in=tipos_alerta).exists():
    for _ in range(60):
        tipo = random.choice(tipos_alerta)
        dias = random.randint(-5, 30)
        try:
            Alerta.objects.create(
                finca=finca,
                animal=random.choice(animales) if tipo != "VENCIMIENTO" else None,
                tipo=tipo,
                mensaje=mensajes[tipo],
                fecha_alerta=date.today() + timedelta(days=dias),
                dias_restantes=max(0, dias),
                leida=random.random() > 0.6,
            )
            alertas_creadas += 1
        except Exception:
            pass

# ── Gastos (50) ──────────────────────────────────────────────────────────────
tipos_gasto = ["MEDICAMENTO", "ALIMENTO", "VETERINARIO", "MAQUINARIA", "PERSONAL", "OTRO"]
gastos_creados = 0
if not Gasto.objects.filter(finca=finca).exists():
    for _ in range(50):
        tipo = random.choice(tipos_gasto)
        cant = rand_decimal(1, 20)
        precio = rand_decimal(10000, 500000)
        try:
            Gasto.objects.create(
                finca=finca,
                animal=random.choice(animales) if random.random() > 0.5 else None,
                registrado_por=owner,
                fecha=fecha_aleatoria(365, 1),
                tipo_gasto=tipo,
                descripcion=f"Gasto de {tipo.lower()} - rutinario",
                cantidad=cant,
                precio_unitario=precio,
                total=round(Decimal(str(cant)) * Decimal(str(precio)), 2),
            )
            gastos_creados += 1
        except Exception:
            pass

print(f"   Reprod: {repros_creadas} | Lactancias: {lact_creadas} | Prod leche: {prod_creadas} | Pesos: {pesos_creados}")
print(f"   Ventas: {ventas_creadas} | Compras: {compras_creadas} | Bajas: {bajas_creadas}")
print(f"   Alertas: {alertas_creadas} | Gastos: {gastos_creados}")

print("\n" + "=" * 60)
print("  SEEDER COMPLETADO")
print(f"  Finca:        {finca.nombre}")
print(f"  Animales:     {Animal.objects.filter(finca=finca).count()}")
print(f"  Vacunaciones: {Vacunacion.objects.filter(finca=finca).count()}")
print(f"  Ventas:       {NotaVenta.objects.filter(finca=finca).count()}")
print(f"  Compras:      {NotaCompra.objects.filter(finca=finca).count()}")
print(f"  Empleados:    {Empleado.objects.filter(finca=finca).count()}")
print(f"  Alertas:      {Alerta.objects.filter(finca=finca).count()}")
print("=" * 60)
