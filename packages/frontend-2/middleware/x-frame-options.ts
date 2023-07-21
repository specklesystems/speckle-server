export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/authn')) {
    const { ssrContext } = useNuxtApp()
    if (ssrContext) {
      ssrContext.event.node.res.setHeader('x-frame-options', 'deny')
    }
  }
})
