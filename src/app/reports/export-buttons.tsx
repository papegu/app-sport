"use client"
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

export default function ExportButtons({ data }: { data: Record<string, any> }) {
  function exportPDF() {
    const doc = new jsPDF()
    doc.text('Rapport - Appli Sport', 10, 10)
    let y = 20
    Object.entries(data).forEach(([k, v]) => {
      doc.text(`${k}: ${v}`, 10, y)
      y += 10
    })
    doc.save('rapport.pdf')
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet([data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport')
    XLSX.writeFile(wb, 'rapport.xlsx')
  }

  return (
    <div className="flex gap-2">
      <button className="border px-3 py-2 rounded" onClick={exportPDF}>Exporter PDF</button>
      <button className="border px-3 py-2 rounded" onClick={exportExcel}>Exporter Excel</button>
    </div>
  )
}
