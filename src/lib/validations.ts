import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  flatNumber: z.string().optional(),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const complaintSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  category: z.enum([
    'PLUMBING',
    'ELECTRICAL',
    'LIFT_ELEVATOR',
    'CLEANING',
    'SECURITY',
    'WATER_SUPPLY',
    'PARKING',
    'COMMON_AREA',
    'OTHER',
  ]),
  photoUrl: z.string().url().optional().or(z.literal('')),
})

export const statusUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
  note: z.string().max(500).optional(),
})

export const priorityUpdateSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

export const noticeSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content must not exceed 5000 characters'),
  isImportant: z.boolean().default(false),
})

export const settingsSchema = z.object({
  overdueThresholdDays: z
    .number()
    .int()
    .min(1, 'Threshold must be at least 1 day')
    .max(365, 'Threshold must not exceed 365 days'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ComplaintInput = z.infer<typeof complaintSchema>
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>
export type PriorityUpdateInput = z.infer<typeof priorityUpdateSchema>
export type NoticeInput = z.infer<typeof noticeSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
