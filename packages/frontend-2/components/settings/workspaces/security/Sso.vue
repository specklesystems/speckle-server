<template>
  <section class="flex flex-col space-y-3">
    <SettingsSectionHeader title="SSO" subheading class="mb-3" />
    <form class="flex flex-col gap-2" @submit="onSubmit">
      <div class="flex flex-col gap-4">
        <FormTextInput
          v-model="providerName"
          label="Provider name"
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
          v-model="clientId"
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
          v-model="clientSecret"
          label="Client secret"
          name="clientSecret"
          color="foundation"
          show-label
          label-position="left"
          type="text"
          placeholder="1234567890"
          :rules="[isRequired, isStringOfLength({ minLength: 5 })]"
        />
        <hr class="border-outline-3" />
        <FormTextInput
          v-model="issuerUrl"
          label="Issuer URL"
          name="issuerUrl"
          color="foundation"
          show-label
          label-position="left"
          type="text"
          placeholder="https://accounts.google.com"
          :rules="[isRequired, isUrl, isStringOfLength({ minLength: 5 })]"
        />
        <div class="mt-6">
          <FormButton color="primary" @click="onSubmit">Save</FormButton>
        </div>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isRequired, isStringOfLength, isUrl } from '~~/lib/common/helpers/validation'
import { graphql } from '~~/lib/common/generated/gql'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import type { SettingsWorkspacesSecuritySso_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment SettingsWorkspacesSecuritySso_Workspace on Workspace {
    id
    slug
  }
`)

type FormValues = {
  providerName: string
  clientId: string
  clientSecret: string
  issuerUrl: string
}

const props = defineProps<{
  workspace: SettingsWorkspacesSecuritySso_WorkspaceFragment
}>()

const apiOrigin = useApiOrigin()
const { handleSubmit } = useForm<FormValues>()

const providerName = ref('')
const clientId = ref('')
const clientSecret = ref('')
const issuerUrl = ref('')

const onSubmit = handleSubmit(async () => {
  const token = useAuthCookie()
  const baseUrl = `${apiOrigin}/api/v1/workspaces/${props.workspace.slug}/sso/oidc/validate`
  const params = [
    `providerName=${providerName.value}`,
    `clientId=${clientId.value}`,
    `clientSecret=${clientSecret.value}`,
    `issuerUrl=${issuerUrl.value}`
  ]
  const route = `${baseUrl}?${params.join('&')}`

  // navigateTo(route, {
  //   external: true
  // })

  const x = await fetch(route, {
    mode: 'cors',
    headers: {
      Authorization: `Bearer ${token.value}`
    }
    // redirect: 'follow'
  })

  console.log(x)
})
</script>
