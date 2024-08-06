<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="flex flex-col items-center space-y-8">
    <!-- <ErrorPageProjectInviteBanner /> -->
    <h1 class="h1 font-medium">Error {{ error.statusCode || 500 }}</h1>
    <div class="flex flex-col items-center space-y-1">
      <h2 class="h2 text-foreground-2 text-center mx-4 break-words max-w-full">
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

    <div v-if="isDev && error.stack" class="max-w-xl" v-html="error.stack" />
    <FormButton :to="homeRoute" size="lg">Go Home</FormButton>
  </div>
</template>
<script setup lang="ts">
import { useRequestId } from '~/lib/core/composables/server'
import type { SimpleError } from '~/lib/core/helpers/observability'
import { homeRoute } from '~~/lib/common/helpers/route'
import { ClipboardIcon } from '@heroicons/vue/24/outline'

defineProps<{ error: SimpleError }>()

const isDev = ref(import.meta.dev)
const reqId = useRequestId({ forceFrontendValue: true })
const { copy } = useClipboard()

const errorDate = ref(new Date().toISOString())
const errorReference = computed(() => `Reference #${reqId} | ${errorDate.value}`)

const onReferenceClick = async () => {
  if (!import.meta.client) return

  const val = errorReference.value + ` | URL: ${window.location.href}`
  await copy(val)
}
</script>
