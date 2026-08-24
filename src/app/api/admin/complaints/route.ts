import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOverdueThreshold, isComplaintOverdue, getOverdueDate } from '@/lib/overdue'

// GET /api/admin/complaints — get all complaints with search/filter/pagination
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? ''
    const category = searchParams.get('category') ?? ''
    const priority = searchParams.get('priority') ?? ''
    const dateFilter = searchParams.get('date') ?? ''
    const overdueOnly = searchParams.get('overdue') === 'true'
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const skip = (page - 1) * limit

    const thresholdDays = await getOverdueThreshold()
    const overdueDate = getOverdueDate(thresholdDays)

    const where: any = {}

    if (status && status !== 'ALL') where.status = status
    if (category && category !== 'ALL') where.category = category
    if (priority && priority !== 'ALL') where.priority = priority

    if (dateFilter) {
      const now = new Date()
      if (dateFilter === 'today') {
        now.setHours(0, 0, 0, 0)
        where.createdAt = { gte: now }
      } else if (dateFilter === '7days') {
        now.setDate(now.getDate() - 7)
        where.createdAt = { gte: now }
      } else if (dateFilter === '30days') {
        now.setDate(now.getDate() - 30)
        where.createdAt = { gte: now }
      }
    }

    if (overdueOnly) {
      where.status = { notIn: ['RESOLVED'] }
      where.createdAt = { lt: overdueDate }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { resident: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        orderBy: [
          // Overdue first, then by createdAt
          { createdAt: 'asc' },
        ],
        skip,
        take: limit,
        include: {
          resident: { select: { id: true, name: true, email: true, flatNumber: true } },
          _count: { select: { history: true } },
        },
      }),
      db.complaint.count({ where }),
    ])

    const complaintsWithOverdue = complaints.map((c) => ({
      ...c,
      isOverdue: isComplaintOverdue(c.createdAt, c.status, thresholdDays),
    }))

    // Sort: overdue first, then by priority (HIGH > MEDIUM > LOW), then by date
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    complaintsWithOverdue.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    return NextResponse.json({
      complaints: complaintsWithOverdue,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      overdueThresholdDays: thresholdDays,
    })
  } catch (error) {
    console.error('[GET /api/admin/complaints]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
