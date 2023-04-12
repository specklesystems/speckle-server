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
    (to) => {
      if (to.path === '/authn') {
        return loginRoute
      }
    }
  ]
})
</script>
