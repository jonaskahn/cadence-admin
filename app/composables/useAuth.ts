import type { AuthUser, OrgAccessResponse, OrgWithRoleResponse } from '~/types'

function mapOrgWithRoleToOrgAccess(org: OrgWithRoleResponse): OrgAccessResponse {
  return { org_id: org.org_id, org_name: org.name, role: org.role as OrgAccessResponse['role'] }
}

// useRequestFetch is required for cookie-forwarding during SSR
export const useAuth = () => {
  const router = useRouter()
  const apiFetch = useRequestFetch()

  const authUser = useState<AuthUser | null>('auth:user', () => null)
  const orgList = useState<OrgAccessResponse[]>('auth:orgs', () => [])
  const isSysAdmin = useState<boolean>('auth:is_sys_admin', () => false)
  const currentOrgId = useCookie<string | null>('cadence-org-id', { default: () => null })

  const currentOrg = computed<OrgAccessResponse | null>(() => {
    if (!currentOrgId.value) return null
    return orgList.value.find((o) => o.org_id === currentOrgId.value) ?? null
  })

  const isAuthenticated = computed(() => !!authUser.value)

  const isOrgAdmin = computed(() => currentOrg.value?.role === 'org_admin' || isSysAdmin.value)

  async function loadUserContext(username: string): Promise<void> {
    authUser.value = { username }
    await Promise.all([loadMe(), loadOrgs()])
    if (isSysAdmin.value) currentOrgId.value = null
  }

  async function login(username: string, password: string): Promise<boolean> {
    const response = await $fetch<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    if (response.token === '[set]') {
      await loadUserContext(username)
      return true
    }
    return false
  }

  async function logout(): Promise<void> {
    try {
      await $fetch('/api/auth/logout', { method: 'DELETE' })
    } catch {}
    authUser.value = null
    orgList.value = []
    isSysAdmin.value = false
    currentOrgId.value = null
    await router.push('/login')
  }

  async function loadMe(): Promise<void> {
    try {
      const me = await apiFetch<{ user_id: string; is_sys_admin: boolean; username?: string; display_name?: string | null }>('/api/me')
      isSysAdmin.value = me.is_sys_admin
      if (authUser.value) {
        if (me.username) authUser.value.username = me.username
        authUser.value.display_name = me.display_name
      }
    } catch {
      isSysAdmin.value = false
    }
  }

  async function loadOrgs(): Promise<OrgAccessResponse[]> {
    try {
      const orgs = await apiFetch<OrgWithRoleResponse[]>('/api/orgs')
      orgList.value = orgs.map(mapOrgWithRoleToOrgAccess)
      return orgList.value
    } catch {
      orgList.value = []
      return []
    }
  }

  function selectOrg(orgId: string): void {
    currentOrgId.value = orgId
    router.push('/dashboard')
  }

  async function restoreSession(): Promise<void> {
    if (authUser.value) return
    try {
      const [orgs, me] = await Promise.all([
        apiFetch<OrgWithRoleResponse[]>('/api/orgs'),
        apiFetch<{ user_id: string; is_sys_admin: boolean; username?: string; display_name?: string | null }>('/api/me')
      ])
      orgList.value = orgs.map(mapOrgWithRoleToOrgAccess)
      isSysAdmin.value = me.is_sys_admin
      authUser.value = { username: me.username ?? '', display_name: me.display_name }
    } catch {
      authUser.value = null
      orgList.value = []
      isSysAdmin.value = false
    }
  }

  return {
    authUser,
    orgList,
    currentOrg,
    currentOrgId,
    isAuthenticated,
    isSysAdmin,
    isOrgAdmin,
    login,
    logout,
    loadMe,
    loadOrgs,
    selectOrg,
    restoreSession
  }
}
