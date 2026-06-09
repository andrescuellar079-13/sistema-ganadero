#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

"""
Script de datos de prueba para Sistema Ganadero
Ejecutar con: python manage.py shell < seed_data.py
"""

import os
import django
from datetime import date, timedelta
from decimal import Decimal
import random

# ============================================================
# 1. FINCA
# ============================================================
print("✅ Creando Finca...")
from fincas.models import Finca

finca, _ = Finca.objects.get_or_create(
    nombre="Finca El Porvenir",
    defaults={
        "direccion": "Km 45 Carretera Norte, Santa Cruz",
        "hectareas": Decimal("250.00"),
        "telefono": "76543210",
    }
)
print(f"   Finca: {finca.nombre} (id={finca.id})")


# ============================================================
# 2. CATALOGOS BASE
# ============================================================
print("\n✅ Creando Catálogos...")
from catalogos.models import Raza, CategoriaAnimal, TipoMedicamento, Medicamento, Veterinario, Alimento, Reproductor, Vacuna

# Razas
razas_data = [
    ("Nelore",         "CARNE",          "Brasil"),
    ("Brahman",        "CARNE",          "India"),
    ("Holstein",       "LECHE",          "Holanda"),
    ("Pardo Suizo",    "LECHE",          "Suiza"),
    ("Simmental",      "DOBLE_PROPOSITO","Suiza"),
    ("Gyr Lechero",    "LECHE",          "India"),
]
razas = {}
for nombre, orientacion, origen in razas_data:
    r, _ = Raza.objects.get_or_create(nombre=nombre, defaults={"orientacion": orientacion, "origen": origen})
    razas[nombre] = r
print(f"   {len(razas)} razas creadas")

# Categorías
categorias_data = [
    ("Ternero/a",   "AMBOS",   0,  6,   0,  150, "TODOS",          False, False),
    ("Novillo",     "MACHO",   7,  24,  150, 350, "CARNE",          False, False),
    ("Toro",        "MACHO",   24, None,350, None,"CARNE",          False, True),
    ("Vaquilla",    "HEMBRA",  7,  24,  150, 300, "LECHE",          False, False),
    ("Vaca",        "HEMBRA",  24, None,300, None,"DOBLE_PROPOSITO", True,  True),
    ("Vaca Seca",   "HEMBRA",  24, None,300, None,"LECHE",          False, True),
]
categorias = {}
for nombre, sexo, emin, emax, pmin, pmax, tipo, lact, repro in categorias_data:
    c, _ = CategoriaAnimal.objects.get_or_create(nombre=nombre, defaults={
        "sexo_aplica": sexo, "edad_min_meses": emin, "edad_max_meses": emax,
        "peso_min_kg": pmin, "peso_max_kg": pmax, "tipo_produccion": tipo,
        "permite_lactancia": lact, "permite_reproduccion": repro, "activo": True,
    })
    categorias[nombre] = c
print(f"   {len(categorias)} categorías creadas")

# Tipos de medicamento
tipo_antiparasitario, _ = TipoMedicamento.objects.get_or_create(nombre="Antiparasitario")
tipo_antibiotico, _     = TipoMedicamento.objects.get_or_create(nombre="Antibiótico")
tipo_antiinflamatorio, _= TipoMedicamento.objects.get_or_create(nombre="Antiinflamatorio")
tipo_vitamina, _        = TipoMedicamento.objects.get_or_create(nombre="Vitamina/Mineral")

# Medicamentos
meds_data = [
    ("Ivermectina 1%",     tipo_antiparasitario, "SUBCUTANEA",  "1 ml/50 kg", 14, 7,  90, Decimal("45.00")),
    ("Oxitetraciclina LA", tipo_antibiotico,     "INTRAMUSCULAR","20 mg/kg",  28, 7, 180, Decimal("85.00")),
    ("Meloxicam",          tipo_antiinflamatorio,"INTRAMUSCULAR","0.5 mg/kg",  3, 0,  90, Decimal("120.00")),
    ("ADE Fort",           tipo_vitamina,        "INTRAMUSCULAR","5 ml",       0, 0, 180, Decimal("35.00")),
    ("Albendazol",         tipo_antiparasitario, "ORAL",        "7.5 mg/kg",   7, 3,  60, Decimal("28.00")),
]
medicamentos = {}
for nombre, tipo, via, dosis, ret_carne, ret_leche, intervalo, precio in meds_data:
    m, _ = Medicamento.objects.get_or_create(nombre=nombre, finca=finca, defaults={
        "tipo": tipo, "via_aplicacion": via, "dosis_recomendada": dosis,
        "dias_retiro_carne": ret_carne, "dias_retiro_leche": ret_leche,
        "intervalo_dias": intervalo, "precio_compra": precio,
        "stock_cantidad": Decimal("100.00"), "stock_minimo": Decimal("10.00"),
        "unidad_medida": "ml", "activo": True,
    })
    medicamentos[nombre] = m
print(f"   {len(medicamentos)} medicamentos creados")

# Veterinarios
vets_data = [
    ("Carlos",   "Mendoza Ríos",    "79812345", "Sanidad General",  "GENERAL"),
    ("Patricia", "Vásquez Torrico", "76234567", "Reproducción",     "REPRODUCCION"),
]
veterinarios = []
for nombre, apellidos, tel, esp, tipo in vets_data:
    v, _ = Veterinario.objects.get_or_create(nombre=nombre, finca=finca, defaults={
        "apellidos": apellidos, "telefono": tel, "especialidad": esp,
        "tipo_servicio": tipo, "costo_visita": Decimal("150.00"), "activo": True,
    })
    veterinarios.append(v)
print(f"   {len(veterinarios)} veterinarios creados")

# Alimentos
alimentos_data = [
    ("Concentrado Lechero 18%", "CONCENTRADO", 50, "kg",   200, 50, Decimal("2.80")),
    ("Heno de Alfalfa",         "HENO",        30, "fardos",100, 20, Decimal("15.00")),
    ("Sal Mineral Ganadera",    "SAL_MINERAL", 25, "kg",    80, 15, Decimal("8.50")),
    ("Silaje de Maíz",          "SILO",        500,"kg",   2000,500, Decimal("0.60")),
]
alimentos = {}
for nombre, tipo, neto, unidad, stock, stock_min, precio in alimentos_data:
    a, _ = Alimento.objects.get_or_create(nombre=nombre, finca=finca, defaults={
        "tipo_alimento": tipo, "contenido_neto": neto, "unidad_medida": unidad,
        "stock_cantidad": Decimal(str(stock)), "stock_minimo": Decimal(str(stock_min)),
        "precio_referencia": precio, "activo": True,
    })
    alimentos[nombre] = a
print(f"   {len(alimentos)} alimentos creados")

# Vacunas
vacunas_data = [
    ("Brucelosis RB51",    "Brucelosis",          "2 ml", "SUBCUTANEA",   365, 4),
    ("Triple Bovina",      "IBR, DVB, Leptospira","5 ml", "INTRAMUSCULAR",180, 6),
    ("Fiebre Aftosa",      "Fiebre Aftosa",        "2 ml", "SUBCUTANEA",   180, 0),
    ("Carbunco Sintomático","Carbunco",            "5 ml", "SUBCUTANEA",   365, 3),
]
vacunas = {}
for nombre, enf, dosis, via, intervalo, edad_min in vacunas_data:
    v, _ = Vacuna.objects.get_or_create(nombre=nombre, finca=finca, defaults={
        "enfermedad_previene": enf, "dosis_recomendada": dosis, "via_aplicacion": via,
        "intervalo_dias": intervalo, "edad_minima_meses": edad_min,
        "stock_cantidad": Decimal("200.00"), "stock_minimo": Decimal("20.00"), "activo": True,
    })
    vacunas[nombre] = v
print(f"   {len(vacunas)} vacunas creadas")

# Reproductores (semen)
reprod_data = [
    ("R001", "Titan Brahman",      "SEMEN", "SEMEN_SEXADO",     razas["Brahman"]),
    ("R002", "Holstein Champion",  "SEMEN", "SEMEN_CONVENCIONAL",razas["Holstein"]),
    ("R003", "Simmental Elite",    "SEMEN", "SEMEN_CONVENCIONAL",razas["Simmental"]),
]
reproductores = []
for codigo, nombre, origen, tipo, raza in reprod_data:
    rep, _ = Reproductor.objects.get_or_create(codigo=codigo, finca=finca, defaults={
        "nombre": nombre, "tipo_origen": origen, "tipo_reproductor": tipo,
        "raza": raza, "stock_pajuelas": 50,
        "costo_pajuela": Decimal("120.00"), "activo": True,
    })
    reproductores.append(rep)
print(f"   {len(reproductores)} reproductores creados")


# ============================================================
# 3. PARCELAS
# ============================================================
print("\n✅ Creando Parcelas...")
from animales.models import Parcela

parcelas_data = [
    ("Potrero Norte",    "ACTIVA", Decimal("45.00"), 40, "Brachiaria"),
    ("Potrero Sur",      "ACTIVA", Decimal("38.00"), 32, "Panicum maximum"),
    ("Potrero Maternidad","ACTIVA",Decimal("12.00"), 10, "Kikuyo"),
    ("Potrero Terneros", "ACTIVA", Decimal("8.00"),  15, "Ryegrass"),
    ("Potrero Engorde",  "ACTIVA", Decimal("30.00"), 25, "Brachiaria híbrido"),
]
parcelas = []
for nombre, estado, tamano, cap, pastura in parcelas_data:
    p, _ = Parcela.objects.get_or_create(nombre=nombre, finca=finca, defaults={
        "estado": estado, "tamano": tamano,
        "capacidad_maxima": cap, "tipo_pastura": pastura,
    })
    parcelas.append(p)
print(f"   {len(parcelas)} parcelas creadas")


# ============================================================
# 4. ANIMALES
# ============================================================
print("\n✅ Creando Animales...")
from animales.models import Animal

hoy = date.today()

animales_data = [
    # (nro_arete, nombre, sexo, fecha_nac, peso, tipo_prod, origen, raza_key, cat_key, color)
    ("AR-001","Lucera",  "HEMBRA", hoy-timedelta(days=1800), 480, "LECHE",          "NACIDO_FINCA", "Holstein",   "Vaca"),
    ("AR-002","Canela",  "HEMBRA", hoy-timedelta(days=2100), 510, "LECHE",          "NACIDO_FINCA", "Pardo Suizo","Vaca"),
    ("AR-003","Estrella","HEMBRA", hoy-timedelta(days=1650), 460, "DOBLE_PROPOSITO","COMPRADO",     "Simmental",  "Vaca"),
    ("AR-004","Rosita",  "HEMBRA", hoy-timedelta(days=1900), 490, "LECHE",          "NACIDO_FINCA", "Holstein",   "Vaca"),
    ("AR-005","Paloma",  "HEMBRA", hoy-timedelta(days=2300), 530, "LECHE",          "NACIDO_FINCA", "Gyr Lechero","Vaca"),
    ("AR-006","Luna",    "HEMBRA", hoy-timedelta(days=900),  310, "LECHE",          "NACIDO_FINCA", "Holstein",   "Vaquilla"),
    ("AR-007","Aurora",  "HEMBRA", hoy-timedelta(days=850),  290, "DOBLE_PROPOSITO","NACIDO_FINCA", "Simmental",  "Vaquilla"),
    ("AR-008","Tormenta","MACHO",  hoy-timedelta(days=2800), 680, "CARNE",          "COMPRADO",     "Brahman",    "Toro"),
    ("AR-009","Capitán", "MACHO",  hoy-timedelta(days=2600), 650, "CARNE",          "COMPRADO",     "Nelore",     "Toro"),
    ("AR-010","Trueno",  "MACHO",  hoy-timedelta(days=600),  280, "CARNE",          "NACIDO_FINCA", "Brahman",    "Novillo"),
    ("AR-011","Roble",   "MACHO",  hoy-timedelta(days=550),  260, "CARNE",          "NACIDO_FINCA", "Nelore",     "Novillo"),
    ("AR-012","Pinta",   "HEMBRA", hoy-timedelta(days=120),  85,  "DOBLE_PROPOSITO","NACIDO_FINCA", "Simmental",  "Ternero/a"),
    ("AR-013","Manchita","HEMBRA", hoy-timedelta(days=90),   75,  "LECHE",          "NACIDO_FINCA", "Holstein",   "Ternero/a"),
    ("AR-014","Bayo",    "MACHO",  hoy-timedelta(days=110),  90,  "CARNE",          "NACIDO_FINCA", "Brahman",    "Ternero/a"),
    ("AR-015","Negrita", "HEMBRA", hoy-timedelta(days=2000), 475, "LECHE",          "COMPRADO",     "Pardo Suizo","Vaca"),
]

animales = {}
for nro, nombre, sexo, fnac, peso, tipo_prod, origen, raza_key, cat_key, color in animales_data:
    a, creado = Animal.objects.get_or_create(nro_arete=nro, defaults={
        "nombre": nombre, "sexo": sexo, "fecha_nacimiento": fnac,
        "peso": Decimal(str(peso)), "tipo_produccion": tipo_prod,
        "origen": origen, "raza": razas[raza_key],
        "categoria": categorias[cat_key], "finca": finca,
        "estado": "ACTIVO", "color": color,
        "fecha_ingreso": fnac + timedelta(days=random.randint(0, 30)),
    })
    animales[nro] = a
    if creado:
        print(f"   + {nro} {nombre}")
print(f"   Total: {len(animales)} animales")


# ============================================================
# 5. REPRODUCCION
# ============================================================
print("\n✅ Creando Eventos Reproductivos...")
from reproduccion.models import InseminacionArtificial, MontaNatural, Reproduccion, Celo

vacas = [animales["AR-001"], animales["AR-002"], animales["AR-003"],
         animales["AR-004"], animales["AR-005"], animales["AR-015"]]

# Inseminaciones
for i, vaca in enumerate(vacas[:4]):
    fecha_ia = hoy - timedelta(days=random.randint(60, 200))
    ia, _ = InseminacionArtificial.objects.get_or_create(
        finca=finca, hembra=vaca, fecha=fecha_ia,
        defaults={
            "reproductor": reproductores[i % len(reproductores)],
            "numero_servicio": 1,
            "resultado": random.choice(["PRENADA", "PRENADA", "VACIA"]),
            "tecnico_inseminador": "Luis Fernández",
        }
    )

# Montas naturales
for vaca in vacas[4:]:
    fecha_monta = hoy - timedelta(days=random.randint(100, 250))
    mn, _ = MontaNatural.objects.get_or_create(
        finca=finca, hembra=vaca, fecha=fecha_monta,
        defaults={
            "resultado": "PRENADA",
            "duracion_dias": 3,
            "numero_servicio": 1,
        }
    )

# Partos registrados (reproducciones con parto real)
partos_data = [
    (animales["AR-001"], animales["AR-008"], animales["AR-012"], hoy-timedelta(days=120)),
    (animales["AR-002"], animales["AR-009"], animales["AR-013"], hoy-timedelta(days=90)),
    (animales["AR-003"], animales["AR-008"], animales["AR-014"], hoy-timedelta(days=110)),
]
for madre, padre, cria, fecha_parto in partos_data:
    reprod, creado = Reproduccion.objects.get_or_create(
        finca=finca, madre=madre,
        fecha_parto_real=fecha_parto,
        defaults={
            "padre": padre,
            "fecha_servicio": fecha_parto - timedelta(days=283),
            "tipo_parto": "NORMAL",
            "num_crias": 1,
            "peso_total_crias": Decimal(str(random.randint(28, 38))),
            "estado": "PARIDA",
        }
    )
    if creado:
        reprod.crias.add(cria)

# Celos registrados
for vaca in vacas[:3]:
    fecha_celo = hoy - timedelta(days=random.randint(10, 40))
    Celo.objects.get_or_create(
        finca=finca, hembra=vaca, fecha_inicio=fecha_celo,
        defaults={
            "tipo": "NATURAL", "intensidad": random.choice(["MEDIA", "ALTA"]),
            "detectado_por": "Operario de campo",
        }
    )
print("   Eventos reproductivos creados")


# ============================================================
# 6. PRODUCCION (Pesos, Lactancias, Leche)
# ============================================================
print("\n✅ Creando Datos de Producción...")
from produccion.models import RegistroPeso, Lactancia, ProduccionLeche, EngordeAnimal

# Registros de peso para todos los animales
for nro, animal in animales.items():
    peso_base = float(animal.peso)
    for meses_atras in [6, 3, 1]:
        fecha_pesaje = hoy - timedelta(days=meses_atras * 30)
        factor = 1 - (meses_atras * 0.04)
        peso = Decimal(str(round(peso_base * factor, 1)))
        RegistroPeso.objects.get_or_create(
            animal=animal, fecha_pesaje=fecha_pesaje,
            defaults={"finca": finca, "peso_kg": peso, "condicion_corporal": Decimal("3.5")}
        )

# Lactancias y producción de leche para vacas
partos_leche = [
    (animales["AR-001"], hoy-timedelta(days=120)),
    (animales["AR-002"], hoy-timedelta(days=90)),
    (animales["AR-003"], hoy-timedelta(days=110)),
    (animales["AR-004"], hoy-timedelta(days=200)),
    (animales["AR-005"], hoy-timedelta(days=150)),
]

for vaca, inicio_lact in partos_leche:
    lact, _ = Lactancia.objects.get_or_create(
        finca=finca, vaca=vaca,
        fecha_inicio=inicio_lact,
        defaults={"numero_lactancia": 1, "estado": "ACTIVA"}
    )
    # Registros de leche cada 5 días
    dias_lact = (hoy - inicio_lact).days
    for d in range(0, min(dias_lact, 90), 5):
        fecha_prod = inicio_lact + timedelta(days=d)
        # Curva de lactancia: sube, llega a pico y baja
        if d < 30:
            litros_base = 8 + d * 0.3
        elif d < 60:
            litros_base = 17 - (d - 30) * 0.1
        else:
            litros_base = 14 - (d - 60) * 0.15
        litros = Decimal(str(round(max(litros_base + random.uniform(-1, 1), 4), 1)))
        ProduccionLeche.objects.get_or_create(
            finca=finca, vaca=vaca, lactancia=lact,
            fecha=fecha_prod, turno="MANIANA",
            defaults={"litros": litros}
        )

# Engordes para novillos
novillos = [animales["AR-010"], animales["AR-011"]]
for novillo in novillos:
    EngordeAnimal.objects.get_or_create(
        finca=finca, animal=novillo,
        defaults={
            "fecha_inicio": hoy - timedelta(days=90),
            "peso_inicial": novillo.peso - Decimal("40"),
            "peso_objetivo": Decimal("450.00"),
            "tipo_engorde": "SEMI_INTENSIVO",
            "lote_grupo": "Lote Engorde A",
            "estado": "EN_ENGORDE",
        }
    )
print("   Producción creada")


# ============================================================
# 7. SANIDAD
# ============================================================
print("\n✅ Creando Registros Sanitarios...")
from sanidad.models import Vacunacion, Tratamiento, Desparasitacion, Enfermedad, Diagnostico

# Enfermedades
enf_data = [
    ("Mastitis", "INFECCIOSA", "Inflamación de la glándula mamaria", "Staphylococcus, Streptococcus"),
    ("Neumonía Bovina", "RESPIRATORIA", "Tos, secreción nasal, fiebre", "Mannheimia haemolytica"),
    ("Diarrea Neonatal", "DIGESTIVA", "Heces líquidas en terneros", "E. coli, Rotavirus"),
    ("Fiebre de Leche", "METABOLICA", "Hipocalcemia posparto", "Déficit de calcio"),
]
enfermedades = {}
for nombre, cat, sintomas, causa in enf_data:
    e, _ = Enfermedad.objects.get_or_create(nombre=nombre, defaults={
        "categoria": cat, "sintomas": sintomas, "causa": causa,
        "tiempo_recuperacion_dias": 10, "mortalidad_porcentaje": Decimal("2.5"),
    })
    enfermedades[nombre] = e

# Vacunaciones para todos los animales
vacuna_fiebre = vacunas["Fiebre Aftosa"]
vacuna_triple = vacunas["Triple Bovina"]
for nro, animal in animales.items():
    fecha_vac = hoy - timedelta(days=random.randint(30, 120))
    Vacunacion.objects.get_or_create(
        finca=finca, animal=animal,
        fecha_aplicacion=fecha_vac,
        vacuna=vacuna_fiebre,
        defaults={
            "dosis_aplicada": "2 ml", "via_aplicacion": "SUBCUTANEA",
            "campana": "Campaña Nacional Aftosa 2026",
            "lote": "LOTE-FA-2026",
            "veterinario": veterinarios[0],
        }
    )
    # Triple bovina para vacas adultas
    if animal.sexo == "HEMBRA" and animal.categoria and animal.categoria.nombre == "Vaca":
        fecha_triple = hoy - timedelta(days=random.randint(60, 180))
        Vacunacion.objects.get_or_create(
            finca=finca, animal=animal,
            fecha_aplicacion=fecha_triple,
            vacuna=vacuna_triple,
            defaults={
                "dosis_aplicada": "5 ml", "via_aplicacion": "INTRAMUSCULAR",
                "campana": "Programa Reproductivo 2026",
                "veterinario": veterinarios[1],
            }
        )

# Desparasitaciones
for nro, animal in list(animales.items())[:10]:
    fecha_desp = hoy - timedelta(days=random.randint(30, 90))
    Desparasitacion.objects.get_or_create(
        finca=finca, animal=animal, fecha=fecha_desp,
        defaults={
            "medicamento": medicamentos["Ivermectina 1%"],
            "tipo_parasiticida": "Endoectocida",
            "producto": "Ivermectina 1%",
            "dosis": "1 ml/50 kg",
            "peso_aplicacion": animal.peso,
            "veterinario": veterinarios[0],
        }
    )

# Tratamientos
tratamientos_data = [
    (animales["AR-001"], "Mastitis subclínica cuarto posterior derecho", enfermedades["Mastitis"],   medicamentos["Oxitetraciclina LA"]),
    (animales["AR-013"], "Diarrea neonatal moderada",                   enfermedades["Diarrea Neonatal"], medicamentos["Meloxicam"]),
    (animales["AR-004"], "Retención de placenta posparto",              enfermedades["Fiebre de Leche"],  medicamentos["ADE Fort"]),
]
for animal, diagnostico, enfermedad, medicamento in tratamientos_data:
    fecha_trat = hoy - timedelta(days=random.randint(5, 30))
    Tratamiento.objects.get_or_create(
        finca=finca, animal=animal, fecha=fecha_trat,
        defaults={
            "diagnostico": diagnostico,
            "enfermedad": enfermedad,
            "medicamento": medicamento,
            "dosis": medicamento.dosis_recomendada,
            "via_aplicacion": medicamento.via_aplicacion,
            "costo": medicamento.precio_compra,
            "dias_retiro": medicamento.dias_retiro_leche,
            "en_tratamiento": False,
            "fecha_inicio": fecha_trat,
            "fecha_fin": fecha_trat + timedelta(days=5),
            "veterinario": veterinarios[0],
        }
    )
print("   Registros sanitarios creados")


# ============================================================
# RESUMEN FINAL
# ============================================================
print("\n" + "="*55)
print("🐄 SEED COMPLETADO - RESUMEN")
print("="*55)
print(f"  Finca:           1")
print(f"  Razas:           {len(razas)}")
print(f"  Categorías:      {len(categorias)}")
print(f"  Medicamentos:    {len(medicamentos)}")
print(f"  Vacunas:         {len(vacunas)}")
print(f"  Alimentos:       {len(alimentos)}")
print(f"  Veterinarios:    {len(veterinarios)}")
print(f"  Reproductores:   {len(reproductores)}")
print(f"  Parcelas:        {len(parcelas)}")
print(f"  Animales:        {len(animales)}")
print(f"  Vacunaciones:    {Vacunacion.objects.filter(finca=finca).count()}")
print(f"  Producciones:    {ProduccionLeche.objects.filter(finca=finca).count()}")
print(f"  Tratamientos:    {Tratamiento.objects.filter(finca=finca).count()}")
print("="*55)
print("✅ Sistema listo para pruebas en http://localhost:5173")