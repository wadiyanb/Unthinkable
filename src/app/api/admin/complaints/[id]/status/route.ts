import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { statusUpdateSchema } from '@/lib/validations'
import { VALID_STATUS_TRANSITIONS } from '@/lib/utils'
import { sendStatusUpdateEmail } from '@/lib/email'
import { ComplaintStatus } from '@prisma/client'

// PATCH /api/admin/complaints/:id/status
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
    const result = statusUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status: newStatus, note } = result.data

    const complaint = await db.complaint.findUnique({
      where: { id: params.id },
      include: { resident: { select: { id: true, name: true, email: true } } },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    // Validate status transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[complaint.status]
    if (!allowedTransitions.includes(newStatus as ComplaintStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${complaint.status} to ${newStatus}`,
          allowedTransitions,
        },
        { status: 422 }
      )
    }

    // Update complaint
    const updatedComplaint = await db.complaint.update({
      where: { id: params.id },
      data: {
        status: newStatus as ComplaintStatus,
        resolvedAt: newStatus === 'RESOLVED' ? new Date() : null,
        updatedAt: new Date(),
      },
    })

    // Create history record
    await db.complaintHistory.create({
      data: {
        complaintId: params.id,
        previousStatus: complaint.status,
        newStatus: newStatus as ComplaintStatus,
        note: note || null,
        actorId: session.user.id,
      },
    })

    // Send email notification asynchronously (don't await to avoid blocking)
    sendStatusUpdateEmail({
      to: complaint.resident.email,
      residentName: complaint.resident.name,
      complaintTitle: complaint.title,
      complaintId: params.id,
      previousStatus: complaint.status,
      newStatus: newStatus as ComplaintStatus,
      adminNote: note,
    }).catch((err) => console.error('[Email] Status update email failed:', err))

    return NextResponse.json({ complaint: updatedComplaint })
  } catch (error) {
    console.error('[PATCH /api/admin/complaints/:id/status]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
