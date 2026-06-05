import os
import django

# Configurar Django antes de importar cualquier cosa
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import asyncio
from graphql import graphql
from config.schema import schema

async def test():
    query = '''
    mutation {
      tokenAuth(username: "pedro", password: "pedro123") {
        token
      }
    }
    '''
    result = await graphql(schema, query)
    print("Resultado:", result)

if __name__ == "__main__":
    asyncio.run(test())