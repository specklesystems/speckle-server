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
          <FormButton size="sm" @click="authAcc(`/projects/${projectId}/acc`)">
            Connect to ACC
          </FormButton>
        </div>
      </div>

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
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useAccAuthManager } from '~/lib/acc/composables/useAccAuthManager'
import { useAccUser } from '~/lib/acc/composables/useAccUser'
// import { DocumentDuplicateIcon } from '@heroicons/vue/24/outline'

defineProps<{ projectId: string }>()

const hasTokens = computed(() => !!tokens.value?.access_token)

const { tokens, loadingTokens, authAcc, tryGetTokensFromCookies } = useAccAuthManager()
const { userInfo, fetchUserInfo } = useAccUser()

watch(tokens, async (newTokens) => {
  if (newTokens?.access_token) {
    await fetchUserInfo(newTokens?.access_token)
  }
})

onMounted(async () => {
  await tryGetTokensFromCookies()
  if (tokens.value) {
    await fetchUserInfo(tokens.value?.access_token)
  }
})
</script>
