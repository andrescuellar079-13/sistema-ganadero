import { useState } from 'react'
import { useClientes } from '../hooks/useClientes'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ClienteForm from '../components/ClienteForm'
import PageHeader from '../components/ui/PageHeader'
import PageAlert from '../components/ui/PageAlert'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, IconButton, Tooltip,
} from '@mui/material'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

export default function ClientesPage() {
  const { clientes, loading, error, crearCliente, actualizarCliente, eliminarCliente } = useClientes()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const notify = (result) => {
    setMessage({ type: result.success ? 'success' : 'error', text: result.message })
    setTimeout(() => setMessage(null), 3500)
  }

  const handleCreate = async (data) => {
    const r = await crearCliente(data)
    notify(r)
    if (r.success) closeForm()
  }

  const handleUpdate = async (data) => {
    const r = await actualizarCliente(editing.id, data)
    notify(r)
    if (r.success) closeForm()
  }

  const handleDelete = async () => {
    const r = await eliminarCliente(confirmId)
    notify(r)
    setConfirmId(null)
  }

  const openAdd = () => { setEditing(null); setShowForm(true) }
  const openEdit = (c) => { setEditing(c); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Clientes"
        icon={PeopleOutlinedIcon}
        onAdd={openAdd}
        addLabel="Nuevo Cliente"
      />

      <PageAlert message={message} onClose={() => setMessage(null)} />

      {clientes.length === 0 ? (
        <EmptyState
          icon={PeopleOutlinedIcon}
          title="No hay clientes registrados"
          description="Agregá el primer cliente para comenzar a registrar ventas."
          onAction={openAdd}
          actionLabel="Crear primer cliente"
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellidos</TableCell>
                  <TableCell>CI / NIT</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.nombre}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{c.apellidos || '—'}</Typography></TableCell>
                    <TableCell>{c.ci || '—'}</TableCell>
                    <TableCell>{c.telefono || '—'}</TableCell>
                    <TableCell>{c.email || '—'}</TableCell>
                    <TableCell>{c.direccion || '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="warning" onClick={() => openEdit(c)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => setConfirmId(c.id)}>
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
        <ClienteForm
          cliente={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={closeForm}
        />
      )}

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar cliente?"
        message="Esta acción no se puede deshacer."
      />
    </Box>
  )
}
