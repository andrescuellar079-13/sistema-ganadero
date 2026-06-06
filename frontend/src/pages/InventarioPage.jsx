// frontend/src/pages/InventarioPage.jsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useAuth } from '../context/AuthContext'
import {
  GET_MOVIMIENTOS_INVENTARIO,
  GET_PRODUCTOS_POR_VENCER,
  GET_PRODUCTOS_STOCK_BAJO,
  REGISTRAR_MOVIMIENTO_INVENTARIO,
} from '../graphql/inventario'
import { GET_MEDICAMENTOS, GET_ALIMENTOS } from '../graphql/compras'

// También necesitamos vacunas — ajusta el import según tu archivo graphql de vacunas
// import { GET_VACUNAS } from '../graphql/vacunas'

// ─── Helpers ────────────────────────────────────────────────────────────────

const TIPO_MOVIMIENTO_LABELS = {
  ENTRADA_COMPRA:   { label: 'Entrada Compra',    color: '#22c55e', bg: '#dcfce7', icon: '↑' },
  SALIDA_USO:       { label: 'Salida por Uso',     color: '#f59e0b', bg: '#fef3c7', icon: '↓' },
  SALIDA_VENTA:     { label: 'Salida por Venta',   color: '#3b82f6', bg: '#dbeafe', icon: '↓' },
  AJUSTE_POSITIVO:  { label: 'Ajuste +',           color: '#10b981', bg: '#d1fae5', icon: '⊕' },
  AJUSTE_NEGATIVO:  { label: 'Ajuste −',           color: '#ef4444', bg: '#fee2e2', icon: '⊖' },
  BAJA_VENCIMIENTO: { label: 'Baja Vencimiento',   color: '#8b5cf6', bg: '#ede9fe', icon: '✕' },
  BAJA_PERDIDA:     { label: 'Baja Pérdida',       color: '#ec4899', bg: '#fce7f3', icon: '✕' },
}

const TIPO_PRODUCTO_LABELS = {
  MEDICAMENTO: { label: 'Medicamento', color: '#6366f1', bg: '#e0e7ff' },
  ALIMENTO:    { label: 'Alimento',    color: '#f59e0b', bg: '#fef3c7' },
  VACUNA:      { label: 'Vacuna',      color: '#10b981', bg: '#d1fae5' },
}

function Badge({ color, bg, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600,
      color, backgroundColor: bg,
    }}>
      {children}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function diasHasta(fechaStr) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaStr)
  return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24))
}

// ─── Modal Nuevo Movimiento ──────────────────────────────────────────────────

function ModalMovimiento({ fincaId, onClose, onSuccess, medicamentos, alimentos }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    tipoMovimiento: 'SALIDA_USO',
    tipoProducto: 'MEDICAMENTO',
    productoId: '',
    cantidad: '',
    fecha: today,
    precioUnitario: '',
    motivo: '',
  })
  const [error, setError] = useState('')

  const [registrar, { loading }] = useMutation(REGISTRAR_MOVIMIENTO_INVENTARIO, {
    refetchQueries: [
      { query: GET_MOVIMIENTOS_INVENTARIO, variables: { fincaId } },
      { query: GET_PRODUCTOS_STOCK_BAJO, variables: { fincaId } },
    ],
  })

  const productos = form.tipoProducto === 'MEDICAMENTO' ? medicamentos : alimentos

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.productoId || !form.cantidad || !form.fecha) {
      setError('Completa todos los campos requeridos')
      return
    }
    try {
      const vars = {
        fincaId,
        tipoMovimiento: form.tipoMovimiento,
        tipoProducto: form.tipoProducto,
        cantidad: parseFloat(form.cantidad),
        fecha: form.fecha,
        motivo: form.motivo || null,
        precioUnitario: form.precioUnitario ? parseFloat(form.precioUnitario) : null,
      }
      if (form.tipoProducto === 'MEDICAMENTO') vars.medicamentoId = form.productoId
      else if (form.tipoProducto === 'ALIMENTO') vars.alimentoId = form.productoId
      else vars.vacunaId = form.productoId

      const { data } = await registrar({ variables: vars })
      if (data?.registrarMovimientoInventario?.success) {
        onSuccess('Movimiento registrado correctamente')
        onClose()
      } else {
        setError(data?.registrarMovimientoInventario?.message || 'Error al registrar')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }
  const modalStyle = {
    background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  }
  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb',
    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
            📦 Nuevo Movimiento
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Tipo de Movimiento *</label>
              <select style={inputStyle} value={form.tipoMovimiento} onChange={e => setForm(p => ({ ...p, tipoMovimiento: e.target.value }))}>
                {Object.entries(TIPO_MOVIMIENTO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo de Producto *</label>
              <select style={inputStyle} value={form.tipoProducto} onChange={e => setForm(p => ({ ...p, tipoProducto: e.target.value, productoId: '' }))}>
                <option value="MEDICAMENTO">Medicamento</option>
                <option value="ALIMENTO">Alimento</option>
                <option value="VACUNA">Vacuna</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Producto *</label>
            <select style={inputStyle} value={form.productoId} onChange={e => setForm(p => ({ ...p, productoId: e.target.value }))}>
              <option value="">— Seleccionar —</option>
              {(productos || []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Stock: {p.stockCantidad ?? p.stock_cantidad ?? 0})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Cantidad *</label>
              <input style={inputStyle} type="number" min="0.01" step="0.01" value={form.cantidad}
                onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input style={inputStyle} type="date" value={form.fecha}
                onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Precio Unitario (opcional)</label>
            <input style={inputStyle} type="number" min="0" step="0.01" value={form.precioUnitario}
              onChange={e => setForm(p => ({ ...p, precioUnitario: e.target.value }))} placeholder="Bs. 0.00" />
          </div>

          <div>
            <label style={labelStyle}>Motivo / Observaciones</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
              placeholder="Describe el motivo del movimiento..." />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8,
              background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151',
            }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{
              padding: '10px 24px', border: 'none', borderRadius: 8,
              background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Tab: Movimientos ────────────────────────────────────────────────────────

function TabMovimientos({ fincaId, medicamentos, alimentos }) {
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')

  const { data, loading } = useQuery(GET_MOVIMIENTOS_INVENTARIO, {
    variables: { fincaId, tipoProducto: filtroProducto || undefined, tipoMovimiento: filtroTipo || undefined },
    skip: !fincaId,
  })

  const movimientos = data?.movimientosInventario || []

  const filtrados = useMemo(() => {
    if (!busqueda) return movimientos
    const q = busqueda.toLowerCase()
    return movimientos.filter(m =>
      m.nombreProducto?.toLowerCase().includes(q) ||
      m.motivo?.toLowerCase().includes(q)
    )
  }, [movimientos, busqueda])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const selectStyle = {
    padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer',
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, background: '#16a34a', color: '#fff',
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>{toast}</div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="🔍 Buscar producto o motivo..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}
        />
        <select style={selectStyle} value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)}>
          <option value="">Todos los productos</option>
          <option value="MEDICAMENTO">Medicamentos</option>
          <option value="ALIMENTO">Alimentos</option>
          <option value="VACUNA">Vacunas</option>
        </select>
        <select style={selectStyle} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los movimientos</option>
          {Object.entries(TIPO_MOVIMIENTO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button onClick={() => setShowModal(true)} style={{
          padding: '9px 18px', background: '#16a34a', color: '#fff', border: 'none',
          borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          + Nuevo Movimiento
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16 }}>No hay movimientos registrados</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Fecha', 'Movimiento', 'Producto', 'Tipo', 'Cantidad', 'Stock Ant.', 'Stock Post.', 'Motivo', 'Registrado por'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m, i) => {
                const tm = TIPO_MOVIMIENTO_LABELS[m.tipoMovimiento] || {}
                const tp = TIPO_PRODUCTO_LABELS[m.tipoProducto] || {}
                return (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#374151' }}>{formatDate(m.fecha)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge color={tm.color} bg={tm.bg}>{tm.icon} {tm.label}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{m.nombreProducto}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge color={tp.color} bg={tp.bg}>{tp.label}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: tm.color }}>{parseFloat(m.cantidad).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{parseFloat(m.stockAnterior).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{parseFloat(m.stockPosterior).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280', maxWidth: 200 }}>{m.motivo || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{m.registradoPor?.username || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ModalMovimiento
          fincaId={fincaId}
          medicamentos={medicamentos}
          alimentos={alimentos}
          onClose={() => setShowModal(false)}
          onSuccess={showToast}
        />
      )}
    </div>
  )
}

// ─── Tab: Stock Actual ───────────────────────────────────────────────────────

function TabStock({ medicamentos, alimentos }) {
  const [filtro, setFiltro] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')

  const items = useMemo(() => {
    let lista = []
    if (filtro !== 'ALIMENTO') {
      lista = lista.concat((medicamentos || []).map(m => ({ ...m, tipo: 'MEDICAMENTO' })))
    }
    if (filtro !== 'MEDICAMENTO') {
      lista = lista.concat((alimentos || []).map(a => ({ ...a, tipo: 'ALIMENTO' })))
    }
    if (busqueda) {
      const q = busqueda.toLowerCase()
      lista = lista.filter(i => i.nombre?.toLowerCase().includes(q))
    }
    return lista
  }, [medicamentos, alimentos, filtro, busqueda])

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Buscar producto..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}
        />
        {['TODOS', 'MEDICAMENTO', 'ALIMENTO'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '8px 16px', borderRadius: 8, border: '1.5px solid',
            borderColor: filtro === f ? '#16a34a' : '#e5e7eb',
            background: filtro === f ? '#dcfce7' : '#fff',
            color: filtro === f ? '#16a34a' : '#6b7280',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            {f === 'TODOS' ? 'Todos' : f === 'MEDICAMENTO' ? '💊 Medicamentos' : '🌾 Alimentos'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {items.map(item => {
          const stockActual = parseFloat(item.stockCantidad || item.stock_cantidad || 0)
          const stockMin = parseFloat(item.stockMinimo || item.stock_minimo || 0)
          const bajo = stockMin > 0 && stockActual <= stockMin
          const tp = TIPO_PRODUCTO_LABELS[item.tipo] || {}
          const pct = stockMin > 0 ? Math.min((stockActual / stockMin) * 100, 100) : 100
          return (
            <div key={`${item.tipo}-${item.id}`} style={{
              background: '#fff', borderRadius: 12, padding: 20,
              border: bajo ? '2px solid #fca5a5' : '1.5px solid #e5e7eb',
              boxShadow: bajo ? '0 0 0 4px #fee2e230' : '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>{item.nombre}</div>
                  <Badge color={tp.color} bg={tp.bg}>{tp.label}</Badge>
                </div>
                {bajo && <span style={{ fontSize: 20 }} title="Stock bajo">⚠️</span>}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: bajo ? '#dc2626' : '#16a34a', marginBottom: 4 }}>
                {stockActual.toFixed(2)}
                <span style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af', marginLeft: 4 }}>{item.unidadMedida || item.unidad_medida || ''}</span>
              </div>
              {stockMin > 0 && (
                <>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Mínimo: {stockMin.toFixed(2)}</div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: bajo ? '#ef4444' : '#22c55e', borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                </>
              )}
            </div>
          )
        })}
        {items.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div>No hay productos registrados</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Vencimientos ───────────────────────────────────────────────────────

function TabVencimientos({ fincaId }) {
  const [dias, setDias] = useState(30)
  const { data, loading } = useQuery(GET_PRODUCTOS_POR_VENCER, {
    variables: { fincaId, dias },
    skip: !fincaId,
  })

  const productos = useMemo(() => {
    if (!data?.productosPorVencer) return []
    try {
      return JSON.parse(data.productosPorVencer).sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento))
    } catch { return [] }
  }, [data])

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Mostrar productos que vencen en los próximos:</span>
        {[15, 30, 60, 90].map(d => (
          <button key={d} onClick={() => setDias(d)} style={{
            padding: '7px 16px', borderRadius: 8, border: '1.5px solid',
            borderColor: dias === d ? '#f59e0b' : '#e5e7eb',
            background: dias === d ? '#fef3c7' : '#fff',
            color: dias === d ? '#b45309' : '#6b7280',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>{d} días</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</div>
      ) : productos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16 }}>No hay productos por vencer en los próximos {dias} días</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {productos.map((p, i) => {
            const d = diasHasta(p.fecha_vencimiento)
            const vencido = d < 0
            const urgente = d >= 0 && d <= 7
            const tp = TIPO_PRODUCTO_LABELS[p.tipo] || {}
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px', borderRadius: 12, background: '#fff',
                border: `1.5px solid ${vencido ? '#fca5a5' : urgente ? '#fcd34d' : '#e5e7eb'}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <span style={{ fontSize: 28 }}>{vencido ? '🔴' : urgente ? '🟡' : '🟠'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    Stock: {p.stock} {p.unidad}
                  </div>
                </div>
                <Badge color={tp.color} bg={tp.bg}>{tp.label}</Badge>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: vencido ? '#dc2626' : urgente ? '#b45309' : '#374151' }}>
                    {vencido ? `Venció hace ${Math.abs(d)} días` : d === 0 ? 'Vence hoy' : `Vence en ${d} días`}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{formatDate(p.fecha_vencimiento)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Stock Mínimo ───────────────────────────────────────────────────────

function TabStockMinimo({ fincaId }) {
  const { data, loading, refetch } = useQuery(GET_PRODUCTOS_STOCK_BAJO, {
    variables: { fincaId },
    skip: !fincaId,
    fetchPolicy: 'network-only',
  })

  const productos = useMemo(() => {
    if (!data?.productosStockBajo) return []
    try { return JSON.parse(data.productosStockBajo) } catch { return [] }
  }, [data])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          {productos.length > 0 ? (
            <span style={{ color: '#dc2626', fontWeight: 700 }}>⚠️ {productos.length} producto(s) con stock bajo</span>
          ) : (
            <span style={{ color: '#16a34a', fontWeight: 700 }}>✅ Todos los productos tienen stock suficiente</span>
          )}
        </div>
        <button onClick={() => refetch()} style={{
          padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8,
          background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151',
        }}>🔄 Actualizar</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</div>
      ) : productos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#16a34a' }}>¡Inventario en buen estado!</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Todos los productos superan su stock mínimo</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {productos.map((p, i) => {
            const tp = TIPO_PRODUCTO_LABELS[p.tipo] || {}
            const pct = p.stock_minimo > 0 ? Math.min((p.stock / p.stock_minimo) * 100, 100) : 0
            return (
              <div key={i} style={{
                background: '#fff', borderRadius: 12, padding: 20,
                border: '2px solid #fca5a5',
                boxShadow: '0 0 0 4px #fee2e220',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Badge color={tp.color} bg={tp.bg}>{tp.label}</Badge>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 8 }}>{p.nombre}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>Stock actual: {p.stock} {p.unidad}</span>
                  <span style={{ color: '#6b7280' }}>Mín: {p.stock_minimo} {p.unidad}</span>
                </div>
                <div style={{ height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#ef4444', borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6, textAlign: 'right' }}>
                  {pct.toFixed(0)}% del mínimo requerido
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function InventarioPage() {
  const { user } = useAuth()
  const fincaId = user?.finca?.id || user?.fincaId

  const [tabActivo, setTabActivo] = useState('stock')

  const { data: dataMed } = useQuery(GET_MEDICAMENTOS, { skip: !fincaId })
  const { data: dataAli } = useQuery(GET_ALIMENTOS, { skip: !fincaId })

  const medicamentos = dataMed?.medicamentos || []
  const alimentos = dataAli?.alimentos || []

  const TABS = [
    { id: 'stock',       label: '📦 Stock Actual' },
    { id: 'movimientos', label: '🔄 Movimientos' },
    { id: 'vencimientos',label: '📅 Vencimientos' },
    { id: 'stock_minimo',label: '⚠️ Stock Mínimo' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            🏪
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Inventario</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Control de stock, movimientos y vencimientos</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f9fafb', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setTabActivo(tab.id)} style={{
            padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: tabActivo === tab.id ? '#fff' : 'transparent',
            color: tabActivo === tab.id ? '#16a34a' : '#6b7280',
            boxShadow: tabActivo === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid #e5e7eb', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        {tabActivo === 'stock' && <TabStock medicamentos={medicamentos} alimentos={alimentos} />}
        {tabActivo === 'movimientos' && <TabMovimientos fincaId={fincaId} medicamentos={medicamentos} alimentos={alimentos} />}
        {tabActivo === 'vencimientos' && <TabVencimientos fincaId={fincaId} />}
        {tabActivo === 'stock_minimo' && <TabStockMinimo fincaId={fincaId} />}
      </div>
    </div>
  )
}