<template>
  <div>
    <FormButton link external :to="authUrl">Continue with SSO</FormButton>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'

definePageMeta({
  middleware: ['requires-workspaces-enabled']
})

const apiOrigin = useApiOrigin()
const { challenge } = useLoginOrRegisterUtils()
const route = useRoute()
const workspaceSlug = computed(() => route.params.slug as string)

const authUrl = computed(() => {
  return new URL(
    `/api/v1/workspaces/${workspaceSlug.value}/sso/auth?challenge=${challenge}`,
    apiOrigin
  ).toString()
})

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
