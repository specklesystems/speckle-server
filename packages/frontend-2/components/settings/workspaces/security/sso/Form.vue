<template>
  <form class="flex flex-col gap-2" @submit="onSubmit">
    <div class="flex flex-col gap-4">
      <FormTextInput
        name="providerName"
        label="Provider"
        help="The label on the button displayed on the login screen."
        color="foundation"
        show-label
        label-position="left"
        :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
        type="text"
      />
      <hr class="border-outline-3" />
      <FormTextInput
        name="clientId"
        label="Client ID"
        color="foundation"
        show-label
        label-position="left"
        :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
        type="text"
      />
      <hr class="border-outline-3" />
      <FormTextInput
        name="clientSecret"
        label="Client secret"
        color="foundation"
        show-label
        label-position="left"
        type="text"
        :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
      />
      <hr class="border-outline-3" />
      <FormTextInput
        name="issuerUrl"
        label="Issuer URL"
        color="foundation"
        show-label
        label-position="left"
        type="text"
        :rules="[isRequired, isUrl, isStringOfLength({ minLength: 5 })]"
      />
      <div class="flex gap-2 mt-4">
        <FormButton :disabled="!challenge" color="primary" type="submit">
          Add
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
import { useMixpanel } from '~/lib/core/composables/mp'

const props = defineProps<{
  workspaceSlug: string
}>()

defineEmits<{
  (e: 'cancel'): void
}>()

const apiOrigin = useApiOrigin()
const postAuthRedirect = usePostAuthRedirect()
const { challenge } = useLoginOrRegisterUtils()
const mixpanel = useMixpanel()

const { handleSubmit } = useForm<SsoFormValues>()

const onSubmit = handleSubmit((values) => {
  const url = new URL(
    `${apiOrigin}/api/v1/workspaces/${props.workspaceSlug}/sso/oidc/validate`
  )

  url.searchParams.set('providerName', values.providerName)
  url.searchParams.set('clientId', values.clientId)
  url.searchParams.set('clientSecret', values.clientSecret)
  url.searchParams.set('issuerUrl', values.issuerUrl)
  if (challenge.value) {
    url.searchParams.set('challenge', challenge.value)
  }

  postAuthRedirect.set(`/workspaces/${props.workspaceSlug}?settings=server/general`)

  mixpanel.track('Workspace SSO Configuration Started', {
    // eslint-disable-next-line camelcase
    workspace_slug: props.workspaceSlug,
    // eslint-disable-next-line camelcase
    provider_name: values.providerName
  })

  navigateTo(url.toString(), {
    external: true
  })
})
</script>
