import { PrismaClient, Role, ComplaintStatus, Priority, Category } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.complaintHistory.deleteMany()
  await prisma.complaint.deleteMany()
  await prisma.notice.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.user.deleteMany()

  // Create admin
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12)
  const admin = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'admin@greenparkresidency.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      flatNumber: 'Office',
      phone: '+91 98765 43210',
    },
  })

  // Create residents
  const residentPasswordHash = await bcrypt.hash('Resident@123', 12)

  const residents = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        passwordHash: residentPasswordHash,
        role: Role.RESIDENT,
        flatNumber: 'A-203',
        phone: '+91 98123 45678',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Anil Mehta',
        email: 'anil.mehta@email.com',
        passwordHash: residentPasswordHash,
        role: Role.RESIDENT,
        flatNumber: 'B-101',
        phone: '+91 97234 56789',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sunita Patel',
        email: 'sunita.patel@email.com',
        passwordHash: residentPasswordHash,
        role: Role.RESIDENT,
        flatNumber: 'C-405',
        phone: '+91 96345 67890',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Vikram Singh',
        email: 'vikram.singh@email.com',
        passwordHash: residentPasswordHash,
        role: Role.RESIDENT,
        flatNumber: 'A-301',
        phone: '+91 95456 78901',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Deepa Nair',
        email: 'deepa.nair@email.com',
        passwordHash: residentPasswordHash,
        role: Role.RESIDENT,
        flatNumber: 'D-102',
        phone: '+91 94567 89012',
      },
    }),
  ])

  // Overdue date (20 days ago)
  const overdueDate = new Date()
  overdueDate.setDate(overdueDate.getDate() - 20)

  // A week ago
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // 3 days ago
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  // Yesterday
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  // Create complaints
  // 1. Overdue - OPEN
  const c1 = await prisma.complaint.create({
    data: {
      title: 'Water leakage from ceiling in master bedroom',
      description: 'There is continuous water dripping from the ceiling of the master bedroom. The seepage appears to be coming from the bathroom above (A-303). The wall is developing cracks and the paint is peeling. This is causing significant damage to the room and has been worsening over the past few weeks.',
      category: Category.PLUMBING,
      status: ComplaintStatus.OPEN,
      priority: Priority.HIGH,
      residentId: residents[0].id,
      createdAt: overdueDate,
      updatedAt: overdueDate,
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c1.id,
      previousStatus: null,
      newStatus: ComplaintStatus.OPEN,
      note: 'Complaint submitted',
      actorId: residents[0].id,
      createdAt: overdueDate,
    },
  })

  // 2. Overdue - IN_PROGRESS
  const c2 = await prisma.complaint.create({
    data: {
      title: 'Lift not working in B Block',
      description: 'The elevator in B Block has been intermittently failing for the past three weeks. It stops between floors and requires manual restart. This is very inconvenient especially for elderly residents and those with mobility issues on higher floors.',
      category: Category.LIFT_ELEVATOR,
      status: ComplaintStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      residentId: residents[1].id,
      createdAt: overdueDate,
      updatedAt: weekAgo,
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c2.id,
      previousStatus: null,
      newStatus: ComplaintStatus.OPEN,
      note: 'Complaint submitted',
      actorId: residents[1].id,
      createdAt: overdueDate,
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c2.id,
      previousStatus: ComplaintStatus.OPEN,
      newStatus: ComplaintStatus.IN_PROGRESS,
      note: 'Contacted elevator maintenance vendor Otis India. Technician visit scheduled for this week.',
      actorId: admin.id,
      createdAt: weekAgo,
    },
  })

  // 3. Recent - IN_PROGRESS
  const c3 = await prisma.complaint.create({
    data: {
      title: 'Street lights not working near parking area',
      description: 'Four of the six parking area lights have stopped working. This creates a safety concern during night hours as the entire B2 parking section is pitch dark. Residents are having difficulty locating their vehicles.',
      category: Category.ELECTRICAL,
      status: ComplaintStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      residentId: residents[2].id,
      createdAt: weekAgo,
      updatedAt: threeDaysAgo,
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c3.id,
      previousStatus: null,
      newStatus: ComplaintStatus.OPEN,
      note: 'Complaint submitted',
      actorId: residents[2].id,
      createdAt: weekAgo,
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c3.id,
      previousStatus: ComplaintStatus.OPEN,
      newStatus: ComplaintStatus.IN_PROGRESS,
      note: 'Electrician has been assigned. Replacement bulbs and wiring check scheduled.',
      actorId: admin.id,
      createdAt: threeDaysAgo,
    },
  })

  // 4. RESOLVED
  const c4resolvedAt = new Date()
  c4resolvedAt.setDate(c4resolvedAt.getDate() - 2)
  const c4 = await prisma.complaint.create({
    data: {
      title: 'Broken gate latch at main entrance',
      description: 'The main entrance gate latch is broken and the gate does not close properly. This is a security concern as unauthorized persons can enter the premises.',
      category: Category.SECURITY,
      status: ComplaintStatus.RESOLVED,
      priority: Priority.HIGH,
      residentId: residents[3].id,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      updatedAt: c4resolvedAt,
      resolvedAt: c4resolvedAt,
    },
  })
  const c4Created = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
  await prisma.complaintHistory.create({
    data: {
      complaintId: c4.id,
      previousStatus: null,
      newStatus: ComplaintStatus.OPEN,
      note: 'Complaint submitted',
      actorId: residents[3].id,
      createdAt: c4Created,
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c4.id,
      previousStatus: ComplaintStatus.OPEN,
      newStatus: ComplaintStatus.IN_PROGRESS,
      note: 'Maintenance team dispatched to inspect the gate latch.',
      actorId: admin.id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c4.id,
      previousStatus: ComplaintStatus.IN_PROGRESS,
      newStatus: ComplaintStatus.RESOLVED,
      note: 'Gate latch has been replaced with a heavy-duty stainless steel latch. The gate now closes and locks properly. Area also inspected for other security vulnerabilities.',
      actorId: admin.id,
      createdAt: c4resolvedAt,
    },
  })

  // 5. Recent OPEN - LOW priority
  const c5 = await prisma.complaint.create({
    data: {
      title: 'Garbage not collected from D Block staircase',
      description: 'Garbage bins in D Block staircase on floors 3 and 4 have not been emptied for the past 4 days. This is causing an unpleasant smell and unhygienic conditions.',
      category: Category.CLEANING,
      status: ComplaintStatus.OPEN,
      priority: Priority.LOW,
      residentId: residents[4].id,
      createdAt: yesterday,
      updatedAt: yesterday,
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c5.id,
      previousStatus: null,
      newStatus: ComplaintStatus.OPEN,
      note: 'Complaint submitted',
      actorId: residents[4].id,
      createdAt: yesterday,
    },
  })

  // 6. Recent OPEN - MEDIUM
  const c6 = await prisma.complaint.create({
    data: {
      title: 'Water supply interrupted in morning hours',
      description: 'Water supply is being cut off every morning between 7-9 AM in the A Block. This is the peak usage time for most residents and is causing serious inconvenience.',
      category: Category.WATER_SUPPLY,
      status: ComplaintStatus.OPEN,
      priority: Priority.MEDIUM,
      residentId: residents[0].id,
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c6.id,
      previousStatus: null,
      newStatus: ComplaintStatus.OPEN,
      note: 'Complaint submitted',
      actorId: residents[0].id,
      createdAt: threeDaysAgo,
    },
  })

  // 7. RESOLVED - recent
  const c7resolvedAt = yesterday
  const c7 = await prisma.complaint.create({
    data: {
      title: 'Unauthorized parking in visitor slot near C Block',
      description: 'A blue Maruti Swift (MH-XX-XXXX) has been parked in the designated visitor slot near C Block entrance for 5 consecutive days. This prevents actual visitors from parking.',
      category: Category.PARKING,
      status: ComplaintStatus.RESOLVED,
      priority: Priority.LOW,
      residentId: residents[2].id,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      updatedAt: c7resolvedAt,
      resolvedAt: c7resolvedAt,
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c7.id,
      previousStatus: null,
      newStatus: ComplaintStatus.OPEN,
      note: 'Complaint submitted',
      actorId: residents[2].id,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c7.id,
      previousStatus: ComplaintStatus.OPEN,
      newStatus: ComplaintStatus.RESOLVED,
      note: 'Security team contacted the vehicle owner. The vehicle has been moved and the resident reminded about parking rules.',
      actorId: admin.id,
      createdAt: c7resolvedAt,
    },
  })

  // 8. OPEN - Common Area
  const c8 = await prisma.complaint.create({
    data: {
      title: 'Gym equipment damaged — treadmill out of service',
      description: 'The treadmill in the society gym (Ground floor, A Block) has been non-functional for two weeks. The belt is torn and the control panel is unresponsive. Several residents use it daily.',
      category: Category.COMMON_AREA,
      status: ComplaintStatus.OPEN,
      priority: Priority.MEDIUM,
      residentId: residents[1].id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.complaintHistory.create({
    data: {
      complaintId: c8.id,
      previousStatus: null,
      newStatus: ComplaintStatus.OPEN,
      note: 'Complaint submitted',
      actorId: residents[1].id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  })

  // Create Notices
  await prisma.notice.create({
    data: {
      title: 'Water Supply Interruption — Annual Pipeline Maintenance',
      content: 'Dear Residents,\n\nPlease note that there will be a complete water supply interruption on Sunday, 25th August 2024 between 8:00 AM and 1:00 PM due to annual pipeline maintenance work.\n\nKindly store sufficient water in advance. We apologize for the inconvenience and appreciate your cooperation.\n\nThank you,\nSociety Management',
      isImportant: true,
      createdById: admin.id,
    },
  })

  await prisma.notice.create({
    data: {
      title: 'Annual General Body Meeting — September 2024',
      content: 'All residents are cordially invited to attend the Annual General Body Meeting of Green Park Residency.\n\nDate: Saturday, 7th September 2024\nTime: 6:30 PM\nVenue: Community Hall, Ground Floor\n\nAgenda:\n1. Financial statement review\n2. Maintenance charge revision proposal\n3. Society improvement plans\n4. Election of new committee members\n5. Open house Q&A\n\nAttendance is strongly encouraged.',
      isImportant: true,
      createdById: admin.id,
    },
  })

  await prisma.notice.create({
    data: {
      title: 'New Visitor Management System Launched',
      content: 'We are pleased to inform that the society has implemented a new digital visitor management system. All visitors must now check in at the main gate using the QR code available at the security desk.\n\nThis enhances the security of our premises significantly. Please cooperate with the security team during this transition period.',
      isImportant: false,
      createdById: admin.id,
    },
  })

  await prisma.notice.create({
    data: {
      title: 'Independence Day Celebration',
      content: 'Green Park Residency is organizing an Independence Day celebration on 15th August 2024.\n\nFlag hoisting: 8:00 AM at the main entrance\nCultural program: 10:00 AM at the Community Hall\nSnacks will be provided\n\nAll residents and their families are invited.',
      isImportant: false,
      createdById: admin.id,
    },
  })

  await prisma.notice.create({
    data: {
      title: 'Reminder: Monthly Maintenance Charges Due',
      content: 'This is a reminder that monthly maintenance charges for August 2024 are due by 10th August 2024.\n\nAmount: ₹3,500 per flat\nPayment Mode: Online transfer to society account or at the admin office (Mon-Sat, 10 AM - 5 PM)\n\nLate payments will attract a penalty of ₹100 per week after the due date.',
      isImportant: false,
      createdById: admin.id,
    },
  })

  // Create Settings
  await prisma.setting.create({
    data: {
      key: 'overdueThresholdDays',
      value: '14',
    },
  })

  await prisma.setting.create({
    data: {
      key: 'societyName',
      value: 'Green Park Residency',
    },
  })

  console.log('✅ Seeding complete!')
  console.log('\n📧 Login credentials:')
  console.log('  Admin:    admin@greenparkresidency.com / Admin@123')
  console.log('  Resident: priya.sharma@email.com / Resident@123')
  console.log('  Resident: anil.mehta@email.com / Resident@123')
  console.log('  Resident: sunita.patel@email.com / Resident@123')
  console.log('  Resident: vikram.singh@email.com / Resident@123')
  console.log('  Resident: deepa.nair@email.com / Resident@123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
