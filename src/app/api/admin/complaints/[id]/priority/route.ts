import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { priorityUpdateSchema } from '@/lib/validations'
import { Priority } from '@prisma/client'

// PATCH /api/admin/complaints/:id/priority
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const result = priorityUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { priority } = result.data

    const complaint = await db.complaint.findUnique({ where: { id: params.id } })
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const updatedComplaint = await db.complaint.update({
      where: { id: params.id },
      data: { priority: priority as Priority },
    })

    return NextResponse.json({ complaint: updatedComplaint })
  } catch (error) {
    console.error('[PATCH /api/admin/complaints/:id/priority]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
