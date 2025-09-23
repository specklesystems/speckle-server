<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="flex items-center relative">
    <FormButton
      color="outline"
      class="hidden sm:flex"
      size="sm"
      @click="shareDialogOpen = true"
    >
      Share
    </FormButton>
    <DashboardsShareDialog
      v-model:open="shareDialogOpen"
      :workspace-slug="workspaceSlug"
      :dashboard-id="id"
    />
  </div>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'

defineProps<{
  id: MaybeNullOrUndefined<string>
  workspaceSlug: MaybeNullOrUndefined<string>
}>()

const shareDialogOpen = ref(false)
</script>
