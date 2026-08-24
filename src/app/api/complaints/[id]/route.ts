import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOverdueThreshold, isComplaintOverdue } from '@/lib/overdue'

// GET /api/complaints/:id — get complaint detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const complaint = await db.complaint.findUnique({
      where: { id: params.id },
      include: {
        resident: { select: { id: true, name: true, email: true, flatNumber: true, phone: true } },
        history: {
          orderBy: { createdAt: 'asc' },
          include: {
            actor: { select: { id: true, name: true, role: true } },
          },
        },
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    // Residents can only view their own complaints
    if (session.user.role === 'RESIDENT' && complaint.residentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const thresholdDays = await getOverdueThreshold()
    const complaintWithOverdue = {
      ...complaint,
      isOverdue: isComplaintOverdue(complaint.createdAt, complaint.status, thresholdDays),
    }

    return NextResponse.json({ complaint: complaintWithOverdue })
  } catch (error) {
    console.error('[GET /api/complaints/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
