import { useState } from 'react'
import { useRrhh } from '../hooks/useRrhh'
import LoadingSpinner from '../components/LoadingSpinner'
import PageAlert from '../components/ui/PageAlert'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatusChip from '../components/ui/StatusChip'
import EmptyState from '../components/ui/EmptyState'
import TipoEmpleadoForm from '../components/TipoEmpleadoForm'
import EmpleadoForm from '../components/EmpleadoForm'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Tabs, Tab, IconButton, Tooltip, Avatar,
  Card, CardContent, Grid, InputAdornment, TextField,
} from '@mui/material'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import WorkOutlinedIcon from '@mui/icons-material/WorkOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import PageHeader from '../components/ui/PageHeader'

const AVATAR_COLORS = ['#E8F5E9', '#E3F2FD', '#EDE7F6', '#FBE9E7', '#E8EAF6']
const AVATAR_TEXT = ['#2E7D32', '#1565C0', '#6A1B9A', '#BF360C', '#283593']

const getAvatarIdx = (id = '') => id.charCodeAt(id.length - 1) % AVATAR_COLORS.length
const getIniciales = (nombre = '') => nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

const fmt = {
  fecha: (f) => f ? new Date(f).toLocaleDateString('es-PY') : '—',
  salario: (s) => s ? `Gs. ${parseFloat(s).toLocaleString('es-PY')}` : '—',
}

const KPI = ({ label, value, accent }) => (
  <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderLeft: `4px solid ${accent}`, borderRadius: 2 }}>
    <CardContent sx={{ p: '16px !important' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: accent }}>{value}</Typography>
    </CardContent>
  </Card>
)

export default function RrhhPage() {
  const { tipos, empleados, eliminarTipo, eliminarEmpleado, loading } = useRrhh()
  const [tabIdx, setTabIdx] = useState(0)
  const [showTipoModal, setShowTipoModal] = useState(false)
  const [showEmpModal, setShowEmpModal] = useState(false)
  const [editTipo, setEditTipo] = useState(null)
  const [editEmp, setEditEmp] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [message, setMessage] = useState(null)
  const [confirmTipoId, setConfirmTipoId] = useState(null)
  const [confirmEmpId, setConfirmEmpId] = useState(null)
  const [confirmName, setConfirmName] = useState('')

  const notify = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3500)
  }

  const handleEliminarTipo = async () => {
    const r = await eliminarTipo(confirmTipoId)
    notify(r.success ? 'success' : 'error', r.success ? 'Tipo eliminado' : r.error)
    setConfirmTipoId(null)
  }

  const handleEliminarEmp = async () => {
    const r = await eliminarEmpleado(confirmEmpId)
    notify(r.success ? 'success' : 'error', r.success ? 'Empleado eliminado' : r.error)
    setConfirmEmpId(null)
  }

  const empleadosFiltrados = empleados.filter(e =>
    !busqueda ||
    e.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.ci?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.tipo?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const activos = empleados.filter(e => e.estado === 'ACTIVO').length

  if (loading) return <LoadingSpinner />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>Recursos Humanos</Typography>
        <Typography variant="body2" color="text.secondary">Gestión de personal y cargos</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}><KPI label="Total empleados" value={empleados.length} accent="#1565C0" /></Grid>
        <Grid item xs={12} sm={4}><KPI label="Activos" value={activos} accent="#2E7D32" /></Grid>
        <Grid item xs={12} sm={4}><KPI label="Tipos de cargo" value={tipos.length} accent="#6A1B9A" /></Grid>
      </Grid>

      <PageAlert message={message} onClose={() => setMessage(null)} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)}>
          <Tab icon={<BadgeOutlinedIcon sx={{ fontSize: 17 }} />} iconPosition="start"
            label={`Empleados (${empleados.length})`}
            sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500 }} />
          <Tab icon={<WorkOutlinedIcon sx={{ fontSize: 17 }} />} iconPosition="start"
            label={`Tipos de cargo (${tipos.length})`}
            sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500 }} />
        </Tabs>
      </Box>

      {/* Empleados */}
      {tabIdx === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar por nombre, CI o cargo…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              sx={{ maxWidth: 320 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <Tooltip title="Nuevo empleado">
              <IconButton color="primary" onClick={() => { setEditEmp(null); setShowEmpModal(true) }}
                sx={{ bgcolor: '#E8F5E9', '&:hover': { bgcolor: '#C8E6C9' } }}>
                <AddOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {empleadosFiltrados.length === 0 ? (
            <EmptyState
              icon={BadgeOutlinedIcon}
              title={busqueda ? 'Sin resultados' : 'No hay empleados registrados'}
              description={busqueda ? 'Probá con otra búsqueda.' : 'Registrá el primer empleado.'}
              onAction={!busqueda ? () => { setEditEmp(null); setShowEmpModal(true) } : undefined}
              actionLabel="Nuevo empleado"
            />
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Empleado</TableCell>
                      <TableCell>Contacto</TableCell>
                      <TableCell>Ingreso</TableCell>
                      <TableCell>Salario</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {empleadosFiltrados.map(emp => {
                      const idx = getAvatarIdx(emp.id)
                      return (
                        <TableRow key={emp.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 34, height: 34, bgcolor: AVATAR_COLORS[idx], color: AVATAR_TEXT[idx], fontSize: 13, fontWeight: 700 }}>
                                {getIniciales(emp.nombreCompleto)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{emp.nombreCompleto}</Typography>
                                <Typography variant="caption" color="text.secondary">{emp.tipo?.nombre || '—'}</Typography>
                                {emp.ci && <Typography variant="caption" color="text.disabled" display="block">CI {emp.ci}</Typography>}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {emp.telefono && <Typography variant="body2">{emp.telefono}</Typography>}
                            {emp.email && <Typography variant="caption" color="text.secondary">{emp.email}</Typography>}
                            {!emp.telefono && !emp.email && '—'}
                          </TableCell>
                          <TableCell>{fmt.fecha(emp.fechaIngreso)}</TableCell>
                          <TableCell><Typography variant="body2" fontWeight={500}>{fmt.salario(emp.salario)}</Typography></TableCell>
                          <TableCell><StatusChip value={emp.estado} /></TableCell>
                          <TableCell align="right">
                            <Tooltip title="Editar">
                              <IconButton size="small" color="warning" onClick={() => { setEditEmp(emp); setShowEmpModal(true) }}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton size="small" color="error" onClick={() => { setConfirmEmpId(emp.id); setConfirmName(emp.nombreCompleto) }}>
                                <DeleteOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Tipos de cargo */}
      {tabIdx === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Tooltip title="Nuevo tipo de cargo">
              <IconButton color="primary" onClick={() => { setEditTipo(null); setShowTipoModal(true) }}
                sx={{ bgcolor: '#E8F5E9', '&:hover': { bgcolor: '#C8E6C9' } }}>
                <AddOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {tipos.length === 0 ? (
            <EmptyState icon={WorkOutlinedIcon} title="No hay tipos de cargo" description="Creá el primer tipo de cargo."
              onAction={() => { setEditTipo(null); setShowTipoModal(true) }} actionLabel="Nuevo tipo" />
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Salario base</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tipos.map(t => (
                      <TableRow key={t.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={700}>{t.nombre}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{t.descripcion || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={500}>Gs. {parseFloat(t.salarioBase || 0).toLocaleString('es-PY')}</Typography></TableCell>
                        <TableCell><StatusChip value={t.activo} /></TableCell>
                        <TableCell align="right">
                          <Tooltip title="Editar">
                            <IconButton size="small" color="warning" onClick={() => { setEditTipo(t); setShowTipoModal(true) }}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => { setConfirmTipoId(t.id); setConfirmName(t.nombre) }}>
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Modales */}
      {showTipoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <TipoEmpleadoForm
              tipoParaEditar={editTipo}
              onSuccess={() => { setShowTipoModal(false); setEditTipo(null) }}
              onCancel={() => { setShowTipoModal(false); setEditTipo(null) }}
            />
          </div>
        </div>
      )}
      {showEmpModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <EmpleadoForm
              empleadoParaEditar={editEmp}
              onSuccess={() => { setShowEmpModal(false); setEditEmp(null) }}
              onCancel={() => { setShowEmpModal(false); setEditEmp(null) }}
            />
          </div>
        </div>
      )}

      <ConfirmDialog open={!!confirmTipoId} onClose={() => setConfirmTipoId(null)} onConfirm={handleEliminarTipo}
        title="¿Eliminar tipo de cargo?" message={`¿Eliminar "${confirmName}"? Esta acción no se puede deshacer.`} />
      <ConfirmDialog open={!!confirmEmpId} onClose={() => setConfirmEmpId(null)} onConfirm={handleEliminarEmp}
        title="¿Eliminar empleado?" message={`¿Eliminar a "${confirmName}"? Esta acción no se puede deshacer.`} />
    </Box>
  )
}
