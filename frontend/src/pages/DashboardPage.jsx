// frontend/src/pages/DashboardPage.jsx
// Centro de control operativo: solo lectura + navegación.
// Todos los KPIs provienen de los resolvers de resumen reales de cada módulo
// (ver useDashboard). El Dashboard no recalcula ni duplica datos.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { useFincas } from '../hooks/useFincas'
import DashboardCard from '../components/DashboardCard'

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

import {
  Box, Grid, Paper, Typography, Stack, Divider, Button, Chip,
  Select, MenuItem, FormControl, TextField, CircularProgress, Alert,
  List, ListItemButton, ListItemIcon, ListItemText, Avatar,
} from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'

import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import HeartBrokenOutlinedIcon from '@mui/icons-material/HeartBrokenOutlined'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined'
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined'
import PregnantWomanOutlinedIcon from '@mui/icons-material/PregnantWomanOutlined'
import ChildCareOutlinedIcon from '@mui/icons-material/ChildCareOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined'
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import PriceCheckOutlinedIcon from '@mui/icons-material/PriceCheckOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const PIE_COLORS = ['#2E7D32', '#1976D2', '#ED6C02', '#9C27B0', '#0288D1', '#D32F2F', '#7B1FA2', '#00838F', '#F9A825', '#5D4037']

const fmtDinero = (v) => 'Bs. ' + Number(v || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
const fmtLeche = (v) => Number(v || 0).toFixed(1).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' Lts'
const fmtEjeMoneda = (v) => {
  if (v >= 1_000_000) return `Bs. ${(v / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (v >= 1_000) return `Bs. ${(v / 1_000).toFixed(1).replace('.0', '')}K`
  return `Bs. ${v}`
}

// Título de sección reutilizable
const SectionTitle = ({ children, color = 'text.primary' }) => (
  <Typography variant="overline" sx={{ fontWeight: 700, color, letterSpacing: 1, display: 'block', mt: 1, mb: 1.5 }}>
    {children}
  </Typography>
)

// Estado vacío para gráficos
const SinDatos = () => (
  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.disabled">Sin datos para este periodo</Typography>
  </Box>
)

const DashboardPage = () => {
  const navigate = useNavigate()
  const { fincaActual } = useFincas()
  const fincaId = fincaActual?.id || '1'

  const [tipoFiltro, setTipoFiltro] = useState('ANIO')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const {
    loading, error,
    datosMensuales, secciones, finanzas, distribucionCategoria, alertasPorTipo,
  } = useDashboard(fincaId, { tipoFiltro, fechaInicio, fechaFin })

  // -------- Estados globales de carga / error --------
  if (loading && !secciones?.animales) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Cargando Dashboard...</Typography>
      </Box>
    )
  }
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 640, mx: 'auto', mt: 6 }}>
          Error al cargar resumen. {error.message}
        </Alert>
      </Box>
    )
  }

  const a = secciones.animales || {}
  const p = secciones.produccion || {}
  const s = secciones.sanidad || {}
  const r = secciones.reproduccion || {}
  const al = secciones.alertas || {}

  const etiquetaPeriodo = tipoFiltro === 'ANIO' ? 'del Año' : tipoFiltro === 'MES' ? 'del Mes' : 'del Período'

  // -------- Acciones pendientes (derivadas de contadores reales > 0) --------
  const acciones = [
    { label: 'Animales sin pesaje', count: p.animalesSinPesaje, icon: ScaleOutlinedIcon, to: '/produccion', color: '#ED6C02' },
    { label: 'Próximos partos (30 días)', count: r.proximosPartos, icon: PregnantWomanOutlinedIcon, to: '/reproduccion', color: '#9C27B0' },
    { label: 'Tratamientos activos', count: s.tratamientosActivos, icon: MedicalServicesOutlinedIcon, to: '/sanidad', color: '#ED6C02' },
    { label: 'Vacunas vencidas', count: s.vacunasVencidas, icon: VaccinesOutlinedIcon, to: '/sanidad', color: '#D32F2F' },
    { label: 'Desparasitaciones vencidas', count: s.desparasitacionesVencidas, icon: BugReportOutlinedIcon, to: '/sanidad', color: '#D32F2F' },
    { label: 'Animales en retiro', count: s.animalesEnRetiro, icon: TimerOutlinedIcon, to: '/sanidad', color: '#D32F2F' },
    { label: 'Alertas críticas', count: al.criticas, icon: ReportProblemOutlinedIcon, to: '/alertas', color: '#D32F2F' },
  ].filter((x) => (x.count ?? 0) > 0)

  // -------- Exportaciones (mantiene funcionalidad previa: balance financiero) --------
  const exportarExcel = () => {
    const filas = datosMensuales.map((m) => ({ Mes: m.name, Ventas: m.ventas, Gastos: m.gastos, 'Leche (L)': m.leche }))
    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
    XLSX.writeFile(wb, `Dashboard_${tipoFiltro}.xlsx`)
  }
  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.text('Resumen del Dashboard', 14, 18)
    doc.setFontSize(10); doc.text(`Periodo: ${etiquetaPeriodo}`, 14, 26)
    doc.autoTable({
      startY: 32,
      head: [['Mes', 'Ventas (Bs.)', 'Gastos (Bs.)', 'Leche (L)']],
      body: datosMensuales.map((m) => [m.name, m.ventas.toFixed(0), m.gastos.toFixed(0), m.leche.toFixed(1)]),
    })
    doc.save(`Dashboard_${tipoFiltro}.pdf`)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>

      {/* Encabezado + filtro temporal */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #E2E8F0', borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Centro de Control Ganadero</Typography>
          <Typography variant="body2" color="text.secondary">Resumen operativo en tiempo real · {fincaActual?.nombre || 'Finca'}</Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <FormControl size="small">
            <Select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="ANIO">Resumen Anual</MenuItem>
              <MenuItem value="MES">Mes Actual</MenuItem>
              <MenuItem value="PERSONALIZADO">Rango Personalizado</MenuItem>
            </Select>
          </FormControl>
          {tipoFiltro === 'PERSONALIZADO' && (
            <>
              <TextField size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              <TextField size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </>
          )}
          <Button size="small" variant="outlined" color="success" onClick={exportarExcel}>Excel</Button>
          <Button size="small" variant="outlined" color="error" onClick={exportarPDF}>PDF</Button>
        </Stack>
      </Paper>

      {/* ===================== RESUMEN GENERAL ===================== */}
      <SectionTitle color="primary.main">Resumen General</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Total animales" value={a.total} icon={PetsOutlinedIcon} accent="#1976D2" subtitle={`${a.machos ?? 0} machos · ${a.hembras ?? 0} hembras`} onClick={() => navigate('/animales')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Animales activos" value={a.activos} icon={CheckCircleOutlineIcon} accent="#2E7D32" onClick={() => navigate('/animales')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Animales vendidos" value={a.vendidos} icon={SellOutlinedIcon} accent="#00838F" onClick={() => navigate('/ventas')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Bajas / Muertes" value={a.bajas} icon={HeartBrokenOutlinedIcon} accent="#78909C" onClick={() => navigate('/bajas')} />
        </Grid>
      </Grid>

      {/* ===================== PRODUCCIÓN ===================== */}
      <SectionTitle color="#B7791F">Producción</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Leche hoy" value={fmtLeche(finanzas.lecheHoy)} icon={WaterDropOutlinedIcon} accent="#F9A825" subtitle={`Prom. ${Number(p.promedioLitrosVaca || 0).toFixed(1)} L/vaca`} onClick={() => navigate('/produccion')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Leche del mes" value={fmtLeche(finanzas.lecheMes)} icon={WaterDropOutlinedIcon} accent="#F9A825" onClick={() => navigate('/produccion')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Animales en engorde" value={p.animalesEngorde} icon={FitnessCenterOutlinedIcon} accent="#ED6C02" subtitle={p.animalesListosVenta > 0 ? `${p.animalesListosVenta} listos p/ venta` : null} onClick={() => navigate('/produccion')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Animales sin pesaje" value={p.animalesSinPesaje} icon={ScaleOutlinedIcon} accent="#ED6C02" highlight={p.animalesSinPesaje > 0} onClick={() => navigate('/produccion')} />
        </Grid>
      </Grid>

      {/* ===================== REPRODUCCIÓN ===================== */}
      <SectionTitle color="secondary.main">Reproducción</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Vacas preñadas" value={r.vacasPrenadas} icon={PregnantWomanOutlinedIcon} accent="#9C27B0" onClick={() => navigate('/reproduccion')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Próximos partos (30 días)" value={r.proximosPartos} icon={ChildCareOutlinedIcon} accent="#7B1FA2" highlight={r.proximosPartos > 0} onClick={() => navigate('/reproduccion')} />
        </Grid>
      </Grid>

      {/* ===================== SANIDAD ===================== */}
      <SectionTitle color="error.main">Sanidad</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={6} md={2.4}>
          <DashboardCard title="Tratamientos activos" value={s.tratamientosActivos} icon={MedicalServicesOutlinedIcon} accent="#ED6C02" highlight={s.tratamientosActivos > 0} onClick={() => navigate('/sanidad')} />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <DashboardCard title="Animales en retiro" value={s.animalesEnRetiro} icon={TimerOutlinedIcon} accent="#D32F2F" highlight={s.animalesEnRetiro > 0} onClick={() => navigate('/sanidad')} />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <DashboardCard title="Vacunas vencidas" value={s.vacunasVencidas} icon={VaccinesOutlinedIcon} accent="#D32F2F" highlight={s.vacunasVencidas > 0} onClick={() => navigate('/sanidad')} />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <DashboardCard title="Despar. vencidas" value={s.desparasitacionesVencidas} icon={BugReportOutlinedIcon} accent="#D32F2F" highlight={s.desparasitacionesVencidas > 0} onClick={() => navigate('/sanidad')} />
        </Grid>
        <Grid item xs={6} md={2.4}>
          <DashboardCard title="Mastitis activas" value={s.mastitisActivas} icon={LocalHospitalOutlinedIcon} accent="#C2185B" highlight={s.mastitisActivas > 0} onClick={() => navigate('/sanidad')} />
        </Grid>
      </Grid>

      {/* ===================== FINANZAS ===================== */}
      <SectionTitle color="success.main">Finanzas</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <DashboardCard title={`Ventas ${etiquetaPeriodo}`} value={fmtDinero(finanzas.ventasPeriodo)} icon={PaidOutlinedIcon} accent="#2E7D32" onClick={() => navigate('/ventas')} />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard title={`Gastos ${etiquetaPeriodo}`} value={fmtDinero(finanzas.gastosPeriodo)} icon={PriceCheckOutlinedIcon} accent="#D32F2F" onClick={() => navigate('/alertas')} />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard title={`Balance ${etiquetaPeriodo}`} value={fmtDinero(finanzas.balancePeriodo)} icon={AccountBalanceOutlinedIcon} accent={finanzas.balancePeriodo >= 0 ? '#1976D2' : '#D32F2F'} />
        </Grid>
      </Grid>

      {/* ===================== ALERTAS ===================== */}
      <SectionTitle color="warning.main">Alertas</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Alertas críticas" value={al.criticas} icon={ReportProblemOutlinedIcon} accent="#D32F2F" highlight={al.criticas > 0} onClick={() => navigate('/alertas')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Alertas vencidas" value={al.vencidas} icon={NotificationsActiveOutlinedIcon} accent="#ED6C02" highlight={al.vencidas > 0} onClick={() => navigate('/alertas')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Alertas pendientes" value={al.pendientes} icon={NotificationsActiveOutlinedIcon} accent="#F9A825" onClick={() => navigate('/alertas')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <DashboardCard title="Alertas resueltas" value={al.resueltas} icon={CheckCircleOutlineIcon} accent="#2E7D32" onClick={() => navigate('/alertas')} />
        </Grid>
      </Grid>

      {/* ===================== ACCIONES PENDIENTES + DISTRIBUCIÓN ===================== */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #E2E8F0', borderRadius: 2, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <PendingActionsOutlinedIcon color="warning" />
              <Typography variant="subtitle1" fontWeight={700}>Acciones pendientes</Typography>
              {acciones.length > 0 && <Chip size="small" color="warning" label={acciones.length} />}
            </Stack>
            <Divider sx={{ mb: 1 }} />
            {acciones.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Sin acciones pendientes 🎉</Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {acciones.map((ac, i) => (
                  <ListItemButton key={i} onClick={() => navigate(ac.to)} sx={{ borderRadius: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar sx={{ width: 30, height: 30, bgcolor: ac.color + '18', color: ac.color }}>
                        <ac.icon sx={{ fontSize: 18 }} />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText primary={ac.label} />
                    <Chip size="small" label={ac.count} sx={{ bgcolor: ac.color + '18', color: ac.color, fontWeight: 700, mr: 0.5 }} />
                    <ChevronRightIcon sx={{ color: 'text.disabled' }} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #E2E8F0', borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Distribución de animales por categoría</Typography>
            <Box sx={{ height: 300 }}>
              {distribucionCategoria.length === 0 ? <SinDatos /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribucionCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => `${e.name} (${e.value})`}>
                      {distribucionCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ===================== GRÁFICOS FINANCIEROS / PRODUCTIVOS ===================== */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Balance Financiero Mensual</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosMensuales} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={fmtEjeMoneda} />
                  <Tooltip formatter={(v) => 'Bs. ' + Number(v).toLocaleString('es-ES')} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 13 }} />
                  <Bar dataKey="ventas" name="Ventas" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#D32F2F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Tendencia de Producción Lechera</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosMensuales} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={(v) => `${v} L`} />
                  <Tooltip formatter={(v) => Number(v).toLocaleString('es-ES') + ' Lts'} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 13 }} />
                  <Line type="monotone" dataKey="leche" name="Producción (Litros)" stroke="#F9A825" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Alertas por tipo</Typography>
            <Box sx={{ height: 300 }}>
              {alertasPorTipo.length === 0 ? <SinDatos /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertasPorTipo} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={130} />
                    <Tooltip />
                    <Bar dataKey="value" name="Alertas" fill="#ED6C02" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

    </Box>
  )
}

export default DashboardPage
