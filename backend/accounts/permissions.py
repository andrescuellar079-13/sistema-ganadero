# backend/accounts/permissions.py
"""
Helpers centrales de control de acceso multi-tenant por finca.

Reutilizados por todos los resolvers GraphQL para garantizar que cada usuario
solo vea / opere sobre las fincas a las que tiene acceso (salvo superadmin).
"""
from graphql import GraphQLError

from fincas.models import Finca


def _is_authenticated(user):
    return bool(user) and getattr(user, "is_authenticated", False)


def fincas_visibles(user):
    """
    QuerySet de fincas a las que el usuario tiene acceso.

    - Superadmin  → todas las fincas.
    - Usuario normal → fincas con acceso activo (UsuarioFinca) ∪ su finca activa.
    - No autenticado → ninguna.
    """
    if not _is_authenticated(user):
        return Finca.objects.none()

    if getattr(user, "es_superadmin", False):
        return Finca.objects.all()

    from django.db.models import Q

    cond = Q(accesos_usuario__usuario=user, accesos_usuario__activo=True)
    if getattr(user, "finca_id", None):
        cond |= Q(id=user.finca_id)
    return Finca.objects.filter(cond).distinct()


def ids_fincas_visibles(user):
    """Lista de IDs de fincas visibles para el usuario."""
    return list(fincas_visibles(user).values_list("id", flat=True))


def ids_para_listado(user):
    """
    IDs de finca para los LISTADOS por defecto (cuando no se indica un finca_id
    explícito).

    Multi-tenant: el usuario trabaja sobre UNA finca a la vez (la finca activa,
    que cambia con el selector). Por eso, si el usuario tiene una finca activa
    válida, los listados se restringen a ELLA; así, al cambiar de finca, los
    datos de cada módulo (vacunas, animales, etc.) cambian de verdad.

    Si no hay finca activa (o no es visible), se devuelven todas las visibles
    como fallback — útil para superadmin sin finca seleccionada.
    """
    visibles = set(ids_fincas_visibles(user))
    fid = getattr(user, "finca_id", None)
    if fid and fid in visibles:
        return [fid]
    return list(visibles)


def scope_ids(user, finca_id=None):
    """
    IDs de fincas sobre las que filtrar un queryset.

    - Si se indica `finca_id` y el usuario tiene acceso → solo esa finca.
    - Si se indica `finca_id` pero el usuario NO tiene acceso → ninguna.
    - Si no se indica `finca_id` → todas las fincas visibles del usuario.
    """
    visibles = set(ids_fincas_visibles(user))
    if finca_id in (None, "", 0):
        return list(visibles)
    fid = int(finca_id)
    return [fid] if fid in visibles else []


def puede_acceder_finca(user, finca_id):
    """True si el usuario puede acceder a la finca indicada."""
    if not _is_authenticated(user) or finca_id in (None, "", 0):
        return False
    if getattr(user, "es_superadmin", False):
        return True
    return int(finca_id) in set(ids_fincas_visibles(user))


def validar_finca(user, finca_id):
    """
    Verifica acceso del usuario a `finca_id`.
    Devuelve la instancia Finca o lanza GraphQLError.
    """
    if not _is_authenticated(user):
        raise GraphQLError("No autenticado.")
    if not puede_acceder_finca(user, finca_id):
        raise GraphQLError("No tiene acceso a esta finca.")
    try:
        return Finca.objects.get(id=finca_id)
    except Finca.DoesNotExist:
        raise GraphQLError("Finca no encontrada.")


def puede_administrar_finca(user, finca_id):
    """
    True si el usuario puede administrar la finca (crear/aceptar transferencias,
    operaciones de escritura). Superadmin siempre; o rol_en_finca administrativo.
    """
    if not _is_authenticated(user) or finca_id in (None, "", 0):
        return False
    if getattr(user, "es_superadmin", False):
        return True

    from accounts.models import UsuarioFinca

    acceso = UsuarioFinca.objects.filter(
        usuario=user, finca_id=finca_id, activo=True
    ).first()
    if acceso and acceso.puede_administrar:
        return True
    # Compatibilidad: la finca activa heredada cuenta como administrable.
    return getattr(user, "finca_id", None) is not None and int(user.finca_id) == int(finca_id)


def validar_admin_finca(user, finca_id, accion="operar sobre esta finca"):
    """Verifica permiso administrativo o lanza GraphQLError."""
    if not _is_authenticated(user):
        raise GraphQLError("No autenticado.")
    if not puede_administrar_finca(user, finca_id):
        raise GraphQLError(f"No tiene permiso para {accion}.")


def usuarios_de_finca(finca_id):
    """
    QuerySet de usuarios activos con acceso a la finca (para notificaciones).
    Incluye los que la tienen como finca activa (compatibilidad).
    """
    from django.db.models import Q
    from accounts.models import Usuario

    return Usuario.objects.filter(
        Q(accesos_finca__finca_id=finca_id, accesos_finca__activo=True)
        | Q(finca_id=finca_id),
        is_active=True,
    ).distinct()
