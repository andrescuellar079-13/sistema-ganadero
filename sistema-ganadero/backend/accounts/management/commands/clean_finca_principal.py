from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Elimina SOLO los datos de Finca Principal. Requiere --confirm.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirmar que se desea borrar los datos de Finca Principal.',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                "No se borró nada. Para ejecutar la limpieza usa:\n"
                "  python manage.py clean_finca_principal --confirm"
            ))
            return

        from fincas.models import Finca
        try:
            finca = Finca.objects.get(nombre="Finca Principal")
        except Finca.DoesNotExist:
            self.stdout.write(self.style.WARNING("No existe Finca Principal. Nada que limpiar."))
            return

        self.stdout.write(f'Limpiando datos de "{finca.nombre}"...')

        with transaction.atomic():
            self._clean(finca)

        self.stdout.write(self.style.SUCCESS("Limpieza completada. Finca Principal y todos sus datos fueron eliminados."))

    def _clean(self, finca):
        # Importar modelos al momento de ejecutar, no al cargar el módulo
        from alertas.models import Alerta, Gasto
        from comercio.models import DetalleVenta, NotaVenta, MuerteBaja
        from compras.models import DetalleCompra, DetalleCompraAlimento, NotaCompra
        from sanidad.models import (
            Vacunacion, TratamientoMedicamento, Tratamiento,
            Desparasitacion, AnimalMedicamento, Diagnostico, Observacion,
        )
        from produccion.models import ProduccionLeche, Lactancia, RegistroPeso, AlimentoAnimal
        from reproduccion.models import Reproduccion, InseminacionArtificial, DiagnosticoPrenez, MontaNatural
        from animales.models import AnimalParcela, Animal, Parcela
        from catalogos.models import Reproductor, Veterinario, Alimento, Medicamento, Vacuna
        from rrhh.models import Empleado
        from accounts.models import Usuario

        def _del(qs, label):
            n, _ = qs.delete()
            if n:
                self.stdout.write(f"  Eliminados {n} {label}")

        # 1. Alertas y gastos
        _del(Alerta.objects.filter(finca=finca), "alertas")
        _del(Gasto.objects.filter(finca=finca), "gastos")

        # 2. Ventas
        _del(DetalleVenta.objects.filter(nota_venta__finca=finca), "detalles de venta")
        _del(NotaVenta.objects.filter(finca=finca), "notas de venta")
        _del(MuerteBaja.objects.filter(finca=finca), "bajas/muertes")

        # 3. Compras
        _del(DetalleCompra.objects.filter(nota_compra__finca=finca), "detalles compra medicamento")
        _del(DetalleCompraAlimento.objects.filter(nota_compra__finca=finca), "detalles compra alimento")
        _del(NotaCompra.objects.filter(finca=finca), "notas de compra")

        # 4. Sanidad
        _del(TratamientoMedicamento.objects.filter(tratamiento__finca=finca), "medicamentos de tratamiento")
        _del(Tratamiento.objects.filter(finca=finca), "tratamientos")
        _del(Vacunacion.objects.filter(finca=finca), "vacunaciones")
        _del(Desparasitacion.objects.filter(finca=finca), "desparasitaciones")
        _del(AnimalMedicamento.objects.filter(animal__finca=finca), "animal-medicamento")
        _del(Diagnostico.objects.filter(finca=finca), "diagnósticos clínicos")
        _del(Observacion.objects.filter(finca=finca), "observaciones sanitarias")

        # 5. Producción
        _del(ProduccionLeche.objects.filter(finca=finca), "producciones de leche")
        _del(Lactancia.objects.filter(finca=finca), "lactancias")
        _del(RegistroPeso.objects.filter(finca=finca), "registros de peso")
        _del(AlimentoAnimal.objects.filter(finca=finca), "alimentaciones")

        # 6. Reproducción — limpiar M2M antes de borrar Reproduccion
        for repro in Reproduccion.objects.filter(finca=finca):
            repro.crias.clear()
        _del(Reproduccion.objects.filter(finca=finca), "reproducciones/partos")
        _del(InseminacionArtificial.objects.filter(finca=finca), "inseminaciones artificiales")
        _del(DiagnosticoPrenez.objects.filter(finca=finca), "diagnósticos de preñez")
        _del(MontaNatural.objects.filter(finca=finca), "montas naturales")

        # 7. Animales y parcelas
        _del(AnimalParcela.objects.filter(animal__finca=finca), "movimientos de parcela")
        _del(Animal.objects.filter(finca=finca), "animales")
        _del(Parcela.objects.filter(finca=finca), "parcelas")

        # 8. Catálogos con finca
        _del(Reproductor.objects.filter(finca=finca), "reproductores")
        _del(Veterinario.objects.filter(finca=finca), "veterinarios")
        _del(Alimento.objects.filter(finca=finca), "alimentos")
        _del(Medicamento.objects.filter(finca=finca), "medicamentos")
        _del(Vacuna.objects.filter(finca=finca), "vacunas")

        # 9. RRHH y clientes/proveedores
        _del(Empleado.objects.filter(finca=finca), "empleados")
        from comercio.models import Cliente
        from compras.models import Proveedor
        _del(Cliente.objects.filter(finca=finca), "clientes")
        _del(Proveedor.objects.filter(finca=finca), "proveedores")

        # 10. Usuarios de la finca
        _del(Usuario.objects.filter(finca=finca), "usuarios")

        # 11. Finca
        finca.delete()
        self.stdout.write("  Eliminada Finca Principal")
