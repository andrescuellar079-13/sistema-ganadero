from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import date, timedelta
from decimal import Decimal
import random


def ago(days):
    return date.today() - timedelta(days=days)


TODAY = date.today()


class Command(BaseCommand):
    help = 'Carga datos demo completos para Finca Principal'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando seed de Finca Principal...")
        with transaction.atomic():
            self._seed()

    def _seed(self):
        from fincas.models import Finca
        from accounts.models import Rol, Usuario
        from accounts.schema import PERMISOS_SISTEMA
        from catalogos.models import (
            Raza, CategoriaAnimal, Vacuna, Medicamento, TipoMedicamento,
            Veterinario, Alimento, Reproductor,
        )
        from animales.models import Animal, Parcela, AnimalParcela
        from reproduccion.models import (
            InseminacionArtificial, DiagnosticoPrenez, Reproduccion,
        )
        from produccion.models import Lactancia, ProduccionLeche, RegistroPeso
        from sanidad.models import Vacunacion, Tratamiento, Desparasitacion
        from comercio.models import Cliente, NotaVenta, DetalleVenta, MuerteBaja
        from compras.models import Proveedor, NotaCompra, DetalleCompra, DetalleCompraAlimento
        from alertas.models import Alerta
        from rrhh.models import TipoEmpleado, Empleado

        c = {}  # counters

        # ── 1. FINCA ──────────────────────────────────────────────────────────
        finca, _ = Finca.objects.get_or_create(
            nombre="Finca Principal",
            defaults={
                "propietario": "Nina Escobar",
                "departamento": "Santa Cruz",
                "municipio": "Santa Cruz de la Sierra",
                "ubicacion": "Zona rural demo",
                "telefono": "70000000",
                "activo": True,
            },
        )
        c['finca'] = 1

        # ── 2. ROLES ──────────────────────────────────────────────────────────
        all_perms = list(PERMISOS_SISTEMA.keys())
        roles_def = [
            ("ADMINISTRADOR", "Acceso total al sistema", all_perms),
            ("VETERINARIO", "Veterinario", [
                'dashboard_ver', 'animales_ver', 'animales_crear', 'animales_editar',
                'vacunas_ver', 'vacunas_crear', 'vacunas_editar',
                'vacunaciones_ver', 'vacunaciones_crear',
                'reproduccion_ver', 'reproduccion_crear',
                'sanidad_ver', 'sanidad_crear',
                'alertas_ver', 'alertas_crear', 'parcelas_ver',
            ]),
            ("OPERADOR", "Operador básico", [
                'dashboard_ver', 'animales_ver', 'parcelas_ver',
                'produccion_ver', 'produccion_crear', 'alertas_ver',
            ]),
            ("ENCARGADO_VENTAS", "Encargado de ventas", [
                'dashboard_ver', 'animales_ver',
                'ventas_ver', 'ventas_crear',
                'compras_ver', 'compras_crear',
                'clientes_ver', 'clientes_crear', 'clientes_editar',
                'proveedores_ver', 'proveedores_crear', 'proveedores_editar',
            ]),
        ]
        roles = {}
        for nombre, desc, perms in roles_def:
            rol, _ = Rol.objects.get_or_create(
                nombre=nombre,
                defaults={"descripcion": desc, "permisos": perms, "activo": True},
            )
            roles[nombre] = rol
        c['roles'] = len(roles_def)

        # ── 3. USUARIO ADMINISTRADOR ──────────────────────────────────────────
        usuario, created = Usuario.objects.get_or_create(
            username="nina",
            defaults={
                "first_name": "Nina",
                "last_name": "Escobar",
                "email": "nina@example.com",
                "finca": finca,
                "rol": roles["ADMINISTRADOR"],
                "is_staff": True,
                "is_superuser": True,
                "activo": True,
            },
        )
        if created:
            usuario.set_password("admin12345")
            usuario.save()
        c['usuarios'] = 1

        # ── 4. CATÁLOGOS ──────────────────────────────────────────────────────
        razas_def = [
            ("Nelore",            "CARNE",          "Brasil"),
            ("Brahman",           "CARNE",          "India/USA"),
            ("Girolando",         "LECHE",          "Brasil"),
            ("Holando Argentino", "LECHE",          "Argentina"),
            ("Gyr",               "LECHE",          "India"),
            ("Brangus",           "CARNE",          "USA"),
            ("Hereford",          "CARNE",          "Inglaterra"),
            ("Angus",             "CARNE",          "Escocia"),
            ("Simmental",         "DOBLE_PROPOSITO","Suiza"),
            ("Jersey",            "LECHE",          "Jersey"),
        ]
        razas = {}
        for nombre, orientacion, origen in razas_def:
            r, _ = Raza.objects.get_or_create(
                nombre=nombre,
                defaults={"orientacion": orientacion, "origen": origen, "activo": True},
            )
            razas[nombre] = r
        c['razas'] = len(razas_def)

        cats_def = ["Ternero", "Ternera", "Vaquillona", "Novillo", "Vaca", "Toro", "Vaca Seca"]
        cats = {}
        for nombre in cats_def:
            ct, _ = CategoriaAnimal.objects.get_or_create(nombre=nombre, defaults={"activo": True})
            cats[nombre] = ct
        c['categorias'] = len(cats_def)

        tipo_med, _ = TipoMedicamento.objects.get_or_create(nombre="General")

        # Vacuna.nombre es unique=True globalmente
        vacunas_def = [
            ("Aftosa",         "2 ml", "INTRAMUSCULAR", 180, 0),
            ("Brucelosis",     "2 ml", "SUBCUTANEA",    365, 3),
            ("Rabia",          "2 ml", "SUBCUTANEA",    365, 0),
            ("Carbunclo",      "5 ml", "SUBCUTANEA",    365, 0),
            ("Triple bovina",  "5 ml", "INTRAMUSCULAR", 365, 0),
            ("Leptospirosis",  "2 ml", "INTRAMUSCULAR", 180, 0),
        ]
        vacunas = {}
        for nombre, dosis, via, intervalo, edad_min in vacunas_def:
            v, _ = Vacuna.objects.get_or_create(
                nombre=nombre,
                defaults={
                    "finca": finca,
                    "dosis_recomendada": dosis,
                    "via_aplicacion": via,
                    "intervalo_dias": intervalo,
                    "edad_minima_meses": edad_min,
                    "activo": True,
                },
            )
            vacunas[nombre] = v
        c['vacunas'] = len(vacunas_def)

        meds_def = [
            ("Oxitetraciclina",   "ml", 500),
            ("Ivermectina",       "ml", 300),
            ("Complejo B",        "ml", 200),
            ("Antiinflamatorio",  "ml", 150),
            ("Desparasitante oral","ml",400),
            ("Calcio inyectable", "ml", 250),
        ]
        meds = {}
        for nombre, unidad, stock in meds_def:
            m, _ = Medicamento.objects.get_or_create(
                finca=finca,
                nombre=nombre,
                defaults={
                    "tipo": tipo_med,
                    "unidad_medida": unidad,
                    "stock_cantidad": stock,
                    "precio_compra": round(random.uniform(50, 200), 2),
                    "activo": True,
                },
            )
            meds[nombre] = m
        c['medicamentos'] = len(meds_def)

        alims_def = [
            ("Balanceado lechero", "kg", 2000),
            ("Sal mineral",        "kg",  500),
            ("Heno",               "kg", 3000),
            ("Ensilaje de maíz",   "kg", 5000),
            ("Afrecho",            "kg", 1000),
            ("Sorgo molido",       "kg", 1500),
        ]
        alims = {}
        for nombre, unidad, stock in alims_def:
            a, _ = Alimento.objects.get_or_create(
                finca=finca,
                nombre=nombre,
                defaults={
                    "unidad_medida": unidad,
                    "stock_cantidad": stock,
                    "precio_referencia": round(random.uniform(5, 50), 2),
                    "activo": True,
                },
            )
            alims[nombre] = a
        c['alimentos'] = len(alims_def)

        vets_def = [
            ("Carlos", "Méndez", "Bovinos"),
            ("Laura",  "Rojas",  "Reproducción"),
            ("Miguel", "Vargas", "Sanidad"),
        ]
        vets = []
        for nombre, apellidos, especialidad in vets_def:
            v, _ = Veterinario.objects.get_or_create(
                finca=finca,
                nombre=nombre,
                apellidos=apellidos,
                defaults={"especialidad": especialidad, "activo": True},
            )
            vets.append(v)

        # ── 5. PARCELAS ──────────────────────────────────────────────────────
        parcelas_def = [
            ("Potrero 1", "OCUPADO",  "Brachiaria",          40, 50),
            ("Potrero 2", "OCUPADO",  "Tanzania",            35, 45),
            ("Potrero 3", "LIBRE",    "Mombaza",             50, 60),
            ("Potrero 4", "DESCANSO", "Brachiaria brizantha",70, 80),
            ("Potrero 5", "OCUPADO",  "Pasto estrella",      25, 35),
            ("Potrero 6", "LIBRE",    "Tanzania",            30, 40),
            ("Potrero 7", "DESCANSO", "Humidícola",          45, 55),
            ("Potrero 8", "OCUPADO",  "Brachiaria",          60, 75),
        ]
        parcelas = {}
        for nombre, estado, pastura, tamano, cap in parcelas_def:
            p, _ = Parcela.objects.get_or_create(
                finca=finca,
                nombre=nombre,
                defaults={
                    "estado": estado,
                    "tipo_pastura": pastura,
                    "tamano": tamano,
                    "capacidad_maxima": cap,
                },
            )
            parcelas[nombre] = p
        c['parcelas'] = len(parcelas_def)

        # ── 6. ANIMALES ──────────────────────────────────────────────────────
        raza_keys = list(razas.keys())

        def mk(arete, nombre, sexo, dias_nac, cat_key, raza_key,
               origen, estado, tipo_prod, peso, padre=None, madre=None, color="Café"):
            a, _ = Animal.objects.get_or_create(
                nro_arete=arete,
                defaults={
                    "finca": finca,
                    "nombre": nombre,
                    "sexo": sexo,
                    "fecha_nacimiento": ago(dias_nac),
                    "categoria": cats[cat_key],
                    "raza": razas[raza_key],
                    "origen": origen,
                    "estado": estado,
                    "tipo_produccion": tipo_prod,
                    "peso": peso,
                    "peso_nacimiento": round(peso * 0.07, 1),
                    "fecha_ingreso": ago(dias_nac),
                    "padre": padre,
                    "madre": madre,
                    "color": color,
                },
            )
            return a

        # A) 5 toros
        toros = [
            mk("M0001","Zeus",      "MACHO",2190,"Toro","Brahman", "COMPRADO","ACTIVO","CARNE", 750, color="Gris"),
            mk("M0002","Hércules",  "MACHO",2000,"Toro","Nelore",  "COMPRADO","ACTIVO","CARNE", 820, color="Blanco"),
            mk("M0003","Trueno",    "MACHO",1800,"Toro","Brangus", "COMPRADO","ACTIVO","CARNE", 710, color="Negro"),
            mk("M0004","Relámpago", "MACHO",1600,"Toro","Angus",   "COMPRADO","ACTIVO","CARNE", 680, color="Negro"),
            mk("M0005","Max",       "MACHO",2400,"Toro","Hereford","COMPRADO","ACTIVO","CARNE", 790, color="Rojo"),
        ]

        # B) 20 vacas adultas
        vacas_info = [
            ("H0001","Canela",    "Brahman",           "Café"),
            ("H0002","Perla",     "Holando Argentino", "Blanco"),
            ("H0003","Luna",      "Girolando",         "Amarillo"),
            ("H0004","Flor",      "Gyr",               "Rojo"),
            ("H0005","Sultana",   "Jersey",            "Café oscuro"),
            ("H0006","Diana",     "Girolando",         "Café"),
            ("H0007","Estrella",  "Holando Argentino", "Blanco"),
            ("H0008","Paloma",    "Nelore",            "Blanco"),
            ("H0009","Bella",     "Brahman",           "Gris"),
            ("H0010","Rosa",      "Girolando",         "Café"),
            ("H0011","Blanca",    "Holando Argentino", "Blanco"),
            ("H0012","Morena",    "Gyr",               "Café oscuro"),
            ("H0013","Dulce",     "Jersey",            "Café"),
            ("H0014","Nieve",     "Holando Argentino", "Blanco"),
            ("H0015","Princesa",  "Girolando",         "Amarillo"),
            ("H0016","Linda",     "Brahman",           "Gris"),
            ("H0017","Reina",     "Nelore",            "Blanco"),
            ("H0018","Esperanza", "Girolando",         "Café"),
            ("H0019","Mariposa",  "Jersey",            "Café claro"),
            ("H0020","Lucera",    "Holando Argentino", "Blanco"),
        ]
        vacas = []
        for i, (arete, nombre, raza_key, color) in enumerate(vacas_info):
            padre_opt = toros[i % 5] if i % 3 == 0 else None
            v = mk(arete, nombre, "HEMBRA", 1500 + i * 30, "Vaca", raza_key,
                   "NACIDO_FINCA", "ACTIVO", "LECHE",
                   random.randint(380, 550), padre=padre_opt, color=color)
            vacas.append(v)

        # C) 10 vaquillonas H0021-H0030
        vaquillonas = []
        for i in range(10):
            arete = f"H{21 + i:04d}"
            v = mk(arete, f"Vaquillona-{21 + i}", "HEMBRA", 700 + i * 20,
                   "Vaquillona", raza_keys[i % 10],
                   "NACIDO_FINCA", "ACTIVO", "LECHE",
                   random.randint(220, 350),
                   padre=toros[i % 5], madre=vacas[i % 20])
            vaquillonas.append(v)

        # D) 5 terneras H0101-H0105, 5 terneros M0101-M0105
        terneras = []
        for i in range(5):
            t = mk(f"H{101 + i:04d}", f"Ternera-{101 + i}", "HEMBRA", 60 + i * 10,
                   "Ternera", raza_keys[i % 10],
                   "NACIDO_FINCA", "ACTIVO", "DOBLE_PROPOSITO",
                   random.randint(50, 140),
                   padre=toros[i % 5], madre=vacas[i])
            terneras.append(t)

        terneros = []
        for i in range(5):
            t = mk(f"M{101 + i:04d}", f"Ternero-{101 + i}", "MACHO", 50 + i * 10,
                   "Ternero", raza_keys[i % 10],
                   "NACIDO_FINCA", "ACTIVO", "CARNE",
                   random.randint(45, 150),
                   padre=toros[i % 5], madre=vacas[5 + i])
            terneros.append(t)

        # E) 3 comprados
        comprado1 = mk("H0201","Comprada-1","HEMBRA",900,"Vaca",      "Simmental","COMPRADO","ACTIVO","DOBLE_PROPOSITO",420,color="Amarillo")
        comprado2 = mk("H0202","Comprada-2","HEMBRA",800,"Vaquillona","Brahman",  "COMPRADO","ACTIVO","CARNE",          290,color="Gris")
        comprado3 = mk("M0201","Comprado-3","MACHO", 1200,"Novillo",  "Nelore",   "COMPRADO","ACTIVO","CARNE",          380,color="Blanco")
        comprados = [comprado1, comprado2, comprado3]

        # F) 2 vendidos
        vendida1 = mk("H0301","Vendida-1","HEMBRA",1400,"Vaca",  "Brahman","NACIDO_FINCA","VENDIDO","LECHE",420)
        vendido2 = mk("M0301","Vendido-2","MACHO", 900, "Novillo","Nelore", "NACIDO_FINCA","VENDIDO","CARNE",360)

        # G) 2 bajas
        baja1 = mk("H0401","Baja-1","HEMBRA",1800,"Vaca",  "Girolando","NACIDO_FINCA","MUERTO","LECHE",380)
        baja2 = mk("M0401","Baja-2","MACHO", 1200,"Novillo","Brahman",  "NACIDO_FINCA","BAJA",  "CARNE",310)

        activos = toros + vacas + vaquillonas + terneras + terneros + comprados
        todos   = activos + [vendida1, vendido2, baja1, baja2]
        c['animales'] = len(todos)

        # Reproductores
        reprod_def = [
            ("REP-001","Zeus",                   "INTERNO", razas["Brahman"]),
            ("REP-002","Hércules",               "INTERNO", razas["Nelore"]),
            ("REP-003","Semen Girolando AX-2026","SEMEN",   razas["Girolando"]),
            ("REP-004","Semen Holando HL-2026",  "SEMEN",   razas["Holando Argentino"]),
            ("REP-005","Toro externo Nelore",    "EXTERNO", razas["Nelore"]),
        ]
        reprod = {}
        for codigo, nombre, tipo, raza in reprod_def:
            r, _ = Reproductor.objects.get_or_create(
                finca=finca, codigo=codigo,
                defaults={"nombre": nombre, "tipo_origen": tipo, "raza": raza, "activo": True},
            )
            reprod[codigo] = r
        c['reproductores'] = len(reprod_def)

        # ── 7. MOVIMIENTOS DE PARCELA ────────────────────────────────────────
        occ = [parcelas["Potrero 1"], parcelas["Potrero 2"],
               parcelas["Potrero 5"], parcelas["Potrero 8"]]
        mov = 0

        # Histórico: primeros 15 activos estuvieron en Potrero 4
        for animal in activos[:15]:
            if not AnimalParcela.objects.filter(animal=animal, parcela=parcelas["Potrero 4"]).exists():
                AnimalParcela.objects.create(
                    animal=animal, parcela=parcelas["Potrero 4"],
                    fecha_ingreso=ago(180), fecha_salida=ago(90),
                )
                mov += 1

        # Parcela actual para todos los activos
        for i, animal in enumerate(activos):
            if not AnimalParcela.objects.filter(animal=animal, fecha_salida__isnull=True).exists():
                AnimalParcela.objects.create(
                    animal=animal, parcela=occ[i % 4],
                    fecha_ingreso=ago(60), fecha_salida=None,
                )
                mov += 1

        c['movimientos'] = mov

        # ── 8. REPRODUCCIÓN ──────────────────────────────────────────────────
        insem_resultados = [
            "PENDIENTE","PENDIENTE","PRENADA","PRENADA",
            "PRENADA","PRENADA","VACIA","VACIA",
            "REPETIR","REPETIR","PRENADA","PENDIENTE",
        ]
        insem_reprod_codes = [
            "REP-001","REP-002","REP-003","REP-004",
            "REP-005","REP-001","REP-002","REP-003",
            "REP-004","REP-005","REP-001","REP-002",
        ]
        insems = []
        for i, hembra in enumerate(vacas[:12]):
            ins, _ = InseminacionArtificial.objects.get_or_create(
                finca=finca,
                hembra=hembra,
                fecha=ago(280 - i * 10),
                defaults={
                    "reproductor": reprod[insem_reprod_codes[i]],
                    "numero_servicio": 1,
                    "resultado": insem_resultados[i],
                    "tecnico_inseminador": "Técnico Demo",
                    "fecha_probable_parto": ago(280 - i * 10) + timedelta(days=283),
                    "observaciones": f"Inseminación #{i + 1}",
                },
            )
            insems.append(ins)
        c['inseminaciones'] = len(insems)

        # Diagnósticos de preñez para las PRENADA
        prenadas = [(ins, vacas[i]) for i, ins in enumerate(insems) if ins.resultado == "PRENADA"]
        diag_defs = [
            ("POSITIVO","Ecografía",  45),
            ("POSITIVO","Ecografía",  60),
            ("POSITIVO","Palpación",  75),
            ("NEGATIVO","Ecografía",  30),
            ("DUDOSO",  "Palpación",  40),
            ("POSITIVO","Ecografía",  90),
        ]
        diag_count = 0
        for i, ((ins, hembra), (res_prenez, metodo, dias)) in enumerate(zip(prenadas[:6], diag_defs)):
            DiagnosticoPrenez.objects.get_or_create(
                finca=finca,
                hembra=hembra,
                fecha=ins.fecha + timedelta(days=45),
                defaults={
                    "resultado": "PENDIENTE",
                    "resultado_prenez": res_prenez,
                    "metodo": metodo,
                    "dias_gestacion": dias,
                    "veterinario": vets[i % 3],
                    "fecha_confirmacion": ins.fecha + timedelta(days=45),
                    "observaciones": f"Diagnóstico #{i + 1}",
                },
            )
            diag_count += 1
        c['diagnosticos'] = diag_count

        # Partos
        partos_defs = [
            ("NORMAL",   1, 120, toros[0], [("HEMBRA","Ternera")]),
            ("NORMAL",   1, 100, toros[1], [("HEMBRA","Ternera")]),
            ("MULTIPLE", 2,  90, toros[2], [("MACHO","Ternero"),("HEMBRA","Ternera")]),
            ("NORMAL",   1,  80, toros[3], [("HEMBRA","Ternera")]),
            ("ABORTO",   0,  70, None,     []),
            ("NORMAL",   1,  60, toros[0], [("MACHO","Ternero")]),
        ]
        parto_count = 0
        cria_count  = 0
        repros_con_parto = []

        for i, (tipo, num_c, dias_p, padre_toro, crias_defs) in enumerate(partos_defs):
            madre = vacas[i]
            ins   = insems[i] if i < len(insems) else None
            fecha_parto = ago(dias_p)

            repro, created = Reproduccion.objects.get_or_create(
                finca=finca,
                madre=madre,
                fecha_parto_real=fecha_parto,
                defaults={
                    "padre": padre_toro,
                    "inseminacion": ins,
                    "tipo_parto": tipo,
                    "num_crias": num_c,
                    "estado": "ABORTO" if tipo == "ABORTO" else "PARIDA",
                    "fecha_servicio": fecha_parto - timedelta(days=283),
                    "fecha_parto_esperado": fecha_parto + timedelta(days=5),
                    "observaciones": f"Parto demo #{i + 1}",
                    "registrado_por": usuario,
                },
            )
            parto_count += 1

            if created and tipo != "ABORTO":
                for j, (sexo_c, cat_key) in enumerate(crias_defs):
                    arete_c = f"C{i + 1:02d}{j + 1:02d}"
                    cat_c = "Ternera" if sexo_c == "HEMBRA" else "Ternero"
                    cria, _ = Animal.objects.get_or_create(
                        nro_arete=arete_c,
                        defaults={
                            "finca": finca,
                            "nombre": f"Cría {arete_c}",
                            "sexo": sexo_c,
                            "fecha_nacimiento": fecha_parto,
                            "categoria": cats[cat_c],
                            "raza": madre.raza,
                            "origen": "NACIDO_FINCA",
                            "estado": "ACTIVO",
                            "tipo_produccion": "DOBLE_PROPOSITO",
                            "peso": random.randint(28, 45),
                            "madre": madre,
                            "padre": padre_toro,
                        },
                    )
                    repro.crias.add(cria)
                    cria_count += 1
                    activos.append(cria)

            if tipo != "ABORTO":
                repros_con_parto.append((repro, madre))

        c['partos'] = parto_count
        c['crias']  = cria_count

        # ── 9. PRODUCCIÓN ────────────────────────────────────────────────────
        lact_count  = 0
        leche_count = 0
        peso_count  = 0

        lactancias_map = {}
        for repro, madre in repros_con_parto:
            # Buscar por reproduccion para evitar duplicar en cada ejecución
            lact = Lactancia.objects.filter(finca=finca, vaca=madre, reproduccion=repro).first()
            if not lact:
                last = Lactancia.objects.filter(vaca=madre).order_by('-numero_lactancia').first()
                numero = (last.numero_lactancia + 1) if last else 1
                lact = Lactancia.objects.create(
                    finca=finca,
                    vaca=madre,
                    reproduccion=repro,
                    numero_lactancia=numero,
                    fecha_inicio=repro.fecha_parto_real,
                    estado="ACTIVA",
                )
                lact_count += 1
            lactancias_map[madre.pk] = lact

        # Producción de leche: 5 fechas × 2 turnos por vaca
        for madre_pk, lact in lactancias_map.items():
            vaca = lact.vaca
            for offset in range(5):
                fecha_prod = lact.fecha_inicio + timedelta(days=offset * 10)
                for turno in ["MANIANA", "TARDE"]:
                    if not ProduccionLeche.objects.filter(vaca=vaca, fecha=fecha_prod, turno=turno).exists():
                        ProduccionLeche.objects.create(
                            finca=finca,
                            vaca=vaca,
                            lactancia=lact,
                            fecha=fecha_prod,
                            turno=turno,
                            litros=round(random.uniform(4, 14), 1),
                            dias_en_lactancia=offset * 10,
                            registrado_por=usuario,
                        )
                        leche_count += 1

        # Registros de peso: 2 pesajes para los primeros 40 activos (fechas deterministas)
        for idx, animal in enumerate(activos[:40]):
            for w in range(2):
                fecha_pesaje = TODAY - timedelta(days=w * 30 + (idx % 5))
                if not RegistroPeso.objects.filter(animal=animal, fecha_pesaje=fecha_pesaje).exists():
                    RegistroPeso.objects.create(
                        finca=finca,
                        animal=animal,
                        fecha_pesaje=fecha_pesaje,
                        peso_kg=Decimal(str(round(float(animal.peso) * random.uniform(0.95, 1.05), 2))),
                        registrado_por=usuario,
                    )
                    peso_count += 1

        c['lactancias']       = lact_count
        c['producciones_leche'] = leche_count
        c['pesos']            = peso_count

        # ── 10. SANIDAD ──────────────────────────────────────────────────────
        vac_list = list(vacunas.values())
        vac_count = 0
        for i, animal in enumerate(activos[:25]):
            vacuna = vac_list[i % len(vac_list)]
            fecha_aplic = ago(30 + i * 7)  # fecha determinista
            if not Vacunacion.objects.filter(animal=animal, vacuna=vacuna, fecha_aplicacion=fecha_aplic).exists():
                Vacunacion.objects.create(
                    finca=finca,
                    animal=animal,
                    vacuna=vacuna,
                    fecha_aplicacion=fecha_aplic,
                    fecha_proxima=fecha_aplic + timedelta(days=vacuna.intervalo_dias),
                    veterinario=vets[i % 3],
                    dosis_aplicada=vacuna.dosis_recomendada,
                    via_aplicacion=vacuna.via_aplicacion,
                    campana="Campaña Demo 2026",
                    registrado_por=usuario,
                )
                vac_count += 1
        c['vacunaciones'] = vac_count

        med_list = list(meds.values())
        trat_count = 0
        for i in range(12):
            animal = activos[i]
            med    = med_list[i % len(med_list)]
            vet    = vets[i % 3]
            fecha_ini = ago(10 + i * 6)  # fecha determinista
            en_trat   = i < 6
            trat, trat_created = Tratamiento.objects.get_or_create(
                finca=finca,
                animal=animal,
                fecha=fecha_ini,
                defaults={
                    "diagnostico": f"Diagnóstico demo #{i + 1}",
                    "tipo": "Tratamiento general",
                    "medicamento": med,
                    "veterinario": vet,
                    "dosis": "5 ml",
                    "via_aplicacion": "INTRAMUSCULAR",
                    "fecha_inicio": fecha_ini,
                    "fecha_fin": None if en_trat else fecha_ini + timedelta(days=7),
                    "en_tratamiento": en_trat,
                    "costo": round(random.uniform(50, 300), 2),
                    "observaciones": f"Observación {i + 1}",
                    "registrado_por": usuario,
                },
            )
            if trat_created:
                trat_count += 1
        c['tratamientos'] = trat_count

        # Desparasitaciones (5)
        desp_count = 0
        for i in range(5):
            animal = activos[25 + i]
            med    = meds.get("Desparasitante oral") or med_list[0]
            fecha_d = ago(45 + i * 15)  # fecha determinista
            if not Desparasitacion.objects.filter(finca=finca, animal=animal, fecha=fecha_d).exists():
                Desparasitacion.objects.create(
                    finca=finca,
                    animal=animal,
                    medicamento=med,
                    veterinario=vets[i % 3],
                    fecha=fecha_d,
                    tipo_parasiticida="Antiparasitario",
                    producto="Desparasitante oral demo",
                    dosis="10 ml",
                    peso_aplicacion=float(animal.peso),
                    proxima_fecha=fecha_d + timedelta(days=90),
                    registrado_por=usuario,
                )
                desp_count += 1

        # ── 11. COMERCIO ─────────────────────────────────────────────────────
        clientes_def = [
            ("Ganadera del Norte",    "77111000"),
            ("Frigorífico Santa Cruz","77222000"),
            ("Productor Local",       "77333000"),
        ]
        clientes = []
        for nombre, tel in clientes_def:
            cl, _ = Cliente.objects.get_or_create(
                finca=finca, nombre=nombre,
                defaults={"telefono": tel},
            )
            clientes.append(cl)
        c['clientes'] = len(clientes_def)

        # Bajas (MuerteBaja)
        for animal, tipo_baja, causa in [
            (vendida1, "OTRO",     "Vendido al mercado"),
            (vendido2, "OTRO",     "Vendido al mercado"),
            (baja1,    "MUERTE",   "Muerte natural"),
            (baja2,    "DESCARTE", "Descarte por enfermedad"),
        ]:
            if not MuerteBaja.objects.filter(animal=animal).exists():
                MuerteBaja.objects.create(
                    finca=finca,
                    animal=animal,
                    fecha_baja=ago(random.randint(30, 60)),
                    causa=causa,
                    tipo=tipo_baja,
                    peso_estimado_kg=float(animal.peso),
                    registrado_por=usuario,
                )

        # Ventas
        ventas_def = [
            ("GS-DEMO-001", vendida1, clientes[0]),
            ("GS-DEMO-002", vendido2, clientes[1]),
            ("GS-DEMO-003", comprado3, clientes[2]),
        ]
        venta_count = 0
        for guia, animal, cliente in ventas_def:
            if not NotaVenta.objects.filter(finca=finca, guia_salida=guia).exists():
                precio   = round(random.uniform(3000, 8000), 2)
                peso_v   = float(animal.peso)
                subtotal = round(precio * peso_v / 100, 2)
                venta = NotaVenta.objects.create(
                    finca=finca, cliente=cliente,
                    fecha_venta=ago(random.randint(15, 50)),
                    guia_salida=guia,
                    monto_total=subtotal,
                    registrado_por=usuario,
                )
                DetalleVenta.objects.create(
                    nota_venta=venta, animal=animal,
                    precio_unitario=precio,
                    peso_venta_kg=peso_v,
                    sub_total=subtotal,
                )
                venta_count += 1
        c['ventas'] = venta_count

        # ── 12. COMPRAS ──────────────────────────────────────────────────────
        provs_def = [
            ("AgroVeterinaria Bolivia","70100001"),
            ("Insumos Ganaderos SRL", "70100002"),
            ("NutriCampo",            "70100003"),
        ]
        provs = []
        for nombre, tel in provs_def:
            p, _ = Proveedor.objects.get_or_create(
                finca=finca, nombre=nombre,
                defaults={"telefono": tel, "estado": True},
            )
            provs.append(p)
        c['proveedores'] = len(provs_def)

        compra_count = 0
        for i in range(3):
            ref = f"NC-MED-{i + 1:03d}"
            if not NotaCompra.objects.filter(finca=finca, observaciones__startswith=ref).exists():
                cant     = random.randint(10, 50)
                precio_u = round(random.uniform(50, 200), 2)
                subtotal = round(cant * precio_u, 2)
                nc = NotaCompra.objects.create(
                    finca=finca, proveedor=provs[i % 3],
                    tipo_compra="MEDICAMENTO",
                    fecha_compra=ago(random.randint(10, 60)),
                    monto_total=subtotal,
                    observaciones=f"{ref} Compra medicamentos demo",
                    registrado_por=usuario,
                )
                DetalleCompra.objects.create(
                    nota_compra=nc,
                    medicamento=med_list[i % len(med_list)],
                    precio_unitario=precio_u,
                    cantidad=cant,
                    sub_total=subtotal,
                )
                compra_count += 1

        alim_list = list(alims.values())
        for i in range(3):
            ref = f"NC-ALI-{i + 1:03d}"
            if not NotaCompra.objects.filter(finca=finca, observaciones__startswith=ref).exists():
                cant     = random.randint(100, 500)
                precio_u = round(random.uniform(5, 30), 2)
                subtotal = round(cant * precio_u, 2)
                nc = NotaCompra.objects.create(
                    finca=finca, proveedor=provs[i % 3],
                    tipo_compra="ALIMENTO",
                    fecha_compra=ago(random.randint(10, 60)),
                    monto_total=subtotal,
                    observaciones=f"{ref} Compra alimentos demo",
                    registrado_por=usuario,
                )
                DetalleCompraAlimento.objects.create(
                    nota_compra=nc,
                    alimento=alim_list[i % len(alim_list)],
                    precio_unitario=precio_u,
                    cantidad=cant,
                    sub_total=subtotal,
                )
                compra_count += 1
        c['compras'] = compra_count

        # ── 13. ALERTAS ──────────────────────────────────────────────────────
        alertas_def = [
            ("VACUNA_PROXIMA",         "Vacuna Aftosa próxima para lote",       activos[0],  15,  False),
            ("VACUNA_PROXIMA",         "Vacuna Triple bovina vence en 7 días",  activos[1],   7,  False),
            ("VACUNA_VENCIDA",         "Vacuna Brucelosis vencida",             activos[2],  -5,  False),
            ("VACUNA_VENCIDA",         "Vacuna Leptospirosis vencida",          activos[3], -10,  True),
            ("PARTO_PROXIMO",          "Parto esperado en 20 días",             vacas[0],    20,  False),
            ("PARTO_PROXIMO",          "Parto esperado en 10 días",             vacas[1],    10,  False),
            ("STOCK_BAJO_MEDICAMENTO", "Stock bajo: Ivermectina",               None,         0,  False),
            ("STOCK_BAJO_MEDICAMENTO", "Stock bajo: Calcio inyectable",         None,         0,  True),
            ("STOCK_BAJO_ALIMENTO",    "Stock bajo: Heno",                      None,         0,  False),
            ("PESAJE_PENDIENTE",       "Pesaje pendiente para terneros",        activos[10],  0,  False),
            ("PESAJE_PENDIENTE",       "Pesaje mensual pendiente",              activos[11],  0,  True),
            ("OTRO",                   "Revisión general de instalaciones",     None,        30,  False),
        ]
        alerta_count = 0
        for tipo, mensaje, animal, dias, leida in alertas_def:
            if not Alerta.objects.filter(finca=finca, tipo=tipo, mensaje=mensaje).exists():
                Alerta.objects.create(
                    finca=finca, tipo=tipo, mensaje=mensaje, animal=animal,
                    fecha_alerta=TODAY + timedelta(days=dias),
                    dias_restantes=dias, leida=leida,
                )
                alerta_count += 1
        c['alertas'] = alerta_count

        # ── 14. RRHH ─────────────────────────────────────────────────────────
        tipos_emp_def = [
            ("Administrador",        5000),
            ("Vaquero",              2000),
            ("Veterinario",          4000),
            ("Encargado de ordeño",  2500),
            ("Encargado de compras", 3000),
        ]
        tipos_emp = {}
        for nombre, salario in tipos_emp_def:
            te, _ = TipoEmpleado.objects.get_or_create(
                nombre=nombre, defaults={"salario_base": salario, "activo": True},
            )
            tipos_emp[nombre] = te

        emps_def = [
            ("Juan",   "Pérez",  "7000001", "MASCULINO", "Vaquero",              2200),
            ("Carlos", "Rojas",  "7000002", "MASCULINO", "Administrador",        5500),
            ("Laura",  "Méndez", "7000003", "FEMENINO",  "Veterinario",          4200),
            ("Pedro",  "Vargas", "7000004", "MASCULINO", "Encargado de ordeño",  2600),
            ("Ana",    "Flores", "7000005", "FEMENINO",  "Encargado de compras", 3100),
        ]
        emp_count = 0
        for nombre, apellidos, ci, sexo, tipo_key, salario in emps_def:
            emp, emp_created = Empleado.objects.get_or_create(
                ci=ci,
                defaults={
                    "finca": finca,
                    "tipo": tipos_emp[tipo_key],
                    "nombre": nombre,
                    "apellidos": apellidos,
                    "sexo": sexo,
                    "fecha_ingreso": ago(365),
                    "salario": salario,
                    "estado": "ACTIVO",
                },
            )
            if emp_created:
                emp_count += 1
        c['empleados'] = emp_count

        # ── RESUMEN ───────────────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS("\nSeed completado correctamente.\n"))
        self.stdout.write("Resumen:")
        resumen = [
            ("Finca creada",                 c.get('finca', 1)),
            ("Usuarios creados",             c.get('usuarios', 0)),
            ("Roles creados",                c.get('roles', 0)),
            ("Razas creadas",                c.get('razas', 0)),
            ("Categorías creadas",           c.get('categorias', 0)),
            ("Vacunas creadas",              c.get('vacunas', 0)),
            ("Medicamentos creados",         c.get('medicamentos', 0)),
            ("Alimentos creados",            c.get('alimentos', 0)),
            ("Parcelas creadas",             c.get('parcelas', 0)),
            ("Animales procesados",          c.get('animales', 0)),
            ("Movimientos de parcela",       c.get('movimientos', 0)),
            ("Inseminaciones creadas",       c.get('inseminaciones', 0)),
            ("Diagnósticos creados",         c.get('diagnosticos', 0)),
            ("Partos creados",               c.get('partos', 0)),
            ("Crías creadas",                c.get('crias', 0)),
            ("Lactancias creadas",           c.get('lactancias', 0)),
            ("Producciones de leche",        c.get('producciones_leche', 0)),
            ("Registros de peso",            c.get('pesos', 0)),
            ("Vacunaciones creadas",         c.get('vacunaciones', 0)),
            ("Tratamientos creados",         c.get('tratamientos', 0)),
            ("Clientes creados",             c.get('clientes', 0)),
            ("Ventas creadas",               c.get('ventas', 0)),
            ("Proveedores creados",          c.get('proveedores', 0)),
            ("Compras creadas",              c.get('compras', 0)),
            ("Alertas creadas",              c.get('alertas', 0)),
            ("Empleados creados",            c.get('empleados', 0)),
        ]
        for label, val in resumen:
            self.stdout.write(f"  - {label}: {val}")

        self.stdout.write(self.style.SUCCESS("\nCredenciales de acceso:"))
        self.stdout.write("  Usuario:    nina")
        self.stdout.write("  Contraseña: admin12345")
