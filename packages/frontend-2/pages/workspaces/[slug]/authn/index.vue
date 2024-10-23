<template>
  <div>
    <FormButton :disabled="!challenge || !ssoProviderName" link @click="handleContinue">
      Continue with {{ ssoProviderName }} SSO
    </FormButton>
  </div>
</template>

<script setup lang="ts">
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'

definePageMeta({
  layout: 'login-or-register',
  middleware: ['requires-workspaces-enabled']
})

const apiOrigin = useApiOrigin()
const route = useRoute()
const { challenge } = useLoginOrRegisterUtils()
const { signInOrSignUpWithSso } = useAuthManager()

const ssoProviderName = ref()

const handleContinue = () => {
  signInOrSignUpWithSso({
    challenge: challenge.value,
    workspaceSlug: route.params.slug.toString()
  })
}

type LimitedWorkspace = {
  name: string
  logo?: string
  defaultLogoIndex: number
  // If no provider name exists, SSO is not configured for workspace.
  ssoProviderName?: string
}

onMounted(() => {
  fetch(new URL(`/api/v1/workspaces/${route.params.slug}/sso`, apiOrigin))
    .then((res) => {
      return res.json()
    })
    .then((data: LimitedWorkspace) => {
      ssoProviderName.value = data.ssoProviderName
    })
})
</script>
