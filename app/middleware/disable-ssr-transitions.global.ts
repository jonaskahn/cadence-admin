/**
 * Disable page/layout transitions during SSR to avoid hydration mismatch.
 * The Transition component renders fragment comments on the server that don't
 * match the client's expected DOM structure.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    to.meta.pageTransition = false
    to.meta.layoutTransition = false
  }
})
