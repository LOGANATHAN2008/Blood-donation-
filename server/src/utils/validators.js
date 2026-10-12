const { z } = require('zod');
const { INDIA_STATES } = require('./indiaLocations');

const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];

const indianPhone = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number');
const bloodGroup  = z.enum(BLOOD_GROUPS);
const stateEnum   = z.enum(INDIA_STATES);
const district    = z.string().min(2).max(80).trim();

const donorSchema = z.object({
  name:             z.string().min(2).max(40).trim(),
  phone:            z.string().optional().nullable(),
  bloodGroup:       bloodGroup,
  state:            stateEnum.optional(),
  district:         district,
  city:             z.string().min(2).max(80).trim(),
  age:              z.number().int().min(18).max(65),
  lastDonationDate: z.string().refine(v => !v || !isNaN(Date.parse(v)), 'Invalid date').optional().nullable(),
  available:        z.boolean().default(true),
  consent:          z.literal(true, { errorMap: () => ({ message: 'You must consent to share your contact.' }) }),
});

const bloodRequestSchema = z.object({
  patientName:  z.string().min(2).max(80).trim(),
  bloodGroup:   bloodGroup,
  units:        z.number().int().min(1).max(10),
  hospital:     z.string().min(2).max(120).trim(),
  state:        stateEnum,
  district:     district,
  city:         z.string().min(2).max(80).trim(),
  urgency:      z.enum(['Normal','Urgent','Critical']).default('Normal'),
  isEmergency:  z.boolean().default(false),
  emergencyTimeWindow: z.enum(['2_hours', '12_hours', 'tomorrow']).nullable().optional(),
  neededBy:     z.string().refine(v => !isNaN(Date.parse(v)), 'Invalid date'),
  contactName:  z.string().max(80).trim().optional(),
  contactPhone: indianPhone,
  note:         z.string().max(500).optional(),
});

const hospitalSchema = z.object({
  name:     z.string().min(2).max(120).trim(),
  type:     z.enum(['Government Hospital','Private Hospital','Blood Bank','Trauma Center','Medical College']),
  district: district,
  address:  z.string().min(5).max(300).trim(),
  phone:    z.string().regex(/^[0-9+\-\s]{7,20}$/, 'Invalid phone').trim(),
  lat:      z.number().min(8).max(14).optional().nullable(),
  lng:      z.number().min(76).max(80.5).optional().nullable(),
  is24x7:   z.boolean().default(false),
});

const medicineSchema = z.object({
  name:         z.string().min(2).max(120).trim(),
  strength:     z.string().max(50).optional(),
  quantity:     z.string().min(1).max(50).trim(),
  expiryDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format'),
  district:     district,
  city:         z.string().min(2).max(80).trim(),
  contactPhone: indianPhone,
  pickupNotes:  z.string().max(300).optional(),
  // cloudinary fields supplied after upload
  imageUrl:     z.string().url().optional().nullable(),
  imagePublicId:z.string().optional().nullable(),
  // safety checkboxes
  checkedSealed:      z.literal(true, { errorMap: () => ({ message: 'Must confirm medicine is sealed.' }) }),
  checkedNotExpired:  z.literal(true, { errorMap: () => ({ message: 'Must confirm medicine is not expired.' }) }),
  checkedNotControlled: z.literal(true, { errorMap: () => ({ message: 'Must confirm not a controlled/narcotic substance.' }) }),
  checkedNotInjection: z.literal(true, { errorMap: () => ({ message: 'Must confirm not an injection/IV.' }) }),
});

const reportSchema = z.object({
  targetType: z.enum(['BloodRequest','Medicine','Hospital','Donor']),
  targetId:   z.string().length(24),
  reason:     z.string().min(5).max(300).trim(),
});

const userSettingsSchema = z.object({
  // Profile
  name: z.string().min(2).max(40).trim().optional(),
  photoUrl: z.string().url().nullable().optional(),
  photoId: z.string().nullable().optional(),
  state: stateEnum.optional(),
  district: z.string().optional(),
  city: z.string().max(80).trim().optional(),
  dob: z.string().refine(v => !v || !isNaN(Date.parse(v)), 'Invalid date').nullable().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).nullable().optional(),
  phone: indianPhone.optional().nullable(),

  // App Preferences
  language: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  textSize: z.enum(['small', 'medium', 'large']).optional(),

  // Notifications
  urgencyFilter: z.enum(['Critical', 'UrgentCritical', 'All']).optional(),
  campReminders: z.boolean().optional(),
  medicineAlerts: z.boolean().optional(),
  pushOptIn: z.boolean().optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm format'),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm format'),
  }).optional(),

  // Donor Settings (These apply if user is a donor)
  bloodGroup: bloodGroup.optional(),
  available: z.boolean().optional(),
  lastDonationDate: z.string().refine(v => !v || !isNaN(Date.parse(v)), 'Invalid date').nullable().optional(),
  contactVisibility: z.enum(['everyone', 'approve', 'hidden']).optional(),
  preferredDistance: z.enum(['5', '10', '25', 'state']).optional(),
  nightWeekendAvail: z.boolean().optional(),

  // Privacy & Security
  pausedAccount: z.boolean().optional(),
  leaderboardOptIn: z.boolean().optional(),
  donorCardQrEnabled: z.boolean().optional(),
});

const onboardingSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(40, 'Name is too long').trim(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine(val => {
      const age = new Date().getFullYear() - new Date(val).getFullYear();
      return age >= 13;
    }, { message: 'You must be at least 13 years old to use Life Connect.' }),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  state: stateEnum.optional().nullable(),
  district: district.optional().nullable(),
  city: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  photoId: z.string().optional().nullable(),
  phone: indianPhone.optional().nullable(),
});

module.exports = {
  BLOOD_GROUPS,
  indianPhone, bloodGroup, district, stateEnum,
  donorSchema, bloodRequestSchema, hospitalSchema, medicineSchema, reportSchema,
  userSettingsSchema, onboardingSchema
};
