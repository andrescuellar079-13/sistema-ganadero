// frontend/src/pages/ClientesPage.jsx
import { useState, useMemo } from 'react'
import { useClientes } from '../hooks/useClientes'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ClienteForm from '../components/ClienteForm'
import PageHeader from '../components/ui/PageHeader'
import PageAlert from '../components/ui/PageAlert'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

// --- Imports añadidos ---
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, IconButton, Tooltip, TextField, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, Chip, Stack, Button,
} from '@mui/material'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined' // Icono añadido

export default function ClientesPage() {
  const { clientes, loading, error, crearCliente, actualizarCliente, eliminarCliente } = useClientes()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const clientesFiltrados = useMemo(() => {
    let filtered = [...clientes]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.nombre?.toLowerCase().includes(term) ||
        c.apellidos?.toLowerCase().includes(term) ||
        c.ci?.toLowerCase().includes(term) ||
        c.telefono?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.direccion?.toLowerCase().includes(term)
      )
    }
    
    return filtered
  }, [clientes, searchTerm])

  // --- Funciones añadidas ---
  const exportarExcel = () => {
    const data = clientesFiltrados.map(c => ({
      Nombre: c.nombre, Apellidos: c.apellidos, CI: c.ci, Telefono: c.telefono, Email: c.email, Direccion: c.direccion
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Clientes")
    XLSX.writeFile(wb, "Reporte_Clientes.xlsx")
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.text("Reporte de Clientes", 14, 15)
    doc.autoTable({
      head: [['Nombre', 'Apellidos', 'CI', 'Teléfono', 'Email', 'Dirección']],
      body: clientesFiltrados.map(c => [c.nombre, c.apellidos, c.ci, c.telefono, c.email, c.direccion]),
    })
    doc.save("Reporte_Clientes.pdf")
  }

  const limpiarFiltros = () => {
    setSearchTerm('')
  }

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

  const hayFiltrosActivos = searchTerm !== ''

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Botones de exportación añadidos junto al header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader
          title="Clientes"
          icon={PeopleOutlinedIcon}
          onAdd={openAdd}
          addLabel="Nuevo Cliente"
        />
        <Stack direction="row" spacing={1}>
           <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportarExcel} size="small" variant="outlined">Excel</Button>
           <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportarPDF} size="small" variant="outlined" color="error">PDF</Button>
        </Stack>
      </Box>

      <PageAlert message={message} onClose={() => setMessage(null)} />

      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Buscar por nombre, apellido, CI, teléfono, email..."
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
              },
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Tooltip title="Filtros avanzados">
              <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            {hayFiltrosActivos && (
              <Chip 
                label="Limpiar filtros" 
                size="small" 
                onClick={limpiarFiltros}
                onDelete={limpiarFiltros}
              />
            )}
          </Box>
        </Stack>

        {showFilters && (
          <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              🔍 Los filtros avanzados para clientes incluyen búsqueda por:
              nombre, apellido, CI, teléfono, email y dirección
            </Typography>
          </Stack>
        )}

        {hayFiltrosActivos && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            {clientesFiltrados.length} de {clientes.length} clientes encontrados
          </Typography>
        )}
      </Paper>

      {clientesFiltrados.length === 0 ? (
        <EmptyState
          icon={PeopleOutlinedIcon}
          title={hayFiltrosActivos ? "No hay clientes que coincidan con la búsqueda" : "No hay clientes registrados"}
          description={hayFiltrosActivos ? "Intentá con otros términos de búsqueda." : "Agregá el primer cliente para comenzar a registrar ventas."}
          onAction={openAdd}
          actionLabel={hayFiltrosActivos ? "Limpiar filtros" : "Crear primer cliente"}
          onSecondaryAction={hayFiltrosActivos ? limpiarFiltros : undefined}
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
                {clientesFiltrados.map((c) => (
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