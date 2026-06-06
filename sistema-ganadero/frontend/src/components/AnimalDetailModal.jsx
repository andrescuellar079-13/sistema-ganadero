import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ANIMAL_DETALLE } from '../graphql/animales'
import {
  Dialog, DialogContent, DialogTitle,
  IconButton, Tabs, Tab, Box,
  Typography, CircularProgress, Grid, Divider, Chip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import StatusChip from './ui/StatusChip'
import AnimalGenealogySection from './AnimalGenealogySection'

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
    </Grid>
  )
}

function TabProduccion({ animal }) {
  const esMacho = animal.sexo === 'MACHO'
  const pesos = animal.registrosPeso || []
  const lactancias = animal.lactancias || []
  const producciones = animal.produccionesLeche || []

  return (
    <Box>
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
  if (totalEventos === 0) {
    return <EmptyMsg>Sin registros reproductivos</EmptyMsg>
  }

  return (
    <Box>
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
    </Box>
  )
}

function TabSanidad({ animal }) {
  const vacunaciones = animal.vacunaciones || []
  const tratamientos = animal.tratamientos || []

  return (
    <Box>
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
    </Box>
  )
}

function TabMovimientos({ animal }) {
  const movimientos = animal.movimientosParcela || []

  return (
    <Box>
      <SectionHeader>Historial de Parcelas</SectionHeader>
      <SimpleTable
        headers={[
          { label: 'Parcela' },
          { label: 'Estado parcela' },
          { label: 'Fecha ingreso' },
          { label: 'Fecha salida' },
        ]}
        rows={movimientos.map(m => [
          m.parcela?.nombre || null,
          m.parcela?.estado || null,
          fmt(m.fechaIngreso),
          m.fechaSalida
            ? fmt(m.fechaSalida)
            : <Chip key={m.id} label="Actual" size="small" color="success" variant="outlined" />,
        ])}
        emptyMsg="Sin movimientos de parcela registrados"
      />
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

export default function AnimalDetailModal({ animalId, onClose }) {
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
              <TabMovimientos animal={animal} />
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
