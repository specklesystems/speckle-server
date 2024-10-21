<template>
  <div>
    <FormButton :disabled="!challenge" link @click="handleContinue">
      Continue with SSO
    </FormButton>
  </div>
</template>

<script setup lang="ts">
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'

definePageMeta({
  layout: 'login-or-register',
  middleware: ['requires-workspaces-enabled']
})

const route = useRoute()
const { challenge } = useLoginOrRegisterUtils()

const { signInOrSignUpWithSso } = useAuthManager()

const handleContinue = () => {
  signInOrSignUpWithSso({
    challenge: challenge.value,
    workspaceSlug: route.params.slug.toString()
  })
}

// onMounted(() => {
//   fetch(new URL(`/api/v1/workspaces/${workspaceSlug.value}/sso`, apiOrigin))
//     .then((res) => {
//       return res.json()
//     })
//     .then((data) => {
//       console.log(data)
//     })
// })
</script>
