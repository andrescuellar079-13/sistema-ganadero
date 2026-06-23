"""Construcción del contexto de base de datos para validar/importar.

Recolecta de la BD solo lo necesario en pocas consultas (no N+1):
  - razas y categorías por nombre (catálogo global),
  - parcelas existentes de la finca por nombre,
  - animales de la finca referenciados (por arete) con su id y sexo,
  - aretes que ya existen en OTRA finca (conflicto de unicidad global al crear).
"""
from . import constantes


class ContextoImportacion:
    def __init__(self, finca, razas, categorias, parcelas,
                 animales_finca, aretes_otra_finca):
        self.finca = finca
        self.razas = razas                      # nombre_lower -> Raza
        self.categorias = categorias            # nombre_lower -> CategoriaAnimal
        self.parcelas = parcelas                # nombre_lower -> Parcela
        self.animales_finca = animales_finca    # arete -> {"id", "sexo"}
        self.aretes_otra_finca = aretes_otra_finca  # set de aretes

    def raza(self, nombre):
        return self.razas.get((nombre or "").strip().lower())

    def categoria(self, nombre):
        return self.categorias.get((nombre or "").strip().lower())

    def parcela_existente(self, nombre):
        return self.parcelas.get((nombre or "").strip().lower())


def _aretes_referenciados(datos):
    aretes = set()
    hoja_animales = datos.get(constantes.HOJA_ANIMALES)
    if hoja_animales:
        for fila in hoja_animales["filas"]:
            v = fila["valores"]
            for campo in ("nro_arete", "padre_arete", "madre_arete"):
                valor = v.get(campo)
                if valor:
                    aretes.add(str(valor).strip())
    hoja_pesos = datos.get(constantes.HOJA_PESOS)
    if hoja_pesos:
        for fila in hoja_pesos["filas"]:
            valor = fila["valores"].get("nro_arete")
            if valor:
                aretes.add(str(valor).strip())
    return aretes


def construir_contexto(finca, datos):
    from catalogos.models import Raza, CategoriaAnimal
    from animales.models import Animal, Parcela

    razas = {
        r.nombre.strip().lower(): r
        for r in Raza.objects.filter(activo=True)
    }
    categorias = {
        c.nombre.strip().lower(): c
        for c in CategoriaAnimal.objects.filter(activo=True)
    }
    parcelas = {
        p.nombre.strip().lower(): p
        for p in Parcela.objects.filter(finca=finca)
    }

    aretes = _aretes_referenciados(datos)
    animales_finca = {}
    aretes_otra_finca = set()
    if aretes:
        qs = Animal.objects.filter(nro_arete__in=aretes).values(
            "id", "nro_arete", "sexo", "finca_id"
        )
        for row in qs:
            if row["finca_id"] == finca.id:
                animales_finca[row["nro_arete"]] = {
                    "id": row["id"], "sexo": row["sexo"]
                }
            else:
                aretes_otra_finca.add(row["nro_arete"])

    return ContextoImportacion(
        finca=finca,
        razas=razas,
        categorias=categorias,
        parcelas=parcelas,
        animales_finca=animales_finca,
        aretes_otra_finca=aretes_otra_finca,
    )
