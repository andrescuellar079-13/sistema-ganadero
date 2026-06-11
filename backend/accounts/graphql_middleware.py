# backend/accounts/graphql_middleware.py
"""
Middleware GraphQL de aislamiento multi-tenant.

Para CUALQUIER campo (query o mutation) que reciba un argumento `finca_id`,
valida que el usuario autenticado tenga acceso a esa finca antes de ejecutar
el resolver. Esto garantiza que ningún usuario pueda leer/operar sobre una
finca que no tiene asignada (salvo superadmin), sin tener que repetir la
validación en cada resolver.

Las consultas que NO reciben `finca_id` (o lo reciben vacío) no se ven
afectadas; esos resolvers aplican su propio filtro por `fincas_visibles`.
"""
from .permissions import puede_acceder_finca, _is_authenticated

# Campos exentos: gestionan accesos y validan internamente / requieren
# semántica especial (p. ej. asignar acceso a otra finca lo hace superadmin).
CAMPOS_EXENTOS = set()


class FincaScopeMiddleware:
    def resolve(self, next, root, info, **args):
        # Solo evaluamos los campos de nivel superior que declaran finca_id.
        if root is None and "finca_id" in args:
            finca_id = args.get("finca_id")
            field_name = info.field_name
            if finca_id and field_name not in CAMPOS_EXENTOS:
                user = getattr(info.context, "user", None)
                from graphql import GraphQLError
                # Distinguir "sesión inválida/expirada" de "sin acceso a la
                # finca": si no está autenticado, devolver un error de auth
                # que el frontend reconoce para cerrar sesión y redirigir al
                # login (de lo contrario el mensaje de acceso enmascara un
                # token expirado y el usuario queda atascado sin datos).
                if not _is_authenticated(user):
                    raise GraphQLError("No autenticado.")
                if not puede_acceder_finca(user, finca_id):
                    raise GraphQLError("No tiene acceso a esta finca.")
        return next(root, info, **args)
