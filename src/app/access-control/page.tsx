"use client"
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

type Member = { id: string; firstName: string; lastName: string; qrCode: string }

export default function AccessControlPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [scanText, setScanText] = useState('')
  const [result, setResult] = useState<string>('')

  useEffect(() => {
    fetch('/api/members-basic')
      .then((r) => r.json())
      .then(setMembers)
  }, [])

  async function simulateScan() {
    setResult('')
    const res = await fetch('/api/access-check', { method: 'POST', body: JSON.stringify({ code: scanText }) })
    const data = await res.json()
    setResult(data.allowed ? 'Entrée AUTORISÉE' : `Refusé: ${data.reason}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Contrôle d'accès</h1>
      <div className="flex gap-2 items-end">
        <input className="border p-2 rounded w-80 focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="Scanner (texte du QR)" value={scanText} onChange={(e) => setScanText(e.target.value)} />
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded" onClick={simulateScan}>Vérifier</button>
        {result && <span className="text-sm ml-2">{result}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
    </div>
  )
}

function MemberCard({ member }: { member: Member }) {
  const [url, setUrl] = useState<string>('')
  useEffect(() => {
    QRCode.toDataURL(member.qrCode).then(setUrl)
  }, [member.qrCode])
  return (
    <div className="border rounded p-4 bg-white flex items-center gap-4 ring-1 ring-primary-100">
      <div>
        <div className="font-semibold">{member.lastName} {member.firstName}</div>
        <div className="text-xs text-gray-500 break-all">{member.qrCode}</div>
      </div>
      {url && <img alt="QR Code" src={url} className="w-24 h-24" />}
    </div>
  )
}
