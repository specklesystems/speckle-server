<template>
  <div class="flex flex-col items-center space-y-8">
    <ErrorPageProjectAccessErrorBlock v-if="isNoProjectAccessError" />
    <ErrorPageWorkspaceAccessErrorBlock v-else-if="isNoWorkspaceAccessError" />
    <ErrorPageGenericErrorBlock
      v-else
      :error="finalError"
      :is-generic-error-page="isGenericErrorPage"
    />
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
  /**
   * We have an /error page for rendering various errors that we don't really know much about (like their
   * actual status code), e.g. for auth errors. This makes the renderer place less of an emphasis on the status code.
   */
  isGenericErrorPage?: boolean
}>()

const route = useRoute()

const isProjectRoute = computed(() => route.path.match(/\/projects\/[^/]+/))
const isWorkspaceRoute = computed(() => route.path.match(/\/workspaces\/[^/]+/))

const finalError = computed(() => formatAppError(props.error))
const isNoProjectAccessError = computed(
  () => finalError.value.statusCode === 403 && isProjectRoute.value
)
const isNoWorkspaceAccessError = computed(
  () => finalError.value.statusCode === 403 && isWorkspaceRoute.value
)
</script>
