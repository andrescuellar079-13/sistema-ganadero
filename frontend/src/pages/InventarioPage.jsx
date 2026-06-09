import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useAuth } from '../context/AuthContext'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import {
  GET_MOVIMIENTOS_INVENTARIO,
  GET_PRODUCTOS_POR_VENCER,
  GET_PRODUCTOS_STOCK_BAJO,
  REGISTRAR_MOVIMIENTO_INVENTARIO,
} from '../graphql/inventario'
import { GET_MEDICAMENTOS, GET_ALIMENTOS } from '../graphql/compras'

// ─── Helpers ────────────────────────────────────────────────────────────────

const TIPO_MOVIMIENTO_LABELS = {
  ENTRADA_COMPRA:   { label: 'Entrada Compra',    color: '#22c55e', bg: '#dcfce7', icon: '↑' },
  SALIDA_USO:       { label: 'Salida por Uso',    color: '#f59e0b', bg: '#fef3c7', icon: '↓' },
  SALIDA_VENTA:     { label: 'Salida por Venta',  color: '#3b82f6', bg: '#dbeafe', icon: '↓' },
  AJUSTE_POSITIVO:  { label: 'Ajuste +',          color: '#10b981', bg: '#d1fae5', icon: '⊕' },
  AJUSTE_NEGATIVO:  { label: 'Ajuste −',          color: '#ef4444', bg: '#fee2e2', icon: '⊖' },
  BAJA_VENCIMIENTO: { label: 'Baja Vencimiento',  color: '#8b5cf6', bg: '#ede9fe', icon: '✕' },
  BAJA_PERDIDA:     { label: 'Baja Pérdida',      color: '#ec4899', bg: '#fce7f3', icon: '✕' },
}

const TIPO_PRODUCTO_LABELS = {
  MEDICAMENTO: { label: 'Medicamento', color: '#6366f1', bg: '#e0e7ff' },
  ALIMENTO:    { label: 'Alimento',    color: '#f59e0b', bg: '#fef3c7' },
  VACUNA:      { label: 'Vacuna',      color: '#10b981', bg: '#d1fae5' },
}

function Badge({ color, bg, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color, backgroundColor: bg }}>
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

// ─── Componentes de Tabs (Modal, Movimientos, Stock, Vencimientos, StockMinimo) ───

// [Nota: Aquí van tus funciones existentes ModalMovimiento, TabMovimientos, TabStock, TabVencimientos, TabStockMinimo]
// (Para ahorrar espacio he omitido su despliegue largo aquí, pero asegúrate de mantenerlas debajo de esta línea)

// ─── Nueva Pestaña Reportes ──────────────────────────────────────────────────

function TabReportes({ medicamentos, alimentos }) {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const todos = [...medicamentos, ...alimentos]

  const exportarExcel = () => {
    const data = todos.map(p => ({
      Nombre: p.nombre,
      Stock: p.stockCantidad || p.stock_cantidad || 0,
      Precio: p.precio || p.costo || 0,
      Total: ((p.stockCantidad || p.stock_cantidad || 0) * (p.precio || p.costo || 0)).toFixed(2)
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Inventario")
    XLSX.writeFile(wb, "Reporte_Inventario.xlsx")
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.text("Reporte de Inventario", 14, 15)
    doc.autoTable({
      head: [['Producto', 'Stock', 'Precio', 'Total']],
      body: todos.map(p => [p.nombre, p.stockCantidad || 0, p.precio || 0, ((p.stockCantidad || 0) * (p.precio || 0)).toFixed(2)]),
    })
    doc.save("Reporte_Inventario.pdf")
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <input type="date" onChange={(e) => setFechaInicio(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
        <input type="date" onChange={(e) => setFechaFin(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
        <button onClick={exportarExcel} style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Excel 📥</button>
        <button onClick={exportarPDF} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>PDF 📥</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ background: '#f9fafb' }}><th style={{ padding: 12, textAlign: 'left' }}>Producto</th><th style={{ padding: 12 }}>Stock</th><th style={{ padding: 12 }}>Total</th></tr></thead>
        <tbody>
          {todos.map((p, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 12 }}>{p.nombre}</td>
              <td style={{ padding: 12, textAlign: 'center' }}>{p.stockCantidad || 0}</td>
              <td style={{ padding: 12, textAlign: 'center' }}>Bs. {((p.stockCantidad || 0) * (p.precio || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    { id: 'stock', label: '📦 Stock Actual' },
    { id: 'movimientos', label: '🔄 Movimientos' },
    { id: 'vencimientos', label: '📅 Vencimientos' },
    { id: 'stock_minimo', label: '⚠️ Stock Mínimo' },
    { id: 'reportes', label: '📊 Reportes' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>Inventario</h1>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f9fafb', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setTabActivo(tab.id)} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', background: tabActivo === tab.id ? '#fff' : 'transparent', fontWeight: 600, color: tabActivo === tab.id ? '#16a34a' : '#6b7280' }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid #e5e7eb' }}>
        {/* Aquí tus componentes según tabActivo */}
        {tabActivo === 'reportes' && <TabReportes medicamentos={medicamentos} alimentos={alimentos} />}
        {/* ... añade tus otros componentes aquí */}
      </div>
    </div>
  )
}