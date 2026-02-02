"use client"
import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'

// Note: This page uses simple client-side fetch via a tiny API route for demo

type Payment = {
  id: string
  member: { firstName: string; lastName: string }
  amount: string
  method: string
  date: string
  receiptNumber?: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    fetch('/api/payments')
      .then((r) => r.json())
      .then(setPayments)
  }, [])

  function exportReceipt(p: Payment) {
    const doc = new jsPDF()
    doc.text('Reçu de paiement', 10, 10)
    doc.text(`Membre: ${p.member.lastName} ${p.member.firstName}`, 10, 20)
    doc.text(`Montant: ${p.amount} FCFA`, 10, 30)
    doc.text(`Méthode: ${p.method}`, 10, 40)
    doc.text(`Date: ${new Date(p.date).toLocaleString()}`, 10, 50)
    doc.text(`Reçu: ${p.receiptNumber || 'N/A'}`, 10, 60)
    doc.save(`recu-${p.id}.pdf`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Paiements</h1>
      <table className="w-full text-sm bg-white border rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-primary-50">
            <th className="p-2 text-left">Membre</th>
            <th className="p-2">Montant</th>
            <th className="p-2">Méthode</th>
            <th className="p-2">Date</th>
            <th className="p-2">Reçu</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.member.lastName} {p.member.firstName}</td>
              <td className="p-2">{p.amount}</td>
              <td className="p-2">{p.method}</td>
              <td className="p-2">{new Date(p.date).toLocaleString()}</td>
              <td className="p-2">
                <button className="border border-primary-200 text-primary-700 hover:bg-primary-50 px-2 py-1 rounded" onClick={() => exportReceipt(p)}>PDF</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
