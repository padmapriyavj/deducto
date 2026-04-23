import { apiFetch, apiFetchJson } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

type LoginRequest = components['schemas']['LoginRequest']
type SignupRequest = components['schemas']['SignupRequest']
type AuthResponse = components['schemas']['AuthResponse']
type UserPublic = components['schemas']['UserResponse']

export async function loginRequest(body: LoginRequest): Promise<AuthResponse> {
  return apiFetchJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function signupRequest(body: SignupRequest): Promise<AuthResponse> {
  return apiFetchJson<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchCurrentUser(token: string): Promise<UserPublic> {
  const res = await apiFetch('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    throw new Error('Invalid or expired token')
  }
  return res.json() as Promise<UserPublic>
}

export type PatchProfileBody = {
  display_name?: string
  avatar_config?: Record<string, unknown>
}

export async function patchProfile(token: string, body: PatchProfileBody): Promise<UserPublic> {
  return apiFetchJson<UserPublic>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
