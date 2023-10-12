<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Create Application"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
  >
    <form @submit="onSubmit">
      <div class="flex flex-col gap-6">
        <FormTextInput
          v-model="name"
          label="Name"
          help="The name of your app"
          name="hookName"
          show-label
          type="text"
        />
        <FormSelectBadges
          v-model="scopes"
          multiple
          name="scopes"
          label="Scopes"
          placeholder="Choose Scopes"
          help="xyz"
          show-required
          :rules="[isItemSelected]"
          show-label
          :items="applicationScopes"
          by="id"
        />
        <FormTextInput
          v-model="redirectUrl"
          label="Redirect URL"
          help="After authentication, the users will be redirected (together with an access token) to this URL."
          show-required
          name="redirectUrl"
          show-label
          type="text"
        />
        <FormTextInput
          v-model="description"
          label="Description"
          help="A short description of your application."
          show-required
          name="description"
          show-label
          type="text"
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { AllScopes } from '@speckle/shared'
import { LayoutDialog, FormSelectBadges } from '@speckle/ui-components'
import { ApplicationFormValues } from '~~/lib/developer-settings/helpers/types'
import { createApplicationMutation } from '~~/lib/developer-settings/graphql/mutations'
import { isItemSelected } from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

const emit = defineEmits<{
  (e: 'application-created'): void
}>()

const { mutate: createApplication } = useMutation(createApplicationMutation)
const { triggerNotification } = useGlobalToast()
const { handleSubmit } = useForm<ApplicationFormValues>()

const isOpen = defineModel<boolean>('open', { required: true })

const name = ref('')
const scopes = ref<typeof applicationScopes.value>([])
const redirectUrl = ref('')
const description = ref('')

const applicationScopes = computed(() => {
  return Object.values(AllScopes).map((value) => ({
    id: value,
    text: value
  }))
})

const onSubmit = handleSubmit(async (applicationFormValues) => {
  const result = await createApplication({
    app: {
      name: name.value,
      scopes: applicationFormValues.scopes.map((t) => t.id),
      redirectUrl: redirectUrl.value,
      description: description.value
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data?.appCreate) {
    isOpen.value = false
    resetFormFields()
    emit('application-created')
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Application created',
      description: 'The application has been successfully created'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to create application',
      description: errorMessage
    })
  }
})

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Create',
    props: { color: 'primary', fullWidth: true },
    onClick: onSubmit
  }
])

const resetFormFields = () => {
  name.value = ''
  scopes.value = []
}

watch(
  () => isOpen.value,
  (newVal) => {
    if (newVal) {
      resetFormFields()
    }
  }
)
</script>
