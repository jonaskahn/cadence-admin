const PUBLIC_ROUTES = new Set(['/login'])
const ORG_SELECT_PATH = '/org-select'
const DASHBOARD_PATH = '/dashboard'
const LOGIN_PATH = '/login'
const ADMIN_PATH_PREFIX = '/admin'

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.has(path)
}

function isOrgSelectRoute(path: string): boolean {
  return path === ORG_SELECT_PATH
}

function isAdminRoute(path: string): boolean {
  return path.startsWith(ADMIN_PATH_PREFIX)
}

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()

  if (isPublicRoute(to.path)) {
    if (auth.isAuthenticated.value) {
      return navigateTo(auth.currentOrgId.value ? DASHBOARD_PATH : ORG_SELECT_PATH)
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
    if (auth.orgList.value.length === 0) {
      await auth.loadOrgs()
    }
    if (auth.orgList.value.length === 1) {
      auth.currentOrgId.value = auth.orgList.value[0]!.org_id
    } else {
      return navigateTo(ORG_SELECT_PATH)
    }
  }
})
