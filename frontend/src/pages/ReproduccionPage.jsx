// frontend/src/pages/ReproduccionPage.jsx
import { useState, useMemo, useEffect } from 'react'
import { useReproduccion } from '../hooks/useReproduccion'
import { useAnimales } from '../hooks/useAnimales'
import { useCatalogos } from '../hooks/useCatalogos'
import LoadingSpinner from '../components/LoadingSpinner'
import InseminacionForm from '../components/InseminacionForm'
import PartoForm from '../components/PartoForm'
import ProximosPartosCard from '../components/ProximosPartosCard'
import ReportesReproduccion from '../components/ReportesReproduccion'
import CeloForm from '../components/CeloForm'
import PalpacionForm from '../components/PalpacionForm'
import DesteteForm from '../components/DesteteForm'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Tabs, Tab, Chip, Card, CardContent, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Divider,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Stack, Tooltip,
} from '@mui/material'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import ChildCareOutlinedIcon from '@mui/icons-material/ChildCareOutlined'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import FavoriteIcon from '@mui/icons-material/Favorite'
import HealingIcon from '@mui/icons-material/Healing'
import CribIcon from '@mui/icons-material/Crib'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AssessmentIcon from '@mui/icons-material/Assessment'

const KPI = ({ label, value, accent }) => (
  <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderLeft: `4px solid ${accent}`, borderRadius: 2 }}>
    <CardContent sx={{ p: '16px !important' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: accent }}>{value}</Typography>
    </CardContent>
  </Card>
)

const TABS = [
  { label: 'Inseminaciones', Icon: ScienceOutlinedIcon },
  { label: 'Diagnósticos', Icon: AssignmentOutlinedIcon },
  { label: 'Partos', Icon: ChildCareOutlinedIcon },
  { label: 'Celos', Icon: FavoriteIcon },
  { label: 'Palpaciones', Icon: HealingIcon },
  { label: 'Destetes', Icon: CribIcon },
  { label: '+ Nueva IA', Icon: AddCircleOutlinedIcon },
  { label: 'Registrar Parto', Icon: PetsOutlinedIcon },
  { label: 'Reportes', Icon: AssessmentIcon },
]

const TIPO_PARTO_LABELS = {
  NORMAL: { label: 'Normal', color: '#DCFCE7', text: '#166534' },
  DISTOCICO: { label: 'Distócico', color: '#FEF3C7', text: '#92400E' },
  MULTIPLE: { label: 'Múltiple', color: '#DBEAFE', text: '#1E40AF' },
  ABORTO: { label: 'Aborto', color: '#FEE2E2', text: '#991B1B' },
}

const ESTADO_LABELS = {
  PARIDA: { label: 'Parida', color: '#DCFCE7', text: '#166534' },
  ABORTO: { label: 'Aborto', color: '#FEE2E2', text: '#991B1B' },
  PRENADA: { label: 'Preñada', color: '#DBEAFE', text: '#1E40AF' },
  SERVIDA: { label: 'Servida', color: '#F3F4F6', text: '#374151' },
  VACIA: { label: 'Vacía', color: '#F3F4F6', text: '#374151' },
}

const RESULTADO_PRENEZ_LABELS = {
  POSITIVO: { label: 'Positivo', color: '#DCFCE7', text: '#166534' },
  NEGATIVO: { label: 'Negativo', color: '#FEE2E2', text: '#991B1B' },
  DUDOSO: { label: 'Dudoso', color: '#FEF3C7', text: '#92400E' },
}

const INTENSIDAD_LABELS = {
  BAJA: { label: 'Baja', color: '#F3F4F6', text: '#374151' },
  MEDIA: { label: 'Media', color: '#DBEAFE', text: '#1E40AF' },
  ALTA: { label: 'Alta', color: '#DCFCE7', text: '#166534' },
}

const TIPO_CELO_LABELS = {
  NATURAL: 'Celo Natural',
  INDUCIDO: 'Celo Inducido',
  SINCRONIZADO: 'Celo Sincronizado',
}

const TIPO_DESTETE_LABELS = {
  NATURAL: 'Natural',
  PRECOZ: 'Precoz',
  FORZADO: 'Forzado',
}

const RESULTADO_PALPACION_LABELS = {
  POSITIVO: { label: 'Positivo (Preñada)', color: '#DCFCE7', text: '#166534' },
  NEGATIVO: { label: 'Negativo (Vacía)', color: '#FEE2E2', text: '#991B1B' },
  SOSPECHOSO: { label: 'Sospechoso', color: '#FEF3C7', text: '#92400E' },
  QUISTE: { label: 'Quiste', color: '#F3E8FF', text: '#6B21A5' },
}

const TipoParto = ({ tipo }) => {
  const cfg = TIPO_PARTO_LABELS[tipo] || { label: tipo, color: '#F3F4F6', text: '#374151' }
  return <Chip size="small" label={cfg.label} sx={{ bgcolor: cfg.color, color: cfg.text, fontWeight: 500 }} />
}

const EstadoParto = ({ estado }) => {
  const cfg = ESTADO_LABELS[estado] || { label: estado, color: '#F3F4F6', text: '#374151' }
  return <Chip size="small" label={cfg.label} sx={{ bgcolor: cfg.color, color: cfg.text, fontWeight: 500 }} />
}

const ResultadoPrenez = ({ resultado }) => {
  const cfg = RESULTADO_PRENEZ_LABELS[resultado] || { label: resultado, color: '#F3F4F6', text: '#374151' }
  return <Chip size="small" label={cfg.label} sx={{ bgcolor: cfg.color, color: cfg.text, fontWeight: 500 }} />
}

const IntensidadCelo = ({ intensidad }) => {
  const cfg = INTENSIDAD_LABELS[intensidad] || { label: intensidad, color: '#F3F4F6', text: '#374151' }
  return <Chip size="small" label={cfg.label} sx={{ bgcolor: cfg.color, color: cfg.text, fontWeight: 500 }} />
}

const ResultadoPalpacion = ({ resultado }) => {
  const cfg = RESULTADO_PALPACION_LABELS[resultado] || { label: resultado, color: '#F3F4F6', text: '#374151' }
  return <Chip size="small" label={cfg.label} sx={{ bgcolor: cfg.color, color: cfg.text, fontWeight: 500 }} />
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—'

// ---------------------------------------------------------------------------
// Diálogo de confirmación para eliminar
// ---------------------------------------------------------------------------
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ bgcolor: '#FEE2E2', color: '#991B1B' }}>
      {title || 'Confirmar eliminación'}
    </DialogTitle>
    <DialogContent sx={{ mt: 2 }}>
      <Typography>{message || '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.'}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} variant="outlined">Cancelar</Button>
      <Button onClick={onConfirm} color="error" variant="contained">Eliminar</Button>
    </DialogActions>
  </Dialog>
)

// ---------------------------------------------------------------------------
// Diálogo de detalle de un parto
// ---------------------------------------------------------------------------
const PartoDetalle = ({ parto, onClose, onEdit }) => {
  if (!parto) return null

  const reproductor = parto.inseminacion?.reproductor || parto.monta?.reproductor
  const tipoEvento = parto.inseminacion ? 'Inseminación Artificial' : parto.monta ? 'Monta Natural' : '—'
  const fechaServicio = parto.inseminacion?.fecha || parto.monta?.fecha || parto.fechaServicio

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>Detalle del Parto</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Row label="Madre" value={parto.madre ? `${parto.madre.nroArete}${parto.madre.nombre ? ' — ' + parto.madre.nombre : ''}` : '—'} />
          <Row label="Padre (interno)" value={parto.padre ? `${parto.padre.nroArete}${parto.padre.nombre ? ' — ' + parto.padre.nombre : ''}` : '—'} />
          <Row label="Reproductor" value={reproductor ? `${reproductor.codigo}${reproductor.nombre ? ' — ' + reproductor.nombre : ''}` : '—'} />
          <Row label="Tipo evento" value={tipoEvento} />
          <Row label="Fecha servicio" value={fmt(fechaServicio)} />
          <Divider />
          <Row label="Fecha esperada" value={fmt(parto.fechaPartoEsperado)} />
          <Row label="Fecha real" value={fmt(parto.fechaPartoReal)} />
          <Row label="Tipo parto" value={<TipoParto tipo={parto.tipoParto} />} />
          <Row label="Estado" value={<EstadoParto estado={parto.estado} />} />
          <Row label="N° crías" value={parto.numCrias ?? 0} />
          {parto.observaciones && <Row label="Observaciones" value={parto.observaciones} />}

          {parto.crias?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Crías registradas
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {parto.crias.map(cria => (
                  <Box key={cria.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, bgcolor: '#F0FDF4', borderRadius: 1, border: '1px solid #BBF7D0' }}>
                    <Typography sx={{ fontSize: 18 }}>{cria.sexo === 'MACHO' ? '🐂' : '🐄'}</Typography>
                    <Box>
                      <Typography variant="body2" fontWeight={700} fontFamily="monospace">{cria.nroArete}</Typography>
                      {cria.nombre && <Typography variant="caption" color="text.secondary">{cria.nombre}</Typography>}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {cria.sexo} · Nacido: {fmt(cria.fechaNacimiento)} · {cria.origen}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {parto.tipoParto === 'ABORTO' && (
            <Box sx={{ p: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 1 }}>
              <Typography variant="body2" color="error.main">Aborto — sin crías registradas</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" size="small">Cerrar</Button>
        <Button onClick={() => { onClose(); onEdit?.(parto); }} variant="contained" color="warning" size="small">
          Editar Parto
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Diálogos de detalle para Celos, Palpaciones y Destetes
// ---------------------------------------------------------------------------
const CeloDetalle = ({ celo, onClose }) => {
  if (!celo) return null
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>❤️ Detalle del Celo</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Row label="Hembra" value={`${celo.hembra?.nroArete} - ${celo.hembra?.nombre || ''}`} />
          <Row label="Fecha Inicio" value={fmt(celo.fechaInicio)} />
          <Row label="Fecha Fin" value={fmt(celo.fechaFin)} />
          <Row label="Tipo" value={TIPO_CELO_LABELS[celo.tipo] || celo.tipo} />
          <Row label="Intensidad" value={<IntensidadCelo intensidad={celo.intensidad} />} />
          <Row label="Detectado por" value={celo.detectadoPor || '—'} />
          <Row label="Observaciones" value={celo.observaciones || '—'} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

const PalpacionDetalle = ({ palpacion, onClose }) => {
  if (!palpacion) return null
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>🩺 Detalle de la Palpación</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Row label="Hembra" value={`${palpacion.hembra?.nroArete} - ${palpacion.hembra?.nombre || ''}`} />
          <Row label="Fecha" value={fmt(palpacion.fecha)} />
          <Row label="Resultado" value={<ResultadoPalpacion resultado={palpacion.resultado} />} />
          <Row label="Días de Gestación" value={palpacion.diasGestacionEstimados || '—'} />
          <Row label="Veterinario" value={palpacion.veterinario?.nombre || '—'} />
          <Row label="Observaciones" value={palpacion.observaciones || '—'} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

const DesteteDetalle = ({ destete, onClose }) => {
  if (!destete) return null
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>🍼 Detalle del Destete</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Row label="Madre" value={`${destete.madre?.nroArete} - ${destete.madre?.nombre || ''}`} />
          <Row label="Cría" value={`${destete.cria?.nroArete} - ${destete.cria?.nombre || ''}`} />
          <Row label="Fecha Destete" value={fmt(destete.fechaDestete)} />
          <Row label="Tipo" value={TIPO_DESTETE_LABELS[destete.tipo] || destete.tipo} />
          <Row label="Edad (días)" value={destete.edadDesteteDias} />
          <Row label="Peso (kg)" value={destete.pesoCria || '—'} />
          <Row label="Estado" value={destete.estadoCria || '—'} />
          <Row label="Observaciones" value={destete.observaciones || '—'} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

const Row = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 130, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, pt: 0.25 }}>
      {label}
    </Typography>
    {typeof value === 'string' || typeof value === 'number'
      ? <Typography variant="body2">{value}</Typography>
      : value
    }
  </Box>
)

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export default function ReproduccionPage() {
  const { 
    inseminaciones, 
    diagnosticos, 
    reproducciones, 
    vacasPrenadas, 
    proximosPartos,
    celos,
    palpaciones,
    destetes,
    loading,
    crearCelo,
    crearPalpacion,
    crearDestete,
    actualizarCelo,
    eliminarCelo,
    actualizarPalpacion,
    eliminarPalpacion,
    actualizarDestete,
    eliminarDestete,
    refetchCelos,
    refetchPalpaciones,
    refetchDestetes,
  } = useReproduccion()
  
  const { animales, loading: loadingAnimales } = useAnimales()
  const { veterinarios, loadingVeterinarios } = useCatalogos()
  
  const [tabIdx, setTabIdx] = useState(0)
  const [detalleParto, setDetalleParto] = useState(null)
  const [detalleCelo, setDetalleCelo] = useState(null)
  const [detallePalpacion, setDetallePalpacion] = useState(null)
  const [detalleDestete, setDetalleDestete] = useState(null)
  const [editingParto, setEditingParto] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [partoToDelete, setPartoToDelete] = useState(null)
  const [message, setMessage] = useState(null)
  
  // Estados para edición
  const [editingCelo, setEditingCelo] = useState(null)
  const [editingPalpacion, setEditingPalpacion] = useState(null)
  const [editingDestete, setEditingDestete] = useState(null)
  
  // Estados para confirmación de eliminación
  const [deleteCeloConfirm, setDeleteCeloConfirm] = useState(false)
  const [celoToDelete, setCeloToDelete] = useState(null)
  const [deletePalpacionConfirm, setDeletePalpacionConfirm] = useState(false)
  const [palpacionToDelete, setPalpacionToDelete] = useState(null)
  const [deleteDesteteConfirm, setDeleteDesteteConfirm] = useState(false)
  const [desteteToDelete, setDesteteToDelete] = useState(null)
  
  // Estados para diálogos de los nuevos formularios
  const [celoDialogOpen, setCeloDialogOpen] = useState(false)
  const [palpacionDialogOpen, setPalpacionDialogOpen] = useState(false)
  const [desteteDialogOpen, setDesteteDialogOpen] = useState(false)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [resultadoFilter, setResultadoFilter] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [diagnosticoResultadoFilter, setDiagnosticoResultadoFilter] = useState('todos')
  const [tipoPartoFilter, setTipoPartoFilter] = useState('todos')
  const [estadoPartoFilter, setEstadoPartoFilter] = useState('todos')
  const [tipoCeloFilter, setTipoCeloFilter] = useState('todos')
  const [intensidadCeloFilter, setIntensidadCeloFilter] = useState('todos')
  const [palpacionResultadoFilter, setPalpacionResultadoFilter] = useState('todos')
  const [tipoDesteteFilter, setTipoDesteteFilter] = useState('todos')

  // Obtener hembras (animales con sexo HEMBRA)
  const hembras = animales?.filter(a => a.sexo === 'HEMBRA') || []
  
  // Obtener crías (animales que son hijos de alguna madre)
  const crias = reproducciones?.flatMap(r => r?.crias || []) || []

  // Recargar destetes una sola vez al montar el componente
  useEffect(() => {
    refetchDestetes()
  }, [])

  // ==========================================
  // FUNCIONES DE ACCIONES - PARTOS
  // ==========================================
  
  const handleViewDetails = (parto) => {
    setDetalleParto(parto)
  }
  
  const handleEditParto = (parto) => {
    setEditingParto(parto)
    setTabIdx(7)
  }
  
  const handleDeleteClick = (parto) => {
    setPartoToDelete(parto)
    setDeleteConfirmOpen(true)
  }
  
  const handleConfirmDelete = async () => {
    if (partoToDelete) {
      setDeleteConfirmOpen(false)
      setPartoToDelete(null)
      window.location.reload()
    }
    setDeleteConfirmOpen(false)
    setPartoToDelete(null)
  }

  // ==========================================
  // FUNCIONES PARA CELOS
  // ==========================================
  
  const handleEditCelo = (celo) => {
    setEditingCelo(celo)
    setCeloDialogOpen(true)
  }

  const handleUpdateCelo = async (id, formData) => {
    const result = await actualizarCelo(id, formData)
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setCeloDialogOpen(false)
      setEditingCelo(null)
      refetchCelos()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
    setTimeout(() => setMessage(null), 3500)
  }

  const handleDeleteCelo = async () => {
    if (celoToDelete) {
      const result = await eliminarCelo(celoToDelete.id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        refetchCelos()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
      setDeleteCeloConfirm(false)
      setCeloToDelete(null)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  // ==========================================
  // FUNCIONES PARA PALPACIONES
  // ==========================================
  
  const handleEditPalpacion = (palpacion) => {
    setEditingPalpacion(palpacion)
    setPalpacionDialogOpen(true)
  }

  const handleUpdatePalpacion = async (id, formData) => {
    const result = await actualizarPalpacion(id, formData)
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setPalpacionDialogOpen(false)
      setEditingPalpacion(null)
      refetchPalpaciones()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
    setTimeout(() => setMessage(null), 3500)
  }

  const handleDeletePalpacion = async () => {
    if (palpacionToDelete) {
      const result = await eliminarPalpacion(palpacionToDelete.id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        refetchPalpaciones()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
      setDeletePalpacionConfirm(false)
      setPalpacionToDelete(null)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  // ==========================================
  // FUNCIONES PARA DESTETES
  // ==========================================
  
  const handleEditDestete = (destete) => {
    setEditingDestete(destete)
    setDesteteDialogOpen(true)
  }

  const handleUpdateDestete = async (id, formData) => {
    const result = await actualizarDestete(id, formData)
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setDesteteDialogOpen(false)
      setEditingDestete(null)
      refetchDestetes()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
    setTimeout(() => setMessage(null), 3500)
  }

  const handleDeleteDestete = async () => {
    if (desteteToDelete) {
      const result = await eliminarDestete(desteteToDelete.id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        refetchDestetes()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
      setDeleteDesteteConfirm(false)
      setDesteteToDelete(null)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  // ==========================================
  // FILTROS
  // ==========================================
  
  const inseminacionesFiltradas = useMemo(() => {
    let filtered = [...inseminaciones]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(ia => 
        ia.hembra?.nroArete?.toLowerCase().includes(term) ||
        ia.hembra?.nombre?.toLowerCase().includes(term) ||
        ia.reproductor?.codigo?.toLowerCase().includes(term) ||
        ia.tecnicoInseminador?.toLowerCase().includes(term)
      )
    }
    if (resultadoFilter !== 'todos') {
      filtered = filtered.filter(ia => ia.resultado === resultadoFilter)
    }
    if (fechaInicio) {
      filtered = filtered.filter(ia => new Date(ia.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(ia => new Date(ia.fecha) <= new Date(fechaFin))
    }
    return filtered
  }, [inseminaciones, searchTerm, resultadoFilter, fechaInicio, fechaFin])

  const diagnosticosFiltrados = useMemo(() => {
    let filtered = [...diagnosticos]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(d => 
        d.hembra?.nroArete?.toLowerCase().includes(term) ||
        d.hembra?.nombre?.toLowerCase().includes(term) ||
        d.metodo?.toLowerCase().includes(term)
      )
    }
    if (diagnosticoResultadoFilter !== 'todos') {
      filtered = filtered.filter(d => d.resultadoPrenez === diagnosticoResultadoFilter)
    }
    if (fechaInicio) {
      filtered = filtered.filter(d => new Date(d.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(d => new Date(d.fecha) <= new Date(fechaFin))
    }
    return filtered
  }, [diagnosticos, searchTerm, diagnosticoResultadoFilter, fechaInicio, fechaFin])

  const partosFiltrados = useMemo(() => {
    let filtered = [...reproducciones]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.madre?.nroArete?.toLowerCase().includes(term) ||
        p.madre?.nombre?.toLowerCase().includes(term) ||
        p.padre?.nroArete?.toLowerCase().includes(term)
      )
    }
    if (tipoPartoFilter !== 'todos') {
      filtered = filtered.filter(p => p.tipoParto === tipoPartoFilter)
    }
    if (estadoPartoFilter !== 'todos') {
      filtered = filtered.filter(p => p.estado === estadoPartoFilter)
    }
    if (fechaInicio) {
      filtered = filtered.filter(p => new Date(p.fechaPartoReal) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(p => new Date(p.fechaPartoReal) <= new Date(fechaFin))
    }
    return filtered
  }, [reproducciones, searchTerm, tipoPartoFilter, estadoPartoFilter, fechaInicio, fechaFin])

  const celosFiltrados = useMemo(() => {
    let filtered = [...celos]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.hembra?.nroArete?.toLowerCase().includes(term) ||
        c.hembra?.nombre?.toLowerCase().includes(term) ||
        c.detectadoPor?.toLowerCase().includes(term)
      )
    }
    if (tipoCeloFilter !== 'todos') {
      filtered = filtered.filter(c => c.tipo === tipoCeloFilter)
    }
    if (intensidadCeloFilter !== 'todos') {
      filtered = filtered.filter(c => c.intensidad === intensidadCeloFilter)
    }
    if (fechaInicio) {
      filtered = filtered.filter(c => new Date(c.fechaInicio) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(c => new Date(c.fechaInicio) <= new Date(fechaFin))
    }
    return filtered
  }, [celos, searchTerm, tipoCeloFilter, intensidadCeloFilter, fechaInicio, fechaFin])

  const palpacionesFiltradas = useMemo(() => {
    let filtered = [...palpaciones]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.hembra?.nroArete?.toLowerCase().includes(term) ||
        p.hembra?.nombre?.toLowerCase().includes(term)
      )
    }
    if (palpacionResultadoFilter !== 'todos') {
      filtered = filtered.filter(p => p.resultado === palpacionResultadoFilter)
    }
    if (fechaInicio) {
      filtered = filtered.filter(p => new Date(p.fecha) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      filtered = filtered.filter(p => new Date(p.fecha) <= new Date(fechaFin))
    }
    return filtered
  }, [palpaciones, searchTerm, palpacionResultadoFilter, fechaInicio, fechaFin])

  // FILTRO DE DESTETES
  const destetesMostrar = useMemo(() => {
    if (!destetes || destetes.length === 0) return []
    return destetes
  }, [destetes])

  const limpiarFiltros = () => {
    setSearchTerm('')
    setResultadoFilter('todos')
    setDiagnosticoResultadoFilter('todos')
    setTipoPartoFilter('todos')
    setEstadoPartoFilter('todos')
    setTipoCeloFilter('todos')
    setIntensidadCeloFilter('todos')
    setPalpacionResultadoFilter('todos')
    setTipoDesteteFilter('todos')
    setFechaInicio('')
    setFechaFin('')
  }

  if (loading || loadingAnimales || loadingVeterinarios) return <LoadingSpinner />

  const tabsWithCount = TABS.map((t, i) => ({
    ...t,
    count: i === 0 ? inseminacionesFiltradas.length
         : i === 1 ? diagnosticosFiltrados.length
         : i === 2 ? partosFiltrados.length
         : i === 3 ? celosFiltrados.length
         : i === 4 ? palpacionesFiltradas.length
         : i === 5 ? destetesMostrar.length
         : undefined,
  }))

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Módulo de Reproducción</Typography>
        <Typography variant="body2" color="text.secondary">Gestión de inseminaciones, diagnósticos, partos, celos, palpaciones y destetes</Typography>
      </Box>

      {/* Botones rápidos para registrar */}
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" color="secondary" startIcon={<FavoriteIcon />} onClick={() => setCeloDialogOpen(true)}>
          Registrar Celo
        </Button>
        <Button variant="outlined" color="info" startIcon={<HealingIcon />} onClick={() => setPalpacionDialogOpen(true)}>
          Registrar Palpación
        </Button>
        <Button variant="outlined" color="warning" startIcon={<CribIcon />} onClick={() => setDesteteDialogOpen(true)}>
          Registrar Destete
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KPI label="Vacas preñadas" value={vacasPrenadas.length} accent="#2E7D32" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KPI label="Inseminaciones" value={inseminacionesFiltradas.length} accent="#1565C0" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><KPI label="Partos" value={partosFiltrados.length} accent="#6A1B9A" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><ProximosPartosCard proximosPartos={proximosPartos} /></Grid>
      </Grid>

      {/* Barra de búsqueda y filtros */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por arete, nombre, reproductor, técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Tooltip title="Filtros avanzados">
              <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            {(searchTerm || resultadoFilter !== 'todos' || diagnosticoResultadoFilter !== 'todos' || 
              tipoPartoFilter !== 'todos' || estadoPartoFilter !== 'todos' || tipoCeloFilter !== 'todos' ||
              intensidadCeloFilter !== 'todos' || palpacionResultadoFilter !== 'todos' || 
              tipoDesteteFilter !== 'todos' || fechaInicio || fechaFin) && (
              <Chip 
                label="Limpiar filtros" 
                size="small" 
                onClick={limpiarFiltros}
                onDelete={limpiarFiltros}
              />
            )}
          </Box>
        </Stack>

        {/* Filtros avanzados */}
        {showFilters && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Resultado IA</InputLabel>
              <Select value={resultadoFilter} onChange={(e) => setResultadoFilter(e.target.value)} label="Resultado IA">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="PRENADA">Preñada</MenuItem>
                <MenuItem value="VACIA">Vacía</MenuItem>
                <MenuItem value="REPETIR">Repetir</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Resultado Diagnóstico</InputLabel>
              <Select value={diagnosticoResultadoFilter} onChange={(e) => setDiagnosticoResultadoFilter(e.target.value)} label="Resultado Diagnóstico">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="POSITIVO">Positivo</MenuItem>
                <MenuItem value="NEGATIVO">Negativo</MenuItem>
                <MenuItem value="DUDOSO">Dudoso</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Tipo Parto</InputLabel>
              <Select value={tipoPartoFilter} onChange={(e) => setTipoPartoFilter(e.target.value)} label="Tipo Parto">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="DISTOCICO">Distócico</MenuItem>
                <MenuItem value="MULTIPLE">Múltiple</MenuItem>
                <MenuItem value="ABORTO">Aborto</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Estado Parto</InputLabel>
              <Select value={estadoPartoFilter} onChange={(e) => setEstadoPartoFilter(e.target.value)} label="Estado Parto">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="PARIDA">Parida</MenuItem>
                <MenuItem value="PRENADA">Preñada</MenuItem>
                <MenuItem value="ABORTO">Aborto</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Tipo Celo</InputLabel>
              <Select value={tipoCeloFilter} onChange={(e) => setTipoCeloFilter(e.target.value)} label="Tipo Celo">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="NATURAL">Natural</MenuItem>
                <MenuItem value="INDUCIDO">Inducido</MenuItem>
                <MenuItem value="SINCRONIZADO">Sincronizado</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Intensidad Celo</InputLabel>
              <Select value={intensidadCeloFilter} onChange={(e) => setIntensidadCeloFilter(e.target.value)} label="Intensidad Celo">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="BAJA">Baja</MenuItem>
                <MenuItem value="MEDIA">Media</MenuItem>
                <MenuItem value="ALTA">Alta</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Resultado Palpación</InputLabel>
              <Select value={palpacionResultadoFilter} onChange={(e) => setPalpacionResultadoFilter(e.target.value)} label="Resultado Palpación">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="POSITIVO">Positivo</MenuItem>
                <MenuItem value="NEGATIVO">Negativo</MenuItem>
                <MenuItem value="SOSPECHOSO">Sospechoso</MenuItem>
                <MenuItem value="QUISTE">Quiste</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Tipo Destete</InputLabel>
              <Select value={tipoDesteteFilter} onChange={(e) => setTipoDesteteFilter(e.target.value)} label="Tipo Destete">
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="NATURAL">Natural</MenuItem>
                <MenuItem value="PRECOZ">Precoz</MenuItem>
                <MenuItem value="FORZADO">Forzado</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Fecha desde"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 150 }}
            />

            <TextField
              label="Fecha hasta"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 150 }}
            />
          </Stack>
        )}

        {/* Indicador de resultados filtrados */}
        {(searchTerm || resultadoFilter !== 'todos' || diagnosticoResultadoFilter !== 'todos' || 
          tipoPartoFilter !== 'todos' || estadoPartoFilter !== 'todos' || tipoCeloFilter !== 'todos' ||
          intensidadCeloFilter !== 'todos' || palpacionResultadoFilter !== 'todos' || 
          tipoDesteteFilter !== 'todos' || fechaInicio || fechaFin) && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            {tabIdx === 0 && `${inseminacionesFiltradas.length} de ${inseminaciones.length} inseminaciones encontradas`}
            {tabIdx === 1 && `${diagnosticosFiltrados.length} de ${diagnosticos.length} diagnósticos encontrados`}
            {tabIdx === 2 && `${partosFiltrados.length} de ${reproducciones.length} partos encontrados`}
            {tabIdx === 3 && `${celosFiltrados.length} de ${celos.length} celos encontrados`}
            {tabIdx === 4 && `${palpacionesFiltradas.length} de ${palpaciones.length} palpaciones encontradas`}
            {tabIdx === 5 && `${destetesMostrar.length} de ${destetes.length} destetes encontrados`}
          </Typography>
        )}
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)} variant="scrollable" scrollButtons="auto">
          {tabsWithCount.map(({ label, Icon, count }) => (
            <Tab
              key={label}
              icon={<Icon sx={{ fontSize: 17 }} />}
              iconPosition="start"
              label={count !== undefined ? `${label} (${count})` : label}
              sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500, fontSize: 13 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab 0: Inseminaciones */}
      {tabIdx === 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Hembra</TableCell>
                  <TableCell>Reproductor</TableCell>
                  <TableCell>N° Pajuela</TableCell>
                  <TableCell>Técnico</TableCell>
                  <TableCell>Resultado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inseminacionesFiltradas.map(ia => (
                  <TableRow key={ia.id} hover>
                    <TableCell>{fmt(ia.fecha)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{ia.hembra?.nroArete}</Typography>
                      <Typography variant="caption" color="text.secondary">{ia.hembra?.nombre || ''}</Typography>
                    </TableCell>
                    <TableCell>{ia.reproductor?.codigo || '—'}</TableCell>
                    <TableCell>{ia.numeroPajuela || '—'}</TableCell>
                    <TableCell>{ia.tecnicoInseminador || '—'}</TableCell>
                    <TableCell>
                      {ia.resultado && ia.resultado !== 'PENDIENTE'
                        ? <Chip size="small" label={ia.resultado} sx={{ fontSize: 11 }} />
                        : <Typography variant="caption" color="text.disabled">Pendiente</Typography>
                      }
                    </TableCell>
                  </TableRow>
                ))}
                {inseminacionesFiltradas.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {searchTerm ? 'No hay inseminaciones que coincidan con la búsqueda' : 'Sin inseminaciones registradas'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tab 1: Diagnósticos */}
      {tabIdx === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Hembra</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Días gestación</TableCell>
                  <TableCell>Método</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diagnosticosFiltrados.map(d => (
                  <TableRow key={d.id} hover>
                    <TableCell>{fmt(d.fecha)}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{d.hembra?.nroArete}</Typography></TableCell>
                    <TableCell><ResultadoPrenez resultado={d.resultadoPrenez} /></TableCell>
                    <TableCell>{d.diasGestacion || '—'}</TableCell>
                    <TableCell>{d.metodo || '—'}</TableCell>
                  </TableRow>
                ))}
                {diagnosticosFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {searchTerm ? 'No hay diagnósticos que coincidan con la búsqueda' : 'Sin diagnósticos registrados'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tab 2: Partos CON BOTONES DE ACCIÓN */}
      {tabIdx === 2 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha parto</TableCell>
                  <TableCell>Madre</TableCell>
                  <TableCell>Padre / Reproductor</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>N° crías</TableCell>
                  <TableCell>Crías</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partosFiltrados.map(r => {
                  const reproductor = r.inseminacion?.reproductor || r.monta?.reproductor
                  const padreMostrar = r.padre
                    ? `${r.padre.nroArete}${r.padre.nombre ? ' — ' + r.padre.nombre : ''}`
                    : reproductor
                      ? `${reproductor.codigo}${reproductor.nombre ? ' — ' + reproductor.nombre : ''}`
                      : '—'

                  let criasMostrar
                  if (r.tipoParto === 'ABORTO') {
                    criasMostrar = <Typography variant="caption" color="error.main">Aborto — sin cría</Typography>
                  } else if (!r.crias || r.crias.length === 0) {
                    criasMostrar = <Typography variant="caption" color="text.disabled">Sin cría registrada</Typography>
                  } else {
                    criasMostrar = (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        {r.crias.map(c => (
                          <Typography key={c.id} variant="caption" fontFamily="monospace">
                            {c.sexo === 'MACHO' ? '🐂' : '🐄'} {c.nroArete}{c.nombre ? ` — ${c.nombre}` : ''}
                          </Typography>
                        ))}
                      </Box>
                    )
                  }

                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>{fmt(r.fechaPartoReal)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{r.madre?.nroArete || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.madre?.nombre || ''}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{padreMostrar}</Typography></TableCell>
                      <TableCell><TipoParto tipo={r.tipoParto} /></TableCell>
                      <TableCell align="center">{r.numCrias ?? 0}</TableCell>
                      <TableCell>{criasMostrar}</TableCell>
                      <TableCell><EstadoParto estado={r.estado} /></TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                          <Tooltip title="Ver detalle">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewDetails(r)} 
                              sx={{ color: '#3b82f6' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditParto(r)} 
                              sx={{ color: '#eab308' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteClick(r)} 
                              sx={{ color: '#ef4444' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {partosFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {searchTerm ? 'No hay partos que coincidan con la búsqueda' : 'Sin partos registrados'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tab 3: Celos CON BOTONES DE ACCIÓN */}
      {tabIdx === 3 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Hembra</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Intensidad</TableCell>
                  <TableCell>Detectado por</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {celosFiltrados.map(celo => (
                  <TableRow key={celo.id} hover>
                    <TableCell>{fmt(celo.fechaInicio)}</TableCell>
                    <TableCell>{fmt(celo.fechaFin)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{celo.hembra?.nroArete}</Typography>
                      <Typography variant="caption" color="text.secondary">{celo.hembra?.nombre || ''}</Typography>
                    </TableCell>
                    <TableCell>{TIPO_CELO_LABELS[celo.tipo] || celo.tipo}</TableCell>
                    <TableCell><IntensidadCelo intensidad={celo.intensidad} /></TableCell>
                    <TableCell>{celo.detectadoPor || '—'}</TableCell>
                    <TableCell>{celo.observaciones || '—'}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => setDetalleCelo(celo)} sx={{ color: '#3b82f6' }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleEditCelo(celo)} sx={{ color: '#eab308' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => {
                            setCeloToDelete(celo)
                            setDeleteCeloConfirm(true)
                          }} sx={{ color: '#ef4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {celosFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {searchTerm ? 'No hay celos que coincidan con la búsqueda' : 'Sin celos registrados'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tab 4: Palpaciones CON BOTONES DE ACCIÓN */}
      {tabIdx === 4 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Hembra</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Días Gestación</TableCell>
                  <TableCell>Veterinario</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {palpacionesFiltradas.map(palpacion => (
                  <TableRow key={palpacion.id} hover>
                    <TableCell>{fmt(palpacion.fecha)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{palpacion.hembra?.nroArete}</Typography>
                      <Typography variant="caption" color="text.secondary">{palpacion.hembra?.nombre || ''}</Typography>
                    </TableCell>
                    <TableCell><ResultadoPalpacion resultado={palpacion.resultado} /></TableCell>
                    <TableCell>{palpacion.diasGestacionEstimados || '—'}</TableCell>
                    <TableCell>{palpacion.veterinario?.nombre || '—'}</TableCell>
                    <TableCell>{palpacion.observaciones || '—'}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => setDetallePalpacion(palpacion)} sx={{ color: '#3b82f6' }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleEditPalpacion(palpacion)} sx={{ color: '#eab308' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => {
                            setPalpacionToDelete(palpacion)
                            setDeletePalpacionConfirm(true)
                          }} sx={{ color: '#ef4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {palpacionesFiltradas.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    {searchTerm ? 'No hay palpaciones que coincidan con la búsqueda' : 'Sin palpaciones registradas'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tab 5: Destetes CON BOTONES DE ACCIÓN */}
      {tabIdx === 5 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha Destete</TableCell>
                  <TableCell>Madre</TableCell>
                  <TableCell>Cría</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Edad (días)</TableCell>
                  <TableCell>Peso (kg)</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {destetesMostrar.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      {searchTerm ? 'No hay destetes que coincidan con la búsqueda' : 'Sin destetes registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  destetesMostrar.map(destete => (
                    <TableRow key={destete.id} hover>
                      <TableCell>{fmt(destete.fechaDestete)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{destete.madre?.nroArete || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{destete.madre?.nombre || ''}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{destete.cria?.nroArete || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{destete.cria?.nombre || ''}</Typography>
                      </TableCell>
                      <TableCell>{TIPO_DESTETE_LABELS[destete.tipo] || destete.tipo}</TableCell>
                      <TableCell>{destete.edadDesteteDias}</TableCell>
                      <TableCell>{destete.pesoCria || '—'}</TableCell>
                      <TableCell>{destete.estadoCria || '—'}</TableCell>
                      <TableCell>{destete.observaciones || '—'}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => setDetalleDestete(destete)} sx={{ color: '#3b82f6' }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleEditDestete(destete)} sx={{ color: '#eab308' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => {
                              setDesteteToDelete(destete)
                              setDeleteDesteteConfirm(true)
                            }} sx={{ color: '#ef4444' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* Tab 6: Nueva IA */}
      {tabIdx === 6 && <InseminacionForm onSuccess={() => setTabIdx(0)} />}

      {/* Tab 7: Registrar Parto */}
      {tabIdx === 7 && <PartoForm 
        onSuccess={() => setTabIdx(2)} 
        initialData={editingParto}
      />}

      {/* Tab 8: Reportes */}
      {tabIdx === 8 && (
        <ReportesReproduccion 
          partos={reproducciones}
          inseminaciones={inseminaciones}
          vacasPrenadas={vacasPrenadas}
          diagnosticos={diagnosticos}
          celos={celos}
          palpaciones={palpaciones}
          destetes={destetes}
        />
      )}

      {/* Diálogos de detalle */}
      {detalleParto && (
        <PartoDetalle 
          parto={detalleParto} 
          onClose={() => setDetalleParto(null)} 
          onEdit={handleEditParto}
        />
      )}
      
      {detalleCelo && (
        <CeloDetalle celo={detalleCelo} onClose={() => setDetalleCelo(null)} />
      )}
      
      {detallePalpacion && (
        <PalpacionDetalle palpacion={detallePalpacion} onClose={() => setDetallePalpacion(null)} />
      )}
      
      {detalleDestete && (
        <DesteteDetalle destete={detalleDestete} onClose={() => setDetalleDestete(null)} />
      )}

      {/* Diálogo de confirmación de eliminación para Parto */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Eliminar Parto"
        message={`¿Estás seguro de que deseas eliminar el parto de la madre ${partoToDelete?.madre?.nroArete || ''} del ${fmt(partoToDelete?.fechaPartoReal)}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* Diálogo de confirmación para eliminar Celo */}
      <ConfirmDialog
        open={deleteCeloConfirm}
        title="Eliminar Celo"
        message={`¿Estás seguro de que deseas eliminar el celo de ${celoToDelete?.hembra?.nroArete || ''} del ${fmt(celoToDelete?.fechaInicio)}?`}
        onConfirm={handleDeleteCelo}
        onCancel={() => setDeleteCeloConfirm(false)}
      />

      {/* Diálogo de confirmación para eliminar Palpación */}
      <ConfirmDialog
        open={deletePalpacionConfirm}
        title="Eliminar Palpación"
        message={`¿Estás seguro de que deseas eliminar la palpación de ${palpacionToDelete?.hembra?.nroArete || ''} del ${fmt(palpacionToDelete?.fecha)}?`}
        onConfirm={handleDeletePalpacion}
        onCancel={() => setDeletePalpacionConfirm(false)}
      />

      {/* Diálogo de confirmación para eliminar Destete */}
      <ConfirmDialog
        open={deleteDesteteConfirm}
        title="Eliminar Destete"
        message={`¿Estás seguro de que deseas eliminar el destete de ${desteteToDelete?.cria?.nroArete || ''} del ${fmt(desteteToDelete?.fechaDestete)}?`}
        onConfirm={handleDeleteDestete}
        onCancel={() => setDeleteDesteteConfirm(false)}
      />

      {/* Diálogos para los nuevos formularios */}
      <CeloForm
        open={celoDialogOpen}
        onClose={() => {
          setCeloDialogOpen(false)
          setEditingCelo(null)
        }}
        onSubmit={editingCelo ? handleUpdateCelo : crearCelo}
        initialData={editingCelo}
        isEditing={!!editingCelo}
        hembras={hembras}
        loading={loading}
      />

      <PalpacionForm
        open={palpacionDialogOpen}
        onClose={() => {
          setPalpacionDialogOpen(false)
          setEditingPalpacion(null)
        }}
        onSubmit={editingPalpacion ? handleUpdatePalpacion : crearPalpacion}
        initialData={editingPalpacion}
        isEditing={!!editingPalpacion}
        hembras={hembras}
        veterinarios={veterinarios}
        loading={loading}
      />

      <DesteteForm
        open={desteteDialogOpen}
        onClose={() => {
          setDesteteDialogOpen(false)
          setEditingDestete(null)
        }}
        onSubmit={editingDestete ? handleUpdateDestete : crearDestete}
        initialData={editingDestete}
        isEditing={!!editingDestete}
        crias={crias}
        loading={loading}
      />
    </Box>
  )
}