<template>
  <LayoutSidebarMenuGroup
    title="Security"
    collapsible
    :icon="hasDomains ? 'edit' : 'add'"
    :icon-click="() => openSettingsDialog(SettingMenuKeys.Workspace.Security)"
    :icon-text="hasDomains ? 'Edit domains' : 'Add domain'"
  >
    <div class="text-body-2xs text-foreground-2 mt-2 px-4 pb-4">
      <template v-if="hasDomains">
        <div
          v-for="domain in workspaceInfo.domains"
          :key="domain.id"
          class="py-1 px-2 rounded-full border border-outline-3 max-w-max"
        >
          {{ domain.domain }}
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col gap-2">
          Verified domains not set.
          <FormButton
            color="outline"
            size="sm"
            @click="openSettingsDialog(SettingMenuKeys.Workspace.Security)"
          >
            Improve security
          </FormButton>
        </div>
      </template>
    </div>
  </LayoutSidebarMenuGroup>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import {
  type AvailableSettingsMenuKeys,
  SettingMenuKeys
} from '~/lib/settings/helpers/types'
import type { WorkspaceSidebar_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceSidebarSecurity_Workspace on Workspace {
    domains {
      id
      domain
    }
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceSidebar_WorkspaceFragment
}>()

const emit = defineEmits<{
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
}>()

const openSettingsDialog = (target: AvailableSettingsMenuKeys) => {
  emit('show-settings-dialog', target)
}

const hasDomains = computed(() => props.workspaceInfo.domains?.length)
</script>
