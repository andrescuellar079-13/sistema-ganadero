"""Tests core de la importación masiva (Fase 1: ANIMALES, PARCELAS, PESOS).

Cubren los 10 escenarios del spec. Ejercitan la lógica completa a través de
``servicios`` (lectura → validación → proceso), salvo el de permisos que pasa
por la vista HTTP.
"""
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from accounts.models import Usuario
from animales.models import Animal, AnimalParcela, Parcela
from catalogos.models import CategoriaAnimal, Raza
from fincas.models import Finca
from produccion.models import RegistroPeso

from importaciones import constantes, servicios
from importaciones.models import ImportacionGanadera
from .factories import construir_xlsx, media_temporal

MEDIA = media_temporal()


def _archivo(hojas, nombre="datos.xlsx"):
    return SimpleUploadedFile(
        nombre, construir_xlsx(hojas),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@override_settings(MEDIA_ROOT=MEDIA)
class BaseImport(TestCase):
    def setUp(self):
        self.finca = Finca.objects.create(nombre="Finca Test")
        self.otra_finca = Finca.objects.create(nombre="Otra Finca")
        self.user = Usuario.objects.create_user(
            username="tester", password="pass12345", finca=self.finca
        )
        self.raza = Raza.objects.create(nombre="Brahman")
        self.categoria = CategoriaAnimal.objects.create(nombre="Vaca")

    def previsualizar(self, hojas, modo=constantes.MODO_SOLO_CREAR, estricto=True):
        return servicios.previsualizar(
            self.finca, self.user, _archivo(hojas), modo, estricto
        )

    def importar(self, hojas, modo=constantes.MODO_SOLO_CREAR, estricto=True):
        prev = self.previsualizar(hojas, modo, estricto)
        imp = ImportacionGanadera.objects.get(id=prev["importacion_id"])
        res = servicios.confirmar(imp)
        imp.refresh_from_db()
        return prev, res, imp


class TestImportacionMasiva(BaseImport):

    def test_01_importar_2000_animales_en_lotes(self):
        filas = [
            {"nro_arete": f"AR-{i:04d}", "sexo": "HEMBRA" if i % 2 else "MACHO",
             "peso_kg": "300"}
            for i in range(1, 2001)
        ]
        _prev, res, imp = self.importar({constantes.HOJA_ANIMALES: filas})
        self.assertTrue(res["ok"], res)
        self.assertEqual(res["creados"], 2000)
        self.assertEqual(Animal.objects.filter(finca=self.finca).count(), 2000)
        self.assertEqual(imp.estado, ImportacionGanadera.Estado.COMPLETADO)

    def test_02_detectar_aretes_duplicados_en_archivo(self):
        filas = [
            {"nro_arete": "AR-1", "sexo": "MACHO"},
            {"nro_arete": "AR-1", "sexo": "HEMBRA"},
        ]
        prev = self.previsualizar({constantes.HOJA_ANIMALES: filas})
        codigos = {e["codigo_error"] for e in prev["muestra_errores"]}
        self.assertIn("ARETE_DUPLICADO_ARCHIVO", codigos)
        self.assertGreaterEqual(prev["total_errores"], 2)

    def test_03_solo_crear_vs_actualizar(self):
        Animal.objects.create(finca=self.finca, nro_arete="AR-9", sexo="HEMBRA",
                              nombre="Viejo")
        # SOLO_CREAR sobre un arete existente → error de duplicado.
        prev = self.previsualizar(
            {constantes.HOJA_ANIMALES: [{"nro_arete": "AR-9", "sexo": "HEMBRA"}]},
            modo=constantes.MODO_SOLO_CREAR,
        )
        self.assertIn("ARETE_DUPLICADO_BD",
                      {e["codigo_error"] for e in prev["muestra_errores"]})

        # ACTUALIZAR_EXISTENTES → actualiza el nombre.
        _p, res, _imp = self.importar(
            {constantes.HOJA_ANIMALES: [{"nro_arete": "AR-9", "sexo": "HEMBRA",
                                         "nombre": "Nuevo"}]},
            modo=constantes.MODO_ACTUALIZAR,
        )
        self.assertTrue(res["ok"], res)
        self.assertEqual(res["actualizados"], 1)
        self.assertEqual(Animal.objects.get(nro_arete="AR-9").nombre, "Nuevo")

    def test_04_resolver_padre_madre_despues_del_hijo(self):
        filas = [
            {"nro_arete": "HIJO", "sexo": "HEMBRA",
             "padre_arete": "PAPA", "madre_arete": "MAMA"},
            {"nro_arete": "PAPA", "sexo": "MACHO"},
            {"nro_arete": "MAMA", "sexo": "HEMBRA"},
        ]
        _p, res, _imp = self.importar({constantes.HOJA_ANIMALES: filas})
        self.assertTrue(res["ok"], res)
        hijo = Animal.objects.get(nro_arete="HIJO")
        self.assertEqual(hijo.padre.nro_arete, "PAPA")
        self.assertEqual(hijo.madre.nro_arete, "MAMA")

    def test_05_rechazar_padre_hembra_madre_macho(self):
        filas = [
            {"nro_arete": "HIJO", "sexo": "MACHO",
             "padre_arete": "X_HEMBRA", "madre_arete": "Y_MACHO"},
            {"nro_arete": "X_HEMBRA", "sexo": "HEMBRA"},
            {"nro_arete": "Y_MACHO", "sexo": "MACHO"},
        ]
        prev = self.previsualizar({constantes.HOJA_ANIMALES: filas})
        codigos = {e["codigo_error"] for e in prev["muestra_errores"]}
        self.assertIn("PADRE_NO_MACHO", codigos)
        self.assertIn("MADRE_NO_HEMBRA", codigos)

    def test_06_una_sola_parcela_activa_por_animal(self):
        hojas = {
            constantes.HOJA_PARCELAS: [
                {"nombre": "Norte"}, {"nombre": "Sur"},
            ],
            constantes.HOJA_ANIMALES: [
                {"nro_arete": "AR-1", "sexo": "MACHO", "parcela_actual": "Norte"},
            ],
        }
        self.importar(hojas)
        animal = Animal.objects.get(nro_arete="AR-1")
        self.assertEqual(
            AnimalParcela.objects.filter(animal=animal, fecha_salida__isnull=True).count(), 1
        )
        # Reimportar moviendo a "Sur" → sigue habiendo UNA sola activa.
        self.importar(
            {constantes.HOJA_ANIMALES: [
                {"nro_arete": "AR-1", "sexo": "MACHO", "parcela_actual": "Sur"}]},
            modo=constantes.MODO_CREAR_O_ACTUALIZAR,
        )
        activas = AnimalParcela.objects.filter(animal=animal, fecha_salida__isnull=True)
        self.assertEqual(activas.count(), 1)
        self.assertEqual(activas.first().parcela.nombre, "Sur")

    def test_07_pesos_historicos_sin_duplicar(self):
        animales = {constantes.HOJA_ANIMALES: [{"nro_arete": "AR-1", "sexo": "MACHO"}]}
        self.importar(animales)
        pesos = {constantes.HOJA_PESOS: [
            {"nro_arete": "AR-1", "fecha_pesaje": "01/06/2024", "peso_kg": "320"},
            {"nro_arete": "AR-1", "fecha_pesaje": "01/07/2024", "peso_kg": "340"},
        ]}
        _p, res1, _i = self.importar(pesos)
        self.assertEqual(res1["contadores"]["pesos_creados"], 2)
        # Reimportar los mismos pesajes → se omiten, no se duplican.
        _p, res2, _i = self.importar(pesos)
        self.assertEqual(res2["contadores"]["pesos_creados"], 0)
        self.assertEqual(RegistroPeso.objects.filter(animal__nro_arete="AR-1").count(), 2)
        self.assertEqual(Animal.objects.get(nro_arete="AR-1").peso, 340)

    def test_08_rollback_estricto_vs_parcial(self):
        filas = [
            {"nro_arete": "OK-1", "sexo": "MACHO"},
            {"nro_arete": "MAL-1", "sexo": "INVALIDO"},  # choice inválido
        ]
        # ESTRICTO → rollback total, nada se crea.
        _p, res, imp = self.importar({constantes.HOJA_ANIMALES: filas}, estricto=True)
        self.assertFalse(res["ok"])
        self.assertTrue(res.get("rollback"))
        self.assertEqual(Animal.objects.filter(finca=self.finca).count(), 0)
        self.assertEqual(imp.estado, ImportacionGanadera.Estado.FALLIDO)

        # PARCIAL → la fila válida se importa, la inválida queda en errores.
        _p, res2, imp2 = self.importar({constantes.HOJA_ANIMALES: filas}, estricto=False)
        self.assertTrue(res2["ok"], res2)
        self.assertEqual(res2["creados"], 1)
        self.assertTrue(Animal.objects.filter(nro_arete="OK-1").exists())
        self.assertFalse(Animal.objects.filter(nro_arete="MAL-1").exists())
        self.assertEqual(imp2.estado, ImportacionGanadera.Estado.COMPLETADO_CON_ERRORES)

    def test_09_permiso_finca_requerido(self):
        client = Client()
        client.force_login(self.user)
        archivo = _archivo({constantes.HOJA_ANIMALES: [{"nro_arete": "AR-1", "sexo": "MACHO"}]})
        # finca a la que el usuario NO tiene acceso → 403.
        resp = client.post("/api/importaciones/previsualizar/", {
            "finca_id": str(self.otra_finca.id),
            "modo": constantes.MODO_SOLO_CREAR,
            "archivo": archivo,
        })
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(Animal.objects.filter(finca=self.otra_finca).count(), 0)

    def test_10_datos_reflejados_en_lista(self):
        self.importar({constantes.HOJA_ANIMALES: [
            {"nro_arete": "VISIBLE-1", "sexo": "HEMBRA", "raza": "Brahman",
             "categoria": "Vaca", "peso_kg": "412.5"},
        ]})
        animal = Animal.objects.get(nro_arete="VISIBLE-1")
        self.assertEqual(animal.finca_id, self.finca.id)
        self.assertEqual(animal.raza, self.raza)
        self.assertEqual(animal.categoria, self.categoria)
        self.assertEqual(str(animal.peso), "412.50")
