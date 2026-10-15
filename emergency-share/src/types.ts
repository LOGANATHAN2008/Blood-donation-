// Types shared across Phase 1 and later phases

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type BloodComponent = 'whole_blood' | 'platelets' | 'plasma' | 'any'
export type Urgency = 'critical' | 'today' | 'within_3_days'
export type Lang = 'en' | 'ta' | 'kn' | 'hi'
export type RequestStatus = 'open' | 'fulfilled' | 'expired'

export interface BloodRequest {
  id: string
  bloodGroup: BloodGroup
  component: BloodComponent
  units: number
  patientName: string
  hospitalName: string
  hospitalArea: string
  city: string
  neededBy: string // ISO 8601
  urgency: Urgency
  contactName: string
  contactPhone: string // normalised e.g. "9876543210"
  note?: string
  showPhoneOnImage: boolean
  lang: Lang
  status: RequestStatus
  createdAt: string // ISO 8601
  expiresAt: string // ISO 8601
  editToken: string
  shareCount: number
  viewCount: number
}
