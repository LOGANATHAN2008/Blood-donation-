// lib/mockStore.ts  — in-memory store for Phase 1 (replaced by Firestore in Phase 2)
import type { BloodRequest } from '../types'

/** Generate a readable 8-char ID excluding confusable chars */
export function generateId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

function generateToken(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

const STORE_KEY = 'bs_mock_requests'

function loadStore(): BloodRequest[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') as BloodRequest[]
  } catch {
    return []
  }
}

function saveStore(requests: BloodRequest[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(requests))
}

export const EDIT_TOKEN_PREFIX = 'bs_edit_'

export function storeEditToken(id: string, token: string): void {
  localStorage.setItem(`${EDIT_TOKEN_PREFIX}${id}`, token)
}

export function getEditToken(id: string): string | null {
  return localStorage.getItem(`${EDIT_TOKEN_PREFIX}${id}`)
}

export async function createRequestMock(
  data: Omit<BloodRequest, 'id' | 'status' | 'createdAt' | 'expiresAt' | 'editToken' | 'shareCount' | 'viewCount'>
): Promise<{ id: string; editToken: string }> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 400))

  const id = generateId()
  const editToken = generateToken()
  const createdAt = new Date().toISOString()
  const neededByDate = new Date(data.neededBy)
  const expiresAt = new Date(neededByDate.getTime() + 24 * 60 * 60 * 1000).toISOString()

  const request: BloodRequest = {
    ...data,
    id,
    editToken,
    status: 'open',
    createdAt,
    expiresAt,
    shareCount: 0,
    viewCount: 0,
  }

  const requests = loadStore()
  requests.unshift(request)
  saveStore(requests)
  storeEditToken(id, editToken)

  return { id, editToken }
}

export function getRequestMock(id: string): BloodRequest | null {
  const requests = loadStore()
  return requests.find((r) => r.id === id) ?? null
}

export function listMyRequests(): BloodRequest[] {
  const all = loadStore()
  return all.filter((r) => getEditToken(r.id) !== null)
}
