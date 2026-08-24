import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOverdueThreshold, isComplaintOverdue } from '@/lib/overdue'

// GET /api/admin/dashboard — aggregate stats
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const thresholdDays = await getOverdueThreshold()

    const [
      totalComplaints,
      openComplaints,
      inProgressComplaints,
      resolvedComplaints,
      allUnresolved,
      categoryStats,
      recentComplaints,
      highPriority,
    ] = await Promise.all([
      db.complaint.count(),
      db.complaint.count({ where: { status: 'OPEN' } }),
      db.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      db.complaint.count({ where: { status: 'RESOLVED' } }),
      db.complaint.findMany({
        where: { status: { notIn: ['RESOLVED'] } },
        select: { createdAt: true, status: true },
      }),
      db.complaint.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      db.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          resident: { select: { name: true, flatNumber: true } },
        },
      }),
      db.complaint.count({
        where: { priority: 'HIGH', status: { notIn: ['RESOLVED'] } },
      }),
    ])

    // Calculate overdue
    const overdueCount = allUnresolved.filter((c) =>
      isComplaintOverdue(c.createdAt, c.status, thresholdDays)
    ).length

    // Trend: complaints per day for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTrend = await db.complaint.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const trendMap: Record<string, { total: number; resolved: number }> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const key = d.toISOString().split('T')[0]
      trendMap[key] = { total: 0, resolved: 0 }
    }

    for (const c of recentTrend) {
      const key = new Date(c.createdAt).toISOString().split('T')[0]
      if (trendMap[key]) {
        trendMap[key].total++
        if (c.status === 'RESOLVED') trendMap[key].resolved++
      }
    }

    const trend = Object.entries(trendMap).map(([date, data]) => ({
      date,
      total: data.total,
      resolved: data.resolved,
    }))

    return NextResponse.json({
      stats: {
        total: totalComplaints,
        open: openComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
        overdue: overdueCount,
        highPriority,
      },
      categoryStats: categoryStats.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
      recentComplaints,
      trend,
      overdueThresholdDays: thresholdDays,
    })
  } catch (error) {
    console.error('[GET /api/admin/dashboard]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
