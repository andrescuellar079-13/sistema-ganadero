# backend/sanidad/schema.py
from datetime import date, timedelta

import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required

from .models import (
    Vacunacion,
    Tratamiento,
    Desparasitacion,
    TratamientoMedicamento,
    AnimalMedicamento,
    Diagnostico,
    Observacion,
)


# ==========================================
# TYPES CON CAMPOS CORRECTOS
# ==========================================

class VacunacionType(DjangoObjectType):
    nombreVacuna = graphene.String()
    fechaAplicacion = graphene.Date()
    fechaProxima = graphene.Date()
    
    class Meta:
        model = Vacunacion
        fields = "__all__"
    
    def resolve_nombreVacuna(self, info):
        return self.vacuna.nombre if self.vacuna else None
    
    def resolve_fechaAplicacion(self, info):
        return self.fecha_aplicacion
    
    def resolve_fechaProxima(self, info):
        return self.fecha_proxima


class TratamientoType(DjangoObjectType):
    fechaInicio = graphene.Date()
    fechaFin = graphene.Date()
    costoTotal = graphene.Decimal()
    enTratamiento = graphene.Boolean()
    
    class Meta:
        model = Tratamiento
        fields = "__all__"
    
    def resolve_fechaInicio(self, info):
        return self.fecha_inicio
    
    def resolve_fechaFin(self, info):
        return self.fecha_fin
    
    def resolve_costoTotal(self, info):
        return self.costo_total
    
    def resolve_enTratamiento(self, info):
        return self.en_tratamiento


class DesparasitacionType(DjangoObjectType):
    tipoParasiticida = graphene.String()
    pesoAplicacion = graphene.Decimal()
    fechaProxima = graphene.Date()
    
    class Meta:
        model = Desparasitacion
        fields = "__all__"
    
    def resolve_tipoParasiticida(self, info):
        return self.tipo_parasiticida
    
    def resolve_pesoAplicacion(self, info):
        return self.peso_aplicacion
    
    def resolve_fechaProxima(self, info):
        return self.fecha_proxima


class TratamientoMedicamentoType(DjangoObjectType):
    viaAplicacion = graphene.String()
    diasRetiro = graphene.Int()
    
    class Meta:
        model = TratamientoMedicamento
        fields = "__all__"
    
    def resolve_viaAplicacion(self, info):
        return self.via_aplicacion
    
    def resolve_diasRetiro(self, info):
        return self.dias_retiro


class AnimalMedicamentoType(DjangoObjectType):
    fechaAdministracion = graphene.Date()
    fechaSiguiente = graphene.Date()
    
    class Meta:
        model = AnimalMedicamento
        fields = "__all__"
    
    def resolve_fechaAdministracion(self, info):
        return self.fecha_administracion
    
    def resolve_fechaSiguiente(self, info):
        return self.fecha_siguiente


class DiagnosticoType(DjangoObjectType):
    class Meta:
        model = Diagnostico
        fields = "__all__"


class ObservacionType(DjangoObjectType):
    class Meta:
        model = Observacion
        fields = "__all__"


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    vacunaciones = graphene.List(VacunacionType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    tratamientos = graphene.List(TratamientoType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    tratamientos_activos = graphene.List(TratamientoType, finca_id=graphene.ID(required=True))
    desparasitaciones = graphene.List(DesparasitacionType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    tratamiento_medicamentos = graphene.List(TratamientoMedicamentoType, finca_id=graphene.ID(required=True))
    animal_medicamentos = graphene.List(AnimalMedicamentoType, finca_id=graphene.ID(required=True))
    diagnosticos = graphene.List(DiagnosticoType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    observaciones_sanitarias = graphene.List(ObservacionType, finca_id=graphene.ID(required=True), animal_id=graphene.ID())
    vacunas_proximas = graphene.List(VacunacionType, dias=graphene.Int(default_value=30))
    vacunas_vencidas = graphene.List(VacunacionType)

    def resolve_vacunaciones(self, info, finca_id, animal_id=None):
        queryset = Vacunacion.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_tratamientos(self, info, finca_id, animal_id=None):
        queryset = Tratamiento.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_tratamientos_activos(self, info, finca_id):
        return Tratamiento.objects.filter(finca_id=finca_id, en_tratamiento=True)

    def resolve_desparasitaciones(self, info, finca_id, animal_id=None):
        queryset = Desparasitacion.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_tratamiento_medicamentos(self, info, finca_id):
        return TratamientoMedicamento.objects.filter(tratamiento__finca_id=finca_id)

    def resolve_animal_medicamentos(self, info, finca_id):
        return AnimalMedicamento.objects.filter(animal__finca_id=finca_id)

    def resolve_diagnosticos(self, info, finca_id, animal_id=None):
        queryset = Diagnostico.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_observaciones_sanitarias(self, info, finca_id, animal_id=None):
        queryset = Observacion.objects.filter(finca_id=finca_id)
        if animal_id:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def resolve_vacunas_proximas(self, info, dias=30):
        hoy = date.today()
        limite = hoy + timedelta(days=dias)
        return Vacunacion.objects.filter(fecha_proxima__gte=hoy, fecha_proxima__lte=limite)

    def resolve_vacunas_vencidas(self, info):
        hoy = date.today()
        return Vacunacion.objects.filter(fecha_proxima__lt=hoy)


# ==========================================
# MUTATIONS - VACUNACION
# ==========================================

class CrearVacunacion(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        vacuna_id = graphene.ID(required=True)
        fecha_aplicacion = graphene.Date(required=True)
        campana = graphene.String()
        lote = graphene.String()
        dosis_aplicada = graphene.String()
        via_aplicacion = graphene.String()
        observaciones = graphene.String()
        fecha_proxima = graphene.Date()

    vacunacion = graphene.Field(VacunacionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, vacuna_id, fecha_aplicacion, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal
            from catalogos.models import Vacuna

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)
            vacuna = Vacuna.objects.get(id=vacuna_id)

            fecha_proxima = kwargs.get('fecha_proxima')
            if not fecha_proxima and vacuna.intervalo_dias:
                fecha_proxima = fecha_aplicacion + timedelta(days=vacuna.intervalo_dias)

            vacunacion = Vacunacion.objects.create(
                finca=finca,
                animal=animal,
                vacuna=vacuna,
                fecha_aplicacion=fecha_aplicacion,
                campana=kwargs.get('campana'),
                lote=kwargs.get('lote'),
                dosis_aplicada=kwargs.get('dosis_aplicada'),
                via_aplicacion=kwargs.get('via_aplicacion'),
                observaciones=kwargs.get('observaciones'),
                fecha_proxima=fecha_proxima
            )

            return CrearVacunacion(vacunacion=vacunacion, success=True, message="Vacunación registrada exitosamente")
        except Exception as e:
            return CrearVacunacion(vacunacion=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - TRATAMIENTO
# ==========================================

class CrearTratamiento(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        diagnostico = graphene.String()
        tipo = graphene.String()
        dosis = graphene.String()
        costo_total = graphene.Decimal()
        medicamento_id = graphene.ID()

    tratamiento = graphene.Field(TratamientoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

            tratamiento = Tratamiento.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                fecha_inicio=fecha,
                diagnostico=kwargs.get('diagnostico'),
                tipo=kwargs.get('tipo'),
                dosis=kwargs.get('dosis'),
                costo_total=kwargs.get('costo_total', 0),
                medicamento_id=kwargs.get('medicamento_id'),
                en_tratamiento=True
            )

            return CrearTratamiento(tratamiento=tratamiento, success=True, message="Tratamiento registrado exitosamente")
        except Exception as e:
            return CrearTratamiento(tratamiento=None, success=False, message=str(e))


class FinalizarTratamiento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_fin = graphene.Date(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, fecha_fin):
        try:
            tratamiento = Tratamiento.objects.get(id=id)
            tratamiento.fecha_fin = fecha_fin
            tratamiento.en_tratamiento = False
            tratamiento.save()
            return FinalizarTratamiento(success=True, message="Tratamiento finalizado")
        except Exception as e:
            return FinalizarTratamiento(success=False, message=str(e))


# ==========================================
# MUTATIONS - DESPARASITACION
# ==========================================

class CrearDesparasitacion(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        tipo_parasiticida = graphene.String(required=True)
        producto = graphene.String(required=True)
        dosis = graphene.String(required=True)
        peso_aplicacion = graphene.Decimal()
        lote = graphene.String()
        fecha_proxima = graphene.Date()
        observaciones = graphene.String()
        veterinario_id = graphene.ID()

    desparasitacion = graphene.Field(DesparasitacionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha, tipo_parasiticida, producto, dosis, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

            veterinario = None
            if kwargs.get('veterinario_id'):
                from catalogos.models import Veterinario
                veterinario = Veterinario.objects.filter(id=kwargs['veterinario_id']).first()

            desparasitacion = Desparasitacion.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                tipo_parasiticida=tipo_parasiticida,
                producto=producto,
                dosis=dosis,
                peso_aplicacion=kwargs.get('peso_aplicacion', 0),
                lote=kwargs.get('lote', ''),
                fecha_proxima=kwargs.get('fecha_proxima'),
                observaciones=kwargs.get('observaciones', ''),
                veterinario=veterinario
            )

            return CrearDesparasitacion(desparasitacion=desparasitacion, success=True, message="Desparasitación registrada exitosamente")
        except Exception as e:
            return CrearDesparasitacion(desparasitacion=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - DIAGNOSTICO
# ==========================================

class CrearDiagnostico(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        descripcion = graphene.String(required=True)
        veterinario_id = graphene.ID()

    diagnostico = graphene.Field(DiagnosticoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha, descripcion, **kwargs):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

            veterinario = None
            if kwargs.get('veterinario_id'):
                from catalogos.models import Veterinario
                veterinario = Veterinario.objects.filter(id=kwargs['veterinario_id']).first()

            diagnostico = Diagnostico.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                descripcion=descripcion,
                veterinario=veterinario
            )

            return CrearDiagnostico(diagnostico=diagnostico, success=True, message="Diagnóstico registrado exitosamente")
        except Exception as e:
            return CrearDiagnostico(diagnostico=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - OBSERVACION
# ==========================================

class CrearObservacion(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        animal_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        descripcion = graphene.String(required=True)

    observacion = graphene.Field(ObservacionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, animal_id, fecha, descripcion):
        try:
            from fincas.models import Finca
            from animales.models import Animal

            finca = Finca.objects.get(id=finca_id)
            animal = Animal.objects.get(id=animal_id)

            observacion = Observacion.objects.create(
                finca=finca,
                animal=animal,
                fecha=fecha,
                descripcion=descripcion,
                registrado_por=info.context.user
            )

            return CrearObservacion(observacion=observacion, success=True, message="Observación registrada exitosamente")
        except Exception as e:
            return CrearObservacion(observacion=None, success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    crear_vacunacion = CrearVacunacion.Field()
    crear_tratamiento = CrearTratamiento.Field()
    finalizar_tratamiento = FinalizarTratamiento.Field()
    crear_desparasitacion = CrearDesparasitacion.Field()
    crear_diagnostico = CrearDiagnostico.Field()
    crear_observacion = CrearObservacion.Field()