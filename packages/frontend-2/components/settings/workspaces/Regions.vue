<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Regions" text="Manage your data residency" />
      <SettingsSectionHeader
        title="Default region"
        text="The default region will be used to store project data for new projects"
        subheading
      />
      <div class="pt-6">
        <SettingsWorkspacesRegionsSelect
          v-model="defaultRegion"
          show-label
          label="Default region"
          :items="availableRegions || []"
          :disabled="!availableRegions?.length || isLoading"
        />
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { useMutationLoading, useQuery } from '@vue/apollo-composable'
import { debounce } from 'lodash-es'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesRegionsSelect_ServerRegionItemFragment } from '~/lib/common/generated/gql/graphql'
import { settingsWorkspaceRegionsQuery } from '~/lib/settings/graphql/queries'
import { useSetDefaultWorkspaceRegion } from '~/lib/workspaces/composables/management'

graphql(`
  fragment SettingsWorkspacesRegions_Workspace on Workspace {
    id
    defaultRegion {
      id
      ...SettingsWorkspacesRegionsSelect_ServerRegionItem
    }
    availableRegions {
      id
      ...SettingsWorkspacesRegionsSelect_ServerRegionItem
    }
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

const isLoading = useMutationLoading()
const setDefaultWorkspaceRegion = useSetDefaultWorkspaceRegion()
const { result } = useQuery(settingsWorkspaceRegionsQuery, () => ({
  workspaceId: props.workspaceId
}))

const defaultRegion = ref<SettingsWorkspacesRegionsSelect_ServerRegionItemFragment>()
const availableRegions = computed(() => result.value?.workspace.availableRegions || [])

const saveDefaultRegion = async () => {
  const regionKey = defaultRegion.value?.key
  if (!regionKey) return
  if (regionKey === result.value?.workspace.defaultRegion?.key) return

  await setDefaultWorkspaceRegion({
    workspaceId: props.workspaceId,
    regionKey
  })
}

const debouncedSaveDefaultRegion = debounce(saveDefaultRegion, 1000)

watch(
  result,
  () => {
    defaultRegion.value = result.value?.workspace.defaultRegion || undefined
  },
  { immediate: true }
)

watch(defaultRegion, (newVal, oldVal) => {
  if (newVal === oldVal) return
  if (newVal?.id === oldVal?.id) return
  debouncedSaveDefaultRegion()
})
</script>
