<template>
  <WorkspaceWizardStep
    title="Do you want to enable SSO?"
    description="Allow logins through your OpenID identity provider."
  >
    <div class="flex flex-col max-w-md w-full items-center">
      <FormRadioGroup
        :model-value="selectedOption"
        :options="radioOptions"
        stack-options
        @update:model-value="(val) => (selectedOption = val)"
      />
      <div class="flex flex-col gap-3 w-full max-w-md mt-8">
        <FormButton
          color="primary"
          :disabled="!selectedOption"
          size="lg"
          full-width
          @click="onEnableClick"
        >
          Continue
        </FormButton>
        <FormButton color="subtle" size="lg" full-width @click.stop="goToPreviousStep">
          Back
        </FormButton>
      </div>
    </div>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { useMixpanel } from '~/lib/core/composables/mp'
import { FormRadioGroup } from '@speckle/ui-components'

const { goToNextStep, goToPreviousStep, state } = useWorkspacesWizard()
const mixpanel = useMixpanel()

const selectedOption = ref<string | undefined>(
  state.value.ssoEnabled === undefined
    ? undefined
    : state.value.ssoEnabled
    ? 'enabled'
    : 'disabled'
)

const radioOptions = computed(() => [
  {
    value: 'enabled',
    title: 'Yes',
    subtitle: 'Plus £20 / month',
    introduction:
      selectedOption.value === 'enabled'
        ? 'You can set up SSO later in the Security tab of workspace settings.'
        : undefined
  },
  {
    value: 'disabled',
    title: 'No, maybe later'
  }
])

const onEnableClick = () => {
  state.value.ssoEnabled = selectedOption.value === 'enabled'
  mixpanel.track('Workspace SSO Step Completed', {
    enabled: selectedOption.value === 'enabled'
  })
  goToNextStep()
}

onMounted(() => {
  mixpanel.track('Workspace SSO Step Viewed')
})

watch(selectedOption, (newVal) => {
  state.value.ssoEnabled = newVal === 'enabled'
})
</script>
