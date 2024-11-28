<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="workspacesRoute" name="Workspaces" :separator="false" />
    </Portal>
    <WorkspacesPromoPage />
  </div>
</template>
<script setup lang="ts">
import { workspacesRoute } from '~/lib/common/helpers/route'

definePageMeta({
  middleware: ['requires-workspaces-enabled', 'auth']
})
useHead({
  title: 'Workspaces'
})
</script>
