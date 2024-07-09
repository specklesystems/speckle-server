export default defineNuxtRouteMiddleware((to) => {
  // Add response header that shows this is a FE2 request
  const { ssrContext } = useNuxtApp()

  if (ssrContext) {
    ssrContext.event.node.res.setHeader('x-speckle-frontend-2', 'true')

    // Check if the route is not an possible embedded route
    // If not add the header to prevent click highjacking
    const embeddedRoutePattern = /^\/projects\/([^/]+)\/models\/([^/]+)$/

    if (!embeddedRoutePattern.test(to.path)) {
      ssrContext.event.node.res.setHeader(
        'Content-Security-Policy',
        'frame-ancestors "none"'
      )
    }
  }
})
