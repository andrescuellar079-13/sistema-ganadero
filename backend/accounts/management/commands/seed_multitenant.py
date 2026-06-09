"""
Datos de prueba para el escenario multi-tenant por finca (Nina / Pedro).

Crea:
  - Fincas: "Finca Principal" y "Hacienda Pedros".
  - Usuario Nina  -> acceso solo a Finca Principal (PROPIETARIO, no superadmin).
  - Usuario Pedro -> acceso solo a Hacienda Pedros (PROPIETARIO, no superadmin).
  - Usuario superadmin "super" -> ve todas las fincas.
  - Algunos animales en cada finca.

Idempotente: se puede ejecutar varias veces.

    python manage.py seed_multitenant
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Crea el escenario multi-tenant de prueba (Nina / Pedro / superadmin)."

    @transaction.atomic
    def handle(self, *args, **options):
        from fincas.models import Finca
        from accounts.models import Rol, Usuario, UsuarioFinca
        from accounts.schema import PERMISOS_SISTEMA
        from catalogos.models import Raza, CategoriaAnimal
        from animales.models import Animal

        hoy = date.today()

        # ── Fincas ────────────────────────────────────────────────────────────
        fp, _ = Finca.objects.get_or_create(
            nombre="Finca Principal",
            defaults={"propietario": "Nina Escobar", "activo": True},
        )
        hp, _ = Finca.objects.get_or_create(
            nombre="Hacienda Pedros",
            defaults={"propietario": "Pedro Gutiérrez", "activo": True},
        )

        # ── Roles ─────────────────────────────────────────────────────────────
        perms_finca = [
            'dashboard_ver', 'animales_ver', 'animales_crear', 'animales_editar',
            'parcelas_ver', 'parcelas_crear',
            'vacunaciones_ver', 'reproduccion_ver', 'produccion_ver',
            'sanidad_ver', 'ventas_ver', 'compras_ver',
            'alertas_ver', 'fincas_ver',
        ]
        rol_finca, _ = Rol.objects.get_or_create(
            nombre="PROPIETARIO_FINCA",
            defaults={"descripcion": "Propietario de finca (sin acceso global)",
                      "permisos": perms_finca, "activo": True},
        )
        rol_super, _ = Rol.objects.get_or_create(
            nombre="SUPER_ADMIN",
            defaults={"descripcion": "Superadministrador (acceso total)",
                      "permisos": ['all'], "activo": True},
        )

        # ── Usuarios ──────────────────────────────────────────────────────────
        def upsert_user(username, first, last, rol, finca, superuser=False):
            u, created = Usuario.objects.get_or_create(
                username=username,
                defaults={"first_name": first, "last_name": last,
                          "email": f"{username}@example.com", "is_active": True},
            )
            u.first_name = first
            u.last_name = last
            u.rol = rol
            u.finca = finca
            u.is_superuser = superuser
            u.is_staff = superuser
            u.is_active = True
            u.set_password("demo12345")
            u.save()
            return u

        nina = upsert_user("nina", "Nina", "Escobar", rol_finca, fp, superuser=False)
        pedro = upsert_user("pedro", "Pedro", "Gutiérrez", rol_finca, hp, superuser=False)
        sup = upsert_user("super", "Super", "Admin", rol_super, fp, superuser=True)

        # ── Accesos UsuarioFinca ──────────────────────────────────────────────
        for usuario, finca in [(nina, fp), (pedro, hp)]:
            UsuarioFinca.objects.update_or_create(
                usuario=usuario, finca=finca,
                defaults={"rol_en_finca": "PROPIETARIO", "activo": True},
            )

        # ── Catálogos mínimos ─────────────────────────────────────────────────
        raza, _ = Raza.objects.get_or_create(
            nombre="Nelore", defaults={"orientacion": "CARNE", "activo": True}
        )
        cat = CategoriaAnimal.objects.first()
        if cat is None:
            cat, _ = CategoriaAnimal.objects.get_or_create(nombre="Vaca", defaults={"activo": True})

        # ── Animales en cada finca ────────────────────────────────────────────
        def mk(arete, finca, sexo):
            Animal.objects.get_or_create(
                nro_arete=arete,
                defaults={
                    "finca": finca, "sexo": sexo, "estado": "ACTIVO",
                    "raza": raza, "categoria": cat,
                    "fecha_nacimiento": hoy - timedelta(days=900),
                    "fecha_ingreso": hoy - timedelta(days=400),
                    "peso": 400,
                },
            )

        for i in range(1, 4):
            mk(f"NP-{i:03d}", fp, "HEMBRA" if i % 2 else "MACHO")
        for i in range(1, 4):
            mk(f"HP-{i:03d}", hp, "HEMBRA" if i % 2 else "MACHO")

        # ── Resumen ───────────────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS("\nEscenario multi-tenant creado.\n"))
        self.stdout.write("Fincas:")
        self.stdout.write(f"  - {fp.nombre} (id={fp.id})")
        self.stdout.write(f"  - {hp.nombre} (id={hp.id})")
        self.stdout.write("\nUsuarios (contraseña: demo12345):")
        self.stdout.write("  - nina   -> Finca Principal  (propietario, no superadmin)")
        self.stdout.write("  - pedro  -> Hacienda Pedros  (propietario, no superadmin)")
        self.stdout.write("  - super  -> todas las fincas (superadmin)")
        self.stdout.write("\nAnimales: NP-001..003 en Finca Principal, HP-001..003 en Hacienda Pedros.")
