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

type Auth = ReturnType<typeof useAuth>

function handleAuthenticatedRedirect(auth: Auth) {
  if (!auth.isAuthenticated.value) return
  if (auth.currentOrgId.value) return navigateTo(DASHBOARD_PATH)
  if (auth.isSysAdmin.value) return navigateTo(ADMIN_PATH)
  return navigateTo(ORG_SELECT_PATH)
}

function handleAdminRoute(auth: Auth) {
  if (!auth.isSysAdmin.value) return navigateTo(DASHBOARD_PATH)
}

async function handleOrgRequiredRoute(auth: Auth) {
  if (auth.currentOrgId.value) return
  if (auth.isSysAdmin.value) {
    if (auth.orgList.value.length === 0) await auth.loadOrgs()
    if (auth.orgList.value.length === 0) return navigateTo(ADMIN_PATH)
  }
  return navigateTo(ORG_SELECT_PATH)
}

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()

  if (isPublicRoute(to.path)) return handleAuthenticatedRedirect(auth)

  if (!auth.isAuthenticated.value) await auth.restoreSession()
  if (!auth.isAuthenticated.value) return navigateTo(LOGIN_PATH)

  if (isOrgSelectRoute(to.path)) return
  if (isAdminRoute(to.path)) return handleAdminRoute(auth)
  return handleOrgRequiredRoute(auth)
})
