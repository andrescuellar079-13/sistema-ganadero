import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_USUARIOS, CREATE_USUARIO, UPDATE_USUARIO, DELETE_USUARIO } from '../graphql/usuarios'
import { GET_ROLES } from '../graphql/roles'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import PageHeader from '../components/ui/PageHeader'
import PageAlert from '../components/ui/PageAlert'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatusChip from '../components/ui/StatusChip'
import EmptyState from '../components/ui/EmptyState'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid,
} from '@mui/material'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

const EMPTY = { username: '', email: '', password: '', firstName: '', lastName: '', rolId: '', telefono: '' }

export default function UsuariosPage() {
  const { data, loading, error, refetch } = useQuery(GET_USUARIOS)
  const { data: rolesData } = useQuery(GET_ROLES)
  const [createUsuario] = useMutation(CREATE_USUARIO)
  const [updateUsuario] = useMutation(UPDATE_USUARIO)
  const [deleteUsuario] = useMutation(DELETE_USUARIO)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY)
  const [message, setMessage] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [confirmName, setConfirmName] = useState('')

  const usuarios = data?.usuarios || []
  const roles = rolesData?.roles || []

  const notify = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3500)
  }

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))

  const openAdd = () => { setEditingId(null); setFormData(EMPTY); setShowForm(true) }
  const openEdit = (u) => {
    setEditingId(u.id)
    setFormData({ username: u.username, email: u.email || '', password: '', firstName: u.firstName || '', lastName: u.lastName || '', rolId: u.rol?.id || '', telefono: u.telefono || '' })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setFormData(EMPTY) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = editingId
        ? await updateUsuario({ variables: { id: editingId, username: formData.username, email: formData.email, firstName: formData.firstName, lastName: formData.lastName, rolId: formData.rolId || null, telefono: formData.telefono, isActive: true } })
        : await createUsuario({ variables: { username: formData.username, email: formData.email, password: formData.password, firstName: formData.firstName, lastName: formData.lastName, rolId: formData.rolId || null, telefono: formData.telefono } })
      const ok = result.data?.crearUsuario?.success || result.data?.actualizarUsuario?.success
      const msg = result.data?.crearUsuario?.message || result.data?.actualizarUsuario?.message
      notify(ok ? 'success' : 'error', msg || (ok ? 'Guardado' : 'Error'))
      if (ok) { closeForm(); refetch() }
    } catch (err) { notify('error', err.message) }
  }

  const handleDelete = async () => {
    try {
      const result = await deleteUsuario({ variables: { id: confirmId } })
      const ok = result.data?.eliminarUsuario?.success
      const msg = result.data?.eliminarUsuario?.message
      notify(ok ? 'success' : 'error', msg || (ok ? 'Eliminado' : 'Error'))
      if (ok) refetch()
    } catch (err) { notify('error', err.message) }
    setConfirmId(null)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Gestión de Usuarios"
        icon={PeopleOutlinedIcon}
        onAdd={openAdd}
        addLabel="Nuevo Usuario"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {usuarios.length === 0 ? (
        <EmptyState
          icon={PeopleOutlinedIcon}
          title="No hay usuarios registrados"
          description="Creá el primer usuario del sistema."
          onAction={openAdd}
          actionLabel="Crear usuario"
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map(u => (
                  <TableRow key={u.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{u.username}</Typography></TableCell>
                    <TableCell>{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{u.email || '—'}</Typography></TableCell>
                    <TableCell>{u.rol?.nombre || '—'}</TableCell>
                    <TableCell><StatusChip value={u.isActive} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="warning" onClick={() => openEdit(u)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => { setConfirmId(u.id); setConfirmName(u.username) }}>
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
      <Dialog open={showForm} onClose={closeForm} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="user-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Usuario *" required size="small" value={formData.username} onChange={set('username')} />
            <TextField label="Email" type="email" size="small" value={formData.email} onChange={set('email')} />
            {!editingId && (
              <TextField label="Contraseña *" type="password" required size="small" value={formData.password} onChange={set('password')} />
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Nombre" size="small" fullWidth value={formData.firstName} onChange={set('firstName')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Apellido" size="small" fullWidth value={formData.lastName} onChange={set('lastName')} />
              </Grid>
            </Grid>
            <TextField label="Teléfono" size="small" value={formData.telefono} onChange={set('telefono')} />
            <TextField select label="Rol" size="small" value={formData.rolId} onChange={set('rolId')}>
              <MenuItem value="">Sin rol</MenuItem>
              {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeForm} variant="outlined" color="inherit">Cancelar</Button>
          <Button type="submit" form="user-form" variant="contained" color="primary">
            {editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar usuario?"
        message={`¿Estás seguro de eliminar al usuario "${confirmName}"? Esta acción no se puede deshacer.`}
      />
    </Box>
  )
}
