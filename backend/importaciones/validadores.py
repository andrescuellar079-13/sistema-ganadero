"""Validación de las hojas de importación.

``validar(datos, contexto, modo)`` recibe la estructura normalizada del lector
y el contexto de BD, y devuelve::

    {
      "hojas": {
        "<HOJA>": {
          "filas_validas": [{"numero_fila": int, "datos": {...}}, ...],
          "resumen": {"total", "validas", "errores", ...},
        }, ...
      },
      "errores": [ {hoja, numero_fila, campo, valor, codigo_error, mensaje,
                    nro_arete}, ... ],
    }

No toca la base de datos: solo lee del contexto ya construido. La escritura es
responsabilidad de ``importador.py``.
"""
from . import constantes
from . import normalizacion as norm

A = constantes.HOJA_ANIMALES
P = constantes.HOJA_PARCELAS
PE = constantes.HOJA_PESOS


# --------------------------------------------------------------------------- #
# Normalización por celda
# --------------------------------------------------------------------------- #
def _normalizar_valor(col, raw):
    tipo = col["tipo"]
    if tipo == constantes.TIPO_CHOICE:
        v, err = norm.normalizar_texto(raw)
        if v is not None:
            v = v.upper().replace(" ", "_")
        return v, err
    if tipo == constantes.TIPO_DECIMAL:
        return norm.normalizar_decimal(raw)
    if tipo == constantes.TIPO_ENTERO:
        return norm.normalizar_entero(raw)
    if tipo == constantes.TIPO_FECHA:
        return norm.normalizar_fecha(raw)
    return norm.normalizar_texto(raw)


_MENSAJES = {
    "REQUERIDO": "El campo '{campo}' es obligatorio.",
    "FECHA_INVALIDA": "Fecha inválida en '{campo}': '{valor}'.",
    "DECIMAL_INVALIDO": "Número decimal inválido en '{campo}': '{valor}'.",
    "ENTERO_INVALIDO": "Número entero inválido en '{campo}': '{valor}'.",
    "VALOR_NEGATIVO": "El valor de '{campo}' no puede ser negativo: '{valor}'.",
    "CHOICE_INVALIDO": "Valor no permitido en '{campo}': '{valor}'.",
}


def _msg(codigo, campo, valor):
    plantilla = _MENSAJES.get(codigo, "Error en '{campo}'.")
    return plantilla.format(campo=campo, valor=valor)


def _normalizar_fila(hoja, valores):
    """Normaliza/valida una fila. Devuelve (datos, errores_celda).

    ``datos['_provistos']`` lista las columnas con valor real en el archivo
    (sin contar defaults), para que ACTUALIZAR_EXISTENTES no sobrescriba datos
    con valores por defecto.
    """
    datos = {}
    provistos = set()
    errores = []
    for col in constantes.columnas(hoja):
        key = col["key"]
        raw = valores.get(key)
        valor, err = _normalizar_valor(col, raw)

        if err:
            errores.append((key, raw, err, _msg(err, col["header"], raw)))
            datos[key] = None
            continue

        if valor is None:
            if col["requerido"]:
                errores.append(
                    (key, raw, "REQUERIDO", _msg("REQUERIDO", col["header"], raw))
                )
            datos[key] = col["default"]
            continue

        provistos.add(key)

        if col["tipo"] == constantes.TIPO_CHOICE and valor not in col["choices"]:
            errores.append(
                (key, raw, "CHOICE_INVALIDO", _msg("CHOICE_INVALIDO", col["header"], valor))
            )
        if col.get("min_valor") is not None and valor is not None:
            try:
                if valor < col["min_valor"]:
                    errores.append(
                        (key, raw, "VALOR_NEGATIVO",
                         _msg("VALOR_NEGATIVO", col["header"], valor))
                    )
            except TypeError:
                pass

        datos[key] = valor
    datos["_provistos"] = provistos
    return datos, errores


# --------------------------------------------------------------------------- #
# Validación a nivel de hoja
# --------------------------------------------------------------------------- #
def _headers_faltantes(hoja, info):
    presentes = info["headers"]
    faltan = [
        c for c in constantes.columnas_requeridas(hoja)
        if c["key"] not in presentes
    ]
    return faltan


def _err(hoja, numero_fila, campo, valor, codigo, mensaje, nro_arete=None):
    return {
        "hoja": hoja,
        "numero_fila": numero_fila,
        "campo": campo,
        "valor": None if valor is None else str(valor),
        "codigo_error": codigo,
        "mensaje": mensaje,
        "nro_arete": nro_arete,
    }


def validar(datos, contexto, modo, opciones=None):
    opciones = opciones or constantes.Opciones()
    errores = []
    hojas_resultado = {}
    # Catálogos referenciados que NO existen aún. Clave = nombre normalizado,
    # valor = nombre original (primero visto), para crearlos sin duplicar.
    nuevos = {"razas": {}, "categorias": {}, "parcelas": {}}

    # Nombres de parcela disponibles = existentes en BD + las del archivo.
    parcelas_archivo = set()
    if P in datos:
        for fila in datos[P]["filas"]:
            v, _ = norm.normalizar_texto(fila["valores"].get("nombre"))
            if v:
                parcelas_archivo.add(v.strip().lower())
    parcelas_disponibles = set(contexto.parcelas.keys()) | parcelas_archivo

    # Aretes presentes en la hoja ANIMALES (con su sexo) para resolver
    # padre/madre y validar pesos aunque el animal venga en el mismo archivo.
    animales_archivo = {}   # arete -> sexo
    if A in datos:
        for fila in datos[A]["filas"]:
            arete, _ = norm.normalizar_texto(fila["valores"].get("nro_arete"))
            sexo, _ = norm.normalizar_texto(fila["valores"].get("sexo"))
            if arete:
                animales_archivo[arete.strip()] = (sexo or "").strip().upper()

    # --- PARCELAS ---
    if P in datos:
        hojas_resultado[P] = _validar_parcelas(datos[P], errores)

    # --- ANIMALES ---
    if A in datos:
        hojas_resultado[A] = _validar_animales(
            datos[A], contexto, modo, parcelas_disponibles,
            animales_archivo, opciones, nuevos, errores
        )

    # --- PESOS ---
    if PE in datos:
        hojas_resultado[PE] = _validar_pesos(
            datos[PE], contexto, animales_archivo, errores
        )

    catalogos_nuevos = {clave: list(d.values()) for clave, d in nuevos.items()}
    return {
        "hojas": hojas_resultado,
        "errores": errores,
        "catalogos_nuevos": catalogos_nuevos,
    }


def _resumen_base(total):
    return {"total": total, "validas": 0, "errores": 0}


def _validar_parcelas(info, errores):
    resultado = {"filas_validas": [], "resumen": _resumen_base(len(info["filas"]))}
    for falta in _headers_faltantes(P, info):
        errores.append(_err(P, 1, falta["header"], None, "HEADER_FALTANTE",
                            f"Falta la columna obligatoria '{falta['header']}'."))
    if _headers_faltantes(P, info):
        return resultado

    vistos = set()
    for fila in info["filas"]:
        n = fila["numero_fila"]
        fdatos, errs_celda = _normalizar_fila(P, fila["valores"])
        valida = not errs_celda
        for campo, valor, cod, msg in errs_celda:
            errores.append(_err(P, n, campo, valor, cod, msg))

        nombre = (fdatos.get("nombre") or "").strip().lower()
        if nombre and nombre in vistos:
            valida = False
            errores.append(_err(P, n, "nombre", fdatos.get("nombre"),
                                "PARCELA_DUPLICADA_ARCHIVO",
                                "Nombre de parcela repetido en el archivo."))
        elif nombre:
            vistos.add(nombre)

        if valida:
            resultado["filas_validas"].append({"numero_fila": n, "datos": fdatos})
            resultado["resumen"]["validas"] += 1
        else:
            resultado["resumen"]["errores"] += 1
    return resultado


def _registrar_nuevo(nuevos, clave, nombre):
    """Guarda un catálogo nuevo (sin duplicar por nombre normalizado)."""
    nuevos[clave].setdefault(nombre.strip().lower(), nombre.strip())


def _validar_animales(info, contexto, modo, parcelas_disponibles,
                      animales_archivo, opciones, nuevos, errores):
    resumen = _resumen_base(len(info["filas"]))
    resumen.update({"nuevas": 0, "actualizadas": 0, "omitidas": 0})
    resultado = {"filas_validas": [], "resumen": resumen}

    for falta in _headers_faltantes(A, info):
        errores.append(_err(A, 1, falta["header"], None, "HEADER_FALTANTE",
                            f"Falta la columna obligatoria '{falta['header']}'."))
    if _headers_faltantes(A, info):
        return resultado

    # Detectar aretes duplicados dentro del archivo.
    conteo = {}
    for fila in info["filas"]:
        arete, _ = norm.normalizar_texto(fila["valores"].get("nro_arete"))
        if arete:
            conteo[arete.strip()] = conteo.get(arete.strip(), 0) + 1

    for fila in info["filas"]:
        n = fila["numero_fila"]
        fdatos, errs_celda = _normalizar_fila(A, fila["valores"])
        arete = (fdatos.get("nro_arete") or "").strip()
        valida = not errs_celda
        for campo, valor, cod, msg in errs_celda:
            errores.append(_err(A, n, campo, valor, cod, msg, arete))

        # Duplicado dentro del archivo
        if arete and conteo.get(arete, 0) > 1:
            valida = False
            errores.append(_err(A, n, "nro_arete", arete, "ARETE_DUPLICADO_ARCHIVO",
                                "El nro_arete está repetido en el archivo.", arete))

        # Catálogos: raza / categoría / parcela. SIEMPRE se registran como
        # "nuevos" cuando no existen (para mostrarlos en la previsualización);
        # solo se marca error si la creación automática está desactivada.
        if fdatos.get("raza") and not contexto.raza(fdatos["raza"]):
            _registrar_nuevo(nuevos, "razas", fdatos["raza"])
            if not opciones.crear_razas:
                valida = False
                errores.append(_err(A, n, "raza", fdatos["raza"], "RAZA_NO_EXISTE",
                                    f"La raza '{fdatos['raza']}' no existe en el catálogo.", arete))
        if fdatos.get("categoria") and not contexto.categoria(fdatos["categoria"]):
            _registrar_nuevo(nuevos, "categorias", fdatos["categoria"])
            if not opciones.crear_categorias:
                valida = False
                errores.append(_err(A, n, "categoria", fdatos["categoria"], "CATEGORIA_NO_EXISTE",
                                    f"La categoría '{fdatos['categoria']}' no existe.", arete))

        # Parcela actual debe existir (en BD o en la hoja PARCELAS), salvo que
        # se permita crearla automáticamente.
        parcela = fdatos.get("parcela_actual")
        if parcela and parcela.strip().lower() not in parcelas_disponibles:
            _registrar_nuevo(nuevos, "parcelas", parcela)
            if not opciones.crear_parcelas:
                valida = False
                errores.append(_err(A, n, "parcela_actual", parcela, "PARCELA_NO_EXISTE",
                                    f"La parcela '{parcela}' no existe ni viene en la hoja PARCELAS.", arete))

        # Padre / madre
        valida = _validar_progenitor(
            A, n, arete, fdatos, "padre_arete", "MACHO", contexto,
            animales_archivo, errores
        ) and valida
        valida = _validar_progenitor(
            A, n, arete, fdatos, "madre_arete", "HEMBRA", contexto,
            animales_archivo, errores
        ) and valida

        # Modo: decidir crear / actualizar / omitir según existencia
        accion = _resolver_accion(A, n, arete, modo, contexto, errores)
        if accion is None:
            valida = False
        fdatos["_accion"] = accion

        if valida:
            resultado["filas_validas"].append({"numero_fila": n, "datos": fdatos})
            resumen["validas"] += 1
            if accion == "actualizar":
                resumen["actualizadas"] += 1
            elif accion == "crear":
                resumen["nuevas"] += 1
        else:
            resumen["errores"] += 1
    return resultado


def _validar_progenitor(hoja, n, arete, fdatos, campo, sexo_esperado,
                        contexto, animales_archivo, errores):
    ref = fdatos.get(campo)
    if not ref:
        return True
    ref = ref.strip()
    cod_no_existe = "PADRE_NO_EXISTE" if sexo_esperado == "MACHO" else "MADRE_NO_EXISTE"
    cod_sexo = "PADRE_NO_MACHO" if sexo_esperado == "MACHO" else "MADRE_NO_HEMBRA"

    sexo = None
    if ref in animales_archivo:
        sexo = animales_archivo[ref]
    elif ref in contexto.animales_finca:
        sexo = contexto.animales_finca[ref]["sexo"]
    else:
        errores.append(_err(hoja, n, campo, ref, cod_no_existe,
                            f"El {'padre' if sexo_esperado == 'MACHO' else 'madre'} "
                            f"'{ref}' no existe en la finca ni en el archivo.", arete))
        return False

    if sexo != sexo_esperado:
        errores.append(_err(hoja, n, campo, ref, cod_sexo,
                            f"'{ref}' debería ser {sexo_esperado}.", arete))
        return False
    return True


def _resolver_accion(hoja, n, arete, modo, contexto, errores):
    """Devuelve 'crear', 'actualizar' o None (fila inválida/omitida)."""
    if not arete:
        return None
    en_finca = arete in contexto.animales_finca
    en_otra = arete in contexto.aretes_otra_finca

    if modo == constantes.MODO_SOLO_CREAR:
        if en_finca or en_otra:
            errores.append(_err(hoja, n, "nro_arete", arete, "ARETE_DUPLICADO_BD",
                                f"Ya existe un animal con arete '{arete}'.", arete))
            return None
        return "crear"

    if modo == constantes.MODO_ACTUALIZAR:
        if en_finca:
            return "actualizar"
        if en_otra:
            errores.append(_err(hoja, n, "nro_arete", arete, "ARETE_DUPLICADO_BD",
                                f"El arete '{arete}' pertenece a otra finca.", arete))
            return None
        errores.append(_err(hoja, n, "nro_arete", arete, "NO_EXISTE_ACTUALIZAR",
                            f"No existe un animal con arete '{arete}' para actualizar.", arete))
        return None

    # CREAR_O_ACTUALIZAR
    if en_finca:
        return "actualizar"
    if en_otra:
        errores.append(_err(hoja, n, "nro_arete", arete, "ARETE_DUPLICADO_BD",
                            f"El arete '{arete}' pertenece a otra finca.", arete))
        return None
    return "crear"


def _validar_pesos(info, contexto, animales_archivo, errores):
    resultado = {"filas_validas": [], "resumen": _resumen_base(len(info["filas"]))}
    for falta in _headers_faltantes(PE, info):
        errores.append(_err(PE, 1, falta["header"], None, "HEADER_FALTANTE",
                            f"Falta la columna obligatoria '{falta['header']}'."))
    if _headers_faltantes(PE, info):
        return resultado

    for fila in info["filas"]:
        n = fila["numero_fila"]
        fdatos, errs_celda = _normalizar_fila(PE, fila["valores"])
        arete = (fdatos.get("nro_arete") or "").strip()
        valida = not errs_celda
        for campo, valor, cod, msg in errs_celda:
            errores.append(_err(PE, n, campo, valor, cod, msg, arete))

        if arete and arete not in animales_archivo and arete not in contexto.animales_finca:
            valida = False
            errores.append(_err(PE, n, "nro_arete", arete, "ARETE_NO_EXISTE",
                                f"No existe un animal con arete '{arete}'.", arete))

        if valida:
            resultado["filas_validas"].append({"numero_fila": n, "datos": fdatos})
            resultado["resumen"]["validas"] += 1
        else:
            resultado["resumen"]["errores"] += 1
    return resultado
