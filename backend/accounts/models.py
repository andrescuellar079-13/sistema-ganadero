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
        help_text="Finca activa actual del usuario.",
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

    @property
    def es_superadmin(self):
        """Acceso total a todas las fincas (multi-tenant)."""
        if self.is_superuser:
            return True
        if self.rol:
            if 'all' in self.rol.get_permisos_lista():
                return True
            # Defensa: un rol nombrado como superadmin concede acceso global
            # aunque su lista de permisos haya perdido el comodín 'all'.
            nombre = (self.rol.nombre or '').strip().lower().replace(' ', '_')
            if nombre in ('super_admin', 'superadmin'):
                return True
        return False

    def fincas_ids(self):
        """IDs de fincas a las que el usuario tiene acceso (helper central)."""
        from accounts.permissions import ids_fincas_visibles
        return ids_fincas_visibles(self)

    def __str__(self):
        return self.username


class UsuarioFinca(models.Model):
    """Relación N:M Usuario↔Finca con rol específico por finca (multi-tenant)."""

    ROL_CHOICES = [
        ("PROPIETARIO",   "Propietario"),
        ("ADMINISTRADOR", "Administrador"),
        ("ENCARGADO",     "Encargado"),
        ("VETERINARIO",   "Veterinario"),
        ("LECTURA",       "Solo lectura"),
    ]

    # Roles que pueden administrar la finca (crear/aceptar transferencias, etc.)
    ROLES_ADMIN = {"PROPIETARIO", "ADMINISTRADOR", "ENCARGADO"}

    usuario = models.ForeignKey(
        "accounts.Usuario",
        on_delete=models.CASCADE,
        related_name="accesos_finca",
    )
    finca = models.ForeignKey(
        Finca,
        on_delete=models.CASCADE,
        related_name="accesos_usuario",
    )
    rol_en_finca = models.CharField(
        max_length=15, choices=ROL_CHOICES, default="ENCARGADO"
    )
    activo = models.BooleanField(default=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Acceso usuario-finca"
        verbose_name_plural = "Accesos usuario-finca"
        unique_together = [["usuario", "finca"]]
        indexes = [
            models.Index(fields=["usuario", "activo"], name="uf_usuario_activo_idx"),
            models.Index(fields=["finca", "activo"], name="uf_finca_activo_idx"),
        ]

    def __str__(self):
        return f"{self.usuario} → {self.finca} ({self.rol_en_finca})"

    @property
    def puede_administrar(self):
        return self.rol_en_finca in self.ROLES_ADMIN
