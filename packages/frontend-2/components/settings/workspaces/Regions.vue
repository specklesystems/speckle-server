<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Data residency"
        text="Manage where your workspace data resides."
      />
      <CommonLoadingIcon
        v-if="isQueryLoading || !workspace"
        class="justify-self-center"
      />
      <template v-else-if="workspace.hasAccessToMultiRegion">
        <template v-if="!workspace.defaultRegion">
          <div class="p-4 bg-foundation border-outline-2 border text-body-xs">
            The default region is the geographical boundary where your workspace's
            project data resides. Changing the default region means pinning your data to
            a new location. This change will affect only new projects created within
            your workspace.
          </div>
          <div class="pt-14">
            <SettingsWorkspacesRegionsSelect
              v-model="defaultRegion"
              show-label
              label="Default region"
              :items="availableRegions || []"
              :disabled="!availableRegions?.length || isMutationLoading"
            />
          </div>
        </template>
        <div v-else class="flex flex-col">
          <div class="text-heading-lg">Current data region</div>
          <div class="px-6 py-4 border border-outline-3 rounded-lg">Ayy!</div>
        </div>
      </template>
      <div
        v-else
        class="flex gap-2 flex-col md:flex-row md:items-center md:justify-between"
      >
        <div class="flex flex-col">
          <div class="text-heading-sm text-foreground">Enable Data Residency</div>
          <div class="text-body-2xs text-foreground-2">
            Control where your workspace data is hosted.
          </div>
        </div>
        <FormButton
          class="!max-w-none !md:max-w-max w-full md:w-auto"
          @click="goToBilling"
        >
          Upgrade to Business
        </FormButton>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { useMutationLoading, useQuery, useQueryLoading } from '@vue/apollo-composable'
import { debounce } from 'lodash-es'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesRegionsSelect_ServerRegionItemFragment } from '~/lib/common/generated/gql/graphql'
import { useMenuState } from '~/lib/settings/composables/menu'
import { settingsWorkspaceRegionsQuery } from '~/lib/settings/graphql/queries'
import { SettingMenuKeys } from '~/lib/settings/helpers/types'
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
    hasAccessToMultiRegion: hasAccessToFeature(
      featureName: workspaceDataRegionSpecificity
    )
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

const { goToWorkspaceMenuItem } = useMenuState()
const pageFetchPolicy = usePageQueryStandardFetchPolicy()
const isMutationLoading = useMutationLoading()
const isQueryLoading = useQueryLoading()
const setDefaultWorkspaceRegion = useSetDefaultWorkspaceRegion()
const { result } = useQuery(
  settingsWorkspaceRegionsQuery,
  () => ({
    workspaceId: props.workspaceId
  }),
  () => ({
    fetchPolicy: pageFetchPolicy.value
  })
)

const defaultRegion = ref<SettingsWorkspacesRegionsSelect_ServerRegionItemFragment>()
const workspace = computed(() => result.value?.workspace)
const availableRegions = computed(() => workspace.value?.availableRegions || [])

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

const goToBilling = () => {
  goToWorkspaceMenuItem(props.workspaceId, SettingMenuKeys.Workspace.Billing)
}

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
