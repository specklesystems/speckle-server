<template>
  <WorkspaceWizardStep
    title="Set your data location"
    description="Manage where your new workspace data resides."
  >
    <form class="flex flex-col gap-4 w-full md:w-96" @submit="onSubmit">
      <CommonLoadingIcon v-if="isQueryLoading" class="justify-self-center" />
      <template v-else>
        <SettingsWorkspacesRegionsSelect
          v-model="defaultRegion"
          show-label
          label="Default region"
          :items="availableRegions || []"
          label-position="top"
          size="lg"
        />
        <div class="flex flex-col gap-3 mt-4 w-full">
          <FormButton :disabled="!hasDefaultRegion" size="lg" full-width submit>
            Continue
          </FormButton>
          <FormButton
            color="subtle"
            size="lg"
            full-width
            @click.stop="goToPreviousStep"
          >
            Back
          </FormButton>
        </div>
      </template>
    </form>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { graphql } from '~/lib/common/generated/gql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { workspaceWizardRegionQuery } from '~/lib/workspaces/graphql/queries'
import type { SettingsWorkspacesRegionsSelect_ServerRegionItemFragment } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'

graphql(`
  fragment WorkspaceWizardStepRegion_ServerInfo on ServerInfo {
    multiRegion {
      regions {
        id
        ...SettingsWorkspacesRegionsSelect_ServerRegionItem
      }
    }
  }
`)

// TODO: This is a settings component, we should abstract it
const defaultRegion = ref<SettingsWorkspacesRegionsSelect_ServerRegionItemFragment>()

const { state, goToNextStep, goToPreviousStep } = useWorkspacesWizard()
const isQueryLoading = useQueryLoading()
const { result } = useQuery(workspaceWizardRegionQuery)
const mixpanel = useMixpanel()

const hasDefaultRegion = computed(() => !!defaultRegion.value)
const availableRegions = computed(
  () => result.value?.serverInfo.multiRegion.regions || []
)

const onSubmit = () => {
  if (!defaultRegion.value) return
  state.value.region = defaultRegion.value

  mixpanel.track('Workspace Region Step Completed', {
    region: defaultRegion.value.id
  })

  goToNextStep()
}

watch(
  () => state.value.region,
  () => {
    defaultRegion.value = state.value
      .region as SettingsWorkspacesRegionsSelect_ServerRegionItemFragment
  },
  { immediate: true }
)
</script>
