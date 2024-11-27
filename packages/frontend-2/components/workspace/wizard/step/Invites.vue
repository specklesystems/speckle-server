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
          v-for="invite in invites"
          :key="invite.id"
          v-model="invite.email"
          color="foundation"
          name="email"
          size="lg"
          placeholder="Email address"
          show-clear
          full-width
          :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
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
import { nanoid } from 'nanoid'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'

const { input, goToNextStep, goToPreviousStep } = useWorkspacesWizard()

const { invites } = toRefs(input)

const nextButtonText = computed(() => (invites.value.length > 0 ? 'Continue' : 'Skip'))

const onAddInvite = () => {
  invites.value.push({
    id: nanoid(),
    email: ''
  })
}

const onSubmit = () => {
  goToNextStep()
}
</script>
