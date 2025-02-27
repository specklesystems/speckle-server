<template>
  <WorkspaceWizardStep
    title="Do you want to enable data residency?"
    description="Manage where your workspace data resides."
  >
    <form class="flex flex-col gap-4 w-full max-w-md" @submit.prevent="onSubmit">
      <CommonLoadingIcon v-if="isQueryLoading" class="justify-self-center" />
      <template v-else>
        <FormRadioGroup v-model="selectedOption" :options="radioOptions" is-stacked>
          <template #enabled>
            <div v-show="selectedOption === 'enabled'" class="pt-2">
              <SettingsWorkspacesRegionsSelect
                v-model="defaultRegion"
                label="Default region"
                :items="availableRegions || []"
                label-position="top"
                size="lg"
              />
            </div>
          </template>
        </FormRadioGroup>
        <div class="flex flex-col gap-3 mt-4 w-full">
          <FormButton size="lg" full-width :disabled="!canContinue" @click="onSubmit">
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

const { goToNextStep, goToPreviousStep, state } = useWorkspacesWizard()
const isQueryLoading = useQueryLoading()
const { result } = useQuery(workspaceWizardRegionQuery)
const mixpanel = useMixpanel()

const selectedOption = ref<string | undefined>(
  state.value.region === undefined
    ? undefined
    : state.value.region
    ? 'enabled'
    : 'disabled'
)

const radioOptions = computed(() => [
  {
    value: 'enabled',
    title: 'Yes',
    subtitle: 'Plus £20 / month'
  },
  {
    value: 'disabled',
    title: 'No, maybe later'
  }
])

const availableRegions = computed(
  () => result.value?.serverInfo.multiRegion.regions || []
)

const canContinue = computed(() => {
  if (!selectedOption.value) return false
  if (selectedOption.value === 'disabled') return true
  return !!defaultRegion.value
})

const onSubmit = () => {
  if (!defaultRegion.value) return
  state.value.region = defaultRegion.value

  mixpanel.track('Workspace Region Step Completed', {
    region: defaultRegion.value.id
  })

  goToNextStep()
}

watch(selectedOption, (newVal) => {
  if (newVal === 'disabled') {
    state.value.region = null
  }
})

watch(
  () => defaultRegion.value,
  (newVal) => {
    state.value.region = newVal || null
  }
)

onMounted(() => {
  mixpanel.track('Workspace Region Step Viewed')
})
</script>
