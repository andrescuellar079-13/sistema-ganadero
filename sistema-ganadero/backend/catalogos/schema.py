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
        return Medicamento.objects.all()

    @login_required
    def resolve_veterinarios(self, info):
        return Veterinario.objects.all()

    @login_required
    def resolve_alimentos(self, info):
        return Alimento.objects.all()

    @login_required
    def resolve_reproductores(self, info):
        return Reproductor.objects.all()
    
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

    categoria = graphene.Field(CategoriaAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, descripcion=None):
        try:
            categoria = CategoriaAnimal.objects.create(
                nombre=nombre,
                descripcion=descripcion
            )
            return CrearCategoriaAnimal(categoria=categoria, success=True, message=f"Categoría {nombre} creada exitosamente")
        except Exception as e:
            return CrearCategoriaAnimal(categoria=None, success=False, message=str(e))


class ActualizarCategoriaAnimal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        descripcion = graphene.String()
        activo = graphene.Boolean()

    categoria = graphene.Field(CategoriaAnimalType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, nombre=None, descripcion=None, activo=None):
        try:
            categoria = CategoriaAnimal.objects.get(pk=id)
            if nombre:
                categoria.nombre = nombre
            if descripcion:
                categoria.descripcion = descripcion
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

    veterinario = graphene.Field(VeterinarioType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, nombre, apellidos=None, ci=None, especialidad=None, telefono=None, email=None):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            
            veterinario = Veterinario.objects.create(
                finca=finca,
                nombre=nombre,
                apellidos=apellidos,
                ci=ci,
                especialidad=especialidad,
                telefono=telefono,
                email=email
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
        activo = graphene.Boolean()

    veterinario = graphene.Field(VeterinarioType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, nombre=None, apellidos=None, ci=None, especialidad=None, telefono=None, email=None, activo=None):
        try:
            veterinario = Veterinario.objects.get(pk=id)
            if nombre:
                veterinario.nombre = nombre
            if apellidos:
                veterinario.apellidos = apellidos
            if ci:
                veterinario.ci = ci
            if especialidad:
                veterinario.especialidad = especialidad
            if telefono:
                veterinario.telefono = telefono
            if email:
                veterinario.email = email
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
            nombre = veterinario.nombre
            veterinario.delete()
            return EliminarVeterinario(success=True, message=f"Veterinario {nombre} eliminado exitosamente")
        except Exception as e:
            return EliminarVeterinario(success=False, message=str(e))


# ==========================================
# MUTATIONS - REPRODUCTOR (CON OBSERVACIONES)
# ==========================================

class CrearReproductor(graphene.Mutation):
    class Arguments:
        finca_id = graphene.ID(required=True)
        raza_id = graphene.ID()
        codigo = graphene.String(required=True)
        nombre = graphene.String()
        tipo_origen = graphene.String(required=True)
        codigo_pajuela = graphene.String()
        laboratorio = graphene.String()
        observaciones = graphene.String()

    reproductor = graphene.Field(ReproductorType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(
        self,
        info,
        finca_id,
        codigo,
        tipo_origen,
        raza_id=None,
        nombre=None,
        codigo_pajuela=None,
        laboratorio=None,
        observaciones=None
    ):
        try:
            from fincas.models import Finca

            finca = Finca.objects.get(id=finca_id)
            raza = Raza.objects.filter(id=raza_id).first() if raza_id else None

            reproductor = Reproductor.objects.create(
                finca=finca,
                raza=raza,
                codigo=codigo,
                nombre=nombre,
                tipo_origen=tipo_origen,
                codigo_pajuela=codigo_pajuela,
                laboratorio=laboratorio
            )
            return CrearReproductor(reproductor=reproductor, success=True, message=f"Reproductor {codigo} creado exitosamente")
        except Exception as e:
            return CrearReproductor(reproductor=None, success=False, message=str(e))


class ActualizarReproductor(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        activo = graphene.Boolean()

    reproductor = graphene.Field(ReproductorType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, nombre=None, activo=None):
        try:
            reproductor = Reproductor.objects.get(pk=id)
            if nombre:
                reproductor.nombre = nombre
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
        unidad_medida = graphene.String()
        stock_cantidad = graphene.Decimal()
        contenido_neto = graphene.Decimal()
        fecha_vencimiento = graphene.Date()
        precio_compra = graphene.Decimal()
        intervalo_dias = graphene.Int()
        activo = graphene.Boolean()

    medicamento = graphene.Field(MedicamentoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, nombre, tipo_id=None, descripcion=None, laboratorio=None, unidad_medida=None, stock_cantidad=0, contenido_neto=0, fecha_vencimiento=None, precio_compra=0, intervalo_dias=0, activo=True):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)
            tipo = TipoMedicamento.objects.filter(id=tipo_id).first() if tipo_id else None

            medicamento = Medicamento.objects.create(
                finca=finca,
                tipo=tipo,
                nombre=nombre,
                descripcion=descripcion,
                laboratorio=laboratorio,
                unidad_medida=unidad_medida,
                stock_cantidad=stock_cantidad,
                contenido_neto=contenido_neto,
                fecha_vencimiento=fecha_vencimiento,
                precio_compra=precio_compra,
                intervalo_dias=intervalo_dias,
                activo=activo
            )
            return CrearMedicamento(medicamento=medicamento, success=True, message=f"Medicamento {nombre} creado exitosamente")
        except Exception as e:
            return CrearMedicamento(medicamento=None, success=False, message=str(e))


class ActualizarMedicamento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        laboratorio = graphene.String()
        stock_cantidad = graphene.Decimal()
        precio_compra = graphene.Decimal()
        activo = graphene.Boolean()

    medicamento = graphene.Field(MedicamentoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, nombre=None, laboratorio=None, stock_cantidad=None, precio_compra=None, activo=None):
        try:
            medicamento = Medicamento.objects.get(pk=id)
            if nombre:
                medicamento.nombre = nombre
            if laboratorio:
                medicamento.laboratorio = laboratorio
            if stock_cantidad is not None:
                medicamento.stock_cantidad = stock_cantidad
            if precio_compra is not None:
                medicamento.precio_compra = precio_compra
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
        contenido_neto = graphene.Decimal()
        unidad_medida = graphene.String()
        fecha_vencimiento = graphene.Date()
        stock_cantidad = graphene.Decimal()
        precio_referencia = graphene.Decimal()
        activo = graphene.Boolean()

    alimento = graphene.Field(AlimentoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, nombre, contenido_neto=0, unidad_medida=None, fecha_vencimiento=None, stock_cantidad=0, precio_referencia=0, activo=True):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(id=finca_id)

            alimento = Alimento.objects.create(
                finca=finca,
                nombre=nombre,
                contenido_neto=contenido_neto,
                unidad_medida=unidad_medida,
                fecha_vencimiento=fecha_vencimiento,
                stock_cantidad=stock_cantidad,
                precio_referencia=precio_referencia,
                activo=activo
            )
            return CrearAlimento(alimento=alimento, success=True, message=f"Alimento {nombre} creado exitosamente")
        except Exception as e:
            return CrearAlimento(alimento=None, success=False, message=str(e))


class ActualizarAlimento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        stock_cantidad = graphene.Decimal()
        precio_referencia = graphene.Decimal()
        activo = graphene.Boolean()

    alimento = graphene.Field(AlimentoType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, nombre=None, stock_cantidad=None, precio_referencia=None, activo=None):
        try:
            alimento = Alimento.objects.get(pk=id)
            if nombre:
                alimento.nombre = nombre
            if stock_cantidad is not None:
                alimento.stock_cantidad = stock_cantidad
            if precio_referencia is not None:
                alimento.precio_referencia = precio_referencia
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
        dosis_recomendada = graphene.String(required=True)
        via_aplicacion = graphene.String(required=True)
        intervalo_dias = graphene.Int()
        edad_minima_meses = graphene.Int()

    vacuna = graphene.Field(VacunaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_id, nombre, dosis_recomendada, via_aplicacion, descripcion=None, intervalo_dias=365, edad_minima_meses=0):
        try:
            from fincas.models import Finca
            finca = Finca.objects.get(pk=finca_id)
            
            vacuna = Vacuna.objects.create(
                finca=finca,
                nombre=nombre,
                descripcion=descripcion,
                dosis_recomendada=dosis_recomendada,
                via_aplicacion=via_aplicacion,
                intervalo_dias=intervalo_dias,
                edad_minima_meses=edad_minima_meses
            )
            return CrearVacuna(vacuna=vacuna, success=True, message=f"Vacuna '{nombre}' creada exitosamente")
        except Exception as e:
            return CrearVacuna(vacuna=None, success=False, message=str(e))


class ActualizarVacuna(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        descripcion = graphene.String()
        dosis_recomendada = graphene.String()
        via_aplicacion = graphene.String()
        intervalo_dias = graphene.Int()
        activo = graphene.Boolean()

    vacuna = graphene.Field(VacunaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, nombre=None, descripcion=None, dosis_recomendada=None, via_aplicacion=None, intervalo_dias=None, activo=None):
        try:
            vacuna = Vacuna.objects.get(pk=id)
            if nombre:
                vacuna.nombre = nombre
            if descripcion is not None:
                vacuna.descripcion = descripcion
            if dosis_recomendada:
                vacuna.dosis_recomendada = dosis_recomendada
            if via_aplicacion:
                vacuna.via_aplicacion = via_aplicacion
            if intervalo_dias:
                vacuna.intervalo_dias = intervalo_dias
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