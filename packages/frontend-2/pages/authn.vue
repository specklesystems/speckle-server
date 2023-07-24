<template>
  <NuxtPage />
</template>
<script setup lang="ts">
import { loginRoute } from '~~/lib/common/helpers/route'

/**
 * Marking all auth/* pages as guest only & ensuring `/auth` can't be accessed as a page
 * on its own
 */

definePageMeta({
  layout: 'login-or-register',
  middleware: [
    'guest',
    () => {
      const { ssrContext } = useNuxtApp()
      if (ssrContext) {
        ssrContext.event.node.res.setHeader('x-frame-options', 'deny')
      }
    },
    (to) => {
      if (to.path === '/authn') {
        return loginRoute
      }
    }
  ]
})
</script>
