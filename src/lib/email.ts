import { Resend } from 'resend'
import { ComplaintStatus } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@societytracker.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function statusLabel(status: ComplaintStatus): string {
  const labels: Record<ComplaintStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
  }
  return labels[status]
}

function statusColor(status: ComplaintStatus): string {
  const colors: Record<ComplaintStatus, string> = {
    OPEN: '#ef4444',
    IN_PROGRESS: '#f59e0b',
    RESOLVED: '#42bea5',
  }
  return colors[status]
}

export async function sendStatusUpdateEmail({
  to,
  residentName,
  complaintTitle,
  complaintId,
  previousStatus,
  newStatus,
  adminNote,
}: {
  to: string
  residentName: string
  complaintTitle: string
  complaintId: string
  previousStatus: ComplaintStatus
  newStatus: ComplaintStatus
  adminNote?: string | null
}): Promise<void> {
  const complaintUrl = `${APP_URL}/complaints/${complaintId}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Complaint Status Update</title>
</head>
<body style="margin:0;padding:0;background:#f8f8fc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#1e1927;padding:24px 32px;border-radius:8px 8px 0 0;">
              <p style="margin:0;color:#42bea5;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Green Park Residency</p>
              <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:600;">Complaint Status Updated</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;border:1px solid #e5e3ef;border-top:none;">
              <p style="margin:0 0 16px;color:#5c5875;font-size:15px;line-height:1.6;">
                Hi <strong style="color:#1e1927;">${residentName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#5c5875;font-size:15px;line-height:1.6;">
                Your maintenance complaint has been updated.
              </p>

              <!-- Complaint Title -->
              <div style="background:#f8f8fc;border:1px solid #e5e3ef;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#9490aa;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Complaint</p>
                <p style="margin:0;color:#1e1927;font-size:16px;font-weight:600;">${complaintTitle}</p>
              </div>

              <!-- Status Change -->
              <div style="margin-bottom:24px;">
                <p style="margin:0 0 12px;color:#5c5875;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Status Update</p>
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="background:#f1f0f8;color:#5c5875;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:500;">
                    ${statusLabel(previousStatus)}
                  </span>
                  <span style="color:#9490aa;font-size:18px;">→</span>
                  <span style="background:${statusColor(newStatus)}20;color:${statusColor(newStatus)};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid ${statusColor(newStatus)}40;">
                    ${statusLabel(newStatus)}
                  </span>
                </div>
              </div>

              ${adminNote ? `
              <!-- Admin Note -->
              <div style="background:#f8f8fc;border-left:3px solid #42bea5;padding:16px 20px;margin-bottom:24px;border-radius:0 6px 6px 0;">
                <p style="margin:0 0 6px;color:#42bea5;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Note from Admin</p>
                <p style="margin:0;color:#1e1927;font-size:14px;line-height:1.6;">${adminNote}</p>
              </div>
              ` : ''}

              <!-- CTA -->
              <a href="${complaintUrl}" style="display:inline-block;background:#4137ff;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
                View Complaint Details
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f8fc;padding:16px 32px;border:1px solid #e5e3ef;border-top:none;border-radius:0 0 8px 8px;">
              <p style="margin:0;color:#9490aa;font-size:12px;text-align:center;">
                Green Park Residency Management System • Automated notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[${statusLabel(newStatus)}] Your complaint: ${complaintTitle}`,
      html,
    })
  } catch (error) {
    // Log but don't throw — email failure shouldn't block the action
    console.error('[Email] Failed to send status update email:', error)
  }
}

export async function sendImportantNoticeEmail({
  to,
  noticeTitle,
  noticeContent,
  noticeId,
}: {
  to: string[]
  noticeTitle: string
  noticeContent: string
  noticeId: string
}): Promise<void> {
  if (to.length === 0) return

  const noticeUrl = `${APP_URL}/notices`
  const truncatedContent = noticeContent.length > 300
    ? noticeContent.substring(0, 300) + '...'
    : noticeContent

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Important Society Notice</title>
</head>
<body style="margin:0;padding:0;background:#f8f8fc;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:#1e1927;padding:24px 32px;border-radius:8px 8px 0 0;">
              <p style="margin:0;color:#dfaeff;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">⚑ Important Notice</p>
              <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:600;">Green Park Residency</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:32px;border:1px solid #e5e3ef;border-top:none;">
              <div style="background:#fdf4ff;border:1px solid #dfaeff;border-radius:6px;padding:4px 12px;display:inline-block;margin-bottom:20px;">
                <span style="color:#7c3aed;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Important</span>
              </div>
              <h2 style="margin:0 0 16px;color:#1e1927;font-size:22px;font-weight:700;line-height:1.3;">${noticeTitle}</h2>
              <p style="margin:0 0 24px;color:#5c5875;font-size:15px;line-height:1.7;white-space:pre-line;">${truncatedContent}</p>
              <a href="${noticeUrl}" style="display:inline-block;background:#4137ff;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
                Read Full Notice
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f8fc;padding:16px 32px;border:1px solid #e5e3ef;border-top:none;border-radius:0 0 8px 8px;">
              <p style="margin:0;color:#9490aa;font-size:12px;text-align:center;">
                Green Park Residency Management System • Society Notice
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    // Send in batches of 50 to avoid rate limits
    const batchSize = 50
    for (let i = 0; i < to.length; i += batchSize) {
      const batch = to.slice(i, i + batchSize)
      await Promise.all(
        batch.map((email) =>
          resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `[Notice] ${noticeTitle}`,
            html,
          })
        )
      )
    }
  } catch (error) {
    console.error('[Email] Failed to send important notice emails:', error)
  }
}
