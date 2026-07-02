import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ANIMAL_DETALLE } from '../graphql/animales'
import { useMovimientosAnimal } from '../hooks/useMovimientosAnimal'
import MovimientoAnimalForm from './MovimientoAnimalForm'
import {
  Dialog, DialogContent, DialogTitle,
  IconButton, Tabs, Tab, Box,
  Typography, CircularProgress, Grid, Divider, Chip, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Tooltip,
} from '@mui/material'
import CloseIcon          from '@mui/icons-material/Close'
import AddOutlinedIcon    from '@mui/icons-material/AddOutlined'
import EditOutlinedIcon   from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SwapHorizIcon      from '@mui/icons-material/SwapHoriz'
import StatusChip from './ui/StatusChip'
import AnimalGenealogySection from './AnimalGenealogySection'
import AdvertenciaRetiro from './AdvertenciaRetiro'

// ── Diccionarios de traducción ───────────────────────────────────────────────
const SEXO       = { MACHO: 'Macho', HEMBRA: 'Hembra' }
const ORIGEN     = { NACIDO_FINCA: 'Nacido en finca', COMPRADO: 'Comprado', DONADO: 'Donado' }
const TIPO_PROD  = { CARNE: 'Carne', LECHE: 'Leche', DOBLE_PROPOSITO: 'Doble propósito' }
const TURNO      = { MANIANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' }
const TIPO_PARTO = { NORMAL: 'Normal', DISTOCICO: 'Distócico', ABORTO: 'Aborto', MULTIPLE: 'Múltiple' }
const RES_PRENEZ = { POSITIVO: 'Positivo', NEGATIVO: 'Negativo', DUDOSO: 'Dudoso' }
const RES_SERV   = { PENDIENTE: 'Pendiente', PRENADA: 'Preñada', VACIA: 'Vacía', REPETIR: 'Repetir' }
const TIPO_BAJA  = { MUERTE: 'Muerte', ROBO: 'Robo', SACRIFICIO: 'Sacrificio', DESCARTE: 'Descarte', PERDIDA: 'Pérdida', OTRO: 'Otro' }
const EST_LACT   = { ACTIVA: 'Activa', SECADA: 'Secada', FINALIZADA: 'Finalizada' }
const TIPO_ORIG  = { INTERNO: 'Interno', EXTERNO: 'Externo', SEMEN: 'Semen' }
const EST_REPRO  = { SERVIDA: 'Servida', PRENADA: 'Preñada', PARIDA: 'Parida', ABORTO: 'Aborto', VACIA: 'Vacía', PENDIENTE: 'Pendiente', REPETIR: 'Repetir' }
const EST_ENGORDE = { EN_ENGORDE: 'En engorde', LISTO_VENTA: 'Listo para venta', RETIRADO: 'Retirado', VENDIDO: 'Vendido' }
const TIPO_ENGORDE = { INTENSIVO: 'Intensivo', EXTENSIVO: 'Extensivo', SEMI_INTENSIVO: 'Semi-intensivo' }
const TIPO_CELO  = { NATURAL: 'Natural', INDUCIDO: 'Inducido', SINCRONIZADO: 'Sincronizado' }
const INTENSIDAD = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' }
const RES_PALP   = { POSITIVO: 'Positivo', NEGATIVO: 'Negativo', SOSPECHOSO: 'Sospechoso', QUISTE: 'Quiste' }
const TIPO_DESTETE = { NATURAL: 'Natural', PRECOZ: 'Precoz', FORZADO: 'Forzado' }
const TIPO_RETIRO = { CARNE: 'Carne', LECHE: 'Leche', AMBOS: 'Ambos' }
const PRIORIDAD  = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', CRITICA: 'Crítica' }
const PRIORIDAD_COLOR = { BAJA: 'default', MEDIA: 'info', ALTA: 'warning', CRITICA: 'error' }

const TABS = ['General', 'Genealogía', 'Producción', 'Reproducción', 'Sanidad', 'Movimientos', 'Ventas/Bajas']

const fmt = (iso) => {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ── Componentes auxiliares ───────────────────────────────────────────────────

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null
}

function InfoRow({ label, value, fallback = 'No registrado' }) {
  return (
    <Box sx={{ mb: 0.75 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value || fallback}
      </Typography>
    </Box>
  )
}

function SectionHeader({ children, sx }) {
  return (
    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, mt: 1, ...sx }}>
      {children}
    </Typography>
  )
}

function EmptyMsg({ children }) {
  return (
    <Box sx={{
      textAlign: 'center', py: 3, mb: 2,
      bgcolor: '#F8FAFC', borderRadius: 1.5,
      border: '1px dashed #CBD5E0',
    }}>
      <Typography variant="body2" color="text.disabled" fontStyle="italic">
        {children}
      </Typography>
    </Box>
  )
}

const TH = ({ children, align = 'left' }) => (
  <TableCell align={align} sx={{ fontWeight: 700, fontSize: 12, py: 1, bgcolor: '#F8FAFC' }}>
    {children}
  </TableCell>
)
const TD = ({ children, align = 'left' }) => (
  <TableCell align={align} sx={{ fontSize: 12, py: 0.75 }}>
    {children ?? <Typography variant="caption" color="text.disabled">—</Typography>}
  </TableCell>
)

function SimpleTable({ headers, rows, emptyMsg }) {
  if (!rows || rows.length === 0) return <EmptyMsg>{emptyMsg}</EmptyMsg>
  return (
    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mb: 3, borderRadius: 1.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((h, i) => <TH key={i} align={h.align}>{h.label}</TH>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} hover>
              {row.map((cell, j) => <TD key={j} align={headers[j]?.align}>{cell}</TD>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ── Tarjetas resumen ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'text.primary', highlight = false }) {
  return (
    <Box sx={{
      p: 1.25, borderRadius: 1.5, minWidth: 0,
      bgcolor: highlight ? '#FFF8E1' : '#F8FAFC',
      border: `1px solid ${highlight ? '#FFE082' : '#E2E8F0'}`,
    }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" noWrap>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} color={color} noWrap title={typeof value === 'string' ? value : undefined}>
        {value ?? '—'}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.disabled" display="block" noWrap>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

function ResumenCards({ animal }) {
  const edad = animal.edadMeses != null
    ? (animal.edadMeses >= 12
        ? `${Math.floor(animal.edadMeses / 12)} a ${animal.edadMeses % 12} m`
        : `${animal.edadMeses} meses`)
    : null
  const up = animal.ultimoPesaje
  const gd = animal.gananciaDiariaActual
  const eng = animal.engordeActivo
  const alertas = animal.alertasActivas || []

  const estadoProductivo = eng
    ? EST_ENGORDE[eng.estado] ?? eng.estado
    : (TIPO_PROD[animal.tipoProduccion] ?? animal.tipoProduccion ?? null)

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
      gap: 1, mb: 0.5,
    }}>
      <StatCard label="Edad actual" value={edad} />
      <StatCard label="Parcela actual" value={animal.parcelaActual?.nombre} />
      <StatCard
        label="Peso actual"
        value={animal.peso != null ? `${animal.peso} kg` : null}
      />
      <StatCard
        label="Último pesaje"
        value={up ? `${Number(up.pesoKg)} kg` : null}
        sub={up ? fmt(up.fechaPesaje) : null}
      />
      <StatCard
        label="Ganancia diaria"
        value={gd != null ? `${Number(gd).toFixed(2)} kg/día` : null}
        color={gd != null && Number(gd) < 0 ? 'error.main' : 'success.main'}
      />
      <StatCard label="Tipo producción" value={TIPO_PROD[animal.tipoProduccion] ?? animal.tipoProduccion} />
      <StatCard label="Estado productivo" value={estadoProductivo} />
      <StatCard
        label="Estado reproductivo"
        value={animal.sexo === 'MACHO' ? 'No aplica' : (EST_REPRO[animal.estadoReproductivo] ?? animal.estadoReproductivo)}
      />
      <StatCard
        label="Próximo parto"
        value={animal.proximoParto ? fmt(animal.proximoParto) : null}
      />
      <StatCard
        label="Alertas activas"
        value={alertas.length > 0 ? `${alertas.length}` : 'Ninguna'}
        color={alertas.length > 0 ? 'warning.main' : 'text.primary'}
        highlight={alertas.length > 0}
      />
    </Box>
  )
}

function AlertasList({ alertas, emptyMsg = 'Sin alertas activas' }) {
  if (!alertas || alertas.length === 0) return <EmptyMsg>{emptyMsg}</EmptyMsg>
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
      {alertas.map(a => (
        <Box key={a.id} sx={{
          p: 1.25, borderRadius: 1.5, border: '1px solid #E2E8F0',
          bgcolor: a.vencida ? '#FFEBEE' : '#FFFDF5',
          display: 'flex', alignItems: 'flex-start', gap: 1,
        }}>
          <Chip
            label={PRIORIDAD[a.prioridad] ?? a.prioridad}
            size="small"
            color={PRIORIDAD_COLOR[a.prioridad] ?? 'default'}
            variant="outlined"
            sx={{ mt: 0.25 }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>{a.mensaje}</Typography>
            <Typography variant="caption" color="text.secondary">
              {a.moduloOrigen}{a.fechaAlerta ? ` · ${a.fechaAlerta}` : ''}
              {a.vencida ? ' · Vencida' : (a.fechaVencimiento ? ` · Vence: ${a.fechaVencimiento}` : '')}
            </Typography>
            {a.accionRecomendada && (
              <Typography variant="caption" color="text.disabled" display="block">
                {a.accionRecomendada}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

// ── Pestañas ─────────────────────────────────────────────────────────────────

function TabGeneral({ animal }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <InfoRow label="Arete"    value={animal.nroArete} />
        <InfoRow label="Nombre"   value={animal.nombre}   fallback="Sin nombre registrado" />
        <InfoRow label="Sexo"     value={SEXO[animal.sexo] ?? animal.sexo} />
        <InfoRow label="Estado"   value={animal.estado} />
        <InfoRow label="Raza"     value={animal.raza?.nombre}      fallback="No registrada" />
        <InfoRow label="Categoría" value={animal.categoria?.nombre} fallback="No registrada" />
        <InfoRow label="Color"    value={animal.color} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <InfoRow label="Peso actual"        value={animal.peso != null ? `${animal.peso} kg` : null} />
        <InfoRow label="Peso al nacimiento" value={animal.pesoNacimiento != null ? `${animal.pesoNacimiento} kg` : null} />
        <InfoRow label="Tipo de producción" value={TIPO_PROD[animal.tipoProduccion] ?? animal.tipoProduccion} />
        <InfoRow label="Origen"             value={ORIGEN[animal.origen] ?? animal.origen} />
        <InfoRow label="Fecha de nacimiento" value={fmt(animal.fechaNacimiento)} />
        <InfoRow label="Fecha de ingreso"    value={fmt(animal.fechaIngreso)} />
        <InfoRow
          label="Edad al ingreso"
          value={animal.edadIngresoMeses ? `${animal.edadIngresoMeses} meses` : null}
        />
        <InfoRow label="Parcela actual" value={animal.parcelaActual?.nombre} fallback="Sin parcela asignada" />
      </Grid>
      {animal.observaciones && (
        <Grid item xs={12}>
          <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom>
              Observaciones
            </Typography>
            <Typography variant="body2">{animal.observaciones}</Typography>
          </Box>
        </Grid>
      )}
      <Grid item xs={12}>
        <SectionHeader>Alertas activas</SectionHeader>
        <AlertasList alertas={animal.alertasActivas} />
      </Grid>
    </Grid>
  )
}

function EngordeResumen({ engorde }) {
  const items = [
    { label: 'Estado', value: EST_ENGORDE[engorde.estado] ?? engorde.estado },
    { label: 'Peso inicial', value: engorde.pesoInicial != null ? `${Number(engorde.pesoInicial)} kg` : '—' },
    { label: 'Peso actual', value: engorde.pesoActual != null ? `${Number(engorde.pesoActual)} kg` : '—' },
    { label: 'Peso objetivo', value: engorde.pesoObjetivo != null ? `${Number(engorde.pesoObjetivo)} kg` : '—' },
    { label: 'Peso faltante', value: engorde.pesoFaltante != null ? `${Number(engorde.pesoFaltante)} kg` : '—' },
    { label: 'Ganancia diaria', value: engorde.gananciaDiaria != null ? `${Number(engorde.gananciaDiaria).toFixed(2)} kg/día` : '—' },
    { label: 'Días en engorde', value: engorde.diasEnEngorde != null ? `${engorde.diasEnEngorde} días` : '—' },
    { label: 'Tipo', value: TIPO_ENGORDE[engorde.tipoEngorde] ?? engorde.tipoEngorde },
  ]
  return (
    <Box sx={{ p: 1.5, mb: 2, borderRadius: 1.5, border: '1px solid #FFE082', bgcolor: '#FFF8E1' }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 1.5,
      }}>
        {items.map(it => (
          <Box key={it.label}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
              {it.label}
            </Typography>
            <Typography variant="body2" fontWeight={700}>{it.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function TabProduccion({ animal }) {
  const esMacho = animal.sexo === 'MACHO'
  const pesos = animal.registrosPeso || []
  const lactancias = animal.lactancias || []
  const producciones = animal.produccionesLeche || []
  const engordeActivo = animal.engordeActivo
  const engordes = animal.engordes || []

  return (
    <Box>
      <SectionHeader>Engorde</SectionHeader>
      {engordeActivo ? (
        <EngordeResumen engorde={engordeActivo} />
      ) : (
        <EmptyMsg>Este animal no tiene un control de engorde activo</EmptyMsg>
      )}
      {engordes.length > 0 && (
        <SimpleTable
          headers={[
            { label: 'Inicio' },
            { label: 'Tipo' },
            { label: 'P. inicial', align: 'right' },
            { label: 'P. objetivo', align: 'right' },
            { label: 'Estado' },
          ]}
          rows={engordes.map(e => [
            fmt(e.fechaInicio),
            TIPO_ENGORDE[e.tipoEngorde] ?? e.tipoEngorde,
            e.pesoInicial != null ? `${Number(e.pesoInicial)} kg` : null,
            e.pesoObjetivo != null ? `${Number(e.pesoObjetivo)} kg` : null,
            EST_ENGORDE[e.estado] ?? e.estado,
          ])}
          emptyMsg="Sin controles de engorde"
        />
      )}

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Historial de Pesos</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Peso (kg)', align: 'right' },
          { label: 'Cond. Corporal', align: 'right' },
          { label: 'Observación' },
        ]}
        rows={pesos.map(r => [
          fmt(r.fechaPesaje),
          r.pesoKg,
          r.condicionCorporal || '—',
          r.observacion || null,
        ])}
        emptyMsg="Sin registros de peso"
      />

      {esMacho ? (
        <EmptyMsg>Este animal no registra producción lechera</EmptyMsg>
      ) : (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionHeader>Lactancias</SectionHeader>
          <SimpleTable
            headers={[
              { label: '#' },
              { label: 'Inicio' },
              { label: 'Secado' },
              { label: 'Total (L)', align: 'right' },
              { label: 'Prom. diario', align: 'right' },
              { label: 'Estado' },
            ]}
            rows={lactancias.map(l => [
              l.numeroLactancia,
              fmt(l.fechaInicio),
              l.fechaSecado ? fmt(l.fechaSecado) : 'En curso',
              l.totalLitros != null ? Number(l.totalLitros).toFixed(1) : null,
              l.promedioDiario != null ? `${Number(l.promedioDiario).toFixed(1)} L` : null,
              EST_LACT[l.estado] ?? l.estado,
            ])}
            emptyMsg="Sin lactancias registradas"
          />

          <Divider sx={{ my: 2 }} />
          <SectionHeader>
            Producción de Leche
            {producciones.length > 0 && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (últimos {producciones.length} registros)
              </Typography>
            )}
          </SectionHeader>
          <SimpleTable
            headers={[
              { label: 'Fecha' },
              { label: 'Turno' },
              { label: 'Litros', align: 'right' },
            ]}
            rows={producciones.slice(0, 50).map(p => [
              fmt(p.fecha),
              TURNO[p.turno] ?? p.turno,
              Number(p.litros).toFixed(1),
            ])}
            emptyMsg="Sin registros de producción de leche"
          />
        </>
      )}
    </Box>
  )
}

function TabReproduccion({ animal }) {
  const esMacho = animal.sexo === 'MACHO'
  const inseminaciones = animal.inseminaciones || []
  const diagnosticos = animal.diagnosticosPrenez || []
  const partos = animal.partos || []
  const celos = animal.celos || []
  const montas = animal.montas || []
  const palpaciones = animal.palpaciones || []
  const destetes = animal.destetes || []

  if (esMacho) {
    const descendencia = animal.descendencia || []
    return (
      <Box>
        <EmptyMsg>
          Los animales machos no reciben inseminaciones ni se registran partos.
        </EmptyMsg>
        <SectionHeader sx={{ mt: 2 }}>Crías registradas (descendencia)</SectionHeader>
        <SimpleTable
          headers={[
            { label: 'Arete' },
            { label: 'Nombre' },
            { label: 'Sexo' },
            { label: 'Nacimiento' },
            { label: 'Estado' },
          ]}
          rows={descendencia.map(c => [
            `#${c.nroArete}`,
            c.nombre || null,
            SEXO[c.sexo] ?? c.sexo,
            fmt(c.fechaNacimiento),
            c.estado,
          ])}
          emptyMsg="Sin descendencia registrada"
        />
      </Box>
    )
  }

  const totalEventos = inseminaciones.length + diagnosticos.length + partos.length
    + celos.length + montas.length + palpaciones.length + destetes.length

  return (
    <Box>
      {/* Resumen reproductivo */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
        gap: 1.5, mb: 2, p: 1.5, borderRadius: 1.5,
        bgcolor: '#F8FAFC', border: '1px solid #E2E8F0',
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Estado reproductivo</Typography>
          <Typography variant="body2" fontWeight={700}>{EST_REPRO[animal.estadoReproductivo] ?? animal.estadoReproductivo ?? '—'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Próximo parto</Typography>
          <Typography variant="body2" fontWeight={700}>{animal.proximoParto ? fmt(animal.proximoParto) : '—'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Días abiertos</Typography>
          <Typography variant="body2" fontWeight={700}>{animal.diasAbiertos != null ? `${animal.diasAbiertos} días` : '—'}</Typography>
        </Box>
      </Box>

      {totalEventos === 0 && (
        <EmptyMsg>Sin registros reproductivos</EmptyMsg>
      )}

      <SectionHeader>Celos</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Inicio' },
          { label: 'Fin' },
          { label: 'Tipo' },
          { label: 'Intensidad' },
          { label: 'Detectado por' },
        ]}
        rows={celos.map(c => [
          fmt(c.fechaInicio),
          c.fechaFin ? fmt(c.fechaFin) : null,
          TIPO_CELO[c.tipo] ?? c.tipo,
          INTENSIDAD[c.intensidad] ?? c.intensidad,
          c.detectadoPor || null,
        ])}
        emptyMsg="Sin celos registrados"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Inseminaciones Artificiales</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Reproductor' },
          { label: 'Resultado' },
          { label: 'F. Parto Probable' },
        ]}
        rows={inseminaciones.map(i => [
          fmt(i.fecha),
          i.reproductor
            ? `${i.reproductor.nombre || i.reproductor.codigo} (${TIPO_ORIG[i.reproductor.tipoOrigen] ?? i.reproductor.tipoOrigen})`
            : null,
          RES_SERV[i.resultado] ?? i.resultado,
          fmt(i.fechaProbableParto),
        ])}
        emptyMsg="Sin inseminaciones registradas"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Montas Naturales</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Reproductor' },
          { label: 'Resultado' },
          { label: 'F. Parto Probable' },
        ]}
        rows={montas.map(m => [
          fmt(m.fecha),
          m.reproductor
            ? `${m.reproductor.nombre || m.reproductor.codigo} (${TIPO_ORIG[m.reproductor.tipoOrigen] ?? m.reproductor.tipoOrigen})`
            : null,
          RES_SERV[m.resultado] ?? m.resultado,
          fmt(m.fechaProbableParto),
        ])}
        emptyMsg="Sin montas registradas"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Diagnósticos de Preñez</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Resultado' },
          { label: 'Días Gestación', align: 'right' },
          { label: 'Método' },
          { label: 'F. Parto Probable' },
        ]}
        rows={diagnosticos.map(d => [
          fmt(d.fecha),
          <Chip
            key={d.id}
            label={RES_PRENEZ[d.resultadoPrenez] ?? d.resultadoPrenez}
            size="small"
            color={d.resultadoPrenez === 'POSITIVO' ? 'success' : d.resultadoPrenez === 'NEGATIVO' ? 'error' : 'default'}
            variant="outlined"
          />,
          d.diasGestacion || '—',
          d.metodo || null,
          fmt(d.fechaProbableParto),
        ])}
        emptyMsg="Sin diagnósticos de preñez registrados"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Palpaciones</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Resultado' },
          { label: 'Días Gestación', align: 'right' },
          { label: 'Veterinario' },
        ]}
        rows={palpaciones.map(p => [
          fmt(p.fecha),
          <Chip
            key={p.id}
            label={RES_PALP[p.resultado] ?? p.resultado}
            size="small"
            color={p.resultado === 'POSITIVO' ? 'success' : p.resultado === 'NEGATIVO' ? 'error' : 'default'}
            variant="outlined"
          />,
          p.diasGestacionEstimados || '—',
          p.veterinario
            ? `${p.veterinario.nombre}${p.veterinario.apellidos ? ' ' + p.veterinario.apellidos : ''}`
            : null,
        ])}
        emptyMsg="Sin palpaciones registradas"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Partos Registrados</SectionHeader>
      {partos.length === 0 ? (
        <EmptyMsg>Sin partos registrados</EmptyMsg>
      ) : (
        partos.map(parto => (
          <Box
            key={parto.id}
            sx={{ mb: 2, p: 1.5, border: '1px solid #E2E8F0', borderRadius: 1.5, bgcolor: '#FAFAFA' }}
          >
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
              <Typography variant="body2">
                <strong>Fecha:</strong> {fmt(parto.fechaPartoReal) || 'Sin fecha'}
              </Typography>
              <Typography variant="body2">
                <strong>Tipo:</strong> {TIPO_PARTO[parto.tipoParto] ?? parto.tipoParto}
              </Typography>
              <Typography variant="body2">
                <strong>Crías:</strong> {parto.numCrias}
              </Typography>
              <Typography variant="body2">
                <strong>Estado:</strong> {parto.estado}
              </Typography>
            </Box>
            {parto.crias && parto.crias.length > 0 ? (
              <Box sx={{ pl: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" gutterBottom>
                  Crías registradas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {parto.crias.map(c => (
                    <Chip
                      key={c.id}
                      label={`#${c.nroArete}${c.nombre ? ` · ${c.nombre}` : ''} (${SEXO[c.sexo] ?? c.sexo})`}
                      size="small"
                      variant="outlined"
                      color={c.sexo === 'MACHO' ? 'info' : 'secondary'}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="caption" color="text.disabled" fontStyle="italic">
                Sin crías registradas para este parto
              </Typography>
            )}
          </Box>
        ))
      )}

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Destetes</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Cría' },
          { label: 'Tipo' },
          { label: 'Edad (días)', align: 'right' },
          { label: 'Peso cría (kg)', align: 'right' },
        ]}
        rows={destetes.map(d => [
          fmt(d.fechaDestete),
          d.cria ? `#${d.cria.nroArete}${d.cria.nombre ? ` · ${d.cria.nombre}` : ''}` : null,
          TIPO_DESTETE[d.tipo] ?? d.tipo,
          d.edadDesteteDias || '—',
          d.pesoCria != null ? Number(d.pesoCria) : null,
        ])}
        emptyMsg="Sin destetes registrados"
      />
    </Box>
  )
}

function TabSanidad({ animal }) {
  const vacunaciones = animal.vacunaciones || []
  const tratamientos = animal.tratamientos || []
  const diagnosticos = animal.diagnosticosSanitarios || []
  const examenes = animal.examenes || []
  const mastitis = animal.mastitis || []
  const desparasitaciones = animal.desparasitaciones || []
  const tiemposRetiro = animal.tiemposRetiro || []
  const esHembra = animal.sexo === 'HEMBRA'
  const alertasSanitarias = (animal.alertasActivas || []).filter(a => a.moduloOrigen === 'SANIDAD')

  return (
    <Box>
      {tiemposRetiro.some(tr => tr.activo) && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1.5, border: '1px solid #FFCDD2', bgcolor: '#FFEBEE' }}>
          <Typography variant="subtitle2" fontWeight={700} color="error.main" gutterBottom>
            Tiempo de retiro activo
          </Typography>
          {tiemposRetiro.filter(tr => tr.activo).map(tr => (
            <Typography key={tr.id} variant="body2">
              {TIPO_RETIRO[tr.tipoRetiro] ?? tr.tipoRetiro}: faltan <strong>{tr.diasRestantes}</strong> días
              {tr.fechaFin ? ` (hasta ${fmt(tr.fechaFin)})` : ''}
              {tr.tratamiento?.diagnostico ? ` · ${tr.tratamiento.diagnostico}` : ''}
            </Typography>
          ))}
        </Box>
      )}

      <SectionHeader>Vacunaciones</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Vacuna' },
          { label: 'Dosis aplicada' },
          { label: 'Próxima dosis' },
          { label: 'Veterinario' },
        ]}
        rows={vacunaciones.map(v => [
          fmt(v.fechaAplicacion),
          v.vacuna?.nombre || null,
          v.dosisAplicada || null,
          v.fechaProxima ? fmt(v.fechaProxima) : null,
          v.veterinario
            ? `${v.veterinario.nombre}${v.veterinario.apellidos ? ' ' + v.veterinario.apellidos : ''}`
            : null,
        ])}
        emptyMsg="Sin vacunaciones registradas"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Tratamientos</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Inicio' },
          { label: 'Fin' },
          { label: 'Diagnóstico' },
          { label: 'Medicamento' },
          { label: 'Estado' },
        ]}
        rows={tratamientos.map(t => [
          fmt(t.fechaInicio),
          t.fechaFin ? fmt(t.fechaFin) : null,
          t.diagnostico || null,
          t.medicamento?.nombre || null,
          t.enTratamiento
            ? <Chip key={t.id} label="En tratamiento" size="small" color="warning" variant="outlined" />
            : <Chip key={t.id} label="Finalizado" size="small" color="success" variant="outlined" />,
        ])}
        emptyMsg="Sin tratamientos registrados"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Desparasitaciones</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Producto' },
          { label: 'Dosis' },
          { label: 'Próxima' },
          { label: 'Veterinario' },
        ]}
        rows={desparasitaciones.map(d => [
          fmt(d.fecha),
          d.producto || d.tipoParasiticida || null,
          d.dosis || null,
          d.fechaProxima ? fmt(d.fechaProxima) : null,
          d.veterinario
            ? `${d.veterinario.nombre}${d.veterinario.apellidos ? ' ' + d.veterinario.apellidos : ''}`
            : null,
        ])}
        emptyMsg="Sin desparasitaciones registradas"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Diagnósticos</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Diagnóstico' },
          { label: 'Resultado' },
          { label: 'Enfermedad' },
          { label: 'Veterinario' },
        ]}
        rows={diagnosticos.map(d => [
          fmt(d.fecha),
          d.descripcion || null,
          d.resultado || null,
          d.enfermedad?.nombre || null,
          d.veterinario
            ? `${d.veterinario.nombre}${d.veterinario.apellidos ? ' ' + d.veterinario.apellidos : ''}`
            : null,
        ])}
        emptyMsg="Sin diagnósticos registrados"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Exámenes de Laboratorio</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'F. toma' },
          { label: 'Tipo' },
          { label: 'Laboratorio' },
          { label: 'Resultado' },
          { label: 'Normal' },
        ]}
        rows={examenes.map(e => [
          fmt(e.fechaToma),
          e.tipoExamen || null,
          e.laboratorio || null,
          e.resultado || null,
          e.esNormal == null
            ? null
            : <Chip key={e.id} label={e.esNormal ? 'Normal' : 'Anormal'} size="small"
                color={e.esNormal ? 'success' : 'error'} variant="outlined" />,
        ])}
        emptyMsg="Sin exámenes de laboratorio registrados"
      />

      {esHembra && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionHeader>Mastitis</SectionHeader>
          <SimpleTable
            headers={[
              { label: 'Fecha' },
              { label: 'Cuarto' },
              { label: 'Tipo' },
              { label: 'Bacteria' },
              { label: 'Estado' },
            ]}
            rows={mastitis.map(m => [
              fmt(m.fecha),
              m.cuartoAfectado || null,
              m.tipo || null,
              m.bacteria || null,
              m.seCuro
                ? <Chip key={m.id} label={`Curada${m.fechaCuracion ? ' · ' + fmt(m.fechaCuracion) : ''}`} size="small" color="success" variant="outlined" />
                : <Chip key={m.id} label="En curso" size="small" color="warning" variant="outlined" />,
            ])}
            emptyMsg="Sin registros de mastitis"
          />
        </>
      )}

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Tiempos de Retiro</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Tipo' },
          { label: 'Inicio' },
          { label: 'Fin' },
          { label: 'Días', align: 'right' },
          { label: 'Estado' },
        ]}
        rows={tiemposRetiro.map(tr => [
          TIPO_RETIRO[tr.tipoRetiro] ?? tr.tipoRetiro,
          fmt(tr.fechaInicio),
          tr.fechaFin ? fmt(tr.fechaFin) : null,
          tr.diasRetiro || '—',
          tr.activo
            ? <Chip key={tr.id} label={`Activo · ${tr.diasRestantes} días`} size="small" color="error" variant="outlined" />
            : <Chip key={tr.id} label="Finalizado" size="small" color="success" variant="outlined" />,
        ])}
        emptyMsg="Sin tiempos de retiro registrados"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Alertas sanitarias activas</SectionHeader>
      <AlertasList alertas={alertasSanitarias} emptyMsg="Sin alertas sanitarias activas" />
    </Box>
  )
}

const MOTIVO_LABEL = {
  ROTACION:      'Rotación de potrero',
  SANIDAD:       'Razones sanitarias',
  ALIMENTACION:  'Manejo de alimentación',
  SEPARACION:    'Separación por gestación/cría',
  VENTA:         'Preparación para venta',
  MANTENIMIENTO: 'Mantenimiento de parcela',
  OTRO:          'Otro',
}

function TabMovimientos({ animal, fincaId }) {
  const asignaciones = animal.movimientosParcela || []

  const {
    movimientos, loading: loadingMov,
    crearMovimiento, actualizarMovimiento, eliminarMovimiento,
  } = useMovimientosAnimal(animal.id)

  const [showForm,    setShowForm]    = useState(false)
  const [editMov,     setEditMov]     = useState(null)
  const [msgLocal,    setMsgLocal]    = useState(null)

  const notify = (r) => {
    setMsgLocal({ ok: r.success, text: r.message })
    setTimeout(() => setMsgLocal(null), 3000)
  }

  const handleSubmit = async (input) => {
    const r = editMov
      ? await actualizarMovimiento(editMov.id, input)
      : await crearMovimiento(input)
    notify(r)
    if (r.success) { setShowForm(false); setEditMov(null) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return
    const r = await eliminarMovimiento(id)
    notify(r)
  }

  return (
    <Box>
      {/* ── Asignaciones de parcela (AnimalParcela) ── */}
      <SectionHeader>Asignaciones de Parcela</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Parcela' },
          { label: 'Estado parcela' },
          { label: 'Fecha ingreso' },
          { label: 'Fecha salida' },
        ]}
        rows={asignaciones.map(m => [
          m.parcela?.nombre || null,
          m.parcela?.estado || null,
          fmt(m.fechaIngreso),
          m.fechaSalida
            ? fmt(m.fechaSalida)
            : <Chip key={m.id} label="Actual" size="small" color="success" variant="outlined" />,
        ])}
        emptyMsg="Sin asignaciones de parcela registradas"
      />

      <Divider sx={{ my: 2 }} />

      {/* ── Registro de movimientos (MovimientoAnimal) ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <SectionHeader sx={{ mb: 0, mt: 0 }}>Registro de Movimientos</SectionHeader>
        <Button
          size="small" variant="contained" startIcon={<AddOutlinedIcon />}
          onClick={() => { setEditMov(null); setShowForm(true) }}
          sx={{ textTransform: 'none' }}
        >
          Registrar
        </Button>
      </Box>

      {/* Mensaje local */}
      {msgLocal && (
        <Box sx={{
          mb: 1.5, p: 1, borderRadius: 1,
          bgcolor: msgLocal.ok ? '#E8F5E9' : '#FFEBEE',
          color:   msgLocal.ok ? '#2E7D32' : '#C62828',
        }}>
          <Typography variant="body2">{msgLocal.text}</Typography>
        </Box>
      )}

      {/* Formulario inline */}
      {showForm && (
        <Box sx={{ mb: 2, border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <MovimientoAnimalForm
            animal={animal}
            fincaId={fincaId}
            movimiento={editMov}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditMov(null) }}
          />
        </Box>
      )}

      {/* Tabla de movimientos */}
      {loadingMov && movimientos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={28} /></Box>
      ) : movimientos.length === 0 ? (
        <EmptyMsg>Sin movimientos registrados manualmente</EmptyMsg>
      ) : (
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 1.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TH>Fecha</TH>
                <TH>Origen</TH>
                <TH align="center"><SwapHorizIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /></TH>
                <TH>Destino</TH>
                <TH>Motivo</TH>
                <TH>Observaciones</TH>
                <TH>Registrado por</TH>
                <TH align="center">Acciones</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.map(m => (
                <TableRow key={m.id} hover>
                  <TD>{fmt(m.fechaMovimiento)}</TD>
                  <TD>{m.parcelaOrigen?.nombre || <Typography variant="caption" color="text.disabled">—</Typography>}</TD>
                  <TD align="center">
                    <SwapHorizIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </TD>
                  <TD>
                    {m.parcelaDestino?.nombre
                      ? <Typography variant="body2" fontWeight={600} color="primary.main">{m.parcelaDestino.nombre}</Typography>
                      : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TD>
                  <TD>
                    {m.motivo
                      ? <Chip label={MOTIVO_LABEL[m.motivo] || m.motivoDisplay || m.motivo} size="small" variant="outlined" />
                      : null}
                  </TD>
                  <TD>{m.observaciones || null}</TD>
                  <TD>{m.registradoPorNombre || null}</TD>
                  <TD align="center">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small" color="warning"
                        onClick={() => { setEditMov(m); setShowForm(true) }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}>
                        <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </TD>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

function TabVentasBajas({ animal }) {
  const ventas = animal.ventas || []
  const bajas = animal.bajas || []

  return (
    <Box>
      <SectionHeader>Ventas</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Cliente' },
          { label: 'Precio/kg', align: 'right' },
          { label: 'Peso (kg)', align: 'right' },
          { label: 'Subtotal', align: 'right' },
          { label: 'Guía salida' },
        ]}
        rows={ventas.map(v => {
          const nv = v.notaVenta || {}
          const cliente = nv.cliente
            ? `${nv.cliente.nombre}${nv.cliente.apellidos ? ' ' + nv.cliente.apellidos : ''}`
            : null
          return [
            fmt(nv.fechaVenta),
            cliente,
            v.precioUnitario != null ? `Gs ${Number(v.precioUnitario).toLocaleString('es-PY')}` : null,
            v.pesoVentaKg != null ? `${Number(v.pesoVentaKg).toFixed(1)} kg` : null,
            v.subTotal != null ? `Gs ${Number(v.subTotal).toLocaleString('es-PY')}` : null,
            nv.guiaSalida || null,
          ]
        })}
        emptyMsg="Sin ventas registradas"
      />

      <Divider sx={{ my: 2 }} />
      <SectionHeader>Bajas</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Fecha' },
          { label: 'Tipo' },
          { label: 'Causa' },
          { label: 'Descripción' },
          { label: 'Peso estimado', align: 'right' },
        ]}
        rows={bajas.map(b => [
          fmt(b.fechaBaja),
          TIPO_BAJA[b.tipo] ?? b.tipo,
          b.causa || null,
          b.descripcion || null,
          b.pesoEstimadoKg != null ? `${Number(b.pesoEstimadoKg).toFixed(1)} kg` : null,
        ])}
        emptyMsg="Sin bajas registradas"
      />
    </Box>
  )
}

// ── Modal principal ──────────────────────────────────────────────────────────

export default function AnimalDetailModal({ animalId, fincaId, onClose }) {
  const [tabIdx, setTabIdx] = useState(0)

  useEffect(() => { setTabIdx(0) }, [animalId])

  const { data, loading, error } = useQuery(GET_ANIMAL_DETALLE, {
    variables: { id: animalId },
    skip: !animalId,
    fetchPolicy: 'cache-and-network',
  })

  const animal = data?.animalDetalle

  return (
    <Dialog
      open={!!animalId}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}
    >
      {/* Título */}
      <DialogTitle sx={{ pb: 0, pr: 6 }}>
        {loading && !animal ? (
          <Typography variant="h6" color="text.secondary">Cargando...</Typography>
        ) : animal ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                #{animal.nroArete}
              </Typography>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {animal.nombre || 'Sin nombre registrado'}
              </Typography>
            </Box>
            <StatusChip value={animal.estado} />
          </Box>
        ) : null}
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Tarjetas resumen */}
      {animal && (
        <Box sx={{ px: 3, pt: 1.5, pb: 1 }}>
          <ResumenCards animal={animal} />
        </Box>
      )}

      {/* Pestañas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={tabIdx}
          onChange={(_, v) => setTabIdx(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map(tab => (
            <Tab
              key={tab}
              label={tab}
              sx={{ textTransform: 'none', fontSize: 13, minHeight: 44, minWidth: 80 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Contenido */}
      <DialogContent sx={{ pt: 1 }}>
        {loading && !animal ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={36} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>
            Error al cargar el detalle del animal.
          </Typography>
        ) : !animal ? null : (
          <>
            <AdvertenciaRetiro animalId={animalId} fincaId={fincaId} sx={{ mb: 2 }} />
            <TabPanel value={tabIdx} index={0}>
              <TabGeneral animal={animal} />
            </TabPanel>
            <TabPanel value={tabIdx} index={1}>
              <AnimalGenealogySection animal={animal} />
            </TabPanel>
            <TabPanel value={tabIdx} index={2}>
              <TabProduccion animal={animal} />
            </TabPanel>
            <TabPanel value={tabIdx} index={3}>
              <TabReproduccion animal={animal} />
            </TabPanel>
            <TabPanel value={tabIdx} index={4}>
              <TabSanidad animal={animal} />
            </TabPanel>
            <TabPanel value={tabIdx} index={5}>
              <TabMovimientos animal={animal} fincaId={fincaId} />
            </TabPanel>
            <TabPanel value={tabIdx} index={6}>
              <TabVentasBajas animal={animal} />
            </TabPanel>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
