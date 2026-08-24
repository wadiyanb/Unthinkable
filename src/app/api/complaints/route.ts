import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { complaintSchema } from '@/lib/validations'

// POST /api/complaints — create a new complaint
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'RESIDENT') {
      return NextResponse.json({ error: 'Only residents can submit complaints' }, { status: 403 })
    }

    const body = await req.json()
    const result = complaintSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, description, category, photoUrl } = result.data

    const complaint = await db.complaint.create({
      data: {
        title,
        description,
        category,
        photoUrl: photoUrl || null,
        residentId: session.user.id,
        status: 'OPEN',
        priority: 'MEDIUM',
      },
    })

    // Create initial history entry
    await db.complaintHistory.create({
      data: {
        complaintId: complaint.id,
        previousStatus: null,
        newStatus: 'OPEN',
        note: 'Complaint submitted',
        actorId: session.user.id,
      },
    })

    return NextResponse.json({ complaint }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/complaints]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
