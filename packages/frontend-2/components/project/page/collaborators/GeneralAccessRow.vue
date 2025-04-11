<template>
  <div
    class="bg-foundation items-center gap-2 py-2.5 px-3 pl-3.5 border border-outline-3 rounded-lg flex"
  >
    <div class="flex flex-1 items-center gap-x-3.5">
      <WorkspaceAvatar :name="name || ''" :logo="logo" size="sm" />
      <p class="text-body-xs">Workspace members</p>
    </div>
    <ProjectPageTeamPermissionSelect
      v-if="canEdit"
      :model-value="generalAccessRole"
      :disabled-roles="[Roles.Stream.Contributor]"
      disabled-item-tooltip="The feature will be available soon"
      hide-owner
    />
    <div v-else class="flex items-center justify-end text-body-2xs">
      {{ roleSelectItems[generalAccessRole].title }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type StreamRoles, type MaybeNullOrUndefined, Roles } from '@speckle/shared'
import { roleSelectItems } from '~~/lib/projects/helpers/components'

defineProps<{
  name?: MaybeNullOrUndefined<string>
  logo?: MaybeNullOrUndefined<string>
  canEdit: boolean
}>()

const generalAccessRole = ref<StreamRoles>(Roles.Stream.Reviewer)
</script>
