// lib/schema.ts  — Zod schema for the create-request form
import { z } from 'zod'

/** Strip +91 prefix / spaces / dashes and validate 10-digit Indian mobile */
const phoneRefinement = (val: string) =>
  /^(\+91[\s-]?)?[6-9]\d{9}$/.test(val.trim())

export const createRequestSchema = z.object({
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: 'Select a blood group' }),
  }),
  component: z.enum(['whole_blood', 'platelets', 'plasma', 'any']).default('whole_blood'),
  units: z.number().int().min(1, 'units_range').max(10, 'units_range'),
  patientName: z.string().min(1, 'field_required').max(80),
  hospitalName: z.string().min(1, 'field_required').max(100),
  hospitalArea: z.string().min(1, 'field_required').max(100),
  city: z.string().min(1, 'field_required').max(80),
  neededBy: z.string().min(1, 'field_required'), // datetime-local string
  urgency: z.enum(['critical', 'today', 'within_3_days'], {
    errorMap: () => ({ message: 'Select urgency' }),
  }),
  contactName: z.string().min(1, 'field_required').max(80),
  contactPhone: z
    .string()
    .min(10, 'phone_invalid')
    .refine(phoneRefinement, 'phone_invalid'),
  note: z.string().max(140, 'note_too_long').optional(),
  showPhoneOnImage: z.boolean().default(false),
  lang: z.enum(['en', 'ta', 'kn', 'hi']).default('en'),
})

export type CreateRequestFormData = z.infer<typeof createRequestSchema>
