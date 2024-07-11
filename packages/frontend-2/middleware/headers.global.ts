export default defineNuxtRouteMiddleware((to) => {
  const { ssrContext } = useNuxtApp()

  if (ssrContext) {
    // Add response header that shows this is a FE2 request
    ssrContext.event.node.res.setHeader('x-speckle-frontend-2', 'true')

    // Check if the route is not an possible embedded route
    // If not add the header to prevent click highjacking
    if (to.name !== 'model-viewer') {
      ssrContext.event.node.res.setHeader(
        'Content-Security-Policy',
        "frame-ancestors 'none'"
      )
    }
  }
})
