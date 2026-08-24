import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { settingsSchema } from '@/lib/validations'

// GET /api/admin/settings
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await db.setting.findMany()
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    return NextResponse.json({
      settings: {
        overdueThresholdDays: parseInt(settingsMap['overdueThresholdDays'] ?? '14', 10),
        societyName: settingsMap['societyName'] ?? 'Residential Society',
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/settings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const result = settingsSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { overdueThresholdDays } = result.data

    await db.setting.upsert({
      where: { key: 'overdueThresholdDays' },
      update: { value: overdueThresholdDays.toString() },
      create: { key: 'overdueThresholdDays', value: overdueThresholdDays.toString() },
    })

    return NextResponse.json({
      settings: { overdueThresholdDays },
      message: 'Settings updated successfully',
    })
  } catch (error) {
    console.error('[PATCH /api/admin/settings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
