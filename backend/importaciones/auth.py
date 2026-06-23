"""Autenticación JWT para las vistas multipart (fuera de GraphQL).

El frontend envía ``Authorization: JWT <token>`` (mismo token que usa Apollo).
Aquí se resuelve el usuario con las utilidades de django-graphql-jwt.
"""
from graphql_jwt.shortcuts import get_user_by_token


class NoAutenticado(Exception):
    pass


def usuario_desde_request(request):
    """Devuelve el Usuario autenticado o lanza ``NoAutenticado``."""
    cabecera = request.META.get("HTTP_AUTHORIZATION", "")
    partes = cabecera.split()
    if len(partes) != 2 or partes[0].upper() != "JWT":
        # Compatibilidad: sesión de Django (admin) también sirve.
        if getattr(request, "user", None) and request.user.is_authenticated:
            return request.user
        raise NoAutenticado("Falta el token de autenticación.")
    try:
        usuario = get_user_by_token(partes[1], request)
    except Exception as exc:  # token inválido / expirado
        raise NoAutenticado("Token inválido o expirado.") from exc
    if not usuario or not usuario.is_authenticated:
        raise NoAutenticado("No autenticado.")
    return usuario
