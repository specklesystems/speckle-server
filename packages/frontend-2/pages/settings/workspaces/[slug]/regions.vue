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
          <div class="pt-14 flex flex-col space-y-4">
            <SettingsWorkspacesRegionsSelect
              v-model="defaultRegion"
              show-label
              label="Default region"
              :items="availableRegions || []"
              :disabled="
                !availableRegions?.length || isMutationLoading || !isWorkspaceAdmin
              "
              label-position="left"
            />
            <div class="w-full flex justify-end">
              <FormButton
                :disabled="!isWorkspaceAdmin || isMutationLoading || !defaultRegion"
                @click="onDefaultRegionSave"
              >
                Save
              </FormButton>
            </div>
          </div>
        </template>
        <div v-else class="flex flex-col gap-6">
          <div class="text-heading-lg">Current data region</div>
          <div class="px-6 py-4 border border-outline-3 rounded-lg flex flex-col">
            <div class="text-foreground text-body-xs font-semibold">
              {{ workspace.defaultRegion.name }}
            </div>
            <div
              v-if="workspace.defaultRegion.description"
              class="text-foreground-2 text-body-2xs font-normal"
            >
              {{ workspace.defaultRegion.description }}
            </div>
          </div>
          <hr class="border-outline-2" />
          <div class="text-heading-lg">Change data region</div>
          <div
            class="p-4 border border-outline-3 rounded-lg flex gap-3 flex-col md:flex-row md:items-center"
          >
            <div class="text-body-xs font-normal">
              Change your default data region and schedule a data residency move.
            </div>
            <span v-tippy="'Coming soon'" class="basis-full md:basis-auto">
              <FormButton color="outline" disabled full-width>
                Change data region
              </FormButton>
            </span>
          </div>
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
    <LayoutDialog
      v-if="defaultRegion"
      v-model:open="showDefaultRegionSaveDisclaimer"
      max-width="sm"
      title="Confirm region change"
      :buttons="saveDisclaimerButtons"
    >
      <!-- prettier-ignore -->
      <span>
        Confirm that you want to update your workspace's region to
        <span class="font-semibold">{{ defaultRegion.name }}</span>.
        This cannot be undone.
      </span>
      <template v-if="hasProjects">
        <br />
        <br />
        <CommonAlert color="warning">
          <template #description>
            Please note that existing projects in your workspace will not be moved to
            the new region as we currently do not support moving projects between
            regions. However, this will be supported soon and we will make sure to move
            over your projects.
          </template>
        </CommonAlert>
      </template>
    </LayoutDialog>
  </section>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutationLoading, useQuery, useQueryLoading } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesRegionsSelect_ServerRegionItemFragment } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { settingsWorkspaceRegionsQuery } from '~/lib/settings/graphql/queries'
import { useSetDefaultWorkspaceRegion } from '~/lib/workspaces/composables/management'

graphql(`
  fragment SettingsWorkspacesRegions_Workspace on Workspace {
    id
    role
    defaultRegion {
      id
      ...SettingsWorkspacesRegionsSelect_ServerRegionItem
    }
    hasAccessToMultiRegion: hasAccessToFeature(
      featureName: workspaceDataRegionSpecificity
    )
    hasProjects: projects(limit: 0) {
      totalCount
    }
  }
`)

graphql(`
  fragment SettingsWorkspacesRegions_ServerInfo on ServerInfo {
    multiRegion {
      regions {
        id
        ...SettingsWorkspacesRegionsSelect_ServerRegionItem
      }
    }
  }
`)

definePageMeta({
  middleware: ['auth'],
  layout: 'settings'
})

useHead({
  title: 'Settings - Regions'
})

const slug = computed(() => (route.params.slug as string) || '')

const route = useRoute()
const mp = useMixpanel()
const pageFetchPolicy = usePageQueryStandardFetchPolicy()
const isMutationLoading = useMutationLoading()
const isQueryLoading = useQueryLoading()
const setDefaultWorkspaceRegion = useSetDefaultWorkspaceRegion()
const { result } = useQuery(
  settingsWorkspaceRegionsQuery,
  () => ({
    slug: slug.value
  }),
  () => ({
    fetchPolicy: pageFetchPolicy.value
  })
)

const showDefaultRegionSaveDisclaimer = ref(false)
const defaultRegion = ref<SettingsWorkspacesRegionsSelect_ServerRegionItemFragment>()
const workspace = computed(() => result.value?.workspaceBySlug)
const availableRegions = computed(
  () => result.value?.serverInfo.multiRegion.regions || []
)
const isWorkspaceAdmin = computed(() => workspace.value?.role === Roles.Workspace.Admin)
const hasProjects = computed(() => (workspace.value?.hasProjects?.totalCount || 0) > 0)
const saveDisclaimerButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (showDefaultRegionSaveDisclaimer.value = false)
  },
  {
    text: 'Confirm',
    onClick: () => {
      saveDefaultRegion()
    }
  }
])

const onDefaultRegionSave = () => {
  showDefaultRegionSaveDisclaimer.value = true
}

const saveDefaultRegion = async () => {
  const regionKey = defaultRegion.value?.key
  if (!workspace.value) return
  if (!regionKey) return
  if (regionKey === workspace.value?.defaultRegion?.key) return

  const res = await setDefaultWorkspaceRegion({
    workspaceId: workspace.value?.id,
    regionKey
  })
  if (res?.defaultRegion?.id) {
    mp.track('Workspace Default Region Set', {
      regionKey,
      // eslint-disable-next-line camelcase
      workspace_id: workspace.value?.id
    })
    showDefaultRegionSaveDisclaimer.value = false
  }
}

const goToBilling = () => {
  // goToWorkspaceMenuItem(props.workspaceId, SettingMenuKeys.Workspace.Billing)
}

watch(
  result,
  () => {
    defaultRegion.value = workspace.value?.defaultRegion || undefined
  },
  { immediate: true }
)
</script>
