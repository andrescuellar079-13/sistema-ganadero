export const GRAPHQL_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/graphql/'

// Base del backend (sin /graphql/) para endpoints REST como la importación masiva.
export const API_BASE_URL = GRAPHQL_URL.replace(/\/graphql\/?$/, '')
