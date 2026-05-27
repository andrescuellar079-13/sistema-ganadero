import { useState } from 'react'
import { useFincas } from '../hooks/useFincas'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage   from '../components/ErrorMessage'
import FincaForm      from '../components/FincaForm'
import PageHeader     from '../components/ui/PageHeader'
import PageAlert      from '../components/ui/PageAlert'
import ConfirmDialog  from '../components/ui/ConfirmDialog'
import StatusChip     from '../components/ui/StatusChip'
import EmptyState     from '../components/ui/EmptyState'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Alert, IconButton, Tooltip,
} from '@mui/material'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import EditOutlinedIcon     from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon   from '@mui/icons-material/DeleteOutlined'

export default function FincaPage() {
  const { fincas, fincaActual, loading, error, crearFinca, actualizarFinca, eliminarFinca } = useFincas()
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [message, setMessage]       = useState(null)
  const [confirmId, setConfirmId]   = useState(null)
  const [confirmNombre, setConfirmNombre] = useState('')

  const notify = (r) => {
    setMessage({ type: r.success ? 'success' : 'error', text: r.message || (r.success ? 'Operación exitosa' : 'Error') })
    setTimeout(() => setMessage(null), 3500)
  }

  const handleCreate = async (data) => {
    const r = await crearFinca(data)
    notify(r)
    if (r.success) closeForm()
  }

  const handleUpdate = async (data) => {
    const r = await actualizarFinca(editing.id, data)
    notify(r)
    if (r.success) closeForm()
  }

  const handleDelete = async () => {
    const r = await eliminarFinca(confirmId)
    notify(r)
    setConfirmId(null)
  }

  const openEdit  = (f) => { setEditing(f); setShowForm(true) }
  const openAdd   = () => { setEditing(null); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  if (loading) return <LoadingSpinner />
  if (error)   return <ErrorMessage message={error.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Gestión de Finca"
        icon={HomeWorkOutlinedIcon}
        onAdd={openAdd}
        addLabel="Nueva Finca"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {/* Finca actual destacada */}
      {fincaActual && (
        <Alert
          severity="info"
          action={
            <Tooltip title="Editar finca actual">
              <IconButton size="small" color="info" onClick={() => openEdit(fincaActual)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Finca activa: {fincaActual.nombre}
          </Typography>
          {fincaActual.propietario && (
            <Typography variant="caption" color="text.secondary">
              Propietario: {fincaActual.propietario}
            </Typography>
          )}
        </Alert>
      )}

      {fincas.length === 0 ? (
        <EmptyState
          icon={HomeWorkOutlinedIcon}
          title="No hay fincas registradas"
          description="Registrá la finca para comenzar a gestionar el sistema."
          onAction={openAdd}
          actionLabel="Registrar finca"
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Propietario</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fincas.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{f.nombre}</Typography></TableCell>
                    <TableCell>{f.propietario || '—'}</TableCell>
                    <TableCell>
                      {[f.municipio, f.departamento].filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell>{f.telefono || '—'}</TableCell>
                    <TableCell><StatusChip value={f.activo} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="warning" onClick={() => openEdit(f)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => { setConfirmId(f.id); setConfirmNombre(f.nombre) }}>
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

      {showForm && (
        <FincaForm
          fincaParaEditar={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={closeForm}
        />
      )}

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar finca?"
        message={`¿Estás seguro de eliminar la finca "${confirmNombre}"? Esta acción no se puede deshacer.`}
      />
    </Box>
  )
}
