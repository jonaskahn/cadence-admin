export * from './api'

export type UserRole = 'sys_admin' | 'org_admin' | 'user'

export interface OrgContext {
  org_id: string
  org_name: string
  role: UserRole
}

export interface AuthUser {
  username: string
  user_id?: string
}
