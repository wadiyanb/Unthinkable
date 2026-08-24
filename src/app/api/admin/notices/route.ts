import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { noticeSchema } from '@/lib/validations'
import { sendImportantNoticeEmail } from '@/lib/email'

// POST /api/admin/notices
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const result = noticeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, content, isImportant } = result.data

    const notice = await db.notice.create({
      data: {
        title,
        content,
        isImportant,
        createdById: session.user.id,
      },
    })

    // If important, send email to all residents asynchronously
    if (isImportant) {
      db.user
        .findMany({ where: { role: 'RESIDENT' }, select: { email: true } })
        .then((residents) => {
          const emails = residents.map((r) => r.email)
          return sendImportantNoticeEmail({
            to: emails,
            noticeTitle: title,
            noticeContent: content,
            noticeId: notice.id,
          })
        })
        .catch((err) => console.error('[Email] Important notice email failed:', err))
    }

    return NextResponse.json({ notice }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/notices]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/notices — same as /api/notices but for admin
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const notices = await db.notice.findMany({
      orderBy: [{ isImportant: 'desc' }, { createdAt: 'desc' }],
      include: { createdBy: { select: { name: true } } },
    })

    return NextResponse.json({ notices })
  } catch (error) {
    console.error('[GET /api/admin/notices]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
