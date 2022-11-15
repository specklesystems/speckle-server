<template>
  <NuxtPage />
</template>
<script setup lang="ts">
import { LoginRoute } from '~~/lib/common/helpers/route'

/**
 * Marking all auth/* pages as guest only & ensuring `/auth` can't be accessed as a page
 * on its own
 */

definePageMeta({
  middleware: [
    'guest',
    (to) => {
      if (to.path === '/auth') {
        return LoginRoute
      }
    }
  ]
})
</script>
