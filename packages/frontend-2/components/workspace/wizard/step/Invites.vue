<template>
  <WorkspaceWizardStep
    title="Invite your team"
    description="Workspaces are made for collaboration"
  >
    <form
      class="flex flex-col gap-4 w-full md:max-w-lg items-center"
      @submit="onSubmit"
    >
      <div class="flex flex-col gap-2 w-full">
        <FormTextInput
          v-for="field in fields"
          :key="field.key"
          v-model="field.value"
          :name="`email-${field.key}`"
          color="foundation"
          size="lg"
          placeholder="Email address"
          show-clear
          full-width
          use-label-in-errors
          label="Email"
          :rules="[isEmailOrEmpty]"
        />
        <div>
          <FormButton color="subtle" :icon-left="PlusIcon" @click="onAddInvite">
            Add another
          </FormButton>
        </div>
      </div>

      <div class="flex flex-col gap-3 mt-4 w-full md:max-w-96">
        <FormButton size="lg" submit full-width>
          {{ nextButtonText }}
        </FormButton>
        <FormButton color="subtle" size="lg" full-width @click.stop="goToPreviousStep">
          Back
        </FormButton>
      </div>
    </form>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { isEmailOrEmpty } from '~~/lib/common/helpers/validation'
import { useForm, useFieldArray } from 'vee-validate'
import { useMixpanel } from '~/lib/core/composables/mp'

interface InviteForm {
  fields: string[]
}

const { goToNextStep, goToPreviousStep, state } = useWorkspacesWizard()
const mixpanel = useMixpanel()
const { handleSubmit } = useForm<InviteForm>({
  initialValues: {
    fields: state.value.invites
  }
})
const { fields, push } = useFieldArray<string>('fields')

const nextButtonText = computed(() =>
  fields.value.filter((field) => !!field.value).length > 0 ? 'Continue' : 'Skip'
)

const onAddInvite = () => {
  push('')
}

const onSubmit = handleSubmit(() => {
  const validInvites = fields.value
    .filter((field) => !!field)
    .map((field) => field.value)

  state.value.invites = validInvites

  mixpanel.track('Workspace Invites Step Completed', {
    inviteCount: validInvites
  })

  goToNextStep()
})
</script>
