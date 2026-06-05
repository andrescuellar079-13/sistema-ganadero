import { useDashboard } from '../hooks/useDashboard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage   from '../components/ErrorMessage'
import ChartCard      from '../components/ChartCard'
import BarChart       from '../components/BarChart'
import PieChart       from '../components/PieChart'
import LineChart      from '../components/LineChart'

import {
  Box, Card, CardContent, Typography, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, Paper,
} from '@mui/material'
import PetsOutlinedIcon                from '@mui/icons-material/PetsOutlined'
import CheckCircleOutlinedIcon         from '@mui/icons-material/CheckCircleOutlined'
import MedicalServicesOutlinedIcon     from '@mui/icons-material/MedicalServicesOutlined'
import VaccinesOutlinedIcon            from '@mui/icons-material/VaccinesOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'

const ACCENT = {
  blue:   '#1565C0',
  green:  '#2E7D32',
  purple: '#6A1B9A',
  orange: '#E65100',
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, IconComp, accent }) {
  return (
    <Card elevation={0} sx={{ borderLeft: `4px solid ${accent}` }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.75 }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.1 }}>
              {value ?? '—'}
            </Typography>
          </Box>
          <Box sx={{
            width: 46, height: 46, borderRadius: 2, flexShrink: 0,
            bgcolor: accent + '14',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconComp sx={{ fontSize: 22, color: accent }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ── Placeholder vacío ─────────────────────────────────────────────────────────
function EmptyChart() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography variant="body2" color="text.disabled">Sin datos disponibles</Typography>
    </Box>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    totalAnimales, totalVacunas, totalVacunaciones, animalesActivos,
    proximasVacunaciones,
    vacunacionesPorMes, animalesPorCategoria, animalesPorSexo,
    vacunasPorTipo, ventasPorMes, produccionPorMes,
    loading, error, refetchStats,
  } = useDashboard()

  if (loading) return <LoadingSpinner />
  if (error && !totalAnimales && !totalVacunas)
    return <ErrorMessage message={error.message} onRetry={refetchStats} />

  const kpis = [
    { label: 'Total Animales',      value: totalAnimales,     IconComp: PetsOutlinedIcon,            accent: ACCENT.blue   },
    { label: 'Animales Activos',    value: animalesActivos,   IconComp: CheckCircleOutlinedIcon,     accent: ACCENT.green  },
    { label: 'Vacunas Registradas', value: totalVacunas,      IconComp: MedicalServicesOutlinedIcon, accent: ACCENT.purple },
    { label: 'Vacunaciones',        value: totalVacunaciones, IconComp: VaccinesOutlinedIcon,        accent: ACCENT.orange },
  ]

  const has = (obj) => obj?.labels?.length > 0

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </Box>

      {/* Gráficos fila 1 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        <ChartCard title="Vacunaciones por Mes">
          {has(vacunacionesPorMes)
            ? <BarChart labels={vacunacionesPorMes.labels} data={vacunacionesPorMes.values}
                title="Cantidad" backgroundColor={ACCENT.orange} />
            : <EmptyChart />}
        </ChartCard>
        <ChartCard title="Ventas por Mes">
          {has(ventasPorMes)
            ? <LineChart labels={ventasPorMes.labels} data={ventasPorMes.values}
                title="Monto (Gs.)" color={ACCENT.green} />
            : <EmptyChart />}
        </ChartCard>
      </Box>

      {/* Gráficos fila 2 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        <ChartCard title="Animales por Categoría">
          {has(animalesPorCategoria)
            ? <PieChart labels={animalesPorCategoria.labels} data={animalesPorCategoria.values} />
            : <EmptyChart />}
        </ChartCard>
        <ChartCard title="Animales por Sexo">
          {has(animalesPorSexo)
            ? <PieChart labels={animalesPorSexo.labels} data={animalesPorSexo.values}
                colors={[ACCENT.blue, '#AD1457']} />
            : <EmptyChart />}
        </ChartCard>
        <ChartCard title="Vacunas por Vía de Aplicación">
          {has(vacunasPorTipo)
            ? <PieChart labels={vacunasPorTipo.labels} data={vacunasPorTipo.values} />
            : <EmptyChart />}
        </ChartCard>
      </Box>

      {/* Producción */}
      <ChartCard title="Producción de Leche por Mes">
        {has(produccionPorMes)
          ? <BarChart labels={produccionPorMes.labels} data={produccionPorMes.values}
              title="Litros" backgroundColor={ACCENT.purple} />
          : <EmptyChart />}
      </ChartCard>

      {/* Próximas vacunaciones */}
      {proximasVacunaciones.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{
            px: 2.5, py: 1.75,
            borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <NotificationsActiveOutlinedIcon sx={{ fontSize: 18, color: ACCENT.orange }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Próximas Vacunaciones — próximos 30 días
            </Typography>
            <Chip
              label={proximasVacunaciones.length}
              size="small"
              sx={{
                bgcolor: '#FEF3C7', color: '#92400E',
                fontWeight: 600, fontSize: '0.7rem', height: 20,
              }}
            />
          </Box>

          {/* Tabla */}
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Animal</TableCell>
                  <TableCell>Vacuna</TableCell>
                  <TableCell>Fecha Próxima</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proximasVacunaciones.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {v.animal?.nroArete && (
                          <Typography component="span" variant="caption" color="text.disabled">
                            #{v.animal.nroArete}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {v.animal?.nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{v.vacuna?.nombre}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={new Date(v.fechaProxima).toLocaleDateString('es-PY')}
                        size="small"
                        sx={{
                          bgcolor: '#FEF3C7', color: '#92400E',
                          border: '1px solid #FDE68A',
                          fontWeight: 500, fontSize: '0.72rem',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
