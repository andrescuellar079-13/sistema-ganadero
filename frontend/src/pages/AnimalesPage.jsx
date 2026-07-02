// frontend/src/pages/AnimalesPage.jsx
import { useState }            from 'react'
import { useApolloClient }      from '@apollo/client'
import { GET_ANIMAL_DETALLE }   from '../graphql/animales'
import {
  buildAnimalReportData,
  generarPDFAnimalCompleto,
  generarExcelAnimalCompleto,
} from '../services/fichaAnimalService'
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
import ExportarAnimalesModal    from '../components/ExportarAnimalesModal'
import ImportarAnimalesModal    from '../components/ImportarAnimalesModal'
import AnimalSearchBar          from '../components/AnimalSearchBar'
import AnimalFilters            from '../components/AnimalFilters'
import AnimalSortSelect         from '../components/AnimalSortSelect'
import AnimalPagination         from '../components/AnimalPagination'
import ParcelaFilters           from '../components/ParcelaFilters'
import ParcelaSortSelect        from '../components/ParcelaSortSelect'
import PaginationControls       from '../components/PaginationControls'
import { useParcelasPaginadas } from '../hooks/useParcelasPaginadas'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Tabs, Tab, Chip, IconButton, Tooltip, Button, CircularProgress,
} from '@mui/material'
import PetsOutlinedIcon         from '@mui/icons-material/PetsOutlined'
import LocationOnOutlinedIcon   from '@mui/icons-material/LocationOnOutlined'
import EditOutlinedIcon         from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon       from '@mui/icons-material/DeleteOutlined'
import AddOutlinedIcon          from '@mui/icons-material/AddOutlined'
import InfoOutlinedIcon         from '@mui/icons-material/InfoOutlined'
import GrassOutlinedIcon        from '@mui/icons-material/GrassOutlined'
import RestartAltIcon           from '@mui/icons-material/RestartAlt'
import FileUploadOutlinedIcon   from '@mui/icons-material/FileUploadOutlined'
import PictureAsPdfIcon         from '@mui/icons-material/PictureAsPdf'
import TableChartIcon           from '@mui/icons-material/TableChart'

export default function AnimalesPage() {
  const { razas, categorias, crearAnimal, actualizarAnimal, eliminarAnimal } = useAnimales()
  const { parcelas, crearParcela, actualizarParcela, eliminarParcela, moverAnimalAParcela, sacarAnimalDeParcela, loading: loadingP } = useParcelas()
  const { fincaActual } = useFincas()
  const apolloClient = useApolloClient()

  const fincaId = fincaActual?.id || null

  const {
    animales, total, paginas, paginaActual, tieneSiguiente, tieneAnterior,
    loading: loadingAnimales, error: errorAnimales,
    buscar, estado, ordenar, porPagina,
    sexo, tipoProduccion, origen, pesoMin, pesoMax,
    fechaNacimientoDesde, fechaNacimientoHasta,
    fechaIngresoDesde, fechaIngresoHasta,
    irAPagina, cambiarBusqueda, cambiarEstado, cambiarOrden, cambiarPorPagina, limpiarFiltros,
    cambiarSexo, cambiarTipoProduccion, cambiarOrigen, cambiarPesoMin, cambiarPesoMax,
    cambiarFechaNacimientoDesde, cambiarFechaNacimientoHasta,
    cambiarFechaIngresoDesde, cambiarFechaIngresoHasta,
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
  const [detailAnimalId, setDetailAnimalId]  = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormato, setExportFormato]     = useState('PDF')
  const [showImportModal, setShowImportModal] = useState(false)
  const [exportando, setExportando]           = useState(null) // { id, formato }

  const notify = (r) => {
    setMessage({ type: r.success ? 'success' : 'error', text: r.message })
    setTimeout(() => setMessage(null), 3000)
  }

  // ==========================================
  // EXPORTACIÓN INDIVIDUAL — FICHA COMPLETA (animalDetalle)
  // Descarga la hoja de vida completa del animal (PDF / Excel) consultando
  // animalDetalle(id). Solo lectura; no afecta al exportador masivo superior.
  // ==========================================
  const handleExportarAnimalIndividual = async (animalFila, formato) => {
    const id = animalFila.id
    if (exportando) return
    setExportando({ id, formato })
    setMessage({ type: 'info', text: 'Cargando datos del animal...' })

    try {
      const { data } = await apolloClient.query({
        query: GET_ANIMAL_DETALLE,
        variables: { id },
        fetchPolicy: 'network-only',
      })

      const animal = data?.animalDetalle
      if (!animal) throw new Error('No se encontraron los datos del animal.')

      setMessage({
        type: 'info',
        text: formato === 'PDF' ? 'Generando PDF...' : 'Generando Excel...',
      })

      const reportData = buildAnimalReportData(animal)
      if (formato === 'PDF') {
        generarPDFAnimalCompleto(reportData, animal)
      } else {
        generarExcelAnimalCompleto(reportData, animal)
      }

      setMessage({
        type: 'success',
        text: `Ficha de #${animal.nroArete}${animal.nombre ? ' · ' + animal.nombre : ''} generada correctamente.`,
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error generando la ficha individual:', error)
      setMessage({
        type: 'error',
        text: 'No se pudo generar la ficha del animal. Intentá nuevamente.',
      })
      setTimeout(() => setMessage(null), 4000)
    } finally {
      setExportando(null)
    }
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

  const handlePDF = () => {
    setExportFormato('PDF')
    setShowExportModal(true)
  }
  const handleExcel = () => {
    setExportFormato('EXCEL')
    setShowExportModal(true)
  }

  const hayFiltrosActivos =
    buscar || estado || sexo || tipoProduccion || origen ||
    pesoMin != null || pesoMax != null ||
    fechaNacimientoDesde || fechaNacimientoHasta ||
    fechaIngresoDesde || fechaIngresoHasta ||
    (ordenar && ordenar !== 'recientes')

  if (errorAnimales) return <ErrorMessage message={errorAnimales.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Gestión Ganadera</Typography>
          <Typography variant="body2" color="text.secondary">
            Animales y parcelas de la finca
          </Typography>
        </Box>
        {tabIdx === 0 && (
          <ReportesButtons onPDF={handlePDF} onExcel={handleExcel} loading={false} />
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

      {tabIdx === 0 && (
        <>
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
              variant="outlined" size="small" startIcon={<FileUploadOutlinedIcon />}
              onClick={() => setShowImportModal(true)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Importar datos
            </Button>
            <Button
              variant="contained" size="small" startIcon={<AddOutlinedIcon />}
              onClick={() => { setEditAnimal(null); setShowAnimalForm(true) }}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Nuevo Animal
            </Button>
          </Box>

          <AnimalFilters
            estado={estado}                         onEstado={cambiarEstado}
            sexo={sexo}                             onSexo={cambiarSexo}
            fechaNacimientoDesde={fechaNacimientoDesde} onFechaNacimientoDesde={cambiarFechaNacimientoDesde}
            fechaNacimientoHasta={fechaNacimientoHasta} onFechaNacimientoHasta={cambiarFechaNacimientoHasta}
            fechaIngresoDesde={fechaIngresoDesde}   onFechaIngresoDesde={cambiarFechaIngresoDesde}
            fechaIngresoHasta={fechaIngresoHasta}   onFechaIngresoHasta={cambiarFechaIngresoHasta}
            tipoProduccion={tipoProduccion}         onTipoProduccion={cambiarTipoProduccion}
            origen={origen}                         onOrigen={cambiarOrigen}
            pesoMin={pesoMin}                       onPesoMin={cambiarPesoMin}
            pesoMax={pesoMax}                       onPesoMax={cambiarPesoMax}
          />

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
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              {loadingAnimales && (
                <Box sx={{
                  position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)',
                  zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CircularProgress size={32} />
                </Box>
              )}
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Arete</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Sexo</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Raza</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Peso (kg)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Fecha Nac.</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Producción</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Origen</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {animales.map((animal) => (
                      <TableRow key={animal.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{animal.nroArete}</Typography>
                        </TableCell>
                        <TableCell>{animal.nombre || '—'}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={animal.sexo === 'MACHO' ? 'Macho' : 'Hembra'}
                            sx={{ bgcolor: animal.sexo === 'MACHO' ? '#E3F2FD' : '#FCE4EC', color: animal.sexo === 'MACHO' ? '#1565C0' : '#C62828' }}
                          />
                        </TableCell>
                        <TableCell>{animal.raza?.nombre || '—'}</TableCell>
                        <TableCell>{animal.categoria?.nombre || '—'}</TableCell>
                        <TableCell>{animal.peso ? `${animal.peso} kg` : '—'}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {animal.fechaNacimiento
                              ? animal.fechaNacimiento.split('-').reverse().join('/')
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {animal.tipoProduccion ? (
                            <Chip
                              size="small"
                              label={
                                animal.tipoProduccion === 'DOBLE_PROPOSITO' ? 'Doble' :
                                animal.tipoProduccion === 'CARNE' ? 'Carne' : 'Leche'
                              }
                              sx={{
                                bgcolor:
                                  animal.tipoProduccion === 'LECHE' ? '#E3F2FD' :
                                  animal.tipoProduccion === 'CARNE' ? '#FFEBEE' : '#F3E5F5',
                                color:
                                  animal.tipoProduccion === 'LECHE' ? '#1565C0' :
                                  animal.tipoProduccion === 'CARNE' ? '#C62828' : '#6A1B9A',
                              }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {animal.origen === 'NACIDO_FINCA' ? 'Nac. finca' :
                             animal.origen === 'COMPRADO' ? 'Comprado' :
                             animal.origen === 'DONADO' ? 'Donado' : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={animal.estado}
                            sx={{ 
                              bgcolor: animal.estado === 'ACTIVO' ? '#E8F5E9' : animal.estado === 'VENDIDO' ? '#FFF3E0' : '#FFEBEE',
                              color: animal.estado === 'ACTIVO' ? '#2E7D32' : animal.estado === 'VENDIDO' ? '#E65100' : '#C62828'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Mover a Parcela">
                            <IconButton
                              size="small" color="primary"
                              onClick={() => { setSelectedAnimal(animal); setShowMoverForm(true) }}
                            >
                              <LocationOnOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" color="info" onClick={() => setDetailAnimalId(animal.id)}>
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton size="small" color="warning" onClick={() => { setEditAnimal(animal); setShowAnimalForm(true) }}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => { setConfirmAnimalId(animal.id); setConfirmName(animal.nombre || animal.nroArete) }}>
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Descargar ficha completa (PDF)">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={!!exportando}
                                onClick={() => handleExportarAnimalIndividual(animal, 'PDF')}
                              >
                                {exportando?.id === animal.id && exportando?.formato === 'PDF'
                                  ? <CircularProgress size={16} />
                                  : <PictureAsPdfIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Exportar ficha completa (Excel)">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                disabled={!!exportando}
                                onClick={() => handleExportarAnimalIndividual(animal, 'EXCEL')}
                              >
                                {exportando?.id === animal.id && exportando?.formato === 'EXCEL'
                                  ? <CircularProgress size={16} />
                                  : <TableChartIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          )}

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

      {tabIdx === 1 && (
        <>
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

          <ParcelaFilters
            estado={estadoParcela}
            temporal={temporalParcela}
            onEstado={cambiarEstadoParcela}
            onTemporal={cambiarTemporalParcela}
          />

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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {parcelasPaginadas.map(parcela => (
                  <Box key={parcela.id} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
                    <Box sx={{ background: 'linear-gradient(135deg,#2E7D32,#1B5E20)', px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight={700} color="#fff">{parcela.nombre}</Typography>
                      <StatusChip value={parcela.estado} />
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                        <Box><Typography variant="caption" color="text.secondary">Tamaño</Typography><Typography variant="body2" fontWeight={600}>{parcela.tamano} ha</Typography></Box>
                        <Box><Typography variant="caption" color="text.secondary">Capacidad</Typography><Typography variant="body2" fontWeight={600}>{parcela.capacidadMaxima} animales</Typography></Box>
                        <Box><Typography variant="caption" color="text.secondary">Pastura</Typography><Typography variant="body2" fontWeight={600}>{parcela.tipoPastura || 'N/A'}</Typography></Box>
                        <Box><Typography variant="caption" color="text.secondary">Ocupación</Typography><Typography variant="body2" fontWeight={600}>{parcela.ocupacionActual ?? parcela.animalesActuales?.length ?? 0} / {parcela.capacidadMaxima}</Typography></Box>
                      </Box>

                      {(() => {
                        const ocu = parcela.ocupacionActual ?? parcela.animalesActuales?.length ?? 0
                        const cap = parcela.capacidadMaxima
                        if (!cap) return null
                        if (ocu > cap) return <Chip label="Sobreocupado" size="small" color="error" sx={{ mb: 1 }} />
                        if (ocu >= cap) return <Chip label="Capacidad completa" size="small" color="warning" sx={{ mb: 1 }} />
                        return null
                      })()}

                      {parcela.animalesActuales?.length > 0 && (
                        <Box sx={{ borderTop: '1px solid #F1F5F9', pt: 1.5, mt: 1 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Animales actuales
                          </Typography>
                          {parcela.animalesActuales.map(item => (
                            <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC', borderRadius: 1, p: 0.75, mt: 0.75 }}>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{item.animal?.nroArete}</Typography>
                                <Typography variant="caption" color="text.secondary">Desde: {new Date(item.fechaIngreso).toLocaleDateString('es-PY')}</Typography>
                              </Box>
                              <IconButton size="small" color="error" onClick={() => setConfirmSacarId(item.id)}>
                                <LocationOnOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
                        <IconButton size="small" color="warning" onClick={() => { setEditParcela(parcela); setShowParcelaForm(true) }}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => { setConfirmParcelaId(parcela.id); setConfirmName(parcela.nombre) }}>
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

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

      <ExportarAnimalesModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        formatoPredefinido={exportFormato}
        fincaId={fincaId}
        fincaNombre={fincaActual?.nombre || 'Mi Finca'}
        razas={razas}
        categorias={categorias}
        parcelas={parcelas}
        filtrosActuales={{
          estado,
          sexo,
          razaId: null,
          categoriaId: null,
          tipoProduccion,
          origen,
          fechaNacimientoDesde,
          fechaNacimientoHasta,
          fechaIngresoDesde,
          fechaIngresoHasta,
        }}
      />

      <ImportarAnimalesModal
        key={showImportModal ? 'import-open' : 'import-closed'}
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        fincaIdInicial={fincaId}
        onImported={() => { refetchPaginados(); refetchParcelasPaginadas() }}
      />

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
        fincaId={fincaId}
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