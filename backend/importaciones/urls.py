from django.urls import path

from . import views

app_name = "importaciones"

urlpatterns = [
    path("plantilla/", views.descargar_plantilla, name="plantilla"),
    path("previsualizar/", views.previsualizar, name="previsualizar"),
    path("confirmar/", views.confirmar, name="confirmar"),
    path("cancelar/", views.cancelar, name="cancelar"),
    path("<int:importacion_id>/errores/", views.descargar_errores, name="errores"),
]
