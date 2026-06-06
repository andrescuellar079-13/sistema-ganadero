# backend/accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from fincas.models import Finca


class Rol(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    permisos = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de claves de permisos asignados al rol",
    )
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.nombre

    def get_permisos_lista(self):
        """Devuelve siempre una lista de strings, independiente del formato guardado."""
        if not self.permisos:
            return []
        if isinstance(self.permisos, list):
            return self.permisos
        if isinstance(self.permisos, dict):
            return [k for k, v in self.permisos.items() if v]
        return []

    def tiene_permiso_rol(self, permiso):
        """
        Verifica si este rol tiene el permiso indicado.
        Soporta:
          - comodín 'all'  → acceso total
          - coincidencia exacta ('animales_ver')
          - coincidencia de módulo ('animales' cubre 'animales_ver', 'animales_crear', …)
        """
        lista = self.get_permisos_lista()
        if 'all' in lista:
            return True
        if permiso in lista:
            return True
        # módulo: 'animales' cubre cualquier 'animales_*'
        modulo = permiso.split('_')[0]
        return modulo in lista


class Usuario(AbstractUser):
    finca = models.ForeignKey(
        Finca,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
    )
    rol = models.ForeignKey(
        Rol,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
    )
    telefono = models.CharField(max_length=30, blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def tiene_permiso(self, permiso):
        if not self.rol:
            return False
        return self.rol.tiene_permiso_rol(permiso)

    @property
    def es_administrador(self):
        if not self.rol:
            return False
        lista = self.rol.get_permisos_lista()
        return 'all' in lista or self.rol.nombre.lower() in ('administrador', 'admin', 'super_admin')

    def __str__(self):
        return self.username
