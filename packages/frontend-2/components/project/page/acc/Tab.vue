<template>
  <div class="flex flex-col text-xs space-y-2">
    <ProjectPageAccSyncs
      :project-id="projectId"
      :is-logged-in="hasTokens"
      :tokens="tokens"
    />

    <ClientOnly>
      <div v-if="!hasTokens">
        <CommonLoadingBar v-if="loadingTokens" :loading="true" class="my-2" />
        <div v-else>
          <hr class="mb-2" />
          <FormButton size="sm" @click="authAcc()">Connect to ACC</FormButton>
        </div>
      </div>
    </ClientOnly>

    <!-- USER INFO -->
    <div v-if="userInfo" class="flex flex-col space-y-2">
      <hr class="my-2" />
      <div class="flex flex-col text ml-1 space-y-2 mb-2">
        <span>
          <strong>Name:</strong>
          {{ userInfo.firstName }} {{ userInfo.lastName }}
        </span>
        <span>
          <strong>Email:</strong>
          {{ userInfo.emailId }}
        </span>
        <span>
          <strong>User ID:</strong>
          {{ userInfo.userId }}
        </span>
      </div>

      <!-- <div v-if="tokens?.access_token" class="flex flex-row items-center space-x-2">
        <FormButton
          class="mr-2"
          hide-text
          :icon-left="DocumentDuplicateIcon"
          color="outline"
          @click="copy(tokens?.access_token)"
        >
          Copy to clipboard
        </FormButton>
        {{ tokens?.access_token.slice(0, 32) }}...
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccTokens, AccUserInfo } from '~/lib/acc/types'
// import { DocumentDuplicateIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ projectId: string }>()
const { triggerNotification } = useGlobalToast()
// const { copy } = useClipboard()

const apiOrigin = useApiOrigin()
const tokens = ref<AccTokens>()
const hasTokens = computed(() => !!tokens.value?.access_token)
const loadingTokens = ref(true)
const userInfo = ref<AccUserInfo>()
const loadingUser = ref(false)

// AUTH + TOKEN FLOW
const fetchTokens = async () => {
  try {
    const res = await fetch(`${apiOrigin}/api/v1/acc/auth/status`, {
      credentials: 'include'
    })
    if (!res.ok) return
    tokens.value = await res.json()
  } finally {
    loadingTokens.value = false
  }
}
fetchTokens()

const authAcc = async () => {
  try {
    const response = await fetch(`${apiOrigin}/api/v1/acc/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: props.projectId })
    })
    if (!response.ok) throw new Error('Failed to initiate ACC login.')
    const { authorizeUrl } = await response.json()
    if (!authorizeUrl) throw new Error('No authorize URL returned by server.')
    window.location.href = authorizeUrl
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error starting ACC login',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
}

const scheduleRefresh = (expiresInSeconds: number) => {
  const refreshTime = (expiresInSeconds - 60) * 1000
  setTimeout(async () => {
    loadingTokens.value = true
    const res = await fetch(`${apiOrigin}/api/v1/acc/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })
    if (res.ok) {
      const refreshed = await res.json()
      await fetchTokens()
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'ACC tokens refreshed',
        description: refreshed
      })
      scheduleRefresh(refreshed.expires_in)
    }
    loadingTokens.value = false
  }, refreshTime)
}

watch(tokens, (newTokens) => {
  if (newTokens?.expires_in) scheduleRefresh(newTokens.expires_in)
  if (newTokens?.access_token) {
    fetchUserInfo()
  }
})

// USER INFO
const fetchUserInfo = async () => {
  loadingUser.value = true
  try {
    const res = await fetch(
      'https://developer.api.autodesk.com/userprofile/v1/users/@me',
      { headers: { Authorization: `Bearer ${tokens.value!.access_token}` } }
    )
    if (!res.ok) throw new Error('Failed to get user info directly from ACC')
    userInfo.value = await res.json()
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error fetching user info directly',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  } finally {
    loadingUser.value = false
  }
}
</script>
