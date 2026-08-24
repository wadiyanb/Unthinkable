import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOverdueThreshold, isComplaintOverdue } from '@/lib/overdue'

// GET /api/complaints/my — get current resident's complaints
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'RESIDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')
    const skip = (page - 1) * limit

    const where: any = { residentId: session.user.id }
    if (status && status !== 'ALL') where.status = status

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          resident: { select: { name: true, flatNumber: true } },
          _count: { select: { history: true } },
        },
      }),
      db.complaint.count({ where }),
    ])

    const thresholdDays = await getOverdueThreshold()

    const complaintsWithOverdue = complaints.map((c) => ({
      ...c,
      isOverdue: isComplaintOverdue(c.createdAt, c.status, thresholdDays),
    }))

    return NextResponse.json({
      complaints: complaintsWithOverdue,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/complaints/my]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
