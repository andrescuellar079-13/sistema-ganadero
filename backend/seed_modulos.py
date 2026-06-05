"""
Script para agregar 10+ registros por módulo a finca 2 para pruebas.
Ejecutar: python manage.py shell < seed_modulos.py
"""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from datetime import date, timedelta
import random

from fincas.models import Finca
from animales.models import Animal
from accounts.models import Usuario
from catalogos.models import Reproductor, Veterinario, Medicamento, Vacuna
from reproduccion.models import InseminacionArtificial, DiagnosticoPrenez, Reproduccion
from produccion.models import Lactancia, ProduccionLeche, RegistroPeso
from sanidad.models import Tratamiento, Desparasitacion, Vacunacion, Diagnostico
from compras.models import Proveedor, NotaCompra

finca = Finca.objects.get(id=2)
admin_user = Usuario.objects.filter(username='admin').first()
nina = Usuario.objects.filter(username='nina').first()

# Assign admin/juan to finca 2 so they can see data
for uname in ['admin', 'juan']:
    u = Usuario.objects.filter(username=uname).first()
    if u and not u.finca_id:
        u.finca = finca
        u.save()
        print(f"Asignado {uname} a finca 2")

hembras = list(Animal.objects.filter(finca=finca, estado='ACTIVO', sexo='HEMBRA').order_by('id')[:20])
machos  = list(Animal.objects.filter(finca=finca, estado='ACTIVO', sexo='MACHO').order_by('id')[:10])
reproductores = list(Reproductor.objects.filter(finca=finca)[:5])
veterinarios  = list(Veterinario.objects.filter(finca=finca)[:5])
medicamentos  = list(Medicamento.objects.filter(finca=finca)[:10])
vacunas       = list(Vacuna.objects.all()[:10])

today = date.today()

def rd(days_back=0):
    return today - timedelta(days=random.randint(0, days_back))

def pick(*args):
    return random.choice(args)

print("\n=== Reproducción: InseminacionArtificial ===")
for i, hembra in enumerate(hembras[:10]):
    fecha = today - timedelta(days=30 * (i + 1))
    ia, created = InseminacionArtificial.objects.get_or_create(
        finca=finca,
        hembra=hembra,
        fecha=fecha,
        defaults=dict(
            reproductor=reproductores[i % len(reproductores)] if reproductores else None,
            numero_servicio=1,
            numero_pajuela=f"AX-{2024 + i:04d}",
            tecnico_inseminador=f"Dr. Técnico {i+1}",
            observaciones=f"Inseminación rutinaria #{i+1}",
        )
    )
    if created:
        print(f"  IA creada: {hembra.nombre} - {fecha}")

print("\n=== Reproducción: DiagnosticoPrenez ===")
for i, hembra in enumerate(hembras[:10]):
    fecha = today - timedelta(days=20 * (i + 1))
    dp, created = DiagnosticoPrenez.objects.get_or_create(
        finca=finca,
        hembra=hembra,
        fecha=fecha,
        defaults=dict(
            resultado_prenez=pick('POSITIVO', 'POSITIVO', 'NEGATIVO', 'DUDOSO'),
            dias_gestacion=random.randint(30, 200),
            metodo=pick('Ultrasonido', 'Palpación rectal', 'Test hormonal'),
            veterinario=veterinarios[i % len(veterinarios)] if veterinarios else None,
            observaciones=f"Diagnóstico #{i+1}",
        )
    )
    if created:
        print(f"  Diagnóstico: {hembra.nombre} - {fecha} - {dp.resultado_prenez}")

print("\n=== Reproducción: Partos (Reproduccion) ===")
for i, hembra in enumerate(hembras[:10]):
    fecha_srv = today - timedelta(days=300 + i * 10)
    fecha_parto = fecha_srv + timedelta(days=random.randint(275, 290))
    estado = pick('PARIDA', 'PARIDA', 'PRENADA', 'VACIA')
    r, created = Reproduccion.objects.get_or_create(
        finca=finca,
        madre=hembra,
        fecha_servicio=fecha_srv,
        defaults=dict(
            fecha_parto_real=fecha_parto if estado == 'PARIDA' else None,
            tipo_parto=pick('NORMAL', 'NORMAL', 'DISTOCICO', 'MULTIPLE'),
            num_crias=1 if pick(True, True, False) else 2,
            estado=estado,
            peso_total_crias=round(random.uniform(25, 45), 1),
            observaciones=f"Parto #{i+1} sin complicaciones",
        )
    )
    if created:
        print(f"  Parto: {hembra.nombre} - {fecha_parto} - {estado}")

print("\n=== Producción: Lactancias ===")
lactancias_creadas = []
for i, hembra in enumerate(hembras[:10]):
    fecha_inicio = today - timedelta(days=random.randint(30, 200))
    lact, created = Lactancia.objects.get_or_create(
        finca=finca,
        vaca=hembra,
        numero_lactancia=1,
        defaults=dict(
            fecha_inicio=fecha_inicio,
            estado='ACTIVA',
            observaciones=f"Lactancia activa #{i+1}",
        )
    )
    if created:
        print(f"  Lactancia: {hembra.nombre} - inicio {fecha_inicio}")
    lactancias_creadas.append(lact)

print("\n=== Producción: ProduccionLeche ===")
for lact in lactancias_creadas:
    for j in range(5):
        fecha = today - timedelta(days=j * 3)
        for turno in ['MANIANA', 'TARDE']:
            litros = round(random.uniform(8, 25), 1)
            pl, created = ProduccionLeche.objects.get_or_create(
                finca=finca,
                vaca=lact.vaca,
                lactancia=lact,
                fecha=fecha,
                turno=turno,
                defaults=dict(
                    litros=litros,
                    observaciones=None,
                )
            )
            if created and j == 0 and turno == 'MANIANA':
                print(f"  Produccion: {lact.vaca.nombre} - {fecha} - {litros}L")

print("\n=== Producción: RegistroPeso ===")
todos = hembras[:8] + machos[:5]
for i, animal in enumerate(todos):
    fecha = today - timedelta(days=i * 7)
    rp, created = RegistroPeso.objects.get_or_create(
        finca=finca,
        animal=animal,
        fecha_pesaje=fecha,
        defaults=dict(
            peso_kg=round(random.uniform(200, 550), 1),
            condicion_corporal=round(random.uniform(2.5, 4.5), 1),
            observacion=f"Pesaje de rutina #{i+1}",
        )
    )
    if created:
        print(f"  Peso: {animal.nombre} - {rp.peso_kg}kg")

print("\n=== Sanidad: Tratamientos ===")
diagnosticos = [
    'Neumonía', 'Diarrea bovina', 'Mastitis', 'Acidosis', 'Hipocalcemia',
    'Infección podal', 'Queratoconjuntivitis', 'Retención placentaria',
    'Bronquitis', 'Parasitismo gastrointestinal',
]
for i, animal in enumerate((hembras + machos)[:10]):
    med = medicamentos[i % len(medicamentos)] if medicamentos else None
    fecha = today - timedelta(days=random.randint(5, 90))
    tr, created = Tratamiento.objects.get_or_create(
        finca=finca,
        animal=animal,
        fecha=fecha,
        defaults=dict(
            medicamento=med,
            veterinario=veterinarios[i % len(veterinarios)] if veterinarios else None,
            diagnostico=diagnosticos[i % len(diagnosticos)],
            tipo='CLINICO',
            dosis=f"{random.randint(5, 20)} ml",
            via_aplicacion=pick('INTRAMUSCULAR', 'SUBCUTANEA', 'ORAL'),
            costo=round(random.uniform(50000, 500000), 0),
            en_tratamiento=pick(True, False),
            observaciones=f"Tratamiento {diagnosticos[i % len(diagnosticos)]}",
        )
    )
    if created:
        print(f"  Tratamiento: {animal.nombre} - {diagnosticos[i % len(diagnosticos)]}")

print("\n=== Sanidad: Desparasitaciones ===")
productos = ['Ivermectina', 'Albendazol', 'Levamisol', 'Closantel', 'Doramectina']
for i, animal in enumerate((hembras + machos)[:10]):
    med = medicamentos[i % len(medicamentos)] if medicamentos else None
    fecha = today - timedelta(days=random.randint(10, 180))
    des, created = Desparasitacion.objects.get_or_create(
        finca=finca,
        animal=animal,
        fecha=fecha,
        defaults=dict(
            medicamento=med,
            veterinario=veterinarios[i % len(veterinarios)] if veterinarios else None,
            tipo_parasiticida=pick('ENDECTOCIDA', 'ANTIHELMÍNTICO', 'ECTOPARASITICIDA'),
            producto=productos[i % len(productos)],
            peso_aplicacion=round(random.uniform(200, 550), 1),
            dosis=f"{random.randint(2, 10)} ml/100kg",
            via_aplicacion=pick('SUBCUTANEA', 'ORAL', 'POUR-ON'),
            costo=round(random.uniform(20000, 200000), 0),
            observaciones=f"Desparasitación preventiva #{i+1}",
        )
    )
    if created:
        print(f"  Desparasitación: {animal.nombre} - {productos[i % len(productos)]}")

print("\n=== Sanidad: Vacunaciones ===")
for i, animal in enumerate((hembras + machos)[:10]):
    vacuna = vacunas[i % len(vacunas)] if vacunas else None
    if not vacuna:
        continue
    fecha = today - timedelta(days=random.randint(15, 120))
    vac, created = Vacunacion.objects.get_or_create(
        finca=finca,
        animal=animal,
        vacuna=vacuna,
        fecha_aplicacion=fecha,
        defaults=dict(
            via_aplicacion=pick('INTRAMUSCULAR', 'SUBCUTANEA'),
            dosis_aplicada=f"{random.randint(2, 5)} ml",
            campana=f"Campaña {today.year}",
            lote=f"LOTE-{random.randint(100, 999)}",
            observaciones=f"Vacunación preventiva #{i+1}",
        )
    )
    if created:
        print(f"  Vacunación: {animal.nombre} - {vacuna.nombre}")

print("\n=== Proveedores (finca 2) ===")
proveedores_data = [
    ("Agroveterinaria Central", "García", "Av. Principal 123", "0981-111-222"),
    ("Distribuidora Pecuaria", "López", "Ruta 8 km 45", "0982-333-444"),
    ("Farmacia Animal del Sur", "Rodríguez", "Calle 5 de Agosto 67", "0983-555-666"),
    ("Insumos Ganaderos SRL", "Martínez", "Zona Industrial Norte", "0984-777-888"),
    ("Almacén Agropecuario", "Sosa", "Barrio San Pedro 34", "0985-999-000"),
    ("Cooperativa Ganadera", "Benítez", "Km 20 Ruta 7", "0986-111-333"),
    ("Proveedor de Semen", "Acosta", "Campo Grande 456", "0987-222-444"),
    ("Nutrición Animal SA", "Villalba", "Av. Mcal. López 789", "0988-333-555"),
    ("Equipos Agro", "Paredes", "Zona Rural Km 5", "0989-444-666"),
    ("Alimentos Balanceados", "Cáceres", "Ruta 1 km 12", "0981-555-777"),
]
provs_creados = []
for nombre, apellidos, dir_, tel in proveedores_data:
    prov, created = Proveedor.objects.get_or_create(
        finca=finca,
        nombre=nombre,
        defaults=dict(
            apellidos=apellidos,
            direccion=dir_,
            telefono=tel,
            estado=True,
            nit=f"{random.randint(1000000, 9999999)}-{random.randint(1, 9)}",
        )
    )
    if created:
        print(f"  Proveedor: {nombre}")
    provs_creados.append(prov)

print("\n=== Compras: NotaCompra ===")
meds = medicamentos[:5]
for i in range(10):
    prov = provs_creados[i % len(provs_creados)] if provs_creados else None
    fecha = today - timedelta(days=random.randint(5, 120))
    nc, created = NotaCompra.objects.get_or_create(
        finca=finca,
        proveedor=prov,
        fecha_compra=fecha,
        defaults=dict(
            tipo_compra=pick('MEDICAMENTO', 'ALIMENTO', 'OTRO'),
            monto_total=round(random.uniform(200000, 5000000), 0),
            observaciones=f"Compra de insumos #{i+1}",
        )
    )
    if created:
        print(f"  NotaCompra: {prov.nombre if prov else 'Sin proveedor'} - {fecha}")

print("\n=== Resumen final ===")
from reproduccion.models import InseminacionArtificial as IA, DiagnosticoPrenez as DP
from produccion.models import Lactancia as Lact, ProduccionLeche as PL, RegistroPeso as RP
from sanidad.models import Tratamiento as TR, Desparasitacion as DES, Vacunacion as VAC
print(f"InseminacionesIA finca 2: {IA.objects.filter(finca_id=2).count()}")
print(f"DiagnosticosPrenez finca 2: {DP.objects.filter(finca_id=2).count()}")
print(f"Reproducciones finca 2: {Reproduccion.objects.filter(finca_id=2).count()}")
print(f"Lactancias finca 2: {Lact.objects.filter(finca_id=2).count()}")
print(f"ProduccionLeche finca 2: {PL.objects.filter(finca_id=2).count()}")
print(f"RegistrosPeso finca 2: {RP.objects.filter(finca_id=2).count()}")
print(f"Tratamientos finca 2: {TR.objects.filter(finca_id=2).count()}")
print(f"Desparasitaciones finca 2: {DES.objects.filter(finca_id=2).count()}")
print(f"Vacunaciones finca 2: {VAC.objects.filter(finca_id=2).count()}")
print(f"Proveedores finca 2: {Proveedor.objects.filter(finca_id=2).count()}")
print(f"NotaCompra finca 2: {NotaCompra.objects.filter(finca_id=2).count()}")
print("\nScript completado con exito!")
