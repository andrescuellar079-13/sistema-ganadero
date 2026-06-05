// frontend/src/components/ReportesButtons.jsx
import React from 'react'

const ReportesButtons = ({ onPDF, onExcel, loading }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={onPDF}
        disabled={loading}
        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 text-sm disabled:bg-gray-400"
      >
        <span>📄</span>
        {loading ? 'Generando...' : 'PDF'}
      </button>
      <button
        onClick={onExcel}
        disabled={loading}
        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 text-sm disabled:bg-gray-400"
      >
        <span>📊</span>
        {loading ? 'Generando...' : 'Excel'}
      </button>
    </div>
  )
}

export default ReportesButtons