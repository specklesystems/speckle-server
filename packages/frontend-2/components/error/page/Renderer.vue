<template>
  <div class="flex flex-col items-center space-y-8">
    <ErrorPageProjectAccessErrorBlock v-if="isNoProjectAccessError" />
    <ErrorPageWorkspaceAccessErrorBlock v-else-if="isNoWorkspaceAccessError" />
    <ErrorPageGenericErrorBlock v-else :error="finalError" />
  </div>
</template>
<script setup lang="ts">
import { formatAppError } from '~/lib/core/helpers/observability'

const props = defineProps<{
  error: {
    statusCode: number
    message: string
    stack?: string
  }
}>()

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
</script>
