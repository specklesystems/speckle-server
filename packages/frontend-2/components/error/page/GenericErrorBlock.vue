<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="flex flex-col items-center space-y-4">
    <!-- <ErrorPageProjectInviteBanner /> -->
    <h1 class="text-heading-2xl">Error {{ error.statusCode || 500 }}</h1>
    <div class="flex flex-col items-center space-y-2">
      <h2 class="text-heading-lg text-foreground-2 mx-4 break-words max-w-full">
        {{ error.message }}
      </h2>
      <button
        class="text-foreground-2 hover:text-foreground text-body-3xs flex space-x-1 items-center"
        @click="onReferenceClick"
      >
        <div class="break-all">{{ errorReference }}</div>
        <ClipboardIcon class="w-3 h-3 shrink-0" />
      </button>
    </div>

    <div
      v-if="isDev && error.stack"
      class="max-w-xl text-body-xs text-foreground-2"
      v-html="error.stack"
    />
    <FormButton :to="homeRoute">Go home</FormButton>
  </div>
</template>
<script setup lang="ts">
import { useRequestId, useServerRequestId } from '~/lib/core/composables/server'
import type { SimpleError } from '~/lib/core/helpers/observability'
import { homeRoute } from '~~/lib/common/helpers/route'
import { ClipboardIcon } from '@heroicons/vue/24/outline'

const SSR_DATE_STATE_KEY = 'ssr_error_page_generic_block_static_date'
const getDate = () => new Date().toISOString()

defineProps<{ error: SimpleError }>()

const isDev = ref(import.meta.dev)
const reqId = useRequestId({ forceFrontendValue: true })
const serverReqId = useServerRequestId()
const { copy } = useClipboard()

// storing in state to avoid hydration mismatch when date gets regenerated in CSR
const ssrErrorDate = useState(SSR_DATE_STATE_KEY, () => getDate())
const errorDate = ref(
  import.meta.client && ssrErrorDate.value ? ssrErrorDate.value : getDate()
)

const errorReference = computed(() => {
  let base = `Reference: #${reqId}`
  if (serverReqId.value) base += ` | #${serverReqId.value}`
  base += ` | ${errorDate.value}`
  return base
})

const onReferenceClick = async () => {
  if (!import.meta.client) return

  const val = errorReference.value + ` | URL: ${window.location.href}`
  await copy(val)
}

onMounted(() => {
  // Immediately wipe the SSR date when page is loaded in CSR
  clearNuxtState(SSR_DATE_STATE_KEY)
})
</script>
