export default defineNuxtRouteMiddleware(() => {
  // Add response header that shows this is a FE2 request
  const { ssrContext } = useNuxtApp()
  if (ssrContext) {
    ssrContext.event.node.res.setHeader('x-speckle-frontend-2', 'true')
  }
})
