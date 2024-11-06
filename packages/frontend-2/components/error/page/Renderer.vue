<template>
  <div class="flex flex-col items-center space-y-8">
    <ErrorPageProjectAccessErrorBlock v-if="isNoProjectAccessError" />
    <ErrorPageWorkspaceAccessErrorBlock v-else-if="isNoWorkspaceAccessError" />
    <ErrorPageGenericErrorBlock v-else :error="finalError" />
  </div>
</template>
<script setup lang="ts">
import { usePostAuthRedirect } from '~/lib/auth/composables/postAuthRedirect'
import { formatAppError } from '~/lib/core/helpers/observability'

const props = defineProps<{
  error: {
    statusCode: number
    message: string
    stack?: string
  }
}>()

const router = useRouter()
const postAuthRedirect = usePostAuthRedirect()

const finalError = computed(() => formatAppError(props.error))
const isNoProjectAccessError = computed(
  () =>
    finalError.value.statusCode === 403 &&
    finalError.value.message.includes('You do not have access to this project')
)
const isNoWorkspaceAccessError = computed(
  () =>
    finalError.value.statusCode === 403 &&
    finalError.value.message.includes('You do not have access to this workspace')
)

onBeforeMount(() => {
  if (props.error.message.includes('SSO_SESSION_MISSING_OR_EXPIRED_ERROR')) {
    postAuthRedirect.setCurrentRoute()
    router.push(`/workspaces/${props.error.message.split(':')[1]}/sso?expired=true`)
  }
})
</script>
