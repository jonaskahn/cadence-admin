import type { UserMembershipResponse } from '~/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Backend access rules: sys-admin can find any user; org-admin cannot find sys-admins (filtered server-side)
export function useUserSearch() {
  async function findUser(identifier: string): Promise<UserMembershipResponse | null> {
    const trimmed = identifier.trim()

    const params: Record<string, string> = UUID_RE.test(trimmed)
      ? { user_id: trimmed }
      : EMAIL_RE.test(trimmed)
        ? { email: trimmed }
        : { username: trimmed }

    const users = await $fetch<UserMembershipResponse[]>('/api/users', { params })

    return users?.length ? users[0] : null
  }

  return { findUser }
}
