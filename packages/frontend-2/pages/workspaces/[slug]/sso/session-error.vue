<template>
  <div class="max-w-md mx-auto flex flex-col items-center gap-4">
    <div v-if="isLoading">
      <CommonLoadingIcon />
    </div>
    <template v-else>
      <div v-if="workspace?.logo" class="w-16 h-16 mb-2">
        <img
          :src="workspace.logo"
          :alt="workspace?.name"
          class="w-full h-full object-contain rounded-full"
        />
      </div>
      <h1 class="text-heading-xl">SSO Required for {{ workspace?.name }}</h1>
      <div
        class="p-4 rounded-lg border border-outline-2 bg-foundation text-body-xs mb-4"
      >
        <p class="font-medium mb-2 text-foreground">
          This workspace requires Single Sign-On (SSO) authentication.
        </p>
        <p class="text-foreground-2">
          While you are a member, you need to sign in using your organization's SSO to
          access it.
        </p>
      </div>
      <FormButton @click="handleLoginRedirect">Logout and sign in with SSO</FormButton>
    </template>
  </div>
</template>

<script setup lang="ts">
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { ssoLoginRoute } from '~/lib/common/helpers/route'

const route = useRoute()
const router = useRouter()
const apiOrigin = useApiOrigin()
const logger = useLogger()
const { logout } = useAuthManager()

const workspaceSlug = route.params.slug as string
const isLoading = ref(true)
const workspace = ref<LimitedWorkspace>()

type LimitedWorkspace = {
  name: string
  logo?: string | null
  defaultLogoIndex: number
}

onMounted(async () => {
  try {
    const res = await fetch(
      new URL(`/api/v1/workspaces/${workspaceSlug}/sso`, apiOrigin)
    )
    const data: LimitedWorkspace = (await res.json()) as LimitedWorkspace
    workspace.value = data
  } catch (error) {
    logger.error('Failed to fetch workspace data:', error)
  } finally {
    isLoading.value = false
  }
})

const handleLoginRedirect = async () => {
  await logout({ skipRedirect: true })
  router.push(ssoLoginRoute)
}
</script>
