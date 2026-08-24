import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { noticeSchema } from '@/lib/validations'

// PATCH /api/admin/notices/:id
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
    const result = noticeSchema.partial().safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const notice = await db.notice.findUnique({ where: { id: params.id } })
    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }

    const updatedNotice = await db.notice.update({
      where: { id: params.id },
      data: result.data,
    })

    return NextResponse.json({ notice: updatedNotice })
  } catch (error) {
    console.error('[PATCH /api/admin/notices/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/notices/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const notice = await db.notice.findUnique({ where: { id: params.id } })
    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }

    await db.notice.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/notices/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
