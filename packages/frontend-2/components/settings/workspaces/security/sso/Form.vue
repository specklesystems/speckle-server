<template>
  <form class="flex flex-col gap-2" @submit="onSubmit">
    <div class="flex flex-col gap-4">
      <FormTextInput
        v-model="formData.providerName"
        label="Provider"
        help="The label on the button displayed on the login screen."
        name="providerName"
        color="foundation"
        show-label
        label-position="left"
        :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
        type="text"
      />
      <hr class="border-outline-3" />
      <FormTextInput
        v-model="formData.clientId"
        label="Client ID"
        name="clientId"
        color="foundation"
        show-label
        label-position="left"
        :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
        type="text"
      />
      <hr class="border-outline-3" />
      <FormTextInput
        v-model="formData.clientSecret"
        label="Client secret"
        name="clientSecret"
        color="foundation"
        show-label
        label-position="left"
        type="text"
        :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
      />
      <hr class="border-outline-3" />
      <FormTextInput
        v-model="formData.issuerUrl"
        label="Discovery URL"
        name="issuerUrl"
        color="foundation"
        show-label
        label-position="left"
        type="text"
        :rules="[isRequired, isUrl, isStringOfLength({ minLength: 5 })]"
      />
      <div class="flex gap-2 mt-4">
        <FormButton :disabled="!challenge" color="primary" type="submit">
          Save
        </FormButton>
        <FormButton v-if="formData.clientId" color="outline" @click="$emit('cancel')">
          Cancel
        </FormButton>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isRequired, isStringOfLength, isUrl } from '~~/lib/common/helpers/validation'
import { useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'
import { usePostAuthRedirect } from '~/lib/auth/composables/postAuthRedirect'
import type { SsoFormValues } from '~/lib/workspaces/helpers/types'

const props = defineProps<{
  initialData?: SsoFormValues
  workspaceSlug: string
}>()

defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', data: SsoFormValues): void
}>()

const logger = useLogger()
const apiOrigin = useApiOrigin()
const postAuthRedirect = usePostAuthRedirect()
const { challenge } = useLoginOrRegisterUtils()

const formData = ref<SsoFormValues>({
  providerName: props.initialData?.providerName ?? '',
  clientId: props.initialData?.clientId ?? '',
  clientSecret: props.initialData?.clientSecret ?? '',
  issuerUrl: props.initialData?.issuerUrl ?? ''
})

const { handleSubmit } = useForm<SsoFormValues>()

const handleCreate = () => {
  const baseUrl = `${apiOrigin}/api/v1/workspaces/${props.workspaceSlug}/sso/oidc/validate`
  const params = [
    `providerName=${formData.value.providerName}`,
    `clientId=${formData.value.clientId}`,
    `clientSecret=${formData.value.clientSecret}`,
    `issuerUrl=${formData.value.issuerUrl}`,
    `challenge=${challenge.value}`
  ]
  const route = `${baseUrl}?${params.join('&')}`

  postAuthRedirect.set(`/workspaces/${props.workspaceSlug}?settings=server/general`)

  navigateTo(route, {
    external: true
  })
}

const handleEdit = () => {
  // TODO: API endpoint for editing SSO configuration is pending
  // Will need:
  // - Update provider name
  // - Update client ID
  // - Optional client secret update
  // - Update issuer URL
  logger.warn('Editing SSO configuration is not yet implemented')
}

const onSubmit = handleSubmit(() => {
  if (props.initialData) {
    handleEdit()
  } else {
    handleCreate()
  }
})
</script>
