// frontend/src/components/ReportesVentas.jsx
import { useState } from 'react'
import { useReportesVentas } from '../hooks/useReportesVentas'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Pets as PetsIcon,
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'

const ReportesVentas = () => {
  const { getEstadisticas, getProductosMasVendidos, getVentasPorCliente } = useReportesVentas()
  
  const [fechaInicio, setFechaInicio] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])
  const [periodoRapido, setPeriodoRapido] = useState('mes')
  const [aplicarFiltros, setAplicarFiltros] = useState(false)

  const { estadisticas, loading: loadingStats, refetch: refetchStats } = getEstadisticas(
    aplicarFiltros ? fechaInicio : null,
    aplicarFiltros ? fechaFin : null
  )
  
  const { productos, loading: loadingProductos, refetch: refetchProductos } = getProductosMasVendidos(
    10,
    aplicarFiltros ? fechaInicio : null,
    aplicarFiltros ? fechaFin : null
  )
  
  const { clientes, loading: loadingClientes, refetch: refetchClientes } = getVentasPorCliente(
    10,
    aplicarFiltros ? fechaInicio : null,
    aplicarFiltros ? fechaFin : null
  )

  // Formato de moneda en Bolivianos
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(value || 0)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-BO').format(value || 0)
  }

  const handlePeriodoRapido = (periodo) => {
    const hoy = new Date()
    let inicio = new Date()
    
    switch (periodo) {
      case 'dia':
        inicio = hoy
        break
      case 'semana':
        inicio.setDate(hoy.getDate() - 7)
        break
      case 'mes':
        inicio.setDate(hoy.getDate() - 30)
        break
      case 'anio':
        inicio = new Date(hoy.getFullYear(), 0, 1)
        break
      default:
        inicio.setDate(hoy.getDate() - 30)
    }
    
    setFechaInicio(inicio.toISOString().split('T')[0])
    setFechaFin(hoy.toISOString().split('T')[0])
    setPeriodoRapido(periodo)
    setAplicarFiltros(true)
  }

  const handleAplicarFiltros = () => {
    setAplicarFiltros(true)
    setTimeout(() => {
      refetchStats()
      refetchProductos()
      refetchClientes()
    }, 100)
  }

  const handleLimpiarFiltros = () => {
    const hoy = new Date()
    const hace30Dias = new Date()
    hace30Dias.setDate(hoy.getDate() - 30)
    
    setFechaInicio(hace30Dias.toISOString().split('T')[0])
    setFechaFin(hoy.toISOString().split('T')[0])
    setPeriodoRapido('mes')
    setAplicarFiltros(false)
    setTimeout(() => {
      refetchStats()
      refetchProductos()
      refetchClientes()
    }, 100)
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Filtros de fecha */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DateRangeIcon /> Filtros de Fecha
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Período rápido</InputLabel>
              <Select
                value={periodoRapido}
                onChange={(e) => handlePeriodoRapido(e.target.value)}
                label="Período rápido"
              >
                <MenuItem value="dia">Último día</MenuItem>
                <MenuItem value="semana">Última semana</MenuItem>
                <MenuItem value="mes">Último mes</MenuItem>
                <MenuItem value="anio">Último año</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Fecha inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Fecha fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleAplicarFiltros}
                disabled={loadingStats}
                sx={{ flex: 1 }}
              >
                Aplicar filtros
              </Button>
              <Button
                variant="outlined"
                onClick={handleLimpiarFiltros}
                disabled={loadingStats}
              >
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1976d2', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Total Ventas
                  </Typography>
                  <Typography variant="h4">
                    {loadingStats ? <CircularProgress size={24} color="inherit" /> : formatNumber(estadisticas?.total_ventas)}
                  </Typography>
                </Box>
                <ShoppingCartIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#2e7d32', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Monto Total
                  </Typography>
                  <Typography variant="h6">
                    {loadingStats ? <CircularProgress size={24} color="inherit" /> : formatCurrency(estadisticas?.monto_total)}
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ed6c02', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Animales Vendidos
                  </Typography>
                  <Typography variant="h4">
                    {loadingStats ? <CircularProgress size={24} color="inherit" /> : formatNumber(estadisticas?.total_animales)}
                  </Typography>
                </Box>
                <PetsIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#9c27b0', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Promedio por Venta
                  </Typography>
                  <Typography variant="h6">
                    {loadingStats ? <CircularProgress size={24} color="inherit" /> : formatCurrency(estadisticas?.promedio_venta)}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Productos más vendidos y Clientes principales */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Animales más vendidos</Typography>
              <Tooltip title="Actualizar">
                <IconButton size="small" onClick={() => refetchProductos()} disabled={loadingProductos}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Arete</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingProductos ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : productos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No hay datos
                      </TableCell>
                    </TableRow>
                  ) : (
                    productos.map((producto, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{producto.nro_arete}</TableCell>
                        <TableCell>{producto.nombre}</TableCell>
                        <TableCell align="right">{producto.cantidad}</TableCell>
                        <TableCell align="right">{formatCurrency(producto.total_monto)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Mejores clientes</Typography>
              <Tooltip title="Actualizar">
                <IconButton size="small" onClick={() => refetchClientes()} disabled={loadingClientes}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>CI</TableCell>
                    <TableCell align="right">Compras</TableCell>
                    <TableCell align="right">Total gastado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingClientes ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : clientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No hay datos
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientes.map((cliente, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{cliente.nombre}</TableCell>
                        <TableCell>{cliente.ci}</TableCell>
                        <TableCell align="right">{cliente.total_compras}</TableCell>
                        <TableCell align="right">{formatCurrency(cliente.total_gastado)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ReportesVentas