const PUBLIC_ROUTES = new Set(['/login'])
const ORG_SELECT_PATH = '/org-select'
const DASHBOARD_PATH = '/dashboard'
const LOGIN_PATH = '/login'
const ADMIN_PATH = '/admin/orgs'

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.has(path)
}

function isOrgSelectRoute(path: string): boolean {
  return path === ORG_SELECT_PATH
}

function isAdminRoute(path: string): boolean {
  return path.startsWith('/admin')
}

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()

  if (isPublicRoute(to.path)) {
    if (auth.isAuthenticated.value) {
      if (auth.currentOrgId.value) return navigateTo(DASHBOARD_PATH)
      if (auth.isSysAdmin.value) return navigateTo(ADMIN_PATH)
      return navigateTo(ORG_SELECT_PATH)
    }
    return
  }

  if (!auth.isAuthenticated.value) {
    await auth.restoreSession()
  }

  if (!auth.isAuthenticated.value) {
    return navigateTo(LOGIN_PATH)
  }

  if (isOrgSelectRoute(to.path)) {
    return
  }

  if (isAdminRoute(to.path)) {
    if (!auth.isSysAdmin.value) {
      return navigateTo(DASHBOARD_PATH)
    }
    return
  }

  if (!auth.currentOrgId.value) {
    if (auth.isSysAdmin.value) {
      return navigateTo(ADMIN_PATH)
    }
    if (auth.orgList.value.length === 0) {
      await auth.loadOrgs()
    }
    if (auth.orgList.value.length === 1) {
      const singleOrg = auth.orgList.value[0]
      if (singleOrg) auth.currentOrgId.value = singleOrg.org_id
    } else {
      return navigateTo(ORG_SELECT_PATH)
    }
  }
})
