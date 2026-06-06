import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_ROLES, GET_PERMISOS_SISTEMA, CREATE_ROL, UPDATE_ROL, DELETE_ROL } from '../graphql/roles'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage   from '../components/ErrorMessage'
import PageHeader     from '../components/ui/PageHeader'
import PageAlert      from '../components/ui/PageAlert'
import ConfirmDialog  from '../components/ui/ConfirmDialog'
import EmptyState     from '../components/ui/EmptyState'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControlLabel, Checkbox, Divider,
} from '@mui/material'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import EditOutlinedIcon               from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon             from '@mui/icons-material/DeleteOutlined'

export default function RolesPage() {
  const { data, loading, error, refetch } = useQuery(GET_ROLES)
  const { data: permisosData }            = useQuery(GET_PERMISOS_SISTEMA)
  const [createRol] = useMutation(CREATE_ROL)
  const [updateRol] = useMutation(UPDATE_ROL)
  const [deleteRol] = useMutation(DELETE_ROL)

  const [showForm, setShowForm]         = useState(false)
  const [editingId, setEditingId]       = useState(null)
  const [formData, setFormData]         = useState({ nombre: '', descripcion: '', permisos: [] })
  const [message, setMessage]           = useState(null)
  const [confirmId, setConfirmId]       = useState(null)
  const [confirmName, setConfirmName]   = useState('')

  const roles         = data?.roles || []
  const permisosSist  = permisosData?.permisosSistemaDict || {}

  const notify = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3500)
  }

  const openAdd  = () => { setEditingId(null); setFormData({ nombre: '', descripcion: '', permisos: [] }); setShowForm(true) }
  const openEdit = (r) => { setEditingId(r.id); setFormData({ nombre: r.nombre, descripcion: r.descripcion || '', permisos: r.permisosLista || [] }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditingId(null); setFormData({ nombre: '', descripcion: '', permisos: [] }) }

  const togglePermiso = (key) =>
    setFormData(prev => ({
      ...prev,
      permisos: prev.permisos.includes(key) ? prev.permisos.filter(p => p !== key) : [...prev.permisos, key],
    }))

  const toggleAll = () => {
    const allKeys = Object.keys(permisosSist)
    setFormData(prev => ({ ...prev, permisos: prev.permisos.length === allKeys.length ? [] : allKeys }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = editingId
        ? await updateRol({ variables: { id: editingId, nombre: formData.nombre, descripcion: formData.descripcion, permisos: formData.permisos, activo: true } })
        : await createRol({ variables: { nombre: formData.nombre, descripcion: formData.descripcion, permisos: formData.permisos } })
      const ok  = result.data?.crearRol?.success || result.data?.actualizarRol?.success
      const msg = result.data?.crearRol?.message  || result.data?.actualizarRol?.message
      notify(ok ? 'success' : 'error', msg || (ok ? 'Guardado' : 'Error'))
      if (ok) { closeForm(); refetch() }
    } catch (err) { notify('error', err.message) }
  }

  const handleDelete = async () => {
    try {
      const result = await deleteRol({ variables: { id: confirmId } })
      const ok  = result.data?.eliminarRol?.success
      const msg = result.data?.eliminarRol?.message
      notify(ok ? 'success' : 'error', msg || (ok ? 'Eliminado' : 'Error'))
      if (ok) refetch()
    } catch (err) { notify('error', err.message) }
    setConfirmId(null)
  }

  // Group permisos by category prefix
  const permisosPorCategoria = Object.keys(permisosSist).reduce((acc, key) => {
    const cat = key.split('_')[0]
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ key, label: permisosSist[key] })
    return acc
  }, {})

  if (loading) return <LoadingSpinner />
  if (error)   return <ErrorMessage message={error.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Gestión de Roles"
        icon={AdminPanelSettingsOutlinedIcon}
        onAdd={openAdd}
        addLabel="Nuevo Rol"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {roles.length === 0 ? (
        <EmptyState
          icon={AdminPanelSettingsOutlinedIcon}
          title="No hay roles registrados"
          description="Creá roles para asignar permisos a los usuarios."
          onAction={openAdd}
          actionLabel="Crear rol"
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rol</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Permisos</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{r.nombre}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{r.descripcion || '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${r.permisosLista?.length || 0} permisos`}
                        sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="warning" onClick={() => openEdit(r)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => { setConfirmId(r.id); setConfirmName(r.nombre) }}>
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

      {/* Form dialog */}
      <Dialog open={showForm} onClose={closeForm} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Editar Rol' : 'Nuevo Rol'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="rol-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Nombre *" required size="small" value={formData.nombre} onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))} />
            <TextField label="Descripción" size="small" multiline rows={2} value={formData.descripcion} onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))} />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Permisos</Typography>
                <Button size="small" onClick={toggleAll} sx={{ textTransform: 'none', fontSize: 12 }}>
                  {formData.permisos.length === Object.keys(permisosSist).length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              </Box>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 340, overflowY: 'auto', borderRadius: 2 }}>
                {Object.keys(permisosPorCategoria).map((cat, i) => (
                  <Box key={cat}>
                    {i > 0 && <Divider sx={{ my: 1.5 }} />}
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {cat}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                      {permisosPorCategoria[cat].map(p => (
                        <FormControlLabel
                          key={p.key}
                          control={
                            <Checkbox
                              size="small"
                              checked={formData.permisos.includes(p.key)}
                              onChange={() => togglePermiso(p.key)}
                              color="primary"
                            />
                          }
                          label={<Typography variant="body2">{p.label}</Typography>}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeForm} variant="outlined" color="inherit">Cancelar</Button>
          <Button type="submit" form="rol-form" variant="contained" color="primary">
            {editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar rol?"
        message={`¿Estás seguro de eliminar el rol "${confirmName}"? Esta acción no se puede deshacer.`}
      />
    </Box>
  )
}
