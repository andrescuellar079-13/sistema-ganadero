"""
Seeder de datos de prueba — Sistema Ganadero
Ejecutar desde la carpeta backend/:
    python seed_data.py

Crea 100+ registros por módulo. Limpia primero los datos existentes
(excepto superusuarios y el rol Administrador).
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
from datetime import date, timedelta, datetime
from decimal import Decimal

from django.utils import timezone

# ── Imports de modelos ────────────────────────────────────────────────────────
from fincas.models import Finca
from catalogos.models import (
    Raza, CategoriaAnimal, TipoMedicamento,
    Medicamento, Veterinario, Alimento, Reproductor, Vacuna,
)
from accounts.models import Rol, Usuario
from animales.models import Animal, Parcela, AnimalParcela
from sanidad.models import Vacunacion, Tratamiento, Desparasitacion, Diagnostico, Observacion
from reproduccion.models import InseminacionArtificial, MontaNatural, DiagnosticoPrenez, Reproduccion
from produccion.models import RegistroPeso, Lactancia, ProduccionLeche, AlimentoAnimal
from comercio.models import Cliente, NotaVenta, DetalleVenta, MuerteBaja
from compras.models import Proveedor, NotaCompra, DetalleCompra
from rrhh.models import TipoEmpleado, Empleado
from alertas.models import Alerta, Gasto


# ── Helpers ───────────────────────────────────────────────────────────────────
def fecha_aleatoria(desde_dias=730, hasta_dias=0):
    delta = random.randint(hasta_dias, desde_dias)
    return date.today() - timedelta(days=delta)


def rand_decimal(lo, hi, dp=2):
    return round(random.uniform(lo, hi), dp)


def pick(*items):
    return random.choice(items)


print("=" * 60)
print("  SEEDER — Sistema Ganadero")
print("=" * 60)


# ════════════════════════════════════════════════════════════════
# 1. FINCA
# ════════════════════════════════════════════════════════════════
print("\n[1/13] Finca...")

finca, _ = Finca.objects.get_or_create(
    nombre="Estancia La Providencia",
    defaults=dict(
        propietario="Juan Carlos Montero",
        departamento="Concepción",
        municipio="Concepción",
        ubicacion="Ruta 5 km 320, Concepción",
        telefono="0981-555-001",
        activo=True,
    ),
)
print(f"   Finca: {finca.nombre} (id={finca.pk})")


# ════════════════════════════════════════════════════════════════
# 2. CATÁLOGOS BASE
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
    ("Vaca", "Hembra adulta en producción"),
    ("Novillo", "Macho castrado en engorde"),
    ("Toro", "Macho reproductor"),
    ("Ternero", "Cría macho menor de 1 año"),
    ("Ternera", "Cría hembra menor de 1 año"),
    ("Vaquillona", "Hembra de 1 a 2 años"),
    ("Buey", "Macho castrado adulto de trabajo"),
    ("Vaca Seca", "Hembra adulta sin producción"),
]
cats = {}
for nombre, desc in cats_data:
    c, _ = CategoriaAnimal.objects.get_or_create(nombre=nombre, defaults=dict(descripcion=desc, activo=True))
    cats[nombre] = c

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
# 3. VACUNAS (20)
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
        nombre=nombre,
        defaults=dict(
            finca=finca, descripcion=desc, dosis_recomendada=dosis,
            via_aplicacion=via, intervalo_dias=intervalo,
            edad_minima_meses=edad_min, activo=True,
        ),
    )
    vacunas.append(v)
print(f"   Vacunas: {len(vacunas)}")


# ════════════════════════════════════════════════════════════════
# 4. MEDICAMENTOS (25)
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
        nombre=nombre,
        defaults=dict(
            finca=finca, tipo=tipo, unidad_medida=unidad,
            stock_cantidad=stock, laboratorio=lab,
            fecha_vencimiento=venc, precio_compra=rand_decimal(5000, 150000),
            activo=True,
        ),
    )
    medicamentos.append(m)
print(f"   Medicamentos: {len(medicamentos)}")


# ════════════════════════════════════════════════════════════════
# 5. ALIMENTOS (10)
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
        nombre=nombre,
        defaults=dict(
            finca=finca, unidad_medida=unidad, stock_cantidad=stock,
            precio_referencia=rand_decimal(500, 8000),
            fecha_vencimiento=date.today() + timedelta(days=365),
            activo=True,
        ),
    )
    alimentos.append(a)
print(f"   Alimentos: {len(alimentos)}")


# ════════════════════════════════════════════════════════════════
# 6. VETERINARIOS (6)
# ════════════════════════════════════════════════════════════════
print("\n[6/13] Veterinarios...")

vets_data = [
    ("Carlos", "Rodríguez Vera", "1234567", "Medicina Bovina", "0981-111-001", "carlos.vet@email.com"),
    ("María", "González López", "2345678", "Reproducción Animal", "0981-111-002", "maria.vet@email.com"),
    ("Roberto", "Martínez Ayala", "3456789", "Sanidad Animal", "0981-111-003", "roberto.vet@email.com"),
    ("Ana", "Sánchez Pereira", "4567890", "Nutrición Bovina", "0981-111-004", "ana.vet@email.com"),
    ("Luis", "Fernández Cano", "5678901", "Cirugía Bovina", "0981-111-005", "luis.vet@email.com"),
    ("Patricia", "Ramírez Jara", "6789012", "Medicina Interna", "0981-111-006", "patricia.vet@email.com"),
]
veterinarios = []
for nombre, apellidos, ci, esp, tel, email in vets_data:
    v, _ = Veterinario.objects.get_or_create(
        ci=ci,
        defaults=dict(
            finca=finca, nombre=nombre, apellidos=apellidos,
            especialidad=esp, telefono=tel, email=email, activo=True,
        ),
    )
    veterinarios.append(v)
print(f"   Veterinarios: {len(veterinarios)}")


# ════════════════════════════════════════════════════════════════
# 7. REPRODUCTORES (8)
# ════════════════════════════════════════════════════════════════
print("\n[7/13] Reproductores...")

reproductores = []
codigos_repr = []
for i in range(1, 9):
    codigo = f"REP-{i:03d}"
    if codigo in codigos_repr:
        continue
    codigos_repr.append(codigo)
    r, _ = Reproductor.objects.get_or_create(
        codigo=codigo,
        defaults=dict(
            finca=finca,
            nombre=f"Reproductor {i}",
            raza=random.choice(list(razas.values())),
            tipo_origen=pick("INTERNO", "EXTERNO", "SEMEN"),
            codigo_pajuela=f"PAJ-{i:04d}" if random.random() > 0.4 else None,
            laboratorio="ABS Global" if random.random() > 0.5 else "Sexing Technologies",
            activo=True,
        ),
    )
    reproductores.append(r)
print(f"   Reproductores: {len(reproductores)}")


# ════════════════════════════════════════════════════════════════
# 8. ROLES Y USUARIOS
# ════════════════════════════════════════════════════════════════
print("\n[8/13] Roles y Usuarios...")

permisos_ganadero = [
    "animales_ver", "animales_crear", "animales_editar",
    "vacunas_ver", "vacunas_crear",
    "vacunaciones_ver", "vacunaciones_crear", "vacunaciones_editar",
    "sanidad_ver", "sanidad_crear",
    "reproduccion_ver", "produccion_ver",
    "alertas_ver",
]
permisos_comercial = [
    "ventas_ver", "ventas_crear", "ventas_editar",
    "compras_ver", "compras_crear",
    "clientes_ver", "clientes_crear",
    "proveedores_ver",
]
permisos_supervisor = [
    "all",
]

roles_data = [
    ("Administrador", "Acceso total al sistema", ["all"]),
    ("Ganadero", "Gestión de animales y sanidad", permisos_ganadero),
    ("Comercial", "Ventas y compras", permisos_comercial),
    ("Supervisor", "Supervisión general", permisos_supervisor),
]
roles = {}
for nombre, desc, perms in roles_data:
    r, _ = Rol.objects.get_or_create(nombre=nombre, defaults=dict(descripcion=desc, permisos=perms, activo=True))
    r.permisos = perms
    r.save(update_fields=["permisos"])
    roles[nombre] = r

usuarios_data = [
    ("nina", "admin12345", "Nina", "Montero", roles["Administrador"]),
    ("jmontero", "montero123", "Juan", "Montero", roles["Supervisor"]),
    ("carlos_g", "carlos123", "Carlos", "González", roles["Ganadero"]),
    ("maria_v", "maria123", "María", "Villalba", roles["Ganadero"]),
    ("pedro_r", "pedro123", "Pedro", "Rodríguez", roles["Ganadero"]),
    ("lucia_s", "lucia123", "Lucía", "Sánchez", roles["Comercial"]),
    ("roberto_p", "roberto123", "Roberto", "Pereira", roles["Comercial"]),
    ("ana_t", "ana123", "Ana", "Torres", roles["Ganadero"]),
    ("miguel_c", "miguel123", "Miguel", "Cabrera", roles["Ganadero"]),
    ("laura_m", "laura123", "Laura", "Martínez", roles["Comercial"]),
]
admin_user = None
for uname, pwd, fname, lname, rol in usuarios_data:
    u, created = Usuario.objects.get_or_create(
        username=uname,
        defaults=dict(
            first_name=fname, last_name=lname,
            finca=finca, rol=rol, activo=True,
            email=f"{uname}@estancia.com",
        ),
    )
    if created:
        u.set_password(pwd)
        u.save()
    else:
        u.rol = rol
        u.finca = finca
        u.save(update_fields=["rol", "finca"])
    if uname == "nina":
        admin_user = u

if admin_user is None:
    admin_user = Usuario.objects.filter(username="nina").first() or Usuario.objects.filter(is_superuser=True).first()

print(f"   Roles: {Rol.objects.count()} | Usuarios: {Usuario.objects.count()}")


# ════════════════════════════════════════════════════════════════
# 9. PARCELAS (12)
# ════════════════════════════════════════════════════════════════
print("\n[9/13] Parcelas y Animales...")

pasturas = ["Tifton 85", "Brachiaria brizantha", "Coastcross", "Tanzania", "Mombaça", "Panicum maximum"]
parcelas = []
for i in range(1, 13):
    p, _ = Parcela.objects.get_or_create(
        nombre=f"Potrero {i}",
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
# 10. ANIMALES (130)
# ════════════════════════════════════════════════════════════════
colores = ["Negro", "Rojo", "Blanco", "Bayo", "Gris", "Pinto", "Overo", "Castaño"]
origenes = ["NACIDO_FINCA", "COMPRADO", "DONADO"]
tipos_prod = ["CARNE", "LECHE", "DOBLE_PROPOSITO"]

# Hembras primero (para luego usarlas en reproducción)
animales = []
aretes_usados = set(Animal.objects.values_list("nro_arete", flat=True))

def arete_nuevo(base):
    arete = base
    while arete in aretes_usados:
        arete = f"{base[:-2]}{random.randint(10,99)}"
    aretes_usados.add(arete)
    return arete

nombres_hembra = [
    "Rosada","Canela","Paloma","Lucero","Sultana","Flor","Diana","Perla","Nieve","Luna",
    "Estrella","Rosa","Mora","Bella","Dulce","Gringa","Colorada","Negra","Blanquita","Rubia",
    "Manchada","Pinta","Dorada","Carioca","Serrana","Margarita","Clarita","Esperanza",
    "Fortuna","Primavera","Alegría","Paz","Violeta","Azucena","Magnolia","Camelia",
    "Gardenia","Jazmín","Orquídea","Dalia","Amapola","Begonia","Crisantema","Gladiola",
    "Petunia","Hortensia","Verbena","Clavel","Lirio","Narciso",
]
nombres_macho = [
    "Trueno","Rayo","Sultan","Gigante","Toro","Nerón","Goliat","Héroe","Valiente","Fuerza",
    "Bravo","Guerrero","Campeón","Titan","Coloso","Máximo","Cesar","León","Tigre","Pantera",
    "Mustang","Tornado","Huracán","Ciclón","Volcán","Terremoto","Meteoro","Cometa","Galaxia",
    "Cosmos","Orion","Jupiter","Saturno","Marte","Neptuno","Mercurio","Venus","Pluton","Atlas",
]

# 80 hembras
hembras = []
for i in range(80):
    arete = arete_nuevo(f"H{i+1:04d}")
    nac = fecha_aleatoria(desde_dias=2555, hasta_dias=365)
    a, created = Animal.objects.get_or_create(
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
    arete = arete_nuevo(f"M{i+1:04d}")
    nac = fecha_aleatoria(desde_dias=2190, hasta_dias=180)
    a, created = Animal.objects.get_or_create(
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

# AnimalParcela — asignar animales a parcelas
for animal in random.sample(animales, min(100, len(animales))):
    parcela = random.choice(parcelas)
    AnimalParcela.objects.get_or_create(
        animal=animal, parcela=parcela,
        defaults=dict(fecha_ingreso=fecha_aleatoria(365, 30)),
    )
print(f"   AnimalParcela: {AnimalParcela.objects.filter(animal__finca=finca).count()}")


# ════════════════════════════════════════════════════════════════
# 11. RRHH (5 tipos + 25 empleados)
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
    ("Ramón", "Garcete López"), ("Óscar", "Benítez Vera"), ("Julio", "Cabrera Ríos"),
    ("Rodrigo", "Montiel Duarte"), ("Héctor", "Ayala Casco"), ("Raúl", "Insfrán Oviedo"),
    ("Mario", "Bogado Torres"), ("Felipe", "Cardozo Riquelme"), ("Andrés", "Giménez Morales"),
    ("Sebastián", "Lugo Sosa"), ("Diego", "Ortega Fleitas"), ("Cristian", "Paiva Leiva"),
    ("Emilio", "Quiroga Almada"), ("Fabio", "Ruiz Barrios"), ("Gerardo", "Salinas Núñez"),
    ("Hugo", "Talavera Pavón"), ("Ignacio", "Urbieta Cano"), ("Javier", "Vallejos Espínola"),
    ("Karina", "López Benítez"), ("Lorena", "Mendoza Jara"), ("Mirta", "Núñez Arce"),
    ("Norma", "Ojeda Villalba"), ("Olga", "Paniagua Ríos"), ("Paula", "Quiñónez Duarte"),
    ("Rosa", "Riveros Sánchez"),
]

empleados = []
ci_usados = set(Empleado.objects.values_list("ci", flat=True))
for i, (nombre, apellidos) in enumerate(nombres_emp):
    ci = f"{7_000_000 + i * 137_893}"
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
            telefono=f"09{random.randint(71,99)}-{random.randint(100,999)}-{random.randint(100,999)}",
            email=f"{nombre.lower()}.{apellidos.split()[0].lower()}@estancia.com",
            tipo=random.choice(tipos_emp),
            fecha_ingreso=fecha_aleatoria(desde_dias=1825, hasta_dias=30),
            salario=rand_decimal(1_500_000, 5_000_000, dp=0),
            estado=pick("ACTIVO", "ACTIVO", "DESCARTE"),
            registrado_por=admin_user,
        ),
    )
    empleados.append(e)
print(f"   TipoEmpleado: {len(tipos_emp)} | Empleados: {len(empleados)}")


# ════════════════════════════════════════════════════════════════
# 12. CLIENTES Y PROVEEDORES
# ════════════════════════════════════════════════════════════════
print("\n[11/13] Clientes y Proveedores...")

clientes_data = [
    ("Frigorífico", "Norte S.A.", "0981-200-001", "Concepción centro"),
    ("Supermercado", "Vidal Hnos.", "0982-200-002", "Asunción"),
    ("Carnicería", "Don Beto", "0983-200-003", "Pedro Juan Caballero"),
    ("Exportadora", "Penta SA", "0981-200-004", "Asunción"),
    ("Estancia", "San Francisco", "0984-200-005", "Horqueta"),
    ("Frigorífico", "Concepción SA", "0985-200-006", "Concepción"),
    ("Cooperativa", "Yaguareté Ltda.", "0986-200-007", "Concepción"),
    ("Mercado", "Central Mayorista", "0987-200-008", "Asunción"),
    ("Restaurant", "El Gaucho", "0988-200-009", "Asunción"),
    ("Tambo", "San Miguel", "0989-200-010", "Caaguazú"),
    ("Empresa", "Lácteos del Norte", "0981-200-011", "Concepción"),
    ("Exportadora", "Biopak SA", "0982-200-012", "Ciudad del Este"),
    ("Frigorifico", "Roa SA", "0983-200-013", "San Lorenzo"),
    ("Mercado", "Del Agricultor", "0984-200-014", "Coronel Oviedo"),
    ("Carnicería", "La Estancia", "0985-200-015", "Villarrica"),
    ("Estancia", "Los Algarrobos", "0986-200-016", "Pozo Colorado"),
    ("Tambo", "El Progreso", "0987-200-017", "Caaguazú"),
    ("Empresa", "Nutrileche SA", "0988-200-018", "Asunción"),
    ("Mercado", "Municipal Concepción", "0989-200-019", "Concepción"),
    ("Exportadora", "Global Meat PY", "0981-200-020", "Asunción"),
]
clientes = []
for nombre, apellidos, tel, dir_ in clientes_data:
    c, _ = Cliente.objects.get_or_create(
        nombre=nombre, apellidos=apellidos,
        defaults=dict(finca=finca, telefono=tel, direccion=dir_),
    )
    clientes.append(c)

proveedores_data = [
    ("Agro", "Center SA", "0981-300-001", "Concepción"),
    ("Veterinaria", "El Campo", "0982-300-002", "Concepción"),
    ("Distribuidora", "Agropecuaria Norte", "0983-300-003", "Pedro Juan Caballero"),
    ("Farmacia", "Veterinaria Nacional", "0984-300-004", "Asunción"),
    ("Ferretería", "Agroindustrial SA", "0985-300-005", "San Lorenzo"),
    ("Semillas", "Tropical PY", "0986-300-006", "Caaguazú"),
    ("Agroquímicos", "Agro Plus SRL", "0987-300-007", "Coronel Oviedo"),
    ("Combustibles", "Petro Norte SA", "0988-300-008", "Concepción"),
    ("Forrajes", "El Rancho Ltda.", "0989-300-009", "Horqueta"),
    ("Maquinarias", "AgroMaq PY", "0981-300-010", "Asunción"),
    ("Balanceados", "Nutriagro SA", "0982-300-011", "San Lorenzo"),
    ("Insumos", "AgriTech PY", "0983-300-012", "Encarnación"),
    ("Minerales", "MinAgro SRL", "0984-300-013", "Villarrica"),
    ("Repuestos", "Agro Service SA", "0985-300-014", "Ciudad del Este"),
    ("Suplementos", "ProGan Ltda.", "0986-300-015", "Concepción"),
]
proveedores = []
for nombre, apellidos, tel, dir_ in proveedores_data:
    p, _ = Proveedor.objects.get_or_create(
        nombre=nombre, apellidos=apellidos,
        defaults=dict(finca=finca, telefono=tel, direccion=dir_, estado=True),
    )
    proveedores.append(p)
print(f"   Clientes: {len(clientes)} | Proveedores: {len(proveedores)}")


# ════════════════════════════════════════════════════════════════
# 13. SANIDAD — Vacunaciones (120), Desparasitaciones (60), Tratamientos (30)
# ════════════════════════════════════════════════════════════════
print("\n[12/13] Sanidad...")

# Vacunaciones
vacs_creadas = 0
for _ in range(120):
    animal = random.choice(animales)
    vacuna = random.choice(vacunas)
    fecha_ap = fecha_aleatoria(365, 1)
    Vacunacion.objects.create(
        finca=finca,
        animal=animal,
        vacuna=vacuna,
        veterinario=random.choice(veterinarios),
        registrado_por=admin_user,
        fecha_aplicacion=fecha_ap,
        campana=f"Campaña {random.randint(1, 4)}/2024",
        lote=f"LT{random.randint(1000, 9999)}",
        dosis_aplicada=vacuna.dosis_recomendada or "2 ml",
        via_aplicacion=vacuna.via_aplicacion or "SUBCUTANEA",
        observaciones="Sin novedad" if random.random() > 0.3 else "Animal nervioso durante aplicación",
        fecha_proxima=fecha_ap + timedelta(days=vacuna.intervalo_dias or 180),
    )
    vacs_creadas += 1

# Desparasitaciones
despar_creadas = 0
for _ in range(60):
    animal = random.choice(animales)
    med = random.choice([m for m in medicamentos if "Ivermectina" in m.nombre or "Albendazol" in m.nombre or "Doramectina" in m.nombre] or medicamentos)
    fecha_d = fecha_aleatoria(365, 1)
    Desparasitacion.objects.create(
        finca=finca,
        animal=animal,
        medicamento=med,
        veterinario=random.choice(veterinarios),
        registrado_por=admin_user,
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

# Tratamientos
trat_creados = 0
diagnosticos = ["Neumonía bovina", "Diarrea neonatal", "Mastitis", "Retención de placenta",
                "Queratoconjuntivitis", "Fiebre", "Parasitosis severa", "Cetosis", "Hipocalcemia"]
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
        registrado_por=admin_user,
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
# 14. REPRODUCCIÓN (50 eventos)
# ════════════════════════════════════════════════════════════════
print("\n[13/13] Reproducción, Producción, Ventas, Compras, Alertas...")

repros_creadas = 0
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
            registrado_por=admin_user,
            fecha_servicio=fecha_serv,
            fecha_parto_esperado=fecha_parto_esp,
            fecha_parto_real=fecha_parto_esp + timedelta(days=random.randint(-3, 5)) if tiene_parto else None,
            tipo_parto=pick("NORMAL", "DISTOCICO", "MULTIPLE") if tiene_parto else None,
            num_crias=pick(1, 1, 1, 2) if tiene_parto else 0,
            estado=pick("PARIDA", "PRENADA", "VACIA") if tiene_parto else "PRENADA",
            peso_total_crias=rand_decimal(28, 88) if tiene_parto else None,
            observaciones="Sin complicaciones",
        )
        repros_creadas += 1
    except Exception:
        pass

# ── Producción de leche (200 registros) ──────────────────────────────────────
prod_creadas = 0
vacas_lecheras = [h for h in hembras if h.tipo_produccion in ("LECHE", "DOBLE_PROPOSITO")][:40]
if not vacas_lecheras:
    vacas_lecheras = hembras[:20]

for vaca in vacas_lecheras:
    for _ in range(5):
        fecha_p = fecha_aleatoria(180, 1)
        try:
            ProduccionLeche.objects.create(
                finca=finca,
                vaca=vaca,
                registrado_por=admin_user,
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
for _ in range(110):
    animal = random.choice(animales)
    try:
        RegistroPeso.objects.create(
            finca=finca,
            animal=animal,
            registrado_por=admin_user,
            fecha_pesaje=fecha_aleatoria(365, 1),
            peso_kg=rand_decimal(80, 650),
            observacion="Pesaje rutinario",
            condicion_corporal=pick("1", "2", "3", "4", "5"),
        )
        pesos_creados += 1
    except Exception:
        pass

# ── Ventas (25 notas + detalles) ─────────────────────────────────────────────
ventas_creadas = 0
animales_vendidos = random.sample([a for a in animales if a.estado == "ACTIVO"], min(25, len([a for a in animales if a.estado == "ACTIVO"])))
i_venta = 0
for _ in range(25):
    cliente = random.choice(clientes)
    fecha_v = fecha_aleatoria(365, 1)
    nota = NotaVenta.objects.create(
        finca=finca, cliente=cliente, registrado_por=admin_user,
        monto_total=0, fecha_venta=fecha_v,
        guia_salida=f"GS-{random.randint(10000,99999)}",
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

# ── Compras (20 notas + detalles) ────────────────────────────────────────────
compras_creadas = 0
for _ in range(20):
    proveedor = random.choice(proveedores)
    fecha_c = fecha_aleatoria(365, 1)
    nota = NotaCompra.objects.create(
        finca=finca, proveedor=proveedor, registrado_por=admin_user,
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
for _ in range(15):
    animal = random.choice(animales)
    try:
        MuerteBaja.objects.create(
            finca=finca, animal=animal, registrado_por=admin_user,
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
for _ in range(50):
    tipo = random.choice(tipos_gasto)
    cant = rand_decimal(1, 20)
    precio = rand_decimal(10000, 500000)
    try:
        Gasto.objects.create(
            finca=finca,
            animal=random.choice(animales) if random.random() > 0.5 else None,
            registrado_por=admin_user,
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

print(f"   Reprod: {repros_creadas} | Prod leche: {prod_creadas} | Pesos: {pesos_creados}")
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
