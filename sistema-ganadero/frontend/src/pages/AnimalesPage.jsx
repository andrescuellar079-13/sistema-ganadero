import { useState } from 'react'
import { useAnimales }          from '../hooks/useAnimales'
import { useAnimalesPaginados } from '../hooks/useAnimalesPaginados'
import { useParcelas }          from '../hooks/useParcelas'
import { useFincas }            from '../hooks/useFincas'
import LoadingSpinner           from '../components/LoadingSpinner'
import ErrorMessage             from '../components/ErrorMessage'
import PageAlert                from '../components/ui/PageAlert'
import ConfirmDialog            from '../components/ui/ConfirmDialog'
import StatusChip               from '../components/ui/StatusChip'
import EmptyState               from '../components/ui/EmptyState'
import AnimalForm               from '../components/AnimalForm'
import AnimalDetailModal        from '../components/AnimalDetailModal'
import ParcelaForm              from '../components/ParcelaForm'
import MoverAnimalForm          from '../components/MoverAnimalForm'
import ReportesButtons          from '../components/ReportesButtons'
import AnimalSearchBar          from '../components/AnimalSearchBar'
import AnimalFilters            from '../components/AnimalFilters'
import AnimalSortSelect         from '../components/AnimalSortSelect'
import AnimalPagination         from '../components/AnimalPagination'
import ParcelaFilters           from '../components/ParcelaFilters'
import ParcelaSortSelect        from '../components/ParcelaSortSelect'
import PaginationControls       from '../components/PaginationControls'
import { useParcelasPaginadas } from '../hooks/useParcelasPaginadas'
import { generarPDFAnimales, generarExcelAnimales } from '../services/reportesService'

import {
  Box, Card, CardContent, CardActions, Paper, CircularProgress,
  Typography, Tabs, Tab, Chip, IconButton, Tooltip, Button, Grid,
} from '@mui/material'
import PetsOutlinedIcon         from '@mui/icons-material/PetsOutlined'
import LocationOnOutlinedIcon   from '@mui/icons-material/LocationOnOutlined'
import EditOutlinedIcon         from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon       from '@mui/icons-material/DeleteOutlined'
import AddOutlinedIcon          from '@mui/icons-material/AddOutlined'
import InfoOutlinedIcon         from '@mui/icons-material/InfoOutlined'
import GrassOutlinedIcon        from '@mui/icons-material/GrassOutlined'
import ExitToAppOutlinedIcon    from '@mui/icons-material/ExitToAppOutlined'
import RestartAltIcon           from '@mui/icons-material/RestartAlt'

export default function AnimalesPage() {
  const { animales: todosAnimales, razas, categorias, crearAnimal, actualizarAnimal, eliminarAnimal } = useAnimales()
  const { parcelas, crearParcela, actualizarParcela, eliminarParcela, moverAnimalAParcela, sacarAnimalDeParcela, loading: loadingP } = useParcelas()
  const { fincaActual } = useFincas()

  const fincaId = fincaActual?.id || null

  const {
    animales, total, paginas, paginaActual, tieneSiguiente, tieneAnterior,
    loading: loadingAnimales, error: errorAnimales,
    buscar, estado, ordenar, porPagina,
    irAPagina, cambiarBusqueda, cambiarEstado, cambiarOrden, cambiarPorPagina, limpiarFiltros,
    refetch: refetchPaginados,
  } = useAnimalesPaginados(fincaId)

  const {
    parcelas: parcelasPaginadas,
    count: countParcelas,
    page: pageParcelas,
    totalPages: totalPagesParcelas,
    hasNext: hasNextParcelas,
    hasPrevious: hasPreviousParcelas,
    loading: loadingParcelasPaginadas,
    buscar: buscarParcela,
    estado: estadoParcela,
    temporal: temporalParcela,
    ordering: orderingParcela,
    irAPagina: irAPaginaParcela,
    cambiarBusqueda: cambiarBusquedaParcela,
    cambiarEstado: cambiarEstadoParcela,
    cambiarTemporal: cambiarTemporalParcela,
    cambiarOrdering: cambiarOrderingParcela,
    limpiarFiltros: limpiarFiltrosParcela,
    refetch: refetchParcelasPaginadas,
  } = useParcelasPaginadas(fincaId)

  const hayFiltrosParcelaActivos = buscarParcela || estadoParcela || temporalParcela || orderingParcela

  const [tabIdx, setTabIdx]                 = useState(0)
  const [showAnimalForm, setShowAnimalForm]   = useState(false)
  const [showParcelaForm, setShowParcelaForm] = useState(false)
  const [showMoverForm, setShowMoverForm]    = useState(false)
  const [editAnimal, setEditAnimal]          = useState(null)
  const [editParcela, setEditParcela]        = useState(null)
  const [selectedAnimal, setSelectedAnimal]  = useState(null)
  const [message, setMessage]               = useState(null)
  const [confirmAnimalId, setConfirmAnimalId] = useState(null)
  const [confirmParcelaId, setConfirmParcelaId] = useState(null)
  const [confirmName, setConfirmName]       = useState('')
  const [confirmSacarId, setConfirmSacarId]  = useState(null)
  const [reporteLoading, setReporteLoading]  = useState(false)
  const [detailAnimalId, setDetailAnimalId]  = useState(null)

  const notify = (r) => {
    setMessage({ type: r.success ? 'success' : 'error', text: r.message })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleCreateAnimal = async (data) => {
    const r = await crearAnimal(data)
    notify(r)
    if (r.success) { setShowAnimalForm(false); setEditAnimal(null); refetchPaginados() }
  }
  const handleUpdateAnimal = async (data) => {
    const r = await actualizarAnimal(editAnimal.id, data)
    notify(r)
    if (r.success) { setShowAnimalForm(false); setEditAnimal(null); refetchPaginados() }
  }
  const handleDeleteAnimal = async () => {
    const r = await eliminarAnimal(confirmAnimalId)
    notify(r)
    setConfirmAnimalId(null)
    if (r.success) refetchPaginados()
  }

  const handleCreateParcela = async (data) => {
    const r = await crearParcela(data)
    notify(r)
    if (r.success) { setShowParcelaForm(false); setEditParcela(null); refetchParcelasPaginadas() }
  }
  const handleUpdateParcela = async (data) => {
    const r = await actualizarParcela(editParcela.id, data)
    notify(r)
    if (r.success) { setShowParcelaForm(false); setEditParcela(null); refetchParcelasPaginadas() }
  }
  const handleDeleteParcela = async () => {
    const r = await eliminarParcela(confirmParcelaId)
    notify(r)
    setConfirmParcelaId(null)
    if (r.success) refetchParcelasPaginadas()
  }
  const handleMoverAnimal = async (data) => {
    const r = await moverAnimalAParcela(data)
    notify(r)
    if (r.success) { setShowMoverForm(false); setSelectedAnimal(null); refetchParcelasPaginadas() }
  }
  const handleSacarAnimal = async () => {
    const r = await sacarAnimalDeParcela(confirmSacarId, new Date().toISOString().split('T')[0])
    notify(r)
    setConfirmSacarId(null)
    if (r.success) refetchParcelasPaginadas()
  }

  const handlePDF = async () => {
    setReporteLoading(true)
    try { generarPDFAnimales(todosAnimales, fincaActual?.nombre || 'Mi Finca') } catch (e) { console.error(e) }
    setReporteLoading(false)
  }
  const handleExcel = async () => {
    setReporteLoading(true)
    try { generarExcelAnimales(todosAnimales, fincaActual?.nombre || 'Mi Finca') } catch (e) { console.error(e) }
    setReporteLoading(false)
  }

  const hayFiltrosActivos = buscar || estado || (ordenar && ordenar !== 'recientes')

  if (errorAnimales) return <ErrorMessage message={errorAnimales.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Gestión Ganadera</Typography>
          <Typography variant="body2" color="text.secondary">
            Animales y parcelas de la finca
          </Typography>
        </Box>
        {tabIdx === 0 && (
          <ReportesButtons onPDF={handlePDF} onExcel={handleExcel} loading={reporteLoading} />
        )}
      </Box>

      <PageAlert message={message} onClose={() => setMessage(null)} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)}>
          <Tab
            icon={<PetsOutlinedIcon sx={{ fontSize: 17 }} />} iconPosition="start"
            label={`Animales (${total.toLocaleString('es-PY')})`}
            sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500 }}
          />
          <Tab
            icon={<GrassOutlinedIcon sx={{ fontSize: 17 }} />} iconPosition="start"
            label={`Parcelas (${countParcelas.toLocaleString('es-PY')})`}
            sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500 }}
          />
        </Tabs>
      </Box>

      {/* ── ANIMALES ── */}
      {tabIdx === 0 && (
        <>
          {/* Toolbar: búsqueda + ordenamiento + limpiar + botón nuevo */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <AnimalSearchBar value={buscar} onChange={cambiarBusqueda} />
            </Box>
            <AnimalSortSelect value={ordenar} onChange={cambiarOrden} />
            {hayFiltrosActivos && (
              <Tooltip title="Limpiar todos los filtros">
                <Button
                  size="small" variant="outlined" color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={limpiarFiltros}
                  sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  Limpiar
                </Button>
              </Tooltip>
            )}
            <Button
              variant="contained" size="small" startIcon={<AddOutlinedIcon />}
              onClick={() => { setEditAnimal(null); setShowAnimalForm(true) }}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Nuevo Animal
            </Button>
          </Box>

          {/* Filtros de estado */}
          <AnimalFilters
            estado={estado}
            onEstado={cambiarEstado}
          />

          {/* Grid de tarjetas */}
          {loadingAnimales && animales.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={40} />
            </Box>
          ) : animales.length === 0 ? (
            hayFiltrosActivos ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No se encontraron resultados
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                  Intentá con otros filtros o términos de búsqueda.
                </Typography>
                <Button variant="outlined" size="small" onClick={limpiarFiltros} startIcon={<RestartAltIcon />}>
                  Limpiar filtros
                </Button>
              </Box>
            ) : (
              <EmptyState
                icon={PetsOutlinedIcon} title="No hay animales registrados"
                description="Creá el primer animal de la finca."
                onAction={() => setShowAnimalForm(true)} actionLabel="Crear animal"
              />
            )
          ) : (
            <Box sx={{ position: 'relative' }}>
              {loadingAnimales && (
                <Box sx={{
                  position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)',
                  zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 2,
                }}>
                  <CircularProgress size={32} />
                </Box>
              )}
              <Grid container spacing={2}>
                {animales.map(animal => (
                  <Grid item xs={12} sm={6} lg={4} key={animal.id}>
                    <Card elevation={0} sx={{
                      border: '1px solid #E2E8F0', borderRadius: 2,
                      height: '100%', display: 'flex', flexDirection: 'column',
                      transition: 'box-shadow .2s',
                      '&:hover': { boxShadow: 3 },
                    }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                              #{animal.nroArete}
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {animal.nombre || 'Sin nombre'}
                            </Typography>
                          </Box>
                          <StatusChip value={animal.estado} />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, mt: 1 }}>
                          {[
                            ['Raza',       animal.raza?.nombre || 'N/A'],
                            ['Categoría',  animal.categoria?.nombre || 'N/A'],
                            ['Peso',       animal.peso ? `${animal.peso} kg` : 'N/A'],
                            ['Sexo',       animal.sexo === 'MACHO' ? 'Macho' : 'Hembra'],
                            ['Nacimiento', animal.fechaNacimiento
                              ? new Date(animal.fechaNacimiento).toLocaleDateString('es-PY') : 'N/A'],
                            ['Origen',     { NACIDO_FINCA: 'Nacido', COMPRADO: 'Comprado', DONADO: 'Donado' }[animal.origen] || 'N/A'],
                          ].map(([k, v]) => (
                            <Box key={k}>
                              <Typography variant="caption" color="text.secondary">{k}</Typography>
                              <Typography variant="body2" fontWeight={500}>{v}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                      <CardActions sx={{ pt: 0, gap: 0.5, flexWrap: 'wrap' }}>
                        <Button
                          size="small" variant="outlined" color="info"
                          startIcon={<LocationOnOutlinedIcon />}
                          onClick={() => { setSelectedAnimal(animal); setShowMoverForm(true) }}
                          sx={{ fontSize: 11, textTransform: 'none' }}
                        >
                          Mover a Parcela
                        </Button>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" color="primary"
                            onClick={() => setDetailAnimalId(animal.id)}>
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="warning"
                            onClick={() => { setEditAnimal(animal); setShowAnimalForm(true) }}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error"
                            onClick={() => { setConfirmAnimalId(animal.id); setConfirmName(animal.nombre || animal.nroArete) }}>
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Paginación */}
          <AnimalPagination
            total={total}
            paginas={paginas}
            paginaActual={paginaActual}
            tieneSiguiente={tieneSiguiente}
            tieneAnterior={tieneAnterior}
            porPagina={porPagina}
            onPagina={irAPagina}
            onPorPagina={cambiarPorPagina}
            loading={loadingAnimales}
          />
        </>
      )}

      {/* ── PARCELAS ── */}
      {tabIdx === 1 && (
        <>
          {/* Toolbar: búsqueda + ordenamiento + limpiar + botón nuevo */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <AnimalSearchBar
                value={buscarParcela}
                onChange={cambiarBusquedaParcela}
                placeholder="Buscar por parcela, estado, pastura, animal u ocupación..."
              />
            </Box>
            <ParcelaSortSelect value={orderingParcela} onChange={cambiarOrderingParcela} />
            {hayFiltrosParcelaActivos && (
              <Tooltip title="Limpiar todos los filtros">
                <Button
                  size="small" variant="outlined" color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={limpiarFiltrosParcela}
                  sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  Limpiar
                </Button>
              </Tooltip>
            )}
            <Button
              variant="contained" size="small" startIcon={<AddOutlinedIcon />}
              onClick={() => { setEditParcela(null); setShowParcelaForm(true) }}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Nueva Parcela
            </Button>
          </Box>

          {/* Filtros de estado y período */}
          <ParcelaFilters
            estado={estadoParcela}
            temporal={temporalParcela}
            onEstado={cambiarEstadoParcela}
            onTemporal={cambiarTemporalParcela}
          />

          {/* Contenido: loading / vacío / grid */}
          {loadingParcelasPaginadas && parcelasPaginadas.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={40} />
            </Box>
          ) : parcelasPaginadas.length === 0 ? (
            hayFiltrosParcelaActivos ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No se encontraron resultados
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                  Intentá con otros filtros o términos de búsqueda.
                </Typography>
                <Button variant="outlined" size="small" onClick={limpiarFiltrosParcela} startIcon={<RestartAltIcon />}>
                  Limpiar filtros
                </Button>
              </Box>
            ) : (
              <EmptyState icon={GrassOutlinedIcon} title="No hay parcelas registradas"
                description="Creá la primera parcela."
                onAction={() => setShowParcelaForm(true)} actionLabel="Crear parcela" />
            )
          ) : (
            <Box sx={{ position: 'relative' }}>
              {loadingParcelasPaginadas && (
                <Box sx={{
                  position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)',
                  zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 2,
                }}>
                  <CircularProgress size={32} />
                </Box>
              )}
              <Grid container spacing={2}>
                {parcelasPaginadas.map(parcela => (
                  <Grid item xs={12} md={6} key={parcela.id}>
                    <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ background: 'linear-gradient(135deg,#2E7D32,#1B5E20)', px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#fff">{parcela.nombre}</Typography>
                        <StatusChip value={parcela.estado} />
                      </Box>
                      <CardContent>
                        <Grid container spacing={1} sx={{ mb: 1.5 }}>
                          {[
                            ['Tamaño',    `${parcela.tamano} ha`],
                            ['Capacidad', `${parcela.capacidadMaxima} animales`],
                            ['Pastura',   parcela.tipoPastura || 'N/A'],
                            ['Ocupación', `${parcela.ocupacionActual ?? parcela.animalesActuales?.length ?? 0} / ${parcela.capacidadMaxima}`],
                          ].map(([k, v]) => (
                            <Grid item xs={6} key={k}>
                              <Typography variant="caption" color="text.secondary">{k}</Typography>
                              <Typography variant="body2" fontWeight={600}>{v}</Typography>
                            </Grid>
                          ))}
                        </Grid>

                        {(() => {
                          const ocu = parcela.ocupacionActual ?? parcela.animalesActuales?.length ?? 0
                          const cap = parcela.capacidadMaxima
                          if (!cap) return null
                          if (ocu > cap) return <Chip label="Sobreocupado" size="small" color="error" sx={{ mb: 1 }} />
                          if (ocu >= cap) return <Chip label="Capacidad completa" size="small" color="warning" sx={{ mb: 1 }} />
                          return null
                        })()}

                        {parcela.animalesActuales?.length > 0 && (
                          <Box sx={{ borderTop: '1px solid #F1F5F9', pt: 1.5 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary"
                              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Animales actuales
                            </Typography>
                            {parcela.animalesActuales.map(item => (
                              <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC', borderRadius: 1, p: 0.75, mt: 0.75 }}>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>{item.animal?.nroArete}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Desde: {new Date(item.fechaIngreso).toLocaleDateString('es-PY')}
                                  </Typography>
                                </Box>
                                <Tooltip title="Retirar animal">
                                  <IconButton size="small" color="error" onClick={() => setConfirmSacarId(item.id)}>
                                    <ExitToAppOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ))}
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" color="warning"
                              onClick={() => { setEditParcela(parcela); setShowParcelaForm(true) }}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error"
                              onClick={() => { setConfirmParcelaId(parcela.id); setConfirmName(parcela.nombre) }}>
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Paginación inferior */}
          <PaginationControls
            count={countParcelas}
            totalPages={totalPagesParcelas}
            page={pageParcelas}
            hasNext={hasNextParcelas}
            hasPrevious={hasPreviousParcelas}
            onPage={irAPaginaParcela}
            loading={loadingParcelasPaginadas}
            label="parcelas"
          />
        </>
      )}

      {/* Form overlays */}
      {showAnimalForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <AnimalForm
              animal={editAnimal} razas={razas} categorias={categorias}
              fincaId={fincaId}
              onSubmit={editAnimal ? handleUpdateAnimal : handleCreateAnimal}
              onCancel={() => { setShowAnimalForm(false); setEditAnimal(null) }}
            />
          </div>
        </div>
      )}
      {showParcelaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <ParcelaForm
              parcelaParaEditar={editParcela}
              onSubmit={editParcela ? handleUpdateParcela : handleCreateParcela}
              onCancel={() => { setShowParcelaForm(false); setEditParcela(null) }}
            />
          </div>
        </div>
      )}
      {showMoverForm && selectedAnimal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <MoverAnimalForm
              animal={selectedAnimal}
              fincaId={fincaId}
              onSubmit={handleMoverAnimal}
              onCancel={() => { setShowMoverForm(false); setSelectedAnimal(null) }}
            />
          </div>
        </div>
      )}

      <AnimalDetailModal
        animalId={detailAnimalId}
        onClose={() => setDetailAnimalId(null)}
      />

      <ConfirmDialog open={!!confirmAnimalId} onClose={() => setConfirmAnimalId(null)} onConfirm={handleDeleteAnimal}
        title="¿Eliminar animal?" message={`¿Eliminar a "${confirmName}"? Esta acción no se puede deshacer.`} />
      <ConfirmDialog open={!!confirmParcelaId} onClose={() => setConfirmParcelaId(null)} onConfirm={handleDeleteParcela}
        title="¿Eliminar parcela?" message={`¿Eliminar la parcela "${confirmName}"? Esta acción no se puede deshacer.`} />
      <ConfirmDialog open={!!confirmSacarId} onClose={() => setConfirmSacarId(null)} onConfirm={handleSacarAnimal}
        title="¿Retirar animal de la parcela?" message="El animal saldrá de la parcela con fecha de hoy." />
    </Box>
  )
}
