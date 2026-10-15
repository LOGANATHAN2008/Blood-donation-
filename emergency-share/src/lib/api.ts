// lib/api.ts — Real-time API service connecting to Life Connect backend
import type { BloodRequest } from '../types'
import {
  createRequestMock,
  getRequestMock,
  storeEditToken,
  getEditToken,
} from './mockStore'

const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
  'http://localhost:5000/api'

export { getEditToken, storeEditToken }

/**
 * Creates an emergency request in the real MongoDB backend via POST /api/requests/emergency.
 * Broadcasts to socket subscribers & auto-matches donors in the background.
 * Falls back to offline mockStore if server is unreachable.
 */
export async function createEmergencyRequest(
  data: Omit<BloodRequest, 'id' | 'status' | 'createdAt' | 'expiresAt' | 'editToken' | 'shareCount' | 'viewCount'>
): Promise<{ id: string; editToken: string }> {
  try {
    const res = await fetch(`${API_BASE}/requests/emergency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `Server responded with ${res.status}`)
    }

    const json = await res.json()
    const id = json.shortCode || json.id || json._id
    const editToken = json.editToken

    if (id && editToken) {
      storeEditToken(id, editToken)
    }

    // Cache locally as offline fallback
    try {
      const STORE_KEY = 'bs_mock_requests'
      const existing: BloodRequest[] = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]')
      const normalized: BloodRequest = {
        ...data,
        id,
        editToken: editToken || '',
        status: 'open',
        createdAt: json.createdAt || new Date().toISOString(),
        expiresAt: json.expiresAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        shareCount: json.shareCount || 0,
        viewCount: json.viewCount || 0,
      }
      existing.unshift(normalized)
      localStorage.setItem(STORE_KEY, JSON.stringify(existing))
    } catch {}

    return { id, editToken }
  } catch (err) {
    console.warn('Backend API unavailable, falling back to local store:', err)
    return await createRequestMock(data)
  }
}

/**
 * Fetches a single blood request by 8-char short code or MongoDB ID.
 * Falls back to local store if offline or server is unreachable.
 */
export async function fetchEmergencyRequest(idOrCode: string): Promise<BloodRequest | null> {
  try {
    const res = await fetch(`${API_BASE}/requests/${encodeURIComponent(idOrCode)}`)
    if (res.ok) {
      const json = await res.json()
      const req: BloodRequest = {
        id: json.shortCode || json.id || json._id,
        bloodGroup: json.bloodGroup,
        component: json.component || 'whole_blood',
        units: Number(json.units) || 1,
        patientName: json.patientName,
        hospitalName: json.hospitalName || json.hospital,
        hospitalArea: json.hospitalArea || '',
        city: json.city,
        neededBy: json.neededBy,
        urgency: json.urgency,
        contactName: json.contactName || '',
        contactPhone: json.contactPhone,
        note: json.note || '',
        showPhoneOnImage: !!json.showPhoneOnImage,
        lang: json.lang || 'en',
        status: json.status,
        createdAt: json.createdAt,
        expiresAt: json.expiresAt,
        editToken: getEditToken(json.shortCode || json.id) || '',
        shareCount: json.shareCount || 0,
        viewCount: json.viewCount || 0,
      }
      return req
    }
  } catch (err) {
    console.warn('Network error fetching request, falling back to local store:', err)
  }
  return getRequestMock(idOrCode)
}

/**
 * Marks request status (fulfilled or cancelled/expired) using the creator's editToken.
 */
export async function updateRequestStatus(id: string, status: 'fulfilled' | 'expired'): Promise<boolean> {
  const token = getEditToken(id)
  try {
    const res = await fetch(`${API_BASE}/requests/${encodeURIComponent(id)}/emergency-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-edit-token': token || '',
      },
      body: JSON.stringify({ status, editToken: token }),
    })
    if (res.ok) return true
  } catch (e) {
    console.warn('Failed to update status on server:', e)
  }

  // Fallback update local store
  try {
    const STORE_KEY = 'bs_mock_requests'
    const requests: BloodRequest[] = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]')
    const match = requests.find((r) => r.id === id)
    if (match) {
      match.status = status
      localStorage.setItem(STORE_KEY, JSON.stringify(requests))
      return true
    }
  } catch {}

  return false
}

/**
 * Increments share count in the backend database.
 */
export async function trackShare(id: string): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/requests/${encodeURIComponent(id)}/share`, {
      method: 'POST',
    })
    if (res.ok) {
      const data = await res.json()
      return data.shareCount
    }
  } catch {}
  return null
}
