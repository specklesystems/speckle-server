<template>
  <WorkspaceWizardStep
    title="Invite teammates"
    description="Get the most of your workspace by inviting others."
  >
    <form
      class="flex flex-col gap-4 w-full md:max-w-lg items-center"
      @submit="onSubmit"
    >
      <div class="flex flex-col gap-2 w-full">
        <FormTextInput
          v-for="item in fields"
          :key="item.value.id"
          v-model="item.value.email"
          color="foundation"
          name="Email"
          size="lg"
          placeholder="Email address"
          show-clear
          full-width
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
import { nanoid } from 'nanoid'

interface InviteForm {
  fields: { id: string; email: string }[]
}

const { state, goToNextStep, goToPreviousStep } = useWorkspacesWizard()
const { handleSubmit } = useForm<InviteForm>({
  initialValues: {
    fields: state.value.invites
  }
})
const { push, fields } = useFieldArray<{ id: string; email: string }>('fields')

const nextButtonText = computed(() =>
  fields.value.filter((field) => !!field.value.email).length > 0 ? 'Continue' : 'Skip'
)

const onAddInvite = () => {
  push({
    id: nanoid(),
    email: ''
  })
}

const onSubmit = handleSubmit(() => {
  const validEmails = fields.value.map((field) => field.value)

  state.value.invites = validEmails
  goToNextStep()
})
</script>
