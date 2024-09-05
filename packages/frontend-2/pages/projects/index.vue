<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="projectsRoute" name="Projects" :separator="false" />
    </Portal>
    <ProjectsDashboard v-if="isLoggedIn" />
    <div v-else class="mx-auto">
      <CommonLoadingIcon />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { projectsRoute } from '~/lib/common/helpers/route'

useHead({
  title: 'Projects'
})

definePageMeta({
  middleware: ['auth']
})

const { isLoggedIn } = useActiveUser()
</script>
