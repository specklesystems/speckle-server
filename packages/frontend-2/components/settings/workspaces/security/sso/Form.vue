<template>
  <form class="flex flex-col gap-2" @submit="onSubmit">
    <div class="flex flex-col gap-4">
      <FormTextInput
        v-model="formData.providerName"
        label="Provider name"
        help="The label on the button displayed on the login screen."
        name="providerName"
        color="foundation"
        show-label
        label-position="left"
        placeholder="Google"
        :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
        type="text"
      />
      <hr class="border-outline-3" />
      <FormTextInput
        v-model="formData.clientId"
        help="Client ID of your OpenID application."
        label="Client ID"
        name="clientId"
        color="foundation"
        show-label
        label-position="left"
        placeholder="1234567890"
        :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
        type="text"
      />
      <hr class="border-outline-3" />
      <FormTextInput
        v-model="formData.clientSecret"
        label="Client secret"
        name="clientSecret"
        help="Client secret provided by your OpenID provider."
        color="foundation"
        show-label
        label-position="left"
        type="text"
        placeholder="1234567890"
        :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
      />
      <hr class="border-outline-3" />
      <FormTextInput
        v-model="formData.issuerUrl"
        label="Discovery URL"
        help="The url of the OpenID provider authorization server."
        name="issuerUrl"
        color="foundation"
        show-label
        label-position="left"
        type="text"
        placeholder="https://accounts.google.com"
        :rules="[isRequired, isUrl, isStringOfLength({ minLength: 5 })]"
      />
      <div class="flex gap-2 mt-4">
        <FormButton :disabled="!challenge" color="primary" type="submit">
          Save
        </FormButton>
        <FormButton color="outline" @click="$emit('cancel')">Cancel</FormButton>
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

const apiOrigin = useApiOrigin()
const postAuthRedirect = usePostAuthRedirect()
const { challenge } = useLoginOrRegisterUtils()

const formData = reactive<SsoFormValues>({
  providerName: props.initialData?.providerName ?? '',
  clientId: props.initialData?.clientId ?? '',
  clientSecret: props.initialData?.clientSecret ?? '',
  issuerUrl: props.initialData?.issuerUrl ?? ''
})

const { handleSubmit } = useForm<SsoFormValues>()

const onSubmit = handleSubmit(() => {
  const baseUrl = `${apiOrigin}/api/v1/workspaces/${props.workspaceSlug}/sso/oidc/validate`
  const params = [
    `providerName=${formData.providerName}`,
    `clientId=${formData.clientId}`,
    `clientSecret=${formData.clientSecret}`,
    `issuerUrl=${formData.issuerUrl}`,
    `challenge=${challenge.value}`
  ]
  const route = `${baseUrl}?${params.join('&')}`

  postAuthRedirect.set(`/workspaces/${props.workspaceSlug}?settings=server/general`)

  navigateTo(route, {
    external: true
  })
})
</script>
