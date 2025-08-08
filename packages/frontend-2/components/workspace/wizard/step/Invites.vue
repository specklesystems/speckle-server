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
          @blur="field.value = field.value?.trim()"
        />
        <div>
          <FormButton color="subtle" :icon-left="Plus" @click="onAddInvite">
            Add another
          </FormButton>
        </div>
      </div>
      <div v-if="verifiedDomain" class="flex flex-col gap-2 w-full">
        <CommonCard class="flex flex-col gap-1 !p-3">
          <FormCheckbox
            v-model="enableDomainDiscoverabilityModel"
            name="enableDomainDiscoverability"
            :label="`Make workspace discoverable to @${verifiedDomain} users`"
          />
          <div class="ml-6 text-body-2xs text-foreground-2 select-none">
            <p>
              Users signing up with a
              <span class="font-medium">@{{ verifiedDomain }}</span>
              email will be able to find and request to join this workspace.
            </p>
          </div>
        </CommonCard>
      </div>
      <div class="flex flex-col gap-3 mt-4 w-full md:max-w-96">
        <FormButton size="lg" submit full-width>{{ nextButtonText }}</FormButton>
        <FormButton color="subtle" size="lg" full-width @click.stop="goToPreviousStep">
          Back
        </FormButton>
      </div>
    </form>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { Plus } from 'lucide-vue-next'
import { isEmailOrEmpty } from '~~/lib/common/helpers/validation'
import { useForm, useFieldArray } from 'vee-validate'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useVerifiedUserEmailDomains } from '~/lib/workspaces/composables/security'
import { isUndefined } from 'lodash-es'

interface InviteForm {
  fields: string[]
}

const { domains } = useVerifiedUserEmailDomains()
const { goToNextStep, goToPreviousStep, state } = useWorkspacesWizard()
const mixpanel = useMixpanel()
const { handleSubmit } = useForm<InviteForm>({
  initialValues: {
    fields: state.value.invites
  }
})
const { fields, push } = useFieldArray<string>('fields')

const enableDomainDiscoverabilityModel = computed({
  get() {
    if (!verifiedDomain.value) return false

    return !isUndefined(state.value.enableDomainDiscoverabilityForDomain)
      ? state.value.enableDomainDiscoverabilityForDomain !== null
        ? true
        : undefined
      : true
  },
  set(value: boolean) {
    if (value && verifiedDomain.value) {
      state.value.enableDomainDiscoverabilityForDomain = verifiedDomain.value
    } else {
      state.value.enableDomainDiscoverabilityForDomain = undefined
    }
  }
})

const nextButtonText = computed(() =>
  fields.value.filter((field) => !!field.value).length > 0
    ? 'Continue'
    : 'Continue without inviting'
)

const verifiedDomain = computed(() => {
  // only support enabling domain discoverability if there's one verified unblocked domain
  if (domains.value.length === 0) return undefined
  return domains.value[0]
})

const onAddInvite = () => {
  push('')
}

const onSubmit = handleSubmit(() => {
  const validInvites = fields.value
    .filter((field) => !!field)
    .map((field) => field.value)

  state.value.invites = validInvites

  if (enableDomainDiscoverabilityModel.value && verifiedDomain.value) {
    state.value.enableDomainDiscoverabilityForDomain = verifiedDomain.value
  } else {
    state.value.enableDomainDiscoverabilityForDomain = null
  }

  mixpanel.track('Workspace Invites Step Completed', {
    inviteCount: validInvites
  })

  goToNextStep()
})

onMounted(() => {
  mixpanel.track('Workspace Invites Step Viewed')
})
</script>
