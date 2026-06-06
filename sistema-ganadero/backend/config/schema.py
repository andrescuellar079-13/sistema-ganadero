# backend/config/schema.py
import graphene

from accounts.schema import Query as AccountsQuery, Mutation as AccountsMutation
from catalogos.schema import Query as CatalogosQuery, Mutation as CatalogosMutation
from animales.schema import Query as AnimalesQuery, Mutation as AnimalesMutation
from sanidad.schema import Query as SanidadQuery, Mutation as SanidadMutation
from fincas.schema import Query as FincasQuery, Mutation as FincasMutation
from comercio.schema import Query as ComercioQuery, Mutation as ComercioMutation
from compras.schema import Query as ComprasQuery, Mutation as ComprasMutation
from produccion.schema import Query as ProduccionQuery, Mutation as ProduccionMutation
from alertas.schema import Query as AlertasQuery, Mutation as AlertasMutation
from reproduccion.schema import Query as ReproduccionQuery, Mutation as ReproduccionMutation
from rrhh.schema import Query as RrhhQuery, Mutation as RrhhMutation


class Query(
    AccountsQuery,
    CatalogosQuery,
    AnimalesQuery,
    SanidadQuery,
    FincasQuery,
    ComercioQuery,
    ComprasQuery,
    ProduccionQuery,
    AlertasQuery,
    ReproduccionQuery,
    RrhhQuery,
    graphene.ObjectType,
):
    health = graphene.String()

    def resolve_health(self, info):
        return "API GraphQL del Sistema Ganadero funcionando"


class Mutation(
    AccountsMutation,      # incluye token_auth, verify_token, refresh_token, logout, etc.
    CatalogosMutation,
    AnimalesMutation,
    SanidadMutation,
    FincasMutation,
    ComercioMutation,
    ComprasMutation,
    ProduccionMutation,
    AlertasMutation,
    ReproduccionMutation,
    RrhhMutation,
    graphene.ObjectType,
):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
