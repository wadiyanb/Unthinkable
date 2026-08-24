import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/notices — get all notices (resident or admin)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notices = await db.notice.findMany({
      orderBy: [{ isImportant: 'desc' }, { createdAt: 'desc' }],
      include: {
        createdBy: { select: { name: true } },
      },
    })

    return NextResponse.json({ notices })
  } catch (error) {
    console.error('[GET /api/notices]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
