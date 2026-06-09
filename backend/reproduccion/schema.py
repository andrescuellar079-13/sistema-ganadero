# backend/reproduccion/schema.py
from datetime import date, timedelta
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required

from .models import (
    InseminacionArtificial,
    MontaNatural,
    DiagnosticoPrenez,
    Reproduccion,
    Celo,
    Palpacion,
    HembraRepetidora,
    AbortoDetallado,
    Destete,
)
from fincas.models import Finca
from animales.models import Animal
from catalogos.models import Reproductor, Veterinario, Raza, CategoriaAnimal


# ==========================================
# TYPES EXISTENTES
# ==========================================

class InseminacionArtificialType(DjangoObjectType):
    class Meta:
        model = InseminacionArtificial
        fields = "__all__"


class MontaNaturalType(DjangoObjectType):
    class Meta:
        model = MontaNatural
        fields = "__all__"


class DiagnosticoPrenezType(DjangoObjectType):
    class Meta:
        model = DiagnosticoPrenez
        fields = "__all__"


class ReproduccionType(DjangoObjectType):
    class Meta:
        model = Reproduccion
        fields = "__all__"


# ==========================================
# NUEVOS TYPES
# ==========================================

class CeloType(DjangoObjectType):
    duracion_horas = graphene.Int()
    
    class Meta:
        model = Celo
        fields = "__all__"
    
    def resolve_duracion_horas(self, info):
        return self.duracion_horas


class PalpacionType(DjangoObjectType):
    class Meta:
        model = Palpacion
        fields = "__all__"


class HembraRepetidoraType(DjangoObjectType):
    class Meta:
        model = HembraRepetidora
        fields = "__all__"


class AbortoDetalladoType(DjangoObjectType):
    class Meta:
        model = AbortoDetallado
        fields = "__all__"


class DesteteType(DjangoObjectType):
    class Meta:
        model = Destete
        fields = "__all__"


# ==========================================
# INPUT TYPES
# ==========================================

class CriaInput(graphene.InputObjectType):
    nro_arete = graphene.String(required=True)
    nombre = graphene.String()
    sexo = graphene.String(required=True)
    raza_id = graphene.ID()
    categoria_id = graphene.ID()
    peso_nacimiento = graphene.Float()
    color = graphene.String()
    observaciones = graphene.String()


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    # Queries existentes
    inseminaciones = graphene.List(InseminacionArtificialType, finca_id=graphene.ID())
    montas_naturales = graphene.List(MontaNaturalType, finca_id=graphene.ID())
    diagnosticos_prenez = graphene.List(DiagnosticoPrenezType, finca_id=graphene.ID())
    reproducciones = graphene.List(ReproduccionType, finca_id=graphene.ID())
    vacas_prenadas = graphene.List(ReproduccionType, finca_id=graphene.ID())
    proximos_partos = graphene.List(ReproduccionType, dias=graphene.Int(default_value=30), finca_id=graphene.ID())
    
    # Nuevas queries
    celos = graphene.List(CeloType, finca_id=graphene.ID(), hembra_id=graphene.ID())
    palpaciones = graphene.List(PalpacionType, finca_id=graphene.ID())
    hembras_repetidoras = graphene.List(HembraRepetidoraType, finca_id=graphene.ID())
    abortos_detallados = graphene.List(AbortoDetalladoType, finca_id=graphene.ID())
    destetes = graphene.List(DesteteType, finca_id=graphene.ID())
    dias_abiertos = graphene.Float(hembra_id=graphene.ID())
    
    # Resolvers existentes
    def resolve_inseminaciones(self, info, finca_id=None):
        qs = InseminacionArtificial.objects.select_related('hembra', 'reproductor', 'finca')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)
        return qs.order_by('-fecha')
    
    def resolve_montas_naturales(self, info, finca_id=None):
        qs = MontaNatural.objects.select_related('hembra', 'reproductor', 'finca')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)
        return qs.order_by('-fecha')
    
    def resolve_diagnosticos_prenez(self, info, finca_id=None):
        qs = DiagnosticoPrenez.objects.select_related('hembra', 'veterinario', 'finca')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)
        return qs.order_by('-fecha')
    
    def resolve_reproducciones(self, info, finca_id=None):
        qs = Reproduccion.objects.select_related(
            'madre', 'padre', 'inseminacion', 'monta',
            'inseminacion__reproductor', 'monta__reproductor'
        ).prefetch_related('crias')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)
        return qs.order_by('-fecha_parto_real', '-fecha_registro')
    
    def resolve_vacas_prenadas(self, info, finca_id=None):
        qs = Reproduccion.objects.filter(estado="PRENADA").select_related('madre')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)
        return qs
    
    def resolve_proximos_partos(self, info, dias=30, finca_id=None):
        hoy = date.today()
        limite = hoy + timedelta(days=dias)
        qs = Reproduccion.objects.filter(
            fecha_parto_esperado__gte=hoy,
            fecha_parto_esperado__lte=limite,
            estado="PRENADA"
        ).select_related('madre')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)
        return qs
    
    # Nuevos resolvers
    def resolve_celos(self, info, finca_id=None, hembra_id=None):
        qs = Celo.objects.select_related('hembra', 'finca')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)
        if hembra_id:
            qs = qs.filter(hembra_id=hembra_id)
        return qs.order_by('-fecha_inicio')
    
    def resolve_palpaciones(self, info, finca_id=None):
        qs = Palpacion.objects.select_related('hembra', 'veterinario', 'finca')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)
        return qs.order_by('-fecha')
    
    def resolve_hembras_repetidoras(self, info, finca_id=None):
        qs = HembraRepetidora.objects.select_related('animal')
        if finca_id:
            qs = qs.filter(animal__finca_id=finca_id)
        return qs.filter(descartada=False).order_by('-numero_servicios')
    
    def resolve_abortos_detallados(self, info, finca_id=None):
        qs = AbortoDetallado.objects.select_related('reproduccion__madre')
        if finca_id:
            qs = qs.filter(reproduccion__finca_id=finca_id)
        return qs.order_by('-created_at')
    
    def resolve_destetes(self, info, finca_id=None):
        qs = Destete.objects.select_related('madre', 'cria', 'finca')
        if finca_id:
            qs = qs.filter(finca_id=finca_id)
        return qs.order_by('-fecha_destete')
    
    def resolve_dias_abiertos(self, info, hembra_id):
        """Calcula días abiertos para una hembra (desde parto hasta próxima preñez)"""
        try:
            ultimo_parto = Reproduccion.objects.filter(
                madre_id=hembra_id,
                fecha_parto_real__isnull=False
            ).order_by('-fecha_parto_real').first()
            
            if not ultimo_parto:
                return None
            
            proxima_prenez = Reproduccion.objects.filter(
                madre_id=hembra_id,
                fecha_servicio__gt=ultimo_parto.fecha_parto_real,
                estado='PRENADA'
            ).order_by('fecha_servicio').first()
            
            if proxima_prenez:
                return (proxima_prenez.fecha_servicio - ultimo_parto.fecha_parto_real).days
            return None
        except Exception:
            return None


# ==========================================
# MUTATIONS EXISTENTES
# ==========================================

class CrearInseminacionArtificial(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        hembra_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        reproductor_id = graphene.ID()
        numero_servicio = graphene.Int()
        numero_pajuela = graphene.String()
        lote_nitrogeno = graphene.String()
        tecnico_inseminador = graphene.String()
        observaciones = graphene.String()

    inseminacion = graphene.Field(InseminacionArtificialType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, hembra_id, fecha, **kwargs):
        try:
            finca = Finca.objects.get(id=finca_id)
            hembra = Animal.objects.get(id=hembra_id)

            reproductor = None
            if kwargs.get('reproductor_id'):
                reproductor = Reproductor.objects.filter(id=kwargs['reproductor_id']).first()

            inseminacion = InseminacionArtificial.objects.create(
                finca=finca,
                hembra=hembra,
                reproductor=reproductor,
                fecha=fecha,
                numero_servicio=kwargs.get('numero_servicio', 1),
                numero_pajuela=kwargs.get('numero_pajuela', ''),
                lote_nitrogeno=kwargs.get('lote_nitrogeno', ''),
                tecnico_inseminador=kwargs.get('tecnico_inseminador', ''),
                observaciones=kwargs.get('observaciones', '')
            )

            return CrearInseminacionArtificial(
                inseminacion=inseminacion,
                success=True,
                message="Inseminación registrada exitosamente"
            )
        except Exception as e:
            return CrearInseminacionArtificial(
                inseminacion=None,
                success=False,
                message=str(e)
            )


class CrearDiagnosticoPrenez(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        hembra_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        resultado_prenez = graphene.String(required=True)
        dias_gestacion = graphene.Int()
        metodo = graphene.String()
        veterinario_id = graphene.ID()
        observaciones = graphene.String()

    diagnostico = graphene.Field(DiagnosticoPrenezType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, hembra_id, fecha, resultado_prenez, **kwargs):
        try:
            finca = Finca.objects.get(id=finca_id)
            hembra = Animal.objects.get(id=hembra_id)

            veterinario = None
            if kwargs.get('veterinario_id'):
                veterinario = Veterinario.objects.filter(id=kwargs['veterinario_id']).first()

            diagnostico = DiagnosticoPrenez.objects.create(
                finca=finca,
                hembra=hembra,
                fecha=fecha,
                resultado_prenez=resultado_prenez,
                dias_gestacion=kwargs.get('dias_gestacion', 0),
                metodo=kwargs.get('metodo', ''),
                veterinario=veterinario,
                observaciones=kwargs.get('observaciones', '')
            )

            return CrearDiagnosticoPrenez(
                diagnostico=diagnostico,
                success=True,
                message=f"Diagnóstico registrado: {resultado_prenez}"
            )
        except Exception as e:
            return CrearDiagnosticoPrenez(
                diagnostico=None,
                success=False,
                message=str(e)
            )


class CrearReproduccion(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        madre_id = graphene.ID(required=True)
        fecha_parto_real = graphene.Date(required=True)
        tipo_parto = graphene.String()
        num_crias = graphene.Int()
        peso_total_crias = graphene.Float()
        observaciones = graphene.String()

    reproduccion = graphene.Field(ReproduccionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, madre_id, fecha_parto_real, **kwargs):
        try:
            finca = Finca.objects.get(id=finca_id)
            madre = Animal.objects.get(id=madre_id)

            reproduccion = Reproduccion.objects.create(
                finca=finca,
                madre=madre,
                fecha_parto_real=fecha_parto_real,
                tipo_parto=kwargs.get('tipo_parto', 'NORMAL'),
                num_crias=kwargs.get('num_crias', 1),
                peso_total_crias=kwargs.get('peso_total_crias', 0),
                observaciones=kwargs.get('observaciones', ''),
                estado="PARIDA"
            )

            return CrearReproduccion(
                reproduccion=reproduccion,
                success=True,
                message="Parto registrado exitosamente"
            )
        except Exception as e:
            return CrearReproduccion(
                reproduccion=None,
                success=False,
                message=str(e)
            )


class RegistrarPartoConCrias(graphene.Mutation):
    """
    Mutation principal para registrar un parto completo con crías.
    Crea la Reproduccion, crea cada cría como Animal, y opcionalmente inicia lactancia.
    """
    class Arguments:
        finca_id = graphene.ID(required=True)
        madre_id = graphene.ID(required=True)
        inseminacion_id = graphene.ID()
        monta_id = graphene.ID()
        padre_id = graphene.ID()
        fecha_parto_esperado = graphene.Date()
        fecha_parto_real = graphene.Date(required=True)
        tipo_parto = graphene.String()
        num_crias = graphene.Int()
        estado = graphene.String()
        observaciones = graphene.String()
        crear_lactancia = graphene.Boolean()
        crias = graphene.List(CriaInput)

    reproduccion = graphene.Field(ReproduccionType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, madre_id, fecha_parto_real, **kwargs):
        try:
            from produccion.models import Lactancia

            finca = Finca.objects.get(id=finca_id)
            madre = Animal.objects.get(id=madre_id, finca=finca)

            if madre.sexo != 'HEMBRA':
                return RegistrarPartoConCrias(
                    reproduccion=None, success=False,
                    message="La madre seleccionada debe ser una hembra"
                )

            tipo_parto = kwargs.get('tipo_parto', 'NORMAL')
            num_crias = kwargs.get('num_crias', 0)

            inseminacion = None
            if kwargs.get('inseminacion_id'):
                inseminacion = InseminacionArtificial.objects.filter(
                    id=kwargs['inseminacion_id'], finca=finca
                ).first()

            monta = None
            if kwargs.get('monta_id'):
                monta = MontaNatural.objects.filter(
                    id=kwargs['monta_id'], finca=finca
                ).first()

            padre = None
            if kwargs.get('padre_id'):
                padre = Animal.objects.filter(
                    id=kwargs['padre_id'], finca=finca, sexo='MACHO'
                ).first()

            fecha_servicio = None
            if inseminacion:
                fecha_servicio = inseminacion.fecha
            elif monta:
                fecha_servicio = monta.fecha

            fecha_parto_esperado = kwargs.get('fecha_parto_esperado')
            if not fecha_parto_esperado:
                if inseminacion and inseminacion.fecha_probable_parto:
                    fecha_parto_esperado = inseminacion.fecha_probable_parto
                elif monta and monta.fecha_probable_parto:
                    fecha_parto_esperado = monta.fecha_probable_parto

            reproduccion = Reproduccion.objects.create(
                finca=finca,
                madre=madre,
                padre=padre,
                inseminacion=inseminacion,
                monta=monta,
                fecha_servicio=fecha_servicio,
                fecha_parto_esperado=fecha_parto_esperado,
                fecha_parto_real=fecha_parto_real,
                tipo_parto=tipo_parto,
                num_crias=num_crias,
                observaciones=kwargs.get('observaciones', ''),
                registrado_por=info.context.user,
            )

            if tipo_parto == 'ABORTO':
                Reproduccion.objects.filter(id=reproduccion.id).update(estado='ABORTO')
                reproduccion.refresh_from_db()

            if inseminacion:
                resultado = 'PRENADA' if tipo_parto != 'ABORTO' else 'VACIA'
                InseminacionArtificial.objects.filter(id=inseminacion.id).update(resultado=resultado)
            if monta:
                resultado = 'PRENADA' if tipo_parto != 'ABORTO' else 'VACIA'
                MontaNatural.objects.filter(id=monta.id).update(resultado=resultado)

            crias_input = kwargs.get('crias') or []
            if tipo_parto != 'ABORTO' and crias_input:
                for cria_data in crias_input:
                    raza = None
                    if cria_data.raza_id:
                        raza = Raza.objects.filter(id=cria_data.raza_id).first()

                    categoria = None
                    if cria_data.categoria_id:
                        categoria = CategoriaAnimal.objects.filter(id=cria_data.categoria_id).first()

                    cria = Animal.objects.create(
                        finca=finca,
                        nro_arete=cria_data.nro_arete,
                        nombre=cria_data.nombre or '',
                        sexo=cria_data.sexo,
                        raza=raza,
                        categoria=categoria,
                        madre=madre,
                        padre=padre,
                        origen='NACIDO_FINCA',
                        fecha_nacimiento=fecha_parto_real,
                        fecha_ingreso=fecha_parto_real,
                        estado='ACTIVO',
                        peso_nacimiento=cria_data.peso_nacimiento or 0,
                        peso=cria_data.peso_nacimiento or 0,
                        color=cria_data.color or '',
                        observaciones=cria_data.observaciones or '',
                    )
                    reproduccion.crias.add(cria)

            if kwargs.get('crear_lactancia') and tipo_parto != 'ABORTO':
                try:
                    last = Lactancia.objects.filter(vaca=madre).order_by('-numero_lactancia').first()
                    numero = (last.numero_lactancia + 1) if last else 1
                    Lactancia.objects.create(
                        finca=finca,
                        vaca=madre,
                        reproduccion=reproduccion,
                        numero_lactancia=numero,
                        fecha_inicio=fecha_parto_real,
                        estado='ACTIVA',
                    )
                except Exception:
                    pass

            reproduccion.refresh_from_db()

            return RegistrarPartoConCrias(
                reproduccion=reproduccion,
                success=True,
                message="Parto registrado exitosamente"
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return RegistrarPartoConCrias(
                reproduccion=None,
                success=False,
                message=str(e)
            )


# ==========================================
# MUTATIONS - CREAR
# ==========================================

class CrearCelo(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        hembra_id = graphene.ID(required=True)
        fecha_inicio = graphene.Date(required=True)
        fecha_fin = graphene.Date()
        tipo = graphene.String()
        intensidad = graphene.String()
        detectado_por = graphene.String()
        observaciones = graphene.String()
    
    celo = graphene.Field(CeloType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, finca_id, hembra_id, fecha_inicio, **kwargs):
        try:
            finca = Finca.objects.get(id=finca_id)
            hembra = Animal.objects.get(id=hembra_id, finca=finca)
            
            celo = Celo.objects.create(
                finca=finca,
                hembra=hembra,
                fecha_inicio=fecha_inicio,
                fecha_fin=kwargs.get('fecha_fin'),
                tipo=kwargs.get('tipo', 'NATURAL'),
                intensidad=kwargs.get('intensidad', 'MEDIA'),
                detectado_por=kwargs.get('detectado_por', ''),
                observaciones=kwargs.get('observaciones', ''),
                registrado_por=info.context.user
            )
            return CrearCelo(celo=celo, success=True, message="Celo registrado exitosamente")
        except Exception as e:
            return CrearCelo(celo=None, success=False, message=str(e))


class CrearPalpacion(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        hembra_id = graphene.ID(required=True)
        fecha = graphene.Date(required=True)
        resultado = graphene.String(required=True)
        dias_gestacion_estimados = graphene.Int()
        observaciones = graphene.String()
        veterinario_id = graphene.ID()
    
    palpacion = graphene.Field(PalpacionType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, finca_id, hembra_id, fecha, resultado, **kwargs):
        try:
            finca = Finca.objects.get(id=finca_id)
            hembra = Animal.objects.get(id=hembra_id, finca=finca)
            
            palpacion = Palpacion.objects.create(
                finca=finca,
                hembra=hembra,
                fecha=fecha,
                resultado=resultado,
                dias_gestacion_estimados=kwargs.get('dias_gestacion_estimados'),
                observaciones=kwargs.get('observaciones', ''),
                veterinario_id=kwargs.get('veterinario_id'),
                registrado_por=info.context.user
            )
            return CrearPalpacion(palpacion=palpacion, success=True, message="Palpación registrada exitosamente")
        except Exception as e:
            return CrearPalpacion(palpacion=None, success=False, message=str(e))


class CrearHembraRepetidora(graphene.Mutation):
    class Arguments:
        animal_id = graphene.ID(required=True)
        numero_servicios = graphene.Int()
        causa_presunta = graphene.String()
    
    hembra_repetidora = graphene.Field(HembraRepetidoraType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, animal_id, **kwargs):
        try:
            animal = Animal.objects.get(id=animal_id)
            
            repetidora, created = HembraRepetidora.objects.get_or_create(
                animal=animal,
                defaults={
                    'numero_servicios': kwargs.get('numero_servicios', 1),
                    'causa_presunta': kwargs.get('causa_presunta', '')
                }
            )
            
            if not created and kwargs.get('numero_servicios'):
                repetidora.numero_servicios = kwargs['numero_servicios']
                repetidora.save()
            
            return CrearHembraRepetidora(
                hembra_repetidora=repetidora,
                success=True,
                message="Hembra repetidora registrada" if created else "Actualizada"
            )
        except Exception as e:
            return CrearHembraRepetidora(hembra_repetidora=None, success=False, message=str(e))


class CrearAbortoDetallado(graphene.Mutation):
    class Arguments:
        reproduccion_id = graphene.ID(required=True)
        causa = graphene.String(required=True)
        descripcion = graphene.String(required=True)
        semanas_gestacion = graphene.Int(required=True)
        estado_feto = graphene.String()
        tratamiento_aplicado = graphene.String()
        medidas_preventivas = graphene.String()
        costo_asociado = graphene.Float()
    
    aborto = graphene.Field(AbortoDetalladoType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, reproduccion_id, causa, descripcion, semanas_gestacion, **kwargs):
        try:
            reproduccion = Reproduccion.objects.get(id=reproduccion_id)
            
            aborto = AbortoDetallado.objects.create(
                reproduccion=reproduccion,
                causa=causa,
                descripcion=descripcion,
                semanas_gestacion=semanas_gestacion,
                estado_feto=kwargs.get('estado_feto'),
                tratamiento_aplicado=kwargs.get('tratamiento_aplicado', ''),
                medidas_preventivas=kwargs.get('medidas_preventivas', ''),
                costo_asociado=kwargs.get('costo_asociado', 0)
            )
            
            return CrearAbortoDetallado(aborto=aborto, success=True, message="Aborto registrado en detalle")
        except Exception as e:
            return CrearAbortoDetallado(aborto=None, success=False, message=str(e))


class CrearDestete(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        madre_id = graphene.ID(required=True)
        cria_id = graphene.ID(required=True)
        fecha_destete = graphene.Date(required=True)
        tipo = graphene.String()
        edad_destete_dias = graphene.Int(required=True)
        peso_cria = graphene.Float()
        estado_cria = graphene.String()
        observaciones = graphene.String()
    
    destete = graphene.Field(DesteteType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, finca_id, madre_id, cria_id, fecha_destete, edad_destete_dias, **kwargs):
        try:
            finca = Finca.objects.get(id=finca_id)
            madre = Animal.objects.get(id=madre_id, finca=finca)
            cria = Animal.objects.get(id=cria_id, finca=finca)
            
            destete = Destete.objects.create(
                finca=finca,
                madre=madre,
                cria=cria,
                fecha_destete=fecha_destete,
                tipo=kwargs.get('tipo', 'NATURAL'),
                edad_destete_dias=edad_destete_dias,
                peso_cria=kwargs.get('peso_cria'),
                estado_cria=kwargs.get('estado_cria', ''),
                observaciones=kwargs.get('observaciones', ''),
                registrado_por=info.context.user
            )
            
            return CrearDestete(destete=destete, success=True, message="Destete registrado exitosamente")
        except Exception as e:
            return CrearDestete(destete=None, success=False, message=str(e))


# ==========================================
# MUTATIONS - ACTUALIZAR Y ELIMINAR (CRUD)
# ==========================================

# ========== CELOS ==========
class ActualizarCelo(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_inicio = graphene.Date()
        fecha_fin = graphene.Date()
        tipo = graphene.String()
        intensidad = graphene.String()
        detectado_por = graphene.String()
        observaciones = graphene.String()
    
    celo = graphene.Field(CeloType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            celo = Celo.objects.get(id=id)
            if kwargs.get('fecha_inicio'):
                celo.fecha_inicio = kwargs['fecha_inicio']
            if kwargs.get('fecha_fin'):
                celo.fecha_fin = kwargs['fecha_fin']
            if kwargs.get('tipo'):
                celo.tipo = kwargs['tipo']
            if kwargs.get('intensidad'):
                celo.intensidad = kwargs['intensidad']
            if kwargs.get('detectado_por'):
                celo.detectado_por = kwargs['detectado_por']
            if kwargs.get('observaciones') is not None:
                celo.observaciones = kwargs['observaciones']
            celo.save()
            return ActualizarCelo(celo=celo, success=True, message="Celo actualizado exitosamente")
        except Exception as e:
            return ActualizarCelo(celo=None, success=False, message=str(e))


class EliminarCelo(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id):
        try:
            celo = Celo.objects.get(id=id)
            celo.delete()
            return EliminarCelo(success=True, message="Celo eliminado exitosamente")
        except Exception as e:
            return EliminarCelo(success=False, message=str(e))


# ========== PALPACIONES ==========
class ActualizarPalpacion(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha = graphene.Date()
        resultado = graphene.String()
        dias_gestacion_estimados = graphene.Int()
        observaciones = graphene.String()
        veterinario_id = graphene.ID()
    
    palpacion = graphene.Field(PalpacionType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            palpacion = Palpacion.objects.get(id=id)
            if kwargs.get('fecha'):
                palpacion.fecha = kwargs['fecha']
            if kwargs.get('resultado'):
                palpacion.resultado = kwargs['resultado']
            if kwargs.get('dias_gestacion_estimados'):
                palpacion.dias_gestacion_estimados = kwargs['dias_gestacion_estimados']
            if kwargs.get('observaciones') is not None:
                palpacion.observaciones = kwargs['observaciones']
            if kwargs.get('veterinario_id'):
                palpacion.veterinario = Veterinario.objects.get(id=kwargs['veterinario_id'])
            palpacion.save()
            return ActualizarPalpacion(palpacion=palpacion, success=True, message="Palpación actualizada exitosamente")
        except Exception as e:
            return ActualizarPalpacion(palpacion=None, success=False, message=str(e))


class EliminarPalpacion(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id):
        try:
            palpacion = Palpacion.objects.get(id=id)
            palpacion.delete()
            return EliminarPalpacion(success=True, message="Palpación eliminada exitosamente")
        except Exception as e:
            return EliminarPalpacion(success=False, message=str(e))


# ========== DESTETES ==========
class ActualizarDestete(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        fecha_destete = graphene.Date()
        tipo = graphene.String()
        edad_destete_dias = graphene.Int()
        peso_cria = graphene.Float()
        estado_cria = graphene.String()
        observaciones = graphene.String()
    
    destete = graphene.Field(DesteteType)
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            destete = Destete.objects.get(id=id)
            if kwargs.get('fecha_destete'):
                destete.fecha_destete = kwargs['fecha_destete']
            if kwargs.get('tipo'):
                destete.tipo = kwargs['tipo']
            if kwargs.get('edad_destete_dias'):
                destete.edad_destete_dias = kwargs['edad_destete_dias']
            if kwargs.get('peso_cria'):
                destete.peso_cria = kwargs['peso_cria']
            if kwargs.get('estado_cria'):
                destete.estado_cria = kwargs['estado_cria']
            if kwargs.get('observaciones') is not None:
                destete.observaciones = kwargs['observaciones']
            destete.save()
            return ActualizarDestete(destete=destete, success=True, message="Destete actualizado exitosamente")
        except Exception as e:
            return ActualizarDestete(destete=None, success=False, message=str(e))


class EliminarDestete(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    @login_required
    def mutate(self, info, id):
        try:
            destete = Destete.objects.get(id=id)
            destete.delete()
            return EliminarDestete(success=True, message="Destete eliminado exitosamente")
        except Exception as e:
            return EliminarDestete(success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    # Mutations existentes
    crear_inseminacion_artificial = CrearInseminacionArtificial.Field()
    crear_diagnostico_prenez = CrearDiagnosticoPrenez.Field()
    crear_reproduccion = CrearReproduccion.Field()
    registrar_parto_con_crias = RegistrarPartoConCrias.Field()
    
    # Mutations - Crear
    crear_celo = CrearCelo.Field()
    crear_palpacion = CrearPalpacion.Field()
    crear_hembra_repetidora = CrearHembraRepetidora.Field()
    crear_aborto_detallado = CrearAbortoDetallado.Field()
    crear_destete = CrearDestete.Field()
    
    # Mutations - Actualizar y Eliminar
    actualizar_celo = ActualizarCelo.Field()
    eliminar_celo = EliminarCelo.Field()
    actualizar_palpacion = ActualizarPalpacion.Field()
    eliminar_palpacion = EliminarPalpacion.Field()
    actualizar_destete = ActualizarDestete.Field()
    eliminar_destete = EliminarDestete.Field()