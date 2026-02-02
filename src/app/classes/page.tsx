import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getData() {
  const classes = await prisma.classSport.findMany({ orderBy: { dayOfWeek: 'asc' } })
  const members = await prisma.memberSport.findMany({ select: { id: true, firstName: true, lastName: true } })
  return { classes, members }
}

async function createClass(formData: FormData) {
  'use server'
  const name = String(formData.get('name') || '')
  const dayOfWeek = Number(formData.get('dayOfWeek') || 1)
  const startTime = String(formData.get('startTime') || '')
  const endTime = String(formData.get('endTime') || '')
  const maxParticipants = Number(formData.get('maxParticipants') || 20)
  const coachName = String(formData.get('coachName') || '')
  if (!name || !startTime || !endTime || !coachName) return
  await prisma.classSport.create({ data: { name, dayOfWeek, startTime, endTime, maxParticipants, coachName } })
  revalidatePath('/classes')
}

async function registerAttendance(formData: FormData) {
  'use server'
  const classId = String(formData.get('classId') || '')
  const memberId = String(formData.get('memberId') || '')
  if (!classId || !memberId) return
  await prisma.attendanceSport.create({ data: { classId, memberId } })
  revalidatePath('/classes')
}

export default async function ClassesPage() {
  const { classes, members } = await getData()
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Cours collectifs</h1>
      <form action={createClass} className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <input name="name" placeholder="Nom du cours" className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-400" />
        <select name="dayOfWeek" className="border p-2 rounded">
          <option value="1">Lundi</option>
          <option value="2">Mardi</option>
          <option value="3">Mercredi</option>
          <option value="4">Jeudi</option>
          <option value="5">Vendredi</option>
          <option value="6">Samedi</option>
          <option value="0">Dimanche</option>
        </select>
        <input name="startTime" type="time" className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-400" />
        <input name="endTime" type="time" className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-400" />
        <input name="maxParticipants" type="number" min={1} className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="Max" />
        <input name="coachName" placeholder="Coach" className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-400" />
        <button className="bg-primary-600 hover:bg-primary-700 text-white rounded p-2">Créer</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map((c) => (
          <div key={c.id} className="border rounded p-4 bg-white space-y-2 ring-1 ring-primary-100">
            <div className="font-semibold">{c.name} (Coach: {c.coachName})</div>
            <div className="text-sm text-gray-500">Jour: {c.dayOfWeek} | {c.startTime} - {c.endTime} | Max: {c.maxParticipants}</div>
            <form action={registerAttendance} className="flex gap-2">
              <input type="hidden" name="classId" value={c.id} />
              <select name="memberId" className="border p-2 rounded">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.lastName} {m.firstName}</option>
                ))}
              </select>
              <button className="border border-primary-200 text-primary-700 hover:bg-primary-50 rounded px-3">Présence</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
