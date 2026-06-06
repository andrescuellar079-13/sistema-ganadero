# backend/fincas/schema.py
import graphene
from graphene_django import DjangoObjectType
from graphql_jwt.decorators import login_required

from .models import Finca, TransferenciaFinca, DetalleTransferenciaFinca


# ==========================================
# TYPES
# ==========================================

class FincaType(DjangoObjectType):
    class Meta:
        model = Finca
        fields = "__all__"


class TransferenciaFincaType(DjangoObjectType):
    total_animales = graphene.Int()
    motivo_display = graphene.String()
    estado_display = graphene.String()
    registrado_por_nombre = graphene.String()

    class Meta:
        model = TransferenciaFinca
        fields = "__all__"

    def resolve_total_animales(self, info):
        return self.detalles.count()

    def resolve_motivo_display(self, info):
        return self.get_motivo_display()

    def resolve_estado_display(self, info):
        return self.get_estado_display()

    def resolve_registrado_por_nombre(self, info):
        if self.registrado_por:
            nombre = f"{self.registrado_por.first_name} {self.registrado_por.last_name}".strip()
            return nombre or self.registrado_por.username
        return None


class DetalleTransferenciaType(DjangoObjectType):
    class Meta:
        model = DetalleTransferenciaFinca
        fields = "__all__"


class TransferenciasPaginadasType(graphene.ObjectType):
    resultados = graphene.List(TransferenciaFincaType)
    total = graphene.Int()
    paginas = graphene.Int()
    pagina_actual = graphene.Int()
    tiene_siguiente = graphene.Boolean()
    tiene_anterior = graphene.Boolean()


# ==========================================
# QUERY
# ==========================================

class Query(graphene.ObjectType):
    fincas = graphene.List(FincaType)
    finca = graphene.Field(FincaType, id=graphene.ID(required=True))
    finca_actual = graphene.Field(FincaType)

    # Transferencias
    transferencias_finca = graphene.Field(
        TransferenciasPaginadasType,
        finca_id=graphene.ID(),
        estado=graphene.String(),
        motivo=graphene.String(),
        fecha_desde=graphene.Date(),
        fecha_hasta=graphene.Date(),
        buscar=graphene.String(),
        pagina=graphene.Int(),
        por_pagina=graphene.Int(),
    )
    transferencia_finca = graphene.Field(
        TransferenciaFincaType,
        id=graphene.ID(required=True),
    )
    animales_disponibles_transferencia = graphene.List(
        'animales.schema.AnimalType',
        finca_id=graphene.ID(required=True),
        buscar=graphene.String(),
        categoria_id=graphene.ID(),
        sexo=graphene.String(),
        parcela_id=graphene.ID(),
    )

    # ---- resolvers fincas ----

    def resolve_fincas(self, info):
        return Finca.objects.all()

    def resolve_finca(self, info, id):
        try:
            return Finca.objects.get(id=id)
        except Finca.DoesNotExist:
            return None

    def resolve_finca_actual(self, info):
        user = info.context.user
        if user.is_authenticated and user.finca:
            return user.finca
        return None

    # ---- resolvers transferencias ----

    @login_required
    def resolve_transferencias_finca(
        self, info,
        finca_id=None, estado=None, motivo=None,
        fecha_desde=None, fecha_hasta=None, buscar=None,
        pagina=1, por_pagina=20,
    ):
        from django.db.models import Q
        qs = TransferenciaFinca.objects.select_related(
            'finca_origen', 'finca_destino', 'registrado_por'
        ).prefetch_related('detalles')

        if finca_id:
            qs = qs.filter(Q(finca_origen_id=finca_id) | Q(finca_destino_id=finca_id))
        if estado and estado not in ('', 'TODOS'):
            qs = qs.filter(estado=estado)
        if motivo and motivo not in ('', 'TODOS'):
            qs = qs.filter(motivo=motivo)
        if fecha_desde:
            qs = qs.filter(fecha_transferencia__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_transferencia__lte=fecha_hasta)
        if buscar:
            qs = qs.filter(
                Q(finca_origen__nombre__icontains=buscar) |
                Q(finca_destino__nombre__icontains=buscar) |
                Q(responsable__icontains=buscar) |
                Q(observaciones__icontains=buscar)
            )

        por_pagina = max(1, min(por_pagina or 20, 100))
        total = qs.count()
        paginas = max(1, (total + por_pagina - 1) // por_pagina)
        pagina = max(1, min(pagina or 1, paginas))
        offset = (pagina - 1) * por_pagina

        return TransferenciasPaginadasType(
            resultados=list(qs[offset:offset + por_pagina]),
            total=total,
            paginas=paginas,
            pagina_actual=pagina,
            tiene_siguiente=pagina < paginas,
            tiene_anterior=pagina > 1,
        )

    @login_required
    def resolve_transferencia_finca(self, info, id):
        try:
            return TransferenciaFinca.objects.select_related(
                'finca_origen', 'finca_destino', 'registrado_por'
            ).prefetch_related(
                'detalles__animal__raza',
                'detalles__animal__categoria',
                'detalles__parcela_origen',
                'detalles__parcela_destino',
            ).get(id=id)
        except TransferenciaFinca.DoesNotExist:
            return None

    @login_required
    def resolve_animales_disponibles_transferencia(
        self, info,
        finca_id, buscar=None, categoria_id=None, sexo=None, parcela_id=None,
    ):
        from animales.models import Animal, AnimalParcela
        from django.db.models import Q

        ESTADOS_INVALIDOS = ['VENDIDO', 'MUERTO', 'BAJA', 'DESCARTE', 'MATADERO']
        qs = Animal.objects.filter(
            finca_id=finca_id
        ).exclude(
            estado__in=ESTADOS_INVALIDOS
        ).select_related('raza', 'categoria')

        if buscar:
            qs = qs.filter(
                Q(nro_arete__icontains=buscar) |
                Q(nombre__icontains=buscar) |
                Q(raza__nombre__icontains=buscar) |
                Q(categoria__nombre__icontains=buscar)
            )
        if categoria_id:
            qs = qs.filter(categoria_id=categoria_id)
        if sexo and sexo not in ('', 'TODOS'):
            qs = qs.filter(sexo=sexo)
        if parcela_id:
            qs = qs.filter(
                historial_parcelas__parcela_id=parcela_id,
                historial_parcelas__fecha_salida__isnull=True,
            ).distinct()

        return qs.order_by('nro_arete')


# ==========================================
# MUTATIONS – FINCA (sin cambios)
# ==========================================

class CrearFinca(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        propietario = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        ubicacion = graphene.String()
        telefono = graphene.String()

    finca = graphene.Field(FincaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, nombre, **kwargs):
        try:
            finca = Finca.objects.create(
                nombre=nombre,
                propietario=kwargs.get('propietario'),
                departamento=kwargs.get('departamento'),
                municipio=kwargs.get('municipio'),
                ubicacion=kwargs.get('ubicacion'),
                telefono=kwargs.get('telefono')
            )
            return CrearFinca(finca=finca, success=True, message="Finca creada exitosamente")
        except Exception as e:
            return CrearFinca(finca=None, success=False, message=str(e))


class ActualizarFinca(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        propietario = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        ubicacion = graphene.String()
        telefono = graphene.String()
        activo = graphene.Boolean()

    finca = graphene.Field(FincaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            finca = Finca.objects.get(id=id)
            if kwargs.get('nombre'):
                finca.nombre = kwargs['nombre']
            if kwargs.get('propietario') is not None:
                finca.propietario = kwargs['propietario']
            if kwargs.get('departamento') is not None:
                finca.departamento = kwargs['departamento']
            if kwargs.get('municipio') is not None:
                finca.municipio = kwargs['municipio']
            if kwargs.get('ubicacion') is not None:
                finca.ubicacion = kwargs['ubicacion']
            if kwargs.get('telefono') is not None:
                finca.telefono = kwargs['telefono']
            if kwargs.get('activo') is not None:
                finca.activo = kwargs['activo']
            finca.save()
            return ActualizarFinca(finca=finca, success=True, message="Finca actualizada exitosamente")
        except Exception as e:
            return ActualizarFinca(finca=None, success=False, message=str(e))


class EliminarFinca(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            finca = Finca.objects.get(id=id)
            nombre = finca.nombre
            finca.delete()
            return EliminarFinca(success=True, message=f"Finca '{nombre}' eliminada")
        except Exception as e:
            return EliminarFinca(success=False, message=str(e))


# ==========================================
# MUTATIONS – TRANSFERENCIAS
# ==========================================

class CrearTransferencia(graphene.Mutation):
    class Arguments:
        finca_origen_id  = graphene.ID(required=True)
        finca_destino_id = graphene.ID(required=True)
        fecha_transferencia = graphene.Date(required=True)
        motivo       = graphene.String()
        observaciones = graphene.String()
        responsable   = graphene.String()

    transferencia = graphene.Field(TransferenciaFincaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, finca_origen_id, finca_destino_id, fecha_transferencia, **kwargs):
        try:
            if str(finca_origen_id) == str(finca_destino_id):
                return CrearTransferencia(
                    transferencia=None, success=False,
                    message="La finca origen no puede ser igual a la finca destino."
                )
            finca_origen  = Finca.objects.get(id=finca_origen_id)
            finca_destino = Finca.objects.get(id=finca_destino_id)
            user = info.context.user
            t = TransferenciaFinca.objects.create(
                finca_origen=finca_origen,
                finca_destino=finca_destino,
                fecha_transferencia=fecha_transferencia,
                motivo=kwargs.get('motivo', 'CAMBIO_FINCA'),
                observaciones=kwargs.get('observaciones'),
                responsable=kwargs.get('responsable'),
                registrado_por=user if user.is_authenticated else None,
            )
            return CrearTransferencia(transferencia=t, success=True, message="Transferencia creada en estado Borrador.")
        except Finca.DoesNotExist as e:
            return CrearTransferencia(transferencia=None, success=False, message="Finca no encontrada.")
        except Exception as e:
            return CrearTransferencia(transferencia=None, success=False, message=str(e))


class ActualizarTransferencia(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        finca_origen_id  = graphene.ID()
        finca_destino_id = graphene.ID()
        fecha_transferencia = graphene.Date()
        motivo        = graphene.String()
        observaciones = graphene.String()
        responsable   = graphene.String()

    transferencia = graphene.Field(TransferenciaFincaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        try:
            t = TransferenciaFinca.objects.get(id=id)
            if t.estado != 'BORRADOR':
                return ActualizarTransferencia(
                    transferencia=None, success=False,
                    message="Solo se pueden editar transferencias en estado Borrador."
                )
            if kwargs.get('finca_origen_id'):
                t.finca_origen_id = kwargs['finca_origen_id']
            if kwargs.get('finca_destino_id'):
                t.finca_destino_id = kwargs['finca_destino_id']
            if t.finca_origen_id == t.finca_destino_id:
                return ActualizarTransferencia(
                    transferencia=None, success=False,
                    message="La finca origen no puede ser igual a la finca destino."
                )
            if kwargs.get('fecha_transferencia'):
                t.fecha_transferencia = kwargs['fecha_transferencia']
            if kwargs.get('motivo'):
                t.motivo = kwargs['motivo']
            if 'observaciones' in kwargs:
                t.observaciones = kwargs['observaciones']
            if 'responsable' in kwargs:
                t.responsable = kwargs['responsable']
            t.save()
            return ActualizarTransferencia(transferencia=t, success=True, message="Transferencia actualizada.")
        except TransferenciaFinca.DoesNotExist:
            return ActualizarTransferencia(transferencia=None, success=False, message="Transferencia no encontrada.")
        except Exception as e:
            return ActualizarTransferencia(transferencia=None, success=False, message=str(e))


class AgregarAnimalTransferencia(graphene.Mutation):
    class Arguments:
        transferencia_id   = graphene.ID(required=True)
        animal_id          = graphene.ID(required=True)
        parcela_destino_id = graphene.ID()
        peso_actual        = graphene.Decimal()
        observaciones      = graphene.String()

    detalle = graphene.Field(DetalleTransferenciaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, transferencia_id, animal_id, **kwargs):
        try:
            from animales.models import Animal, AnimalParcela, Parcela

            t = TransferenciaFinca.objects.select_related(
                'finca_origen', 'finca_destino'
            ).get(id=transferencia_id)

            if t.estado != 'BORRADOR':
                return AgregarAnimalTransferencia(
                    detalle=None, success=False,
                    message="Solo se pueden agregar animales a transferencias en estado Borrador."
                )

            # Animal validation
            ESTADOS_INVALIDOS = ['VENDIDO', 'MUERTO', 'BAJA', 'DESCARTE', 'MATADERO']
            animal = Animal.objects.select_related('finca').get(id=animal_id)

            if animal.finca_id != t.finca_origen_id:
                return AgregarAnimalTransferencia(
                    detalle=None, success=False,
                    message=f"El animal {animal.nro_arete} no pertenece a la finca origen."
                )
            if animal.estado in ESTADOS_INVALIDOS:
                labels = {'VENDIDO': 'vendido', 'MUERTO': 'muerto', 'BAJA': 'dado de baja',
                          'DESCARTE': 'en descarte', 'MATADERO': 'en matadero'}
                return AgregarAnimalTransferencia(
                    detalle=None, success=False,
                    message=f"El animal {animal.nro_arete} está {labels.get(animal.estado, animal.estado)} y no puede transferirse."
                )
            if DetalleTransferenciaFinca.objects.filter(
                transferencia=t, animal_id=animal_id
            ).exists():
                return AgregarAnimalTransferencia(
                    detalle=None, success=False,
                    message=f"El animal {animal.nro_arete} ya está en esta transferencia."
                )

            # Parcela destino validation
            parcela_destino = None
            parcela_destino_id = kwargs.get('parcela_destino_id')
            if parcela_destino_id:
                parcela_destino = Parcela.objects.get(id=parcela_destino_id)
                if parcela_destino.finca_id != t.finca_destino_id:
                    return AgregarAnimalTransferencia(
                        detalle=None, success=False,
                        message="La parcela destino no pertenece a la finca destino."
                    )
                if parcela_destino.estado == 'DESCANSO':
                    return AgregarAnimalTransferencia(
                        detalle=None, success=False,
                        message="La parcela destino está en descanso y no puede recibir animales."
                    )
                ocupacion = AnimalParcela.objects.filter(
                    parcela=parcela_destino, fecha_salida__isnull=True
                ).count()
                if parcela_destino.capacidad_maxima > 0 and ocupacion >= parcela_destino.capacidad_maxima:
                    return AgregarAnimalTransferencia(
                        detalle=None, success=False,
                        message=f"La parcela destino no tiene capacidad disponible ({ocupacion}/{parcela_destino.capacidad_maxima})."
                    )

            # Current parcela as parcela_origen
            parcela_origen_id = AnimalParcela.objects.filter(
                animal=animal, fecha_salida__isnull=True
            ).values_list('parcela_id', flat=True).first()

            detalle = DetalleTransferenciaFinca.objects.create(
                transferencia=t,
                animal=animal,
                parcela_origen_id=parcela_origen_id,
                parcela_destino=parcela_destino,
                estado_animal_antes=animal.estado,
                peso_actual_transferencia=kwargs.get('peso_actual') or animal.peso,
                observaciones=kwargs.get('observaciones'),
            )
            return AgregarAnimalTransferencia(detalle=detalle, success=True, message="Animal agregado.")
        except (TransferenciaFinca.DoesNotExist, Animal.DoesNotExist, Parcela.DoesNotExist) as e:
            return AgregarAnimalTransferencia(detalle=None, success=False, message=str(e))
        except Exception as e:
            return AgregarAnimalTransferencia(detalle=None, success=False, message=str(e))


class ActualizarDetalleTransferencia(graphene.Mutation):
    class Arguments:
        detalle_id         = graphene.ID(required=True)
        parcela_destino_id = graphene.ID()
        peso_actual        = graphene.Decimal()
        observaciones      = graphene.String()

    detalle = graphene.Field(DetalleTransferenciaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, detalle_id, **kwargs):
        try:
            from animales.models import AnimalParcela, Parcela

            detalle = DetalleTransferenciaFinca.objects.select_related(
                'transferencia__finca_destino'
            ).get(id=detalle_id)

            if detalle.transferencia.estado != 'BORRADOR':
                return ActualizarDetalleTransferencia(
                    detalle=None, success=False,
                    message="Solo se pueden editar detalles de transferencias en Borrador."
                )

            parcela_destino_id = kwargs.get('parcela_destino_id')
            if parcela_destino_id is not None:
                if parcela_destino_id == '' or parcela_destino_id == 0:
                    detalle.parcela_destino = None
                else:
                    parcela_destino = Parcela.objects.get(id=parcela_destino_id)
                    if parcela_destino.finca_id != detalle.transferencia.finca_destino_id:
                        return ActualizarDetalleTransferencia(
                            detalle=None, success=False,
                            message="La parcela destino no pertenece a la finca destino."
                        )
                    ocupacion = AnimalParcela.objects.filter(
                        parcela=parcela_destino, fecha_salida__isnull=True
                    ).count()
                    if parcela_destino.capacidad_maxima > 0 and ocupacion >= parcela_destino.capacidad_maxima:
                        return ActualizarDetalleTransferencia(
                            detalle=None, success=False,
                            message="La parcela destino no tiene capacidad disponible."
                        )
                    detalle.parcela_destino = parcela_destino

            if kwargs.get('peso_actual') is not None:
                detalle.peso_actual_transferencia = kwargs['peso_actual']
            if 'observaciones' in kwargs:
                detalle.observaciones = kwargs['observaciones']

            detalle.save()
            return ActualizarDetalleTransferencia(detalle=detalle, success=True, message="Detalle actualizado.")
        except Exception as e:
            return ActualizarDetalleTransferencia(detalle=None, success=False, message=str(e))


class QuitarAnimalTransferencia(graphene.Mutation):
    class Arguments:
        detalle_id = graphene.ID(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, detalle_id):
        try:
            detalle = DetalleTransferenciaFinca.objects.select_related('transferencia').get(id=detalle_id)
            if detalle.transferencia.estado != 'BORRADOR':
                return QuitarAnimalTransferencia(
                    success=False,
                    message="Solo se pueden quitar animales de transferencias en Borrador."
                )
            detalle.delete()
            return QuitarAnimalTransferencia(success=True, message="Animal removido de la transferencia.")
        except Exception as e:
            return QuitarAnimalTransferencia(success=False, message=str(e))


class ConfirmarTransferencia(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    transferencia = graphene.Field(TransferenciaFincaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        from django.db import transaction
        from django.utils import timezone
        from animales.models import Animal, AnimalParcela, MovimientoAnimal

        try:
            with transaction.atomic():
                t = TransferenciaFinca.objects.select_for_update().select_related(
                    'finca_origen', 'finca_destino'
                ).get(id=id)

                if t.estado != 'BORRADOR':
                    return ConfirmarTransferencia(
                        transferencia=None, success=False,
                        message="Solo se pueden confirmar transferencias en estado Borrador."
                    )

                detalles = list(t.detalles.select_related(
                    'animal', 'parcela_destino'
                ).all())

                if not detalles:
                    return ConfirmarTransferencia(
                        transferencia=None, success=False,
                        message="Debe agregar al menos un animal antes de confirmar."
                    )

                ESTADOS_INVALIDOS = ['VENDIDO', 'MUERTO', 'BAJA', 'DESCARTE', 'MATADERO']
                fecha = t.fecha_transferencia
                user = info.context.user

                for detalle in detalles:
                    animal = detalle.animal

                    if animal.finca_id != t.finca_origen_id:
                        return ConfirmarTransferencia(
                            transferencia=None, success=False,
                            message=f"El animal {animal.nro_arete} ya no pertenece a la finca origen."
                        )
                    if animal.estado in ESTADOS_INVALIDOS:
                        return ConfirmarTransferencia(
                            transferencia=None, success=False,
                            message=f"El animal {animal.nro_arete} está en estado {animal.estado} y no puede transferirse."
                        )

                    # 1. Cerrar registro activo de AnimalParcela en finca origen
                    AnimalParcela.objects.filter(
                        animal=animal, fecha_salida__isnull=True
                    ).update(fecha_salida=fecha)

                    # 2. Crear nuevo AnimalParcela en parcela destino si fue seleccionada
                    if detalle.parcela_destino:
                        if detalle.parcela_destino.finca_id != t.finca_destino_id:
                            return ConfirmarTransferencia(
                                transferencia=None, success=False,
                                message=f"La parcela destino del animal {animal.nro_arete} no pertenece a la finca destino."
                            )
                        ocupacion = AnimalParcela.objects.filter(
                            parcela=detalle.parcela_destino, fecha_salida__isnull=True
                        ).count()
                        if (detalle.parcela_destino.capacidad_maxima > 0 and
                                ocupacion >= detalle.parcela_destino.capacidad_maxima):
                            return ConfirmarTransferencia(
                                transferencia=None, success=False,
                                message=f"La parcela destino del animal {animal.nro_arete} no tiene capacidad disponible."
                            )
                        AnimalParcela.objects.create(
                            animal=animal,
                            parcela=detalle.parcela_destino,
                            fecha_ingreso=fecha,
                        )
                        detalle.parcela_destino.estado = 'OCUPADO'
                        detalle.parcela_destino.save(update_fields=['estado'])

                    # 3. Cambiar animal.finca a finca_destino
                    detalle.estado_animal_antes = animal.estado
                    animal.finca = t.finca_destino
                    animal.save(update_fields=['finca'])
                    detalle.estado_animal_despues = animal.estado
                    detalle.recibido = True
                    detalle.save(update_fields=['estado_animal_antes', 'estado_animal_despues', 'recibido'])

                    # 4. Registrar movimiento tipo TRANSFERENCIA_FINCA
                    MovimientoAnimal.objects.create(
                        finca=t.finca_origen,
                        finca_destino=t.finca_destino,
                        animal=animal,
                        parcela_origen=detalle.parcela_origen,
                        parcela_destino=detalle.parcela_destino,
                        fecha_movimiento=fecha,
                        motivo='TRANSFERENCIA_FINCA',
                        observaciones=(
                            f"Transferencia a {t.finca_destino.nombre}."
                            + (f" {t.observaciones}" if t.observaciones else "")
                        ),
                        registrado_por=user if user.is_authenticated else None,
                    )

                t.estado = 'CONFIRMADA'
                t.fecha_confirmacion = timezone.now()
                t.save(update_fields=['estado', 'fecha_confirmacion'])

                return ConfirmarTransferencia(
                    transferencia=t, success=True,
                    message=f"Transferencia confirmada. {len(detalles)} animal(es) trasladado(s) a {t.finca_destino.nombre}."
                )

        except TransferenciaFinca.DoesNotExist:
            return ConfirmarTransferencia(transferencia=None, success=False, message="Transferencia no encontrada.")
        except Exception as e:
            return ConfirmarTransferencia(transferencia=None, success=False, message=str(e))


class CancelarTransferencia(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    transferencia = graphene.Field(TransferenciaFincaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            t = TransferenciaFinca.objects.get(id=id)
            if t.estado == 'RECIBIDA':
                return CancelarTransferencia(
                    transferencia=None, success=False,
                    message="No se puede cancelar una transferencia ya recibida."
                )
            if t.estado == 'CANCELADA':
                return CancelarTransferencia(
                    transferencia=None, success=False,
                    message="La transferencia ya está cancelada."
                )
            t.estado = 'CANCELADA'
            t.save(update_fields=['estado'])
            return CancelarTransferencia(transferencia=t, success=True, message="Transferencia cancelada.")
        except TransferenciaFinca.DoesNotExist:
            return CancelarTransferencia(transferencia=None, success=False, message="Transferencia no encontrada.")
        except Exception as e:
            return CancelarTransferencia(transferencia=None, success=False, message=str(e))


class MarcarTransferenciaRecibida(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    transferencia = graphene.Field(TransferenciaFincaType)
    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, id):
        try:
            t = TransferenciaFinca.objects.get(id=id)
            if t.estado != 'CONFIRMADA':
                return MarcarTransferenciaRecibida(
                    transferencia=None, success=False,
                    message="Solo se pueden marcar como recibidas las transferencias confirmadas."
                )
            t.estado = 'RECIBIDA'
            t.save(update_fields=['estado'])
            return MarcarTransferenciaRecibida(transferencia=t, success=True, message="Transferencia marcada como recibida.")
        except TransferenciaFinca.DoesNotExist:
            return MarcarTransferenciaRecibida(transferencia=None, success=False, message="Transferencia no encontrada.")
        except Exception as e:
            return MarcarTransferenciaRecibida(transferencia=None, success=False, message=str(e))


# ==========================================
# MUTATION PRINCIPAL
# ==========================================

class Mutation(graphene.ObjectType):
    crear_finca       = CrearFinca.Field()
    actualizar_finca  = ActualizarFinca.Field()
    eliminar_finca    = EliminarFinca.Field()

    crear_transferencia            = CrearTransferencia.Field()
    actualizar_transferencia       = ActualizarTransferencia.Field()
    agregar_animal_transferencia   = AgregarAnimalTransferencia.Field()
    actualizar_detalle_transferencia = ActualizarDetalleTransferencia.Field()
    quitar_animal_transferencia    = QuitarAnimalTransferencia.Field()
    confirmar_transferencia        = ConfirmarTransferencia.Field()
    cancelar_transferencia         = CancelarTransferencia.Field()
    marcar_transferencia_recibida  = MarcarTransferenciaRecibida.Field()
