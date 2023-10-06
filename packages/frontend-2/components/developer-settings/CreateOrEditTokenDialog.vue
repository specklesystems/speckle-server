<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :title="props.token ? 'Edit Token' : 'Create Token'"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
  >
    <form @submit="onSubmit">
      <div class="flex flex-col gap-6">
        <FormTextInput
          v-model="name"
          label="Name"
          help="A name to remember this token by. For example, the name of the script or application you're planning to use it in!"
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
          help="It's good practice to limit the scopes of your token to the absolute minimum. For example, if your application or script will only read and write streams, select just those scopes."
          show-required
          :rules="[isItemSelected]"
          show-label
          :items="apiTokenScopes"
          by="id"
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { Scopes } from '@speckle/shared'
import { LayoutDialog, FormSelectBadges } from '@speckle/ui-components'
import { TokenItem, TokenFormValues } from '~~/lib/developer-settings/helpers/types'
import {
  updateAccessTokenMutation,
  createAccessTokenMutation
} from '~~/lib/developer-settings/graphql/mutations'
import { isItemSelected, fullyResetForm } from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

const props = defineProps<{
  token?: TokenItem | null
}>()

const emit = defineEmits<{
  (e: 'token-created'): void
}>()

const { mutate: updateMutation } = useMutation(updateAccessTokenMutation)
const { mutate: createToken } = useMutation(createAccessTokenMutation)
const { triggerNotification } = useGlobalToast()
const { handleSubmit, resetForm } = useForm<TokenFormValues>()

const isOpen = defineModel<boolean>('open', { required: true })

const name = ref('')
const scopes = ref<typeof apiTokenScopes.value>([])

const apiTokenScopes = computed(() => {
  return Object.values(Scopes).map((value) => ({
    id: value,
    text: value
  }))
})

const onSubmit = handleSubmit(async (tokenFormValues) => {
  if (props.token) {
    const tokenId = props.token.id
    const result = await updateMutation(
      {
        user: {
          name: name.value
        }
      },
      {
        update: (cache, { data }) => {
          if (data?.activeUserMutations.update.apiTokens) {
            cache.modify({
              id: getCacheId('Webhook', tokenId),
              fields: {
                name: () => tokenFormValues.name,
                scopes: () => scopes
              }
            })
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data?.activeUserMutations) {
      isOpen.value = false
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Webhook updated',
        description: 'The webhook has been successfully updated'
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update webhook',
        description: errorMessage
      })
    }
  } else {
    const result = await createToken({
      token: {
        name: name.value,
        scopes: tokenFormValues.scopes.map((t) => t.id)
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data?.apiTokenCreate) {
      isOpen.value = false
      emit('token-created')
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
  }
})

watch(
  () => isOpen.value,
  (newVal, oldVal) => {
    if (!(newVal && !oldVal)) return

    // Only run on open
    // Reset vee-validate form initialValues to prevent inheriting previous dialog values
    fullyResetForm(resetForm)

    // Explicitly reset values
    // resetTokenModel()
  }
)

// const resetTokenModel = () => {
//   name.value = props.token?.name || ''
//   scopes.value = ((props.token?.scopes || []) as Array<ValueOf<typeof Scopes>>)
//     .filter((i): i is ValueOf<typeof Scopes> =>
//       Object.values(Scopes).includes(i as ValueOf<typeof Scopes>)
//     )
//     .map((i) => ({
//       id: i,
//       text: i
//     }))
// }

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: props.token ? 'Save' : 'Create',
    props: { color: 'primary', fullWidth: true },
    onClick: onSubmit
  }
])
</script>
