import type { UserMembershipResponse } from '~/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildSearchParams(identifier: string): Record<string, string> {
  if (UUID_RE.test(identifier)) return { user_id: identifier }
  if (EMAIL_RE.test(identifier)) return { email: identifier }
  return { username: identifier }
}

export function useUserSearch() {
  async function findUser(identifier: string): Promise<UserMembershipResponse | null> {
    const trimmed = identifier.trim()
    const users = await $fetch<UserMembershipResponse[]>('/api/users', { params: buildSearchParams(trimmed) })
    return users?.[0] ?? null
  }

  return { findUser }
}
