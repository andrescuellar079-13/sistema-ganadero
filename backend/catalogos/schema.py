import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required

from .models import (
    Raza,
    CategoriaAnimal,
    TipoMedicamento,
    Medicamento,
    Veterinario,
    Alimento,
    Reproductor,
    Vacuna,
)


class RazaType(DjangoObjectType):
    class Meta:
        model = Raza
        fields = "__all__"


class CategoriaAnimalType(DjangoObjectType):
    class Meta:
        model = CategoriaAnimal
        fields = "__all__"


class TipoMedicamentoType(DjangoObjectType):
    class Meta:
        model = TipoMedicamento
        fields = "__all__"


class MedicamentoType(DjangoObjectType):
    class Meta:
        model = Medicamento
        fields = "__all__"


class VeterinarioType(DjangoObjectType):
    class Meta:
        model = Veterinario
        fields = "__all__"


class AlimentoType(DjangoObjectType):
    class Meta:
        model = Alimento
        fields = "__all__"


class ReproductorType(DjangoObjectType):
    class Meta:
        model = Reproductor
        fields = "__all__"


class VacunaType(DjangoObjectType):
    id = graphene.ID()
    info = graphene.String()

    class Meta:
        model = Vacuna
        fields = "__all__"

    def resolve_id(self, info):
        return self.id

    def resolve_info(self, info):
        return f"{self.nombre} - {self.dosis_recomendada}"


class Query(graphene.ObjectType):
    razas = graphene.List(RazaType)
    categorias_animales = graphene.List(CategoriaAnimalType)
    tipos_medicamento = graphene.List(TipoMedicamentoType)
    medicamentos = graphene.List(MedicamentoType)
    veterinarios = graphene.List(VeterinarioType)
    alimentos = graphene.List(AlimentoType)
    reproductores = graphene.List(ReproductorType)
    vacunas = graphene.List(VacunaType)
    # aliases for backwards compatibility
    all_vacunas = graphene.List(VacunaType)
    vacuna_by_id = graphene.Field(VacunaType, id=graphene.ID(required=True))
    vacuna_by_nombre = graphene.Field(VacunaType, nombre=graphene.String(required=True))
    vacunas_activas = graphene.List(VacunaType)

    @login_required
    def resolve_razas(self, info):
        return Raza.objects.all()

    @login_required
    def resolve_categorias_animales(self, info):
        return CategoriaAnimal.objects.all()

    @login_required
    def resolve_tipos_medicamento(self, info):
        return TipoMedicamento.objects.all()

    @login_required
    def resolve_medicamentos(self, info):
        user = info.context.user
        finca_id = getattr(user, 'finca_id', None)
        if finca_id:
            return Medicamento.objects.filter(finca_id=finca_id)
        return Medicamento.objects.all()

    @login_required
    def resolve_veterinarios(self, info):
        user = info.context.user
        finca_id = getattr(user, 'finca_id', None)
        if finca_id:
            return Veterinario.objects.filter(finca_id=finca_id)
        return Veterinario.objects.all()

    @login_required
    def resolve_alimentos(self, info):
        user = info.context.user
        finca_id = getattr(user, 'finca_id', None)
        if finca_id:
            return Alimento.objects.filter(finca_id=finca_id)
        return Alimento.objects.all()

    @login_required
    def resolve_reproductores(self, info):
        user = info.context.user
        finca_id = getattr(user, 'finca_id', None)
        if finca_id:
            return Reproductor.objects.filter(finca_id=finca_id)
        return Reproductor.objects.all()

    @login_required
    def resolve_vacunas(self, info):
        user = info.context.user
        finca_id = getattr(user, 'finca_id', None)
        if finca_id:
            return Vacuna.objects.filter(finca_id=finca_id)
        return Vacuna.objects.all()

    @login_required
    def resolve_all_vacunas(self, info):
        return Vacuna.objects.all()

    @login_required
    def resolve_vacuna_by_id(self, info, id):
        return Vacuna.objects.get(pk=id)

    @login_required
    def resolve_vacuna_by_nombre(self, info, nombre):
        return Vacuna.objects.get(nombre=nombre)

    @login_required
    def resolve_vacunas_activas(self, info):
        return Vacuna.objects.filter(activo=True)


# ==========================================
# MUTATIONS - RAZA
# ==========================================

class CrearRaza(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        orientacion = graphene.String()
        origen = graphene.String()
        descripcion = graphene.String()

    raza = graphene.Field(RazaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, orientacion="DOBLE_PROPOSITO", origen=None, descripcion=None):
        try:
            raza = Raza.objects.create(
                nombre=nombre,
                orientacion=orientacion,
                origen=origen,
                descripcion=descripcion
            )
            return CrearRaza(raza=raza, success=True, message=f"Raza {nombre} creada exitosamente")
        except Exception as e:
            return CrearRaza(raza=None, success=False, message=str(e))


class ActualizarRaza(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        orientacion = graphene.String()
        origen = graphene.String()
        descripcion = graphene.String()
        activo = graphene.Boolean()

    raza = graphene.Field(RazaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, nombre=None, orientacion=None, origen=None, descripcion=None, activo=None):
        try:
            raza = Raza.objects.get(pk=id)
            if nombre:
                raza.nombre = nombre
            if orientacion:
                raza.orientacion = orientacion
            if origen:
                raza.origen = origen
            if descripcion:
                raza.descripcion = descripcion
            if activo is not None:
                raza.activo = activo
            raza.save()
            return ActualizarRaza(raza=raza, success=True, message="Raza actualizada exitosamente")
        except Exception as e:
            return ActualizarRaza(raza=None, success=False, message=str(e))


class EliminarRaza(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            raza = Raza.objects.get(pk=id)
            nombre = raza.nombre
            raza.delete()
            return EliminarRaza(success=True, message=f"Raza {nombre} eliminada exitosamente")
        except Exception as e:
            return EliminarRaza(success=False, message=str(e))


# ==========================================
# MUTATIONS - CATEGORIA ANIMAL
# ==========================================

class CrearCategoriaAnimal(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        descripcion = graphene.String()
        sexo_aplica = graphene.String()
        edad_min_meses = graphene.Int()
        edad_max_meses = graphene.Int()
        peso_min_kg = graphene.Decimal()
        peso_max_kg = graphene.Decimal()
        tipo_produccion = graphene.String()
        permite_lactancia = graphene.Boolean()
        permite_reproduccion = graphene.Boolean()
        orden = graphene.Int()

    categoria = graphene.Field(CategoriaAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, nombre,
        descripcion=None, sexo_aplica="AMBOS",
        edad_min_meses=0, edad_max_meses=None,
        peso_min_kg=0, peso_max_kg=None,
        tipo_produccion="TODOS",
        permite_lactancia=False, permite_reproduccion=False, orden=0
    ):
        try:
            if CategoriaAnimal.objects.filter(nombre__iexact=nombre).exists():
                return CrearCategoriaAnimal(categoria=None, success=False, message=f"Ya existe una categoría con el nombre '{nombre}'")

            e_min = edad_min_meses if edad_min_meses is not None else 0
            if e_min < 0:
                return CrearCategoriaAnimal(categoria=None, success=False, message="La edad mínima no puede ser negativa")
            if edad_max_meses is not None:
                if edad_max_meses < 0:
                    return CrearCategoriaAnimal(categoria=None, success=False, message="La edad máxima no puede ser negativa")
                if e_min > edad_max_meses:
                    return CrearCategoriaAnimal(categoria=None, success=False, message="La edad mínima no puede ser mayor que la edad máxima")

            p_min = float(peso_min_kg) if peso_min_kg is not None else 0.0
            if p_min < 0:
                return CrearCategoriaAnimal(categoria=None, success=False, message="El peso mínimo no puede ser negativo")
            if peso_max_kg is not None:
                if float(peso_max_kg) < 0:
                    return CrearCategoriaAnimal(categoria=None, success=False, message="El peso máximo no puede ser negativo")
                if p_min > float(peso_max_kg):
                    return CrearCategoriaAnimal(categoria=None, success=False, message="El peso mínimo no puede ser mayor que el peso máximo")

            categoria = CategoriaAnimal.objects.create(
                nombre=nombre,
                descripcion=descripcion,
                sexo_aplica=sexo_aplica,
                edad_min_meses=e_min,
                edad_max_meses=edad_max_meses,
                peso_min_kg=p_min,
                peso_max_kg=peso_max_kg,
                tipo_produccion=tipo_produccion,
                permite_lactancia=permite_lactancia,
                permite_reproduccion=permite_reproduccion,
                orden=orden
            )
            return CrearCategoriaAnimal(categoria=categoria, success=True, message=f"Categoría {nombre} creada exitosamente")
        except Exception as e:
            return CrearCategoriaAnimal(categoria=None, success=False, message=str(e))


class ActualizarCategoriaAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        descripcion = graphene.String()
        sexo_aplica = graphene.String()
        edad_min_meses = graphene.Int()
        edad_max_meses = graphene.Int()
        peso_min_kg = graphene.Decimal()
        peso_max_kg = graphene.Decimal()
        tipo_produccion = graphene.String()
        permite_lactancia = graphene.Boolean()
        permite_reproduccion = graphene.Boolean()
        orden = graphene.Int()
        activo = graphene.Boolean()

    categoria = graphene.Field(CategoriaAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, id,
        nombre=None, descripcion=None, sexo_aplica=None,
        edad_min_meses=None, edad_max_meses=None,
        peso_min_kg=None, peso_max_kg=None,
        tipo_produccion=None, permite_lactancia=None,
        permite_reproduccion=None, orden=None, activo=None
    ):
        try:
            categoria = CategoriaAnimal.objects.get(pk=id)

            if nombre and CategoriaAnimal.objects.filter(nombre__iexact=nombre).exclude(pk=id).exists():
                return ActualizarCategoriaAnimal(categoria=None, success=False, message=f"Ya existe una categoría con el nombre '{nombre}'")

            # Validate ranges using resolved values
            e_min = edad_min_meses if edad_min_meses is not None else categoria.edad_min_meses
            e_max = edad_max_meses if edad_max_meses is not None else categoria.edad_max_meses
            if e_min is not None and e_max is not None:
                if e_min < 0 or e_max < 0:
                    return ActualizarCategoriaAnimal(categoria=None, success=False, message="La edad no puede ser negativa")
                if e_min > e_max:
                    return ActualizarCategoriaAnimal(categoria=None, success=False, message="La edad mínima no puede ser mayor que la edad máxima")

            p_min = float(peso_min_kg) if peso_min_kg is not None else (float(categoria.peso_min_kg) if categoria.peso_min_kg else None)
            p_max = float(peso_max_kg) if peso_max_kg is not None else (float(categoria.peso_max_kg) if categoria.peso_max_kg else None)
            if p_min is not None and p_max is not None:
                if p_min < 0 or p_max < 0:
                    return ActualizarCategoriaAnimal(categoria=None, success=False, message="El peso no puede ser negativo")
                if p_min > p_max:
                    return ActualizarCategoriaAnimal(categoria=None, success=False, message="El peso mínimo no puede ser mayor que el peso máximo")

            if nombre:
                categoria.nombre = nombre
            if descripcion is not None:
                categoria.descripcion = descripcion
            if sexo_aplica:
                categoria.sexo_aplica = sexo_aplica
            if edad_min_meses is not None:
                categoria.edad_min_meses = edad_min_meses
            if edad_max_meses is not None:
                categoria.edad_max_meses = edad_max_meses
            if peso_min_kg is not None:
                categoria.peso_min_kg = peso_min_kg
            if peso_max_kg is not None:
                categoria.peso_max_kg = peso_max_kg
            if tipo_produccion:
                categoria.tipo_produccion = tipo_produccion
            if permite_lactancia is not None:
                categoria.permite_lactancia = permite_lactancia
            if permite_reproduccion is not None:
                categoria.permite_reproduccion = permite_reproduccion
            if orden is not None:
                categoria.orden = orden
            if activo is not None:
                categoria.activo = activo
            categoria.save()
            return ActualizarCategoriaAnimal(categoria=categoria, success=True, message="Categoría actualizada exitosamente")
        except Exception as e:
            return ActualizarCategoriaAnimal(categoria=None, success=False, message=str(e))


class EliminarCategoriaAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            categoria = CategoriaAnimal.objects.get(pk=id)
            if categoria.animal_set.exists():
                return EliminarCategoriaAnimal(success=False, message="No se puede eliminar: hay animales con esta categoría. Inactívela en su lugar.")
            nombre = categoria.nombre
            categoria.delete()
            return EliminarCategoriaAnimal(success=True, message=f"Categoría {nombre} eliminada exitosamente")
        except Exception as e:
            return EliminarCategoriaAnimal(success=False, message=str(e))


# ==========================================
# MUTATIONS - VETERINARIO
# ==========================================

class CrearVeterinario(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        apellidos = graphene.String()
        ci = graphene.String()
        especialidad = graphene.String()
        telefono = graphene.String()
        email = graphene.String()
        matricula_profesional = graphene.String()
        tipo_servicio = graphene.String()
        costo_visita = graphene.Decimal()
        direccion = graphene.String()
        observaciones = graphene.String()

    veterinario = graphene.Field(VeterinarioType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, finca_id, nombre,
        apellidos=None, ci=None, especialidad=None, telefono=None, email=None,
        matricula_profesional=None, tipo_servicio=None, costo_visita=0,
        direccion=None, observaciones=None
    ):
        try:
            from fincas.models import Finca
            if costo_visita is not None and float(costo_visita) < 0:
                return CrearVeterinario(veterinario=None, success=False, message="El costo de visita no puede ser negativo")
            finca = Finca.objects.get(id=finca_id)
            veterinario = Veterinario.objects.create(
                finca=finca,
                nombre=nombre,
                apellidos=apellidos,
                ci=ci,
                especialidad=especialidad,
                telefono=telefono,
                email=email,
                matricula_profesional=matricula_profesional,
                tipo_servicio=tipo_servicio,
                costo_visita=costo_visita or 0,
                direccion=direccion,
                observaciones=observaciones,
            )
            return CrearVeterinario(veterinario=veterinario, success=True, message=f"Veterinario {nombre} creado exitosamente")
        except Exception as e:
            return CrearVeterinario(veterinario=None, success=False, message=str(e))


class ActualizarVeterinario(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        apellidos = graphene.String()
        ci = graphene.String()
        especialidad = graphene.String()
        telefono = graphene.String()
        email = graphene.String()
        matricula_profesional = graphene.String()
        tipo_servicio = graphene.String()
        costo_visita = graphene.Decimal()
        direccion = graphene.String()
        observaciones = graphene.String()
        activo = graphene.Boolean()

    veterinario = graphene.Field(VeterinarioType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, id,
        nombre=None, apellidos=None, ci=None, especialidad=None,
        telefono=None, email=None, matricula_profesional=None,
        tipo_servicio=None, costo_visita=None, direccion=None,
        observaciones=None, activo=None
    ):
        try:
            veterinario = Veterinario.objects.get(pk=id)
            if costo_visita is not None and float(costo_visita) < 0:
                return ActualizarVeterinario(veterinario=None, success=False, message="El costo de visita no puede ser negativo")
            if nombre:
                veterinario.nombre = nombre
            if apellidos is not None:
                veterinario.apellidos = apellidos
            if ci is not None:
                veterinario.ci = ci
            if especialidad is not None:
                veterinario.especialidad = especialidad
            if telefono is not None:
                veterinario.telefono = telefono
            if email is not None:
                veterinario.email = email
            if matricula_profesional is not None:
                veterinario.matricula_profesional = matricula_profesional
            if tipo_servicio is not None:
                veterinario.tipo_servicio = tipo_servicio
            if costo_visita is not None:
                veterinario.costo_visita = costo_visita
            if direccion is not None:
                veterinario.direccion = direccion
            if observaciones is not None:
                veterinario.observaciones = observaciones
            if activo is not None:
                veterinario.activo = activo
            veterinario.save()
            return ActualizarVeterinario(veterinario=veterinario, success=True, message="Veterinario actualizado exitosamente")
        except Exception as e:
            return ActualizarVeterinario(veterinario=None, success=False, message=str(e))


class EliminarVeterinario(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            veterinario = Veterinario.objects.get(pk=id)
            tiene_uso = False
            usos = []
            for attr, label in [
                ('vacunaciones_realizadas', 'vacunaciones'),
                ('tratamiento_eventos_sanitarios', 'tratamientos'),
                ('desparasitacion_eventos_sanitarios', 'desparasitaciones'),
                ('diagnosticos_prenez_reproduccion', 'diagnósticos de preñez'),
            ]:
                try:
                    if getattr(veterinario, attr).exists():
                        tiene_uso = True
                        usos.append(label)
                except Exception:
                    pass
            if tiene_uso:
                return EliminarVeterinario(
                    success=False,
                    message=f"No se puede eliminar: el veterinario está siendo usado en {', '.join(usos)}. Puede inactivarlo."
                )
            nombre = veterinario.nombre
            veterinario.delete()
            return EliminarVeterinario(success=True, message=f"Veterinario {nombre} eliminado exitosamente")
        except Exception as e:
            return EliminarVeterinario(success=False, message=str(e))


# ==========================================
# MUTATIONS - REPRODUCTOR
# ==========================================

class CrearReproductor(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        raza_id = graphene.ID()
        animal_interno_id = graphene.ID()
        codigo = graphene.String(required=True)
        nombre = graphene.String()
        tipo_origen = graphene.String(required=True)
        tipo_reproductor = graphene.String()
        codigo_pajuela = graphene.String()
        laboratorio = graphene.String()
        stock_pajuelas = graphene.Int()
        costo_pajuela = graphene.Decimal()
        facilidad_parto = graphene.Decimal()
        valor_genetico = graphene.Decimal()
        observaciones = graphene.String()

    reproductor = graphene.Field(ReproductorType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, finca_id, codigo, tipo_origen,
        raza_id=None, animal_interno_id=None, nombre=None,
        tipo_reproductor="TORO", codigo_pajuela=None, laboratorio=None,
        stock_pajuelas=0, costo_pajuela=None, facilidad_parto=None,
        valor_genetico=None, observaciones=None
    ):
        try:
            from fincas.models import Finca

            if tipo_origen == "SEMEN" and not codigo_pajuela:
                return CrearReproductor(reproductor=None, success=False, message="El código de pajuela es obligatorio para tipo Semen")
            if stock_pajuelas is not None and stock_pajuelas < 0:
                return CrearReproductor(reproductor=None, success=False, message="El stock de pajuelas no puede ser negativo")

            finca = Finca.objects.get(id=finca_id)
            raza = Raza.objects.filter(id=raza_id).first() if raza_id else None

            animal_interno = None
            if animal_interno_id:
                from animales.models import Animal
                animal_interno = Animal.objects.filter(id=animal_interno_id, finca=finca).first()

            reproductor = Reproductor.objects.create(
                finca=finca,
                raza=raza,
                animal_interno=animal_interno,
                codigo=codigo,
                nombre=nombre,
                tipo_origen=tipo_origen,
                tipo_reproductor=tipo_reproductor,
                codigo_pajuela=codigo_pajuela,
                laboratorio=laboratorio,
                stock_pajuelas=stock_pajuelas or 0,
                costo_pajuela=costo_pajuela,
                facilidad_parto=facilidad_parto,
                valor_genetico=valor_genetico,
                observaciones=observaciones
            )
            return CrearReproductor(reproductor=reproductor, success=True, message=f"Reproductor {codigo} creado exitosamente")
        except Exception as e:
            return CrearReproductor(reproductor=None, success=False, message=str(e))


class ActualizarReproductor(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        raza_id = graphene.ID()
        animal_interno_id = graphene.ID()
        nombre = graphene.String()
        tipo_origen = graphene.String()
        tipo_reproductor = graphene.String()
        codigo_pajuela = graphene.String()
        laboratorio = graphene.String()
        stock_pajuelas = graphene.Int()
        costo_pajuela = graphene.Decimal()
        facilidad_parto = graphene.Decimal()
        valor_genetico = graphene.Decimal()
        observaciones = graphene.String()
        activo = graphene.Boolean()

    reproductor = graphene.Field(ReproductorType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, id,
        raza_id=None, animal_interno_id=None, nombre=None,
        tipo_origen=None, tipo_reproductor=None,
        codigo_pajuela=None, laboratorio=None,
        stock_pajuelas=None, costo_pajuela=None,
        facilidad_parto=None, valor_genetico=None,
        observaciones=None, activo=None
    ):
        try:
            reproductor = Reproductor.objects.get(pk=id)

            if stock_pajuelas is not None and stock_pajuelas < 0:
                return ActualizarReproductor(reproductor=None, success=False, message="El stock de pajuelas no puede ser negativo")

            if raza_id is not None:
                reproductor.raza = Raza.objects.filter(id=raza_id).first() if raza_id else None
            if animal_interno_id is not None:
                from animales.models import Animal
                reproductor.animal_interno = Animal.objects.filter(id=animal_interno_id).first() if animal_interno_id else None
            if nombre is not None:
                reproductor.nombre = nombre
            if tipo_origen:
                reproductor.tipo_origen = tipo_origen
            if tipo_reproductor:
                reproductor.tipo_reproductor = tipo_reproductor
            if codigo_pajuela is not None:
                reproductor.codigo_pajuela = codigo_pajuela
            if laboratorio is not None:
                reproductor.laboratorio = laboratorio
            if stock_pajuelas is not None:
                reproductor.stock_pajuelas = stock_pajuelas
            if costo_pajuela is not None:
                reproductor.costo_pajuela = costo_pajuela
            if facilidad_parto is not None:
                reproductor.facilidad_parto = facilidad_parto
            if valor_genetico is not None:
                reproductor.valor_genetico = valor_genetico
            if observaciones is not None:
                reproductor.observaciones = observaciones
            if activo is not None:
                reproductor.activo = activo
            reproductor.save()
            return ActualizarReproductor(reproductor=reproductor, success=True, message="Reproductor actualizado exitosamente")
        except Exception as e:
            return ActualizarReproductor(reproductor=None, success=False, message=str(e))


class EliminarReproductor(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            reproductor = Reproductor.objects.get(pk=id)
            if reproductor.inseminaciones.exists() or reproductor.montas_naturales.exists():
                return EliminarReproductor(success=False, message="No se puede eliminar: el reproductor tiene eventos de reproducción asociados. Inactívelo en su lugar.")
            codigo = reproductor.codigo
            reproductor.delete()
            return EliminarReproductor(success=True, message=f"Reproductor {codigo} eliminado exitosamente")
        except Exception as e:
            return EliminarReproductor(success=False, message=str(e))


# ==========================================
# MUTATIONS - MEDICAMENTOS
# ==========================================

class CrearMedicamento(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        tipo_id = graphene.ID()
        nombre = graphene.String(required=True)
        descripcion = graphene.String()
        laboratorio = graphene.String()
        principio_activo = graphene.String()
        presentacion = graphene.String()
        unidad_medida = graphene.String()
        stock_cantidad = graphene.Decimal()
        stock_minimo = graphene.Decimal()
        contenido_neto = graphene.Decimal()
        fecha_vencimiento = graphene.Date()
        precio_compra = graphene.Decimal()
        dosis_recomendada = graphene.String()
        via_aplicacion = graphene.String()
        dias_retiro_carne = graphene.Int()
        dias_retiro_leche = graphene.Int()
        intervalo_dias = graphene.Int()
        activo = graphene.Boolean()

    medicamento = graphene.Field(MedicamentoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, finca_id, nombre,
        tipo_id=None, descripcion=None, laboratorio=None,
        principio_activo=None, presentacion=None,
        unidad_medida=None, stock_cantidad=0, stock_minimo=0,
        contenido_neto=0, fecha_vencimiento=None, precio_compra=0,
        dosis_recomendada=None, via_aplicacion=None,
        dias_retiro_carne=0, dias_retiro_leche=0,
        intervalo_dias=0, activo=True
    ):
        try:
            from fincas.models import Finca

            if float(stock_cantidad or 0) < 0:
                return CrearMedicamento(medicamento=None, success=False, message="El stock no puede ser negativo")
            if float(precio_compra or 0) < 0:
                return CrearMedicamento(medicamento=None, success=False, message="El precio no puede ser negativo")
            if (dias_retiro_carne or 0) < 0 or (dias_retiro_leche or 0) < 0:
                return CrearMedicamento(medicamento=None, success=False, message="Los días de retiro no pueden ser negativos")

            finca = Finca.objects.get(id=finca_id)
            tipo = TipoMedicamento.objects.filter(id=tipo_id).first() if tipo_id else None

            medicamento = Medicamento.objects.create(
                finca=finca,
                tipo=tipo,
                nombre=nombre,
                descripcion=descripcion,
                laboratorio=laboratorio,
                principio_activo=principio_activo,
                presentacion=presentacion,
                unidad_medida=unidad_medida,
                stock_cantidad=stock_cantidad,
                stock_minimo=stock_minimo,
                contenido_neto=contenido_neto,
                fecha_vencimiento=fecha_vencimiento,
                precio_compra=precio_compra,
                dosis_recomendada=dosis_recomendada,
                via_aplicacion=via_aplicacion,
                dias_retiro_carne=dias_retiro_carne or 0,
                dias_retiro_leche=dias_retiro_leche or 0,
                intervalo_dias=intervalo_dias or 0,
                activo=activo
            )
            return CrearMedicamento(medicamento=medicamento, success=True, message=f"Medicamento {nombre} creado exitosamente")
        except Exception as e:
            return CrearMedicamento(medicamento=None, success=False, message=str(e))


class ActualizarMedicamento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        tipo_id = graphene.ID()
        nombre = graphene.String()
        descripcion = graphene.String()
        laboratorio = graphene.String()
        principio_activo = graphene.String()
        presentacion = graphene.String()
        unidad_medida = graphene.String()
        stock_cantidad = graphene.Decimal()
        stock_minimo = graphene.Decimal()
        contenido_neto = graphene.Decimal()
        fecha_vencimiento = graphene.Date()
        precio_compra = graphene.Decimal()
        dosis_recomendada = graphene.String()
        via_aplicacion = graphene.String()
        dias_retiro_carne = graphene.Int()
        dias_retiro_leche = graphene.Int()
        intervalo_dias = graphene.Int()
        activo = graphene.Boolean()

    medicamento = graphene.Field(MedicamentoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, id,
        tipo_id=None, nombre=None, descripcion=None, laboratorio=None,
        principio_activo=None, presentacion=None, unidad_medida=None,
        stock_cantidad=None, stock_minimo=None, contenido_neto=None,
        fecha_vencimiento=None, precio_compra=None,
        dosis_recomendada=None, via_aplicacion=None,
        dias_retiro_carne=None, dias_retiro_leche=None,
        intervalo_dias=None, activo=None
    ):
        try:
            medicamento = Medicamento.objects.get(pk=id)

            if stock_cantidad is not None and float(stock_cantidad) < 0:
                return ActualizarMedicamento(medicamento=None, success=False, message="El stock no puede ser negativo")
            if precio_compra is not None and float(precio_compra) < 0:
                return ActualizarMedicamento(medicamento=None, success=False, message="El precio no puede ser negativo")
            if dias_retiro_carne is not None and dias_retiro_carne < 0:
                return ActualizarMedicamento(medicamento=None, success=False, message="Los días de retiro carne no pueden ser negativos")
            if dias_retiro_leche is not None and dias_retiro_leche < 0:
                return ActualizarMedicamento(medicamento=None, success=False, message="Los días de retiro leche no pueden ser negativos")

            if tipo_id is not None:
                medicamento.tipo = TipoMedicamento.objects.filter(id=tipo_id).first() if tipo_id else None
            if nombre:
                medicamento.nombre = nombre
            if descripcion is not None:
                medicamento.descripcion = descripcion
            if laboratorio is not None:
                medicamento.laboratorio = laboratorio
            if principio_activo is not None:
                medicamento.principio_activo = principio_activo
            if presentacion is not None:
                medicamento.presentacion = presentacion
            if unidad_medida is not None:
                medicamento.unidad_medida = unidad_medida
            if stock_cantidad is not None:
                medicamento.stock_cantidad = stock_cantidad
            if stock_minimo is not None:
                medicamento.stock_minimo = stock_minimo
            if contenido_neto is not None:
                medicamento.contenido_neto = contenido_neto
            if fecha_vencimiento is not None:
                medicamento.fecha_vencimiento = fecha_vencimiento
            if precio_compra is not None:
                medicamento.precio_compra = precio_compra
            if dosis_recomendada is not None:
                medicamento.dosis_recomendada = dosis_recomendada
            if via_aplicacion is not None:
                medicamento.via_aplicacion = via_aplicacion
            if dias_retiro_carne is not None:
                medicamento.dias_retiro_carne = dias_retiro_carne
            if dias_retiro_leche is not None:
                medicamento.dias_retiro_leche = dias_retiro_leche
            if intervalo_dias is not None:
                medicamento.intervalo_dias = intervalo_dias
            if activo is not None:
                medicamento.activo = activo
            medicamento.save()
            return ActualizarMedicamento(medicamento=medicamento, success=True, message="Medicamento actualizado exitosamente")
        except Exception as e:
            return ActualizarMedicamento(medicamento=None, success=False, message=str(e))


class EliminarMedicamento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            medicamento = Medicamento.objects.get(pk=id)
            tiene_tratamientos = medicamento.tratamiento_set.exists() if hasattr(medicamento, 'tratamiento_set') else False
            tiene_desparasitaciones = medicamento.desparasitacion_set.exists() if hasattr(medicamento, 'desparasitacion_set') else False
            if tiene_tratamientos or tiene_desparasitaciones:
                return EliminarMedicamento(success=False, message="No se puede eliminar: el medicamento tiene tratamientos o eventos sanitarios asociados. Inactívelo en su lugar.")
            nombre = medicamento.nombre
            medicamento.delete()
            return EliminarMedicamento(success=True, message=f"Medicamento {nombre} eliminado exitosamente")
        except Exception as e:
            return EliminarMedicamento(success=False, message=str(e))


# ==========================================
# MUTATIONS - ALIMENTOS
# ==========================================

class CrearAlimento(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        tipo_alimento = graphene.String()
        contenido_neto = graphene.Decimal()
        unidad_medida = graphene.String()
        fecha_vencimiento = graphene.Date()
        stock_cantidad = graphene.Decimal()
        stock_minimo = graphene.Decimal()
        precio_referencia = graphene.Decimal()
        costo_por_kg = graphene.Decimal()
        materia_seca_porcentaje = graphene.Decimal()
        proteina_porcentaje = graphene.Decimal()
        fibra_porcentaje = graphene.Decimal()
        energia = graphene.String()
        uso_recomendado = graphene.String()
        activo = graphene.Boolean()

    alimento = graphene.Field(AlimentoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, finca_id, nombre,
        tipo_alimento=None, contenido_neto=0, unidad_medida=None,
        fecha_vencimiento=None, stock_cantidad=0, stock_minimo=0,
        precio_referencia=0, costo_por_kg=0,
        materia_seca_porcentaje=0, proteina_porcentaje=0, fibra_porcentaje=0,
        energia=None, uso_recomendado=None, activo=True
    ):
        try:
            from fincas.models import Finca
            if float(stock_cantidad or 0) < 0:
                return CrearAlimento(alimento=None, success=False, message="El stock no puede ser negativo")
            if float(stock_minimo or 0) < 0:
                return CrearAlimento(alimento=None, success=False, message="El stock mínimo no puede ser negativo")
            if float(precio_referencia or 0) < 0:
                return CrearAlimento(alimento=None, success=False, message="El precio no puede ser negativo")
            if float(costo_por_kg or 0) < 0:
                return CrearAlimento(alimento=None, success=False, message="El costo por kg no puede ser negativo")
            if float(contenido_neto or 0) < 0:
                return CrearAlimento(alimento=None, success=False, message="El contenido neto no puede ser negativo")
            for campo, valor in [
                ('materia seca', materia_seca_porcentaje),
                ('proteína', proteina_porcentaje),
                ('fibra', fibra_porcentaje),
            ]:
                v = float(valor or 0)
                if v < 0 or v > 100:
                    return CrearAlimento(alimento=None, success=False, message=f"El porcentaje de {campo} debe estar entre 0 y 100")

            finca = Finca.objects.get(id=finca_id)
            alimento = Alimento.objects.create(
                finca=finca,
                nombre=nombre,
                tipo_alimento=tipo_alimento,
                contenido_neto=contenido_neto or 0,
                unidad_medida=unidad_medida,
                fecha_vencimiento=fecha_vencimiento,
                stock_cantidad=stock_cantidad or 0,
                stock_minimo=stock_minimo or 0,
                precio_referencia=precio_referencia or 0,
                costo_por_kg=costo_por_kg or 0,
                materia_seca_porcentaje=materia_seca_porcentaje or 0,
                proteina_porcentaje=proteina_porcentaje or 0,
                fibra_porcentaje=fibra_porcentaje or 0,
                energia=energia,
                uso_recomendado=uso_recomendado,
                activo=activo,
            )
            return CrearAlimento(alimento=alimento, success=True, message=f"Alimento {nombre} creado exitosamente")
        except Exception as e:
            return CrearAlimento(alimento=None, success=False, message=str(e))


class ActualizarAlimento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        tipo_alimento = graphene.String()
        contenido_neto = graphene.Decimal()
        unidad_medida = graphene.String()
        fecha_vencimiento = graphene.Date()
        stock_cantidad = graphene.Decimal()
        stock_minimo = graphene.Decimal()
        precio_referencia = graphene.Decimal()
        costo_por_kg = graphene.Decimal()
        materia_seca_porcentaje = graphene.Decimal()
        proteina_porcentaje = graphene.Decimal()
        fibra_porcentaje = graphene.Decimal()
        energia = graphene.String()
        uso_recomendado = graphene.String()
        activo = graphene.Boolean()

    alimento = graphene.Field(AlimentoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, id,
        nombre=None, tipo_alimento=None, contenido_neto=None, unidad_medida=None,
        fecha_vencimiento=None, stock_cantidad=None, stock_minimo=None,
        precio_referencia=None, costo_por_kg=None,
        materia_seca_porcentaje=None, proteina_porcentaje=None, fibra_porcentaje=None,
        energia=None, uso_recomendado=None, activo=None
    ):
        try:
            alimento = Alimento.objects.get(pk=id)
            if stock_cantidad is not None and float(stock_cantidad) < 0:
                return ActualizarAlimento(alimento=None, success=False, message="El stock no puede ser negativo")
            if stock_minimo is not None and float(stock_minimo) < 0:
                return ActualizarAlimento(alimento=None, success=False, message="El stock mínimo no puede ser negativo")
            if precio_referencia is not None and float(precio_referencia) < 0:
                return ActualizarAlimento(alimento=None, success=False, message="El precio no puede ser negativo")
            if costo_por_kg is not None and float(costo_por_kg) < 0:
                return ActualizarAlimento(alimento=None, success=False, message="El costo por kg no puede ser negativo")
            if contenido_neto is not None and float(contenido_neto) < 0:
                return ActualizarAlimento(alimento=None, success=False, message="El contenido neto no puede ser negativo")
            for campo, valor in [
                ('materia seca', materia_seca_porcentaje),
                ('proteína', proteina_porcentaje),
                ('fibra', fibra_porcentaje),
            ]:
                if valor is not None:
                    v = float(valor)
                    if v < 0 or v > 100:
                        return ActualizarAlimento(alimento=None, success=False, message=f"El porcentaje de {campo} debe estar entre 0 y 100")

            if nombre:
                alimento.nombre = nombre
            if tipo_alimento is not None:
                alimento.tipo_alimento = tipo_alimento
            if contenido_neto is not None:
                alimento.contenido_neto = contenido_neto
            if unidad_medida is not None:
                alimento.unidad_medida = unidad_medida
            if fecha_vencimiento is not None:
                alimento.fecha_vencimiento = fecha_vencimiento
            if stock_cantidad is not None:
                alimento.stock_cantidad = stock_cantidad
            if stock_minimo is not None:
                alimento.stock_minimo = stock_minimo
            if precio_referencia is not None:
                alimento.precio_referencia = precio_referencia
            if costo_por_kg is not None:
                alimento.costo_por_kg = costo_por_kg
            if materia_seca_porcentaje is not None:
                alimento.materia_seca_porcentaje = materia_seca_porcentaje
            if proteina_porcentaje is not None:
                alimento.proteina_porcentaje = proteina_porcentaje
            if fibra_porcentaje is not None:
                alimento.fibra_porcentaje = fibra_porcentaje
            if energia is not None:
                alimento.energia = energia
            if uso_recomendado is not None:
                alimento.uso_recomendado = uso_recomendado
            if activo is not None:
                alimento.activo = activo
            alimento.save()
            return ActualizarAlimento(alimento=alimento, success=True, message="Alimento actualizado exitosamente")
        except Exception as e:
            return ActualizarAlimento(alimento=None, success=False, message=str(e))


class EliminarAlimento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            alimento = Alimento.objects.get(pk=id)
            tiene_uso = False
            for attr in ('detalles_compra', 'suministros_animales'):
                try:
                    if getattr(alimento, attr).exists():
                        tiene_uso = True
                        break
                except Exception:
                    pass
            if tiene_uso:
                return EliminarAlimento(
                    success=False,
                    message="No se puede eliminar porque está siendo usado en compras o alimentación animal. Puede inactivarlo."
                )
            nombre = alimento.nombre
            alimento.delete()
            return EliminarAlimento(success=True, message=f"Alimento {nombre} eliminado exitosamente")
        except Exception as e:
            return EliminarAlimento(success=False, message=str(e))


# ==========================================
# MUTATIONS - VACUNA
# ==========================================

class CrearVacuna(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        descripcion = graphene.String()
        enfermedad_previene = graphene.String()
        dosis_recomendada = graphene.String(required=True)
        via_aplicacion = graphene.String(required=True)
        intervalo_dias = graphene.Int()
        edad_minima_meses = graphene.Int()
        stock_cantidad = graphene.Decimal()
        stock_minimo = graphene.Decimal()
        lote = graphene.String()
        fecha_vencimiento = graphene.Date()

    vacuna = graphene.Field(VacunaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, finca_id, nombre, dosis_recomendada, via_aplicacion,
        descripcion=None, enfermedad_previene=None,
        intervalo_dias=365, edad_minima_meses=0,
        stock_cantidad=0, stock_minimo=0, lote=None, fecha_vencimiento=None
    ):
        try:
            from fincas.models import Finca

            if float(stock_cantidad or 0) < 0:
                return CrearVacuna(vacuna=None, success=False, message="El stock no puede ser negativo")
            if float(stock_minimo or 0) < 0:
                return CrearVacuna(vacuna=None, success=False, message="El stock mínimo no puede ser negativo")
            if (edad_minima_meses or 0) < 0:
                return CrearVacuna(vacuna=None, success=False, message="La edad mínima no puede ser negativa")

            finca = Finca.objects.get(pk=finca_id)

            vacuna = Vacuna.objects.create(
                finca=finca,
                nombre=nombre,
                descripcion=descripcion,
                enfermedad_previene=enfermedad_previene,
                dosis_recomendada=dosis_recomendada,
                via_aplicacion=via_aplicacion,
                intervalo_dias=intervalo_dias,
                edad_minima_meses=edad_minima_meses,
                stock_cantidad=stock_cantidad or 0,
                stock_minimo=stock_minimo or 0,
                lote=lote,
                fecha_vencimiento=fecha_vencimiento
            )
            return CrearVacuna(vacuna=vacuna, success=True, message=f"Vacuna '{nombre}' creada exitosamente")
        except Exception as e:
            return CrearVacuna(vacuna=None, success=False, message=str(e))


class ActualizarVacuna(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        descripcion = graphene.String()
        enfermedad_previene = graphene.String()
        dosis_recomendada = graphene.String()
        via_aplicacion = graphene.String()
        intervalo_dias = graphene.Int()
        edad_minima_meses = graphene.Int()
        stock_cantidad = graphene.Decimal()
        stock_minimo = graphene.Decimal()
        lote = graphene.String()
        fecha_vencimiento = graphene.Date()
        activo = graphene.Boolean()

    vacuna = graphene.Field(VacunaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self, info, id,
        nombre=None, descripcion=None, enfermedad_previene=None,
        dosis_recomendada=None, via_aplicacion=None,
        intervalo_dias=None, edad_minima_meses=None,
        stock_cantidad=None, stock_minimo=None,
        lote=None, fecha_vencimiento=None, activo=None
    ):
        try:
            vacuna = Vacuna.objects.get(pk=id)

            if stock_cantidad is not None and float(stock_cantidad) < 0:
                return ActualizarVacuna(vacuna=None, success=False, message="El stock no puede ser negativo")
            if stock_minimo is not None and float(stock_minimo) < 0:
                return ActualizarVacuna(vacuna=None, success=False, message="El stock mínimo no puede ser negativo")
            if edad_minima_meses is not None and edad_minima_meses < 0:
                return ActualizarVacuna(vacuna=None, success=False, message="La edad mínima no puede ser negativa")

            if nombre:
                vacuna.nombre = nombre
            if descripcion is not None:
                vacuna.descripcion = descripcion
            if enfermedad_previene is not None:
                vacuna.enfermedad_previene = enfermedad_previene
            if dosis_recomendada:
                vacuna.dosis_recomendada = dosis_recomendada
            if via_aplicacion:
                vacuna.via_aplicacion = via_aplicacion
            if intervalo_dias is not None:
                vacuna.intervalo_dias = intervalo_dias
            if edad_minima_meses is not None:
                vacuna.edad_minima_meses = edad_minima_meses
            if stock_cantidad is not None:
                vacuna.stock_cantidad = stock_cantidad
            if stock_minimo is not None:
                vacuna.stock_minimo = stock_minimo
            if lote is not None:
                vacuna.lote = lote
            if fecha_vencimiento is not None:
                vacuna.fecha_vencimiento = fecha_vencimiento
            if activo is not None:
                vacuna.activo = activo
            vacuna.save()
            return ActualizarVacuna(vacuna=vacuna, success=True, message="Vacuna actualizada exitosamente")
        except Exception as e:
            return ActualizarVacuna(vacuna=None, success=False, message=str(e))


class EliminarVacuna(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            vacuna = Vacuna.objects.get(pk=id)
            if vacuna.vacunacion_set.exists():
                return EliminarVacuna(success=False, message="No se puede eliminar: la vacuna está asociada a vacunaciones registradas. Inactívela en su lugar.")
            nombre = vacuna.nombre
            vacuna.delete()
            return EliminarVacuna(success=True, message=f"Vacuna '{nombre}' eliminada exitosamente")
        except Exception as e:
            return EliminarVacuna(success=False, message=str(e))


class Mutation(graphene.ObjectType):
    # Razas
    crear_raza = CrearRaza.Field()
    actualizar_raza = ActualizarRaza.Field()
    eliminar_raza = EliminarRaza.Field()

    # Categorías
    crear_categoria_animal = CrearCategoriaAnimal.Field()
    actualizar_categoria_animal = ActualizarCategoriaAnimal.Field()
    eliminar_categoria_animal = EliminarCategoriaAnimal.Field()

    # Veterinarios
    crear_veterinario = CrearVeterinario.Field()
    actualizar_veterinario = ActualizarVeterinario.Field()
    eliminar_veterinario = EliminarVeterinario.Field()

    # Reproductores
    crear_reproductor = CrearReproductor.Field()
    actualizar_reproductor = ActualizarReproductor.Field()
    eliminar_reproductor = EliminarReproductor.Field()

    # Medicamentos
    crear_medicamento = CrearMedicamento.Field()
    actualizar_medicamento = ActualizarMedicamento.Field()
    eliminar_medicamento = EliminarMedicamento.Field()

    # Alimentos
    crear_alimento = CrearAlimento.Field()
    actualizar_alimento = ActualizarAlimento.Field()
    eliminar_alimento = EliminarAlimento.Field()

    # Vacunas
    crear_vacuna = CrearVacuna.Field()
    actualizar_vacuna = ActualizarVacuna.Field()
    eliminar_vacuna = EliminarVacuna.Field()
