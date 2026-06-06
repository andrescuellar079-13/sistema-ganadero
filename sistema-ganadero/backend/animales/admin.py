from django.contrib import admin
from .models import Animal, Parcela, AnimalParcela

admin.site.register(Animal)
admin.site.register(Parcela)
admin.site.register(AnimalParcela)