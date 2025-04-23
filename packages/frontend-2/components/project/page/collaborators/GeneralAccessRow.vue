<template>
  <div
    class="bg-foundation items-center gap-2 py-2.5 px-3 pl-3.5 border border-outline-3 rounded-lg flex"
  >
    <div class="flex flex-1 items-center gap-x-3.5">
      <WorkspaceAvatar :name="name || ''" :logo="logo" size="sm" />
      <p class="text-body-xs">All workspace members</p>
    </div>
    <ProjectPageTeamAccessSelect v-if="canEdit" :model-value="generalAccessRole" />
    <div v-else class="flex items-center justify-end text-body-2xs">
      {{ accessSelectItems[generalAccessRole].title }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  AccessSelectItems,
  accessSelectItems
} from '~~/lib/projects/helpers/components'

defineProps<{
  name?: MaybeNullOrUndefined<string>
  logo?: MaybeNullOrUndefined<string>
  canEdit: boolean
}>()

const generalAccessRole = ref<AccessSelectItems>(AccessSelectItems.Reviewer)
</script>
