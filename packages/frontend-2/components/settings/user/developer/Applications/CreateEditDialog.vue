<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :buttons="dialogButtons">
    <template #header>
      {{ props.application ? 'Edit application' : 'Create application' }}
    </template>
    <form @submit="onSubmit">
      <div class="flex flex-col gap-3 mb-2">
        <FormTextInput
          v-model="name"
          label="Name"
          help="The name of your app"
          color="foundation"
          name="hookName"
          :rules="[isRequired]"
          show-label
          type="text"
        />
        <FormSelectBadges
          v-model="scopes"
          multiple
          name="scopes"
          label="Scopes"
          placeholder="Choose Scopes"
          help="It's good practice to limit the scopes of your token to the absolute minimum."
          :rules="[isItemSelected]"
          show-label
          :items="applicationScopes"
          :label-id="badgesLabelId"
          :button-id="badgesButtonId"
          by="id"
        />
        <FormTextInput
          v-model="redirectUrl"
          label="Redirect URL"
          help="After authentication, the users will be redirected (together with an access token) to this URL."
          name="redirectUrl"
          color="foundation"
          show-label
          :rules="[isRequired, isUrl]"
          type="text"
        />
        <FormTextInput
          v-model="description"
          label="Description"
          color="foundation"
          help="A short description of your application."
          name="description"
          show-label
          show-optional
          type="text"
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import type { AllScopes } from '@speckle/shared'
import {
  LayoutDialog,
  FormSelectBadges,
  type LayoutDialogButton
} from '@speckle/ui-components'
import type {
  ApplicationFormValues,
  ApplicationItem
} from '~~/lib/developer-settings/helpers/types'
import {
  createApplicationMutation,
  editApplicationMutation
} from '~~/lib/developer-settings/graphql/mutations'
import {
  isItemSelected,
  isRequired,
  isUrl,
  fullyResetForm
} from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { useServerInfoScopes } from '~~/lib/common/composables/serverInfo'

const props = defineProps<{
  application?: ApplicationItem
}>()

const emit = defineEmits<{
  (e: 'application-created', applicationId: string): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { scopes: allScopes } = useServerInfoScopes()
const { mutate: createApplication } = useMutation(createApplicationMutation)
const { mutate: editApplication } = useMutation(editApplicationMutation)
const { triggerNotification } = useGlobalToast()
const { handleSubmit, resetForm } = useForm<ApplicationFormValues>()

const badgesLabelId = useId()
const badgesButtonId = useId()
const name = ref('')
const scopes = ref<typeof applicationScopes.value>([])
const redirectUrl = ref('')
const description = ref('')

const applicationScopes = computed(() => {
  return Object.values(allScopes.value).map((value) => ({
    id: value.name,
    text: value.name
  }))
})

const onSubmit = handleSubmit(async (applicationFormValues) => {
  const applicationId = props.application?.id

  if (props.application) {
    const usedScopeIds = applicationFormValues.scopes.map((t) => t.id)
    const result = await editApplication(
      {
        app: {
          id: props.application.id,
          name: name.value,
          scopes: applicationFormValues.scopes.map((t) => t.id),
          redirectUrl: redirectUrl.value,
          description: description.value
        }
      },
      {
        update: (cache, { data }) => {
          if (applicationId && data?.appUpdate) {
            cache.modify({
              id: getCacheId('ServerApp', applicationId),
              fields: {
                redirectUrl: () => applicationFormValues.redirectUrl,
                description: () => description.value || '',
                scopes: () =>
                  allScopes.value.filter((t) => usedScopeIds.includes(t.name)),
                name: () => name.value
              }
            })
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data?.appUpdate) {
      isOpen.value = false
      resetFormFields()
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Application updated',
        description: 'The application has been successfully updated'
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update application',
        description: errorMessage
      })
    }
  } else {
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
      emit('application-created', result.data.appCreate)
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
  }
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: props.application ? 'Save' : 'Create',
    props: {},
    onClick: onSubmit
  }
])

const resetApplicationModel = () => {
  if (props.application) {
    name.value = props.application.name
    scopes.value = (props.application.scopes || []).map((scope) => ({
      id: scope.name as (typeof AllScopes)[number],
      text: scope.name as (typeof AllScopes)[number]
    }))
    redirectUrl.value = props.application.redirectUrl
    description.value = props.application.description || ''
  } else {
    resetFormFields()
  }
}

const resetFormFields = () => {
  name.value = ''
  scopes.value = []
  redirectUrl.value = ''
  description.value = ''
  fullyResetForm(resetForm)
}

watch(
  () => isOpen.value,
  (newVal) => {
    if (newVal) {
      resetApplicationModel()
    }
  }
)
</script>
