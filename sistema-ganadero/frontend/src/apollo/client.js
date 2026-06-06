// frontend/src/apollo/client.js
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { GRAPHQL_URL } from '../utils/constants'

// ---------------------------------------------------------------------------
// Error link — loggea errores y limpia la sesión si el token es inválido
// ---------------------------------------------------------------------------
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, path }) => {
      console.error(`[GraphQL error] Op: ${operation.operationName} | Path: ${path} | ${message}`)

      const esErrorAuth =
        message.toLowerCase().includes('not authenticated') ||
        message.toLowerCase().includes('signature has expired') ||
        message.toLowerCase().includes('invalid token')

      if (esErrorAuth && operation.operationName !== 'TokenAuth') {
        // Token inválido/expirado: limpiar sesión y recargar al login
        console.warn('[Auth] Token inválido o expirado — cerrando sesión')
        localStorage.removeItem('token')
        localStorage.removeItem('fincaId')
        // Pequeño delay para que el stack actual termine antes del reload
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      }
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError.message || networkError}`)
  }
})

// ---------------------------------------------------------------------------
// Auth link — agrega el header Authorization: JWT <token>
// ---------------------------------------------------------------------------
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `JWT ${token}` } : {}),
    },
  }
})

// ---------------------------------------------------------------------------
// HTTP link
// ---------------------------------------------------------------------------
const httpLink = createHttpLink({ uri: GRAPHQL_URL })

// ---------------------------------------------------------------------------
// Cliente Apollo
// ---------------------------------------------------------------------------
export const client = new ApolloClient({
  link: from([errorLink, authLink.concat(httpLink)]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { errorPolicy: 'all' },
    mutate: { errorPolicy: 'all' },
  },
})
