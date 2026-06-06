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
)


# ==========================================
# TYPES
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
    inseminaciones = graphene.List(InseminacionArtificialType, finca_id=graphene.ID())
    montas_naturales = graphene.List(MontaNaturalType, finca_id=graphene.ID())
    diagnosticos_prenez = graphene.List(DiagnosticoPrenezType, finca_id=graphene.ID())
    reproducciones = graphene.List(ReproduccionType, finca_id=graphene.ID())
    vacas_prenadas = graphene.List(ReproduccionType, finca_id=graphene.ID())
    proximos_partos = graphene.List(ReproduccionType, dias=graphene.Int(default_value=30), finca_id=graphene.ID())

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


# ==========================================
# MUTATIONS
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
            from fincas.models import Finca
            from animales.models import Animal
            from catalogos.models import Reproductor

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
            from fincas.models import Finca
            from animales.models import Animal
            from catalogos.models import Veterinario

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
            from fincas.models import Finca
            from animales.models import Animal

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
            from fincas.models import Finca
            from animales.models import Animal
            from catalogos.models import Raza, CategoriaAnimal

            finca = Finca.objects.get(id=finca_id)
            madre = Animal.objects.get(id=madre_id, finca=finca)

            if madre.sexo != 'HEMBRA':
                return RegistrarPartoConCrias(
                    reproduccion=None, success=False,
                    message="La madre seleccionada debe ser una hembra"
                )

            tipo_parto = kwargs.get('tipo_parto', 'NORMAL')
            num_crias = kwargs.get('num_crias', 0)

            # Resolver evento relacionado
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

            # Padre interno solo si se seleccionó un Animal explícitamente
            padre = None
            if kwargs.get('padre_id'):
                padre = Animal.objects.filter(
                    id=kwargs['padre_id'], finca=finca, sexo='MACHO'
                ).first()

            # Calcular fecha_servicio desde el evento
            fecha_servicio = None
            if inseminacion:
                fecha_servicio = inseminacion.fecha
            elif monta:
                fecha_servicio = monta.fecha

            # Calcular fecha_parto_esperado desde el evento si no fue dado
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

            # El modelo save() pone estado=PARIDA cuando hay fecha_parto_real.
            # Para ABORTO necesitamos corregirlo sin disparar save() de nuevo.
            if tipo_parto == 'ABORTO':
                Reproduccion.objects.filter(id=reproduccion.id).update(estado='ABORTO')
                reproduccion.refresh_from_db()

            # Marcar evento relacionado como completado
            if inseminacion:
                resultado = 'PRENADA' if tipo_parto != 'ABORTO' else 'VACIA'
                InseminacionArtificial.objects.filter(id=inseminacion.id).update(resultado=resultado)
            if monta:
                resultado = 'PRENADA' if tipo_parto != 'ABORTO' else 'VACIA'
                MontaNatural.objects.filter(id=monta.id).update(resultado=resultado)

            # Crear crías como Animal solo si no es aborto
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

            # Crear lactancia si fue solicitado y el parto fue exitoso
            if kwargs.get('crear_lactancia') and tipo_parto != 'ABORTO':
                try:
                    from produccion.models import Lactancia
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
                    pass  # Lactancia es opcional, no falla el parto si falla esto

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
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    crear_inseminacion_artificial = CrearInseminacionArtificial.Field()
    crear_diagnostico_prenez = CrearDiagnosticoPrenez.Field()
    crear_reproduccion = CrearReproduccion.Field()
    registrar_parto_con_crias = RegistrarPartoConCrias.Field()
