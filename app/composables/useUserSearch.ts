import type { UserMembershipResponse } from '~/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Composable for finding platform users by email, username, or user ID.
 *
 * The backend enforces access rules:
 * - Sys-admin: can find any user including other sys-admins.
 * - Org-admin: cannot find sys-admin accounts (filtered server-side).
 */
export function useUserSearch() {
  /**
   * Finds a user by exact match on email, username, or user ID.
   * Returns null when no match is found.
   * Throws on API errors.
   */
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
