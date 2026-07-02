"""Procesamiento (escritura) de una importación ya validada.

Orden crítico (dentro de una única transacción):
  0. Crear catálogos faltantes (razas/categorías) si las opciones lo permiten.
  1. Crear parcelas nuevas (hoja PARCELAS + referenciadas por animales).
  2. Crear animales SIN padre/madre  (bulk_create por lotes).
  3. Actualizar animales existentes   (bulk_update por lotes).
  4. Segunda pasada: resolver padre/madre (ya existen todos los aretes).
  5. Ubicar animales en su parcela actual (1 parcela activa por animal).
  6. Importar pesos (dedup histórico, ganancia diaria, peso del animal).

Usa ``bulk_create``/``bulk_update`` en lotes; NO usa ``ignore_conflicts``.
La atomicidad la garantiza el llamador con ``transaction.atomic``.
"""
from datetime import date
from decimal import Decimal

from django.db import transaction

from . import constantes

LOTE = 500  # tamaño de lote para bulk_create/bulk_update

# Campos de Animal que la importación puede setear.
_CAMPOS_ANIMAL = [
    "nombre", "sexo", "fecha_nacimiento", "fecha_ingreso", "peso",
    "peso_nacimiento", "estado", "tipo_produccion", "origen", "color",
    "observaciones",
]


def _aplicar_campos(animal, datos, contexto, solo_provistos):
    provistos = datos.get("_provistos", set())
    for campo in _CAMPOS_ANIMAL:
        if solo_provistos and campo not in provistos:
            continue
        if datos.get(campo) is not None:
            setattr(animal, campo, datos[campo])
    # Las FK se resuelven por nombre contra el contexto (ya incluye los
    # catálogos recién creados en la pasada 0).
    if not solo_provistos or "raza" in provistos:
        animal.raza = contexto.raza(datos["raza"]) if datos.get("raza") else None
    if not solo_provistos or "categoria" in provistos:
        animal.categoria = (
            contexto.categoria(datos["categoria"]) if datos.get("categoria") else None
        )


def _crear_catalogos(contexto, nuevos, opciones, contadores):
    """Crea razas/categorías faltantes y las registra en el contexto."""
    from catalogos.models import Raza, CategoriaAnimal

    if opciones.crear_razas:
        faltan = [n for n in nuevos.get("razas", []) if not contexto.raza(n)]
        if faltan:
            Raza.objects.bulk_create([Raza(nombre=n) for n in faltan], batch_size=LOTE)
            for r in Raza.objects.filter(nombre__in=faltan, activo=True):
                contexto.razas[r.nombre.strip().lower()] = r
            contadores["razas_creadas"] = len(faltan)

    if opciones.crear_categorias:
        faltan = [n for n in nuevos.get("categorias", []) if not contexto.categoria(n)]
        if faltan:
            CategoriaAnimal.objects.bulk_create(
                [CategoriaAnimal(nombre=n) for n in faltan], batch_size=LOTE
            )
            for c in CategoriaAnimal.objects.filter(nombre__in=faltan, activo=True):
                contexto.categorias[c.nombre.strip().lower()] = c
            contadores["categorias_creadas"] = len(faltan)


@transaction.atomic
def procesar(finca, usuario, resultado, contexto, modo, opciones=None):
    """Escribe en BD las filas válidas. Devuelve un dict de contadores."""
    from animales.models import Animal, Parcela, AnimalParcela
    from produccion.models import RegistroPeso

    opciones = opciones or constantes.Opciones()
    hojas = resultado["hojas"]
    nuevos = resultado.get("catalogos_nuevos", {})
    contadores = {
        "creados": 0, "actualizados": 0, "omitidos": 0,
        "parcelas_creadas": 0, "razas_creadas": 0, "categorias_creadas": 0,
        "pesos_creados": 0, "pesos_omitidos": 0,
    }

    # ---- 0. Catálogos faltantes (razas / categorías) ----
    _crear_catalogos(contexto, nuevos, opciones, contadores)

    # ---- 1. Parcelas (hoja PARCELAS + referenciadas por animales) ----
    parcelas_por_nombre = dict(contexto.parcelas)  # nombre_lower -> Parcela
    nuevas, vistos = [], set()

    def _agendar_parcela(nombre, datos=None):
        clave = nombre.strip().lower()
        if clave in parcelas_por_nombre or clave in vistos:
            return
        vistos.add(clave)
        datos = datos or {}
        nuevas.append(Parcela(
            finca=finca,
            nombre=nombre.strip(),
            estado=datos.get("estado") or "ACTIVA",
            tamano=datos.get("tamano") or 0,
            capacidad_maxima=datos.get("capacidad_maxima") or 0,
            tipo_pastura=datos.get("tipo_pastura"),
        ))

    hoja_parcelas = hojas.get(constantes.HOJA_PARCELAS)
    if hoja_parcelas:
        for fila in hoja_parcelas["filas_validas"]:
            d = fila["datos"]
            _agendar_parcela(d["nombre"], d)
    if opciones.crear_parcelas:
        for nombre in nuevos.get("parcelas", []):
            _agendar_parcela(nombre)
    if nuevas:
        Parcela.objects.bulk_create(nuevas, batch_size=LOTE)
        contadores["parcelas_creadas"] = len(nuevas)
        for p in Parcela.objects.filter(finca=finca):
            parcelas_por_nombre[p.nombre.strip().lower()] = p

    # ---- 2 y 3. Animales: crear / actualizar ----
    hoja_animales = hojas.get(constantes.HOJA_ANIMALES)
    animal_por_arete = {}
    filas_animales = hoja_animales["filas_validas"] if hoja_animales else []

    a_crear, a_actualizar_ids = [], []
    if filas_animales:
        ids_existentes = {
            a.nro_arete: a
            for a in Animal.objects.filter(
                finca=finca,
                nro_arete__in=[f["datos"]["nro_arete"] for f in filas_animales],
            )
        }
        for fila in filas_animales:
            d = fila["datos"]
            if d.get("_accion") == "actualizar":
                animal = ids_existentes.get(d["nro_arete"])
                if not animal:
                    contadores["omitidos"] += 1
                    continue
                _aplicar_campos(animal, d, contexto, solo_provistos=True)
                a_actualizar_ids.append((animal, d))
                animal_por_arete[d["nro_arete"]] = animal
            else:
                animal = Animal(finca=finca, nro_arete=d["nro_arete"])
                _aplicar_campos(animal, d, contexto, solo_provistos=False)
                a_crear.append((animal, d))

        if a_crear:
            Animal.objects.bulk_create([a for a, _ in a_crear], batch_size=LOTE)
            contadores["creados"] = len(a_crear)
            # Recuperar ids asignados.
            creados_map = {
                a.nro_arete: a
                for a in Animal.objects.filter(
                    finca=finca, nro_arete__in=[d["nro_arete"] for _, d in a_crear]
                )
            }
            for _, d in a_crear:
                animal_por_arete[d["nro_arete"]] = creados_map[d["nro_arete"]]

        if a_actualizar_ids:
            Animal.objects.bulk_update(
                [a for a, _ in a_actualizar_ids],
                fields=_CAMPOS_ANIMAL + ["raza", "categoria"],
                batch_size=LOTE,
            )
            contadores["actualizados"] = len(a_actualizar_ids)

    # ---- 4. Segunda pasada: padre / madre ----
    con_progenitor = []
    for fila in filas_animales:
        d = fila["datos"]
        animal = animal_por_arete.get(d["nro_arete"])
        if not animal:
            continue
        cambio = False
        padre = _resolver_animal(d.get("padre_arete"), animal_por_arete, contexto)
        madre = _resolver_animal(d.get("madre_arete"), animal_por_arete, contexto)
        if padre and animal.padre_id != padre.id:
            animal.padre = padre
            cambio = True
        if madre and animal.madre_id != madre.id:
            animal.madre = madre
            cambio = True
        if cambio:
            con_progenitor.append(animal)
    if con_progenitor:
        Animal.objects.bulk_update(
            con_progenitor, fields=["padre", "madre"], batch_size=LOTE
        )

    # ---- 5. Ubicación en parcela actual (1 activa por animal) ----
    _ubicar_en_parcelas(filas_animales, animal_por_arete, parcelas_por_nombre,
                        AnimalParcela)

    # ---- 6. Pesos ----
    hoja_pesos = hojas.get(constantes.HOJA_PESOS)
    if hoja_pesos:
        _importar_pesos(
            finca, usuario, hoja_pesos["filas_validas"], animal_por_arete,
            contexto, RegistroPeso, Animal, contadores,
        )

    return contadores


def _resolver_animal(arete, animal_por_arete, contexto):
    if not arete:
        return None
    arete = arete.strip()
    if arete in animal_por_arete:
        return animal_por_arete[arete]
    info = contexto.animales_finca.get(arete)
    if info:
        # Referencia a un animal preexistente no incluido en el archivo.
        from animales.models import Animal
        return Animal.objects.filter(id=info["id"]).first()
    return None


def _ubicar_en_parcelas(filas_animales, animal_por_arete, parcelas_por_nombre,
                        AnimalParcela):
    hoy = date.today()
    for fila in filas_animales:
        d = fila["datos"]
        nombre = d.get("parcela_actual")
        if not nombre:
            continue
        animal = animal_por_arete.get(d["nro_arete"])
        parcela = parcelas_por_nombre.get(nombre.strip().lower())
        if not animal or not parcela:
            continue
        activa = AnimalParcela.objects.filter(
            animal=animal, fecha_salida__isnull=True
        ).first()
        if activa:
            if activa.parcela_id == parcela.id:
                continue  # ya está en la parcela correcta → no duplicar
            activa.fecha_salida = hoy
            activa.save(update_fields=["fecha_salida"])
        fecha_ing = d.get("fecha_ingreso") or hoy
        AnimalParcela.objects.create(
            animal=animal, parcela=parcela, fecha_ingreso=fecha_ing
        )


def _importar_pesos(finca, usuario, filas, animal_por_arete, contexto,
                    RegistroPeso, Animal, contadores):
    # Agrupar pesajes por animal para calcular ganancia diaria y peso final.
    por_animal = {}
    for fila in filas:
        d = fila["datos"]
        animal = animal_por_arete.get(d["nro_arete"].strip())
        if not animal:
            info = contexto.animales_finca.get(d["nro_arete"].strip())
            animal = Animal.objects.filter(id=info["id"]).first() if info else None
        if not animal:
            contadores["pesos_omitidos"] += 1
            continue
        por_animal.setdefault(animal, []).append(d)

    a_crear = []
    for animal, registros in por_animal.items():
        # Fechas ya existentes en BD para no duplicar histórico.
        existentes = set(
            RegistroPeso.objects.filter(animal=animal).values_list(
                "fecha_pesaje", flat=True
            )
        )
        # Pesajes previos (BD) para arrancar el cálculo de ganancia.
        historial = list(
            RegistroPeso.objects.filter(animal=animal)
            .order_by("fecha_pesaje")
            .values_list("fecha_pesaje", "peso_kg")
        )
        registros.sort(key=lambda r: r["fecha_pesaje"])
        vistos_archivo = set()
        for d in registros:
            fecha = d["fecha_pesaje"]
            if fecha in existentes or fecha in vistos_archivo:
                contadores["pesos_omitidos"] += 1
                continue
            vistos_archivo.add(fecha)
            ganancia = _ganancia(historial, fecha, d["peso_kg"])
            historial.append((fecha, d["peso_kg"]))
            historial.sort(key=lambda x: x[0])
            a_crear.append(RegistroPeso(
                finca=finca,
                animal=animal,
                fecha_pesaje=fecha,
                peso_kg=d["peso_kg"],
                condicion_corporal=d.get("condicion_corporal") or 0,
                observacion=d.get("observacion"),
                ganancia_diaria=ganancia,
                registrado_por=usuario,
            ))

    if a_crear:
        RegistroPeso.objects.bulk_create(a_crear, batch_size=LOTE)
        contadores["pesos_creados"] = len(a_crear)

    # Actualizar peso del animal al pesaje más reciente (incluye BD + nuevos).
    for animal in por_animal:
        ultimo = (
            RegistroPeso.objects.filter(animal=animal)
            .order_by("-fecha_pesaje", "-fecha_registro")
            .first()
        )
        if ultimo and animal.peso != ultimo.peso_kg:
            animal.peso = ultimo.peso_kg
            animal.save(update_fields=["peso"])


def _ganancia(historial, fecha, peso):
    """Ganancia diaria respecto del pesaje anterior más cercano (Decimal)."""
    anteriores = [(f, p) for f, p in historial if f < fecha]
    if not anteriores:
        return Decimal("0")
    f_ant, p_ant = max(anteriores, key=lambda x: x[0])
    dias = (fecha - f_ant).days
    if dias <= 0:
        return Decimal("0")
    return (Decimal(peso) - Decimal(p_ant)) / Decimal(dias)
