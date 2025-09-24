<template>
  <div
    class="flex items-center justify-between border border-foreground-1 bg-foundation rounded-lg p-2"
  >
    <div class="flex items-center space-x-3">
      <img
        :src="integration.logo"
        alt=""
        class="w-10 h-10 p-1 object-cover border border-foreground-1 rounded-lg"
      />
      <div class="flex flex-col">
        <span class="font-medium">{{ integration.name }}</span>
        <span class="text-sm text-foreground-2">
          {{ integration.description }}
        </span>
      </div>
    </div>

    <div class="flex items-center space-x-4">
      <CommonLoadingIcon v-if="loading" :loading="true" class="opacity-50 mr-2" />
      <div v-else-if="integration.enabled">
        <div class="flex items-center text-sm text-foreground-2 space-x-2">
          <span
            v-if="
              integration.status === 'connected' || integration.status === 'expired'
            "
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-success': integration.status === 'connected',
              'bg-warning': integration.status === 'expired'
            }"
          ></span>
          <div>{{ statusText() }}</div>

          <!-- CTA -->
          <FormButton size="sm" color="outline" @click="handleCTA()">
            <span v-if="integration.status === 'notConnected'">Log in</span>
            <span v-else-if="integration.status === 'expired'">Reconnect</span>
            <span v-else>Log out</span>
          </FormButton>
        </div>
      </div>
      <div v-else>
        <FormButton size="sm" @click="$emit('upgrade')">Upgrade</FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBentleyAuthManager } from '~/lib/bentley/composables/useBentleyAuthManager'
import { useBentleyIntegration } from '~/lib/integrations/composables/useBentleyIntegration'

const props = defineProps<{ workspaceId: string; workspaceSlug: string }>()
defineEmits<{
  (e: 'handleCTA'): void
  (e: 'upgrade'): void
}>()

const loading = ref(true)

const { integration, checkConnection } = useBentleyIntegration()
const { tokens, fetchTokens, authBentley, logOut, tryGetTokensFromCookies } =
  useBentleyAuthManager()

const statusText = () => {
  switch (integration.value.status) {
    case 'connected':
      return 'Connected'
    case 'expired':
      return 'Expired'
    case 'notConnected':
      return ''

    default:
      break
  }
}

const handleCTA = async () => {
  if (
    integration.value.status === 'notConnected' ||
    integration.value.status === 'expired'
  ) {
    authBentley(`/settings/workspaces/${props.workspaceSlug}/integrations`)
  } else {
    logOut()
    // await checkConnection(props.workspaceSlug, props.workspaceId || '')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await tryGetTokensFromCookies()
    if (!tokens.value) {
      await fetchTokens()
    }
    await checkConnection(props.workspaceSlug, props.workspaceId || '')
  } finally {
    loading.value = false
  }
})
</script>
