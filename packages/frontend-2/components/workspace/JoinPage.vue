<template>
  <HeaderWithEmptyPage empty-header>
    <template #header-left>
      <HeaderLogoBlock :active="false" class="min-w-40 cursor-pointer" no-link />
    </template>
    <template #header-right>
      <FormButton
        size="sm"
        color="outline"
        @click="() => logout({ skipRedirect: false })"
      >
        Sign out
      </FormButton>
    </template>

    <WorkspaceDiscoverableWorkspacesPage />
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { useAuthManager } from '~/lib/auth/composables/auth'

const { logout } = useAuthManager()
</script>
