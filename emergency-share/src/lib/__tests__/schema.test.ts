import { describe, it, expect } from 'vitest'
import { createRequestSchema } from '../schema'
import { generateId } from '../mockStore'

describe('createRequestSchema', () => {
  const validData = {
    bloodGroup: 'O-',
    component: 'whole_blood',
    units: 2,
    patientName: 'Ravi Kumar',
    hospitalName: 'Apollo Hospital',
    hospitalArea: 'Greams Road',
    city: 'Chennai',
    neededBy: '2026-10-16T18:00',
    urgency: 'critical',
    contactName: 'Suresh',
    contactPhone: '9876543210',
    note: 'Urgent replacement needed for surgery',
    showPhoneOnImage: false,
    lang: 'en',
  }

  it('validates correct form data successfully', () => {
    const result = createRequestSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('accepts Indian phone numbers with +91 or formatting', () => {
    const withPrefix = { ...validData, contactPhone: '+91 9876543210' }
    const result = createRequestSchema.safeParse(withPrefix)
    expect(result.success).toBe(true)
  })

  it('rejects invalid phone numbers', () => {
    const invalidPhone = { ...validData, contactPhone: '12345' }
    const result = createRequestSchema.safeParse(invalidPhone)
    expect(result.success).toBe(false)
  })

  it('rejects units less than 1 or more than 10', () => {
    expect(createRequestSchema.safeParse({ ...validData, units: 0 }).success).toBe(false)
    expect(createRequestSchema.safeParse({ ...validData, units: 11 }).success).toBe(false)
  })

  it('rejects note longer than 140 chars', () => {
    const longNote = 'a'.repeat(141)
    const result = createRequestSchema.safeParse({ ...validData, note: longNote })
    expect(result.success).toBe(false)
  })
})

describe('generateId', () => {
  it('generates 8-character ID without confusable characters (0, O, 1, I)', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateId()
      expect(id).toHaveLength(8)
      expect(id).not.toMatch(/[01IO]/)
    }
  })
})
