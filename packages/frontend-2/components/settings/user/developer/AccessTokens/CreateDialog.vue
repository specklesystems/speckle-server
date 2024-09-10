<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :buttons="dialogButtons">
    <template #header>Create token</template>
    <form @submit="onSubmit">
      <div class="flex flex-col gap-4 mb-2">
        <FormTextInput
          v-model="name"
          label="Name"
          help="A name to remember this token by. For example, the name of the script or application you're planning to use it in!"
          name="hookName"
          placeholder="Token name"
          color="foundation"
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
          help="It's good practice to limit the scopes of your token to the absolute minimum. For example, if your application or script will only read and write projects/streams, select just those scopes."
          :rules="[isItemSelected]"
          show-label
          :items="apiTokenScopes"
          mount-menu-on-body
          :label-id="badgesLabelId"
          :button-id="badgesButtonId"
          by="id"
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import {
  LayoutDialog,
  FormSelectBadges,
  type LayoutDialogButton
} from '@speckle/ui-components'
import type { TokenFormValues } from '~~/lib/developer-settings/helpers/types'
import { createAccessTokenMutation } from '~~/lib/developer-settings/graphql/mutations'
import { isItemSelected, isRequired } from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { useServerInfoScopes } from '~/lib/common/composables/serverInfo'

const emit = defineEmits<{
  (e: 'token-created', tokenId: string): void
}>()

const { scopes: allScopes } = useServerInfoScopes()
const { mutate: createToken } = useMutation(createAccessTokenMutation)
const { triggerNotification } = useGlobalToast()
const { handleSubmit } = useForm<TokenFormValues>()

const isOpen = defineModel<boolean>('open', { required: true })

const badgesLabelId = useId()
const badgesButtonId = useId()
const name = ref('')
const scopes = ref<typeof apiTokenScopes.value>([])

const apiTokenScopes = computed(() => {
  return Object.values(allScopes.value).map((value) => ({
    id: value.name,
    text: value.name
  }))
})

const onSubmit = handleSubmit(async (tokenFormValues) => {
  const result = await createToken({
    token: {
      name: name.value,
      scopes: tokenFormValues.scopes.map((t) => t.id)
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data?.apiTokenCreate) {
    isOpen.value = false
    resetFormFields()
    emit('token-created', result.data.apiTokenCreate)
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Webhook created',
      description: 'The webhook has been successfully created'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to create token',
      description: errorMessage
    })
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
    text: 'Create',
    props: {},
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
