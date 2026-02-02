import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getMembers(q?: string) {
  const where = q
    ? {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' as any } },
          { lastName: { contains: q, mode: 'insensitive' as any } },
          { email: { contains: q, mode: 'insensitive' as any } },
        ],
      }
    : undefined
  return prisma.memberSport.findMany({ where, orderBy: { createdAt: 'desc' } })
}

async function createMember(formData: FormData) {
  'use server'
  const firstName = String(formData.get('firstName') || '')
  const lastName = String(formData.get('lastName') || '')
  const phone = String(formData.get('phone') || '')
  const email = String(formData.get('email') || '')
  const address = String(formData.get('address') || '')
  const accountType = String(formData.get('accountType') || 'USER_SIMPLE') as 'ADMINISTRATEUR' | 'USER_SIMPLE' | 'CLIENT_ASSIDU'
  const subscriptionType = String(formData.get('subscriptionType') || '') as
    | 'MENSUEL'
    | 'ANNUEL'
    | 'SEANCE'
    | 'SEMAINE'
  if (!firstName || !lastName || !phone) return
  // Generate a unique QR code and handle optional photo file -> data URL (placeholder storage)
  const qrCode = `QR-${crypto.randomUUID()}`
  const photoFile = formData.get('photo') as File | null
  let photoUrl: string | undefined
  if (photoFile && typeof photoFile.arrayBuffer === 'function') {
    const buf = Buffer.from(await photoFile.arrayBuffer())
    photoUrl = `data:${photoFile.type};base64,${buf.toString('base64')}`
  }

  // Avoid unique constraint violations: update existing member by phone/email or create new
  const exists = await prisma.memberSport.findFirst({
    where: {
      OR: [
        { phone },
        ...(email ? [{ email }] : []),
      ],
    },
  })
  let member
  if (exists) {
    member = await prisma.memberSport.update({
      where: { id: exists.id },
      data: {
        firstName,
        lastName,
        email: email || undefined,
        address: address || undefined,
        accountType,
        ...(photoUrl ? { photoUrl } : {}),
      },
    })
  } else {
    member = await prisma.memberSport.create({
      data: {
        firstName,
        lastName,
        phone,
        email: email || undefined,
        address: address || undefined,
        accountType,
        photoUrl,
        qrCode,
      },
    })
  }

  // Optionally create an initial subscription based on selection
  if (subscriptionType) {
    const now = new Date()
    const endDate = new Date(now)
    let price = '0.00'
    switch (subscriptionType) {
      case 'MENSUEL':
        endDate.setMonth(endDate.getMonth() + 1)
        price = '30.00'
        break
      case 'ANNUEL':
        endDate.setFullYear(endDate.getFullYear() + 1)
        price = '300.00'
        break
      case 'SEANCE':
        endDate.setDate(endDate.getDate() + 1)
        price = '5.00'
        break
      case 'SEMAINE':
        endDate.setDate(endDate.getDate() + 7)
        price = '12.00'
        break
    }
    await prisma.subscriptionSport.create({
      data: {
        memberId: member.id,
        type: subscriptionType,
        startDate: now,
        endDate,
        price,
      },
    })
  }
  revalidatePath('/members')
}

async function quickPay(memberId: string, type: 'SEANCE' | 'SEMAINE' | 'MENSUEL' | 'ANNUEL') {
  'use server'
  // Lookup price config, fallback to defaults
  const cfg = await prisma.priceConfigSport.findUnique({ where: { type: type as any } })
  const amount = String(
    cfg?.amount ??
    (type === 'SEANCE' ? '5.00' : type === 'MENSUEL' ? '30.00' : type === 'SEMAINE' ? '12.00' : '300.00')
  )
  await prisma.paymentSport.create({
    data: { memberId, amount, method: 'WAVE' },
  })
  revalidatePath('/members')
}

async function updateStatus(id: string, status: 'ACTIF' | 'EXPIRE' | 'SUSPENDU') {
  'use server'
  await prisma.memberSport.update({ where: { id }, data: { status } })
  revalidatePath('/members')
}

async function removeMember(id: string) {
  'use server'
  await prisma.memberSport.delete({ where: { id } })
  revalidatePath('/members')
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>
}) {
  const { q = '' } = (await searchParams) || {}
  const members = await getMembers(q || undefined)
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Membres</h1>
      {/* Quick search */}
      <form method="GET" className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input name="q" defaultValue={q} placeholder="Recherche: nom, prénom ou email" className="border rounded p-2" />
        <button className="bg-gray-800 hover:bg-gray-900 text-white rounded p-2">Rechercher</button>
      </form>

      {/* Create member */}
      <form action={createMember} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
        <input name="firstName" placeholder="Prénom" className="border rounded p-2" required />
        <input name="lastName" placeholder="Nom" className="border rounded p-2" required />
        <input name="phone" placeholder="Téléphone" className="border rounded p-2" required />
        <input name="email" placeholder="Email" className="border rounded p-2" />
        <input name="address" placeholder="Adresse (optionnel)" className="border rounded p-2" />
        <select name="accountType" className="border rounded p-2">
          <option value="USER_SIMPLE">User simple</option>
          <option value="CLIENT_ASSIDU">Client assidu</option>
          <option value="ADMINISTRATEUR">Administrateur</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Photo</label>
          <input type="file" name="photo" accept="image/*" className="text-sm" />
        </div>
        <select name="subscriptionType" className="border rounded p-2">
          <option value="">Abonnement (optionnel)</option>
          <option value="SEANCE">Journalier (Séance)</option>
          <option value="SEMAINE">Hebdomadaire (Semaine)</option>
          <option value="MENSUEL">Mensuel</option>
          <option value="ANNUEL">Annuel</option>
        </select>
        <button className="bg-primary-600 hover:bg-primary-700 text-white rounded p-2">Ajouter</button>
      </form>

      {/* Catalogue-style grid inspired by bookstore listings */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {members.map((m) => {
          const initials = `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase()
          const palette = [
            'from-emerald-500 to-sky-500',
            'from-sky-500 to-emerald-500',
            'from-indigo-500 to-sky-500',
            'from-rose-500 to-amber-500',
            'from-teal-500 to-cyan-500',
          ]
          const color = palette[Math.abs(m.id?.charCodeAt(0) ?? 0) % palette.length]
          const statusColor =
            m.status === 'ACTIF'
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : m.status === 'SUSPENDU'
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          return (
            <div key={m.id} className="group rounded-lg border bg-white overflow-hidden shadow-sm hover:shadow-md transition">
              <Link href={`/members/${m.id}`} className="block">
                <div className="relative">
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={`${m.firstName} ${m.lastName}`} className="aspect-[3/4] w-full object-cover" />
                  ) : (
                    <div className={`aspect-[3/4] bg-gradient-to-br ${color} flex items-center justify-center text-white text-3xl font-semibold`}>
                      <span className="drop-shadow-sm">{initials || 'MB'}</span>
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded border text-xs ${statusColor}`}>
                    {m.status}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="space-y-0.5">
                    <h3 className="font-medium text-sm text-gray-900">
                      {m.lastName} {m.firstName}
                    </h3>
                    <p className="text-xs text-gray-600">{m.phone}</p>
                    {m.email && <p className="text-xs text-gray-600">{m.email}</p>}
                    {m.address && <p className="text-xs text-gray-600">{m.address}</p>}
                  </div>
                </div>
              </Link>
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-2 pt-1">
                  <form action={updateStatus.bind(null, m.id, 'ACTIF')}>
                    <button className="text-xs px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50">Activer</button>
                  </form>
                  <form action={updateStatus.bind(null, m.id, 'SUSPENDU')}>
                    <button className="text-xs px-2 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-50">Suspendre</button>
                  </form>
                  <form action={updateStatus.bind(null, m.id, 'EXPIRE')}>
                    <button className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50">Expirer</button>
                  </form>
                  <form action={removeMember.bind(null, m.id)}>
                    <button className="text-xs px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50">Supprimer</button>
                  </form>
                  {/* Inline quick payments */}
                  <form action={quickPay.bind(null, m.id, 'SEANCE')}>
                    <button className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50">Journalier</button>
                  </form>
                  <form action={quickPay.bind(null, m.id, 'SEMAINE')}>
                    <button className="text-xs px-2 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-50">Hebdo</button>
                  </form>
                  <form action={quickPay.bind(null, m.id, 'MENSUEL')}>
                    <button className="text-xs px-2 py-1 rounded border border-primary-200 text-primary-700 hover:bg-primary-50">Mensuel</button>
                  </form>
                  <form action={quickPay.bind(null, m.id, 'ANNUEL')}>
                    <button className="text-xs px-2 py-1 rounded border border-sky-200 text-sky-700 hover:bg-sky-50">Annuel</button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
