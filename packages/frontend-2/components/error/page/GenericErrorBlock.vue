<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="flex flex-col items-center space-y-8">
    <!-- <ErrorPageProjectInviteBanner /> -->
    <h1 class="h1 font-medium">Error {{ error.statusCode || 500 }}</h1>
    <div class="flex flex-col items-center space-y-1">
      <h2 class="h2 text-foreground-2 mx-4 break-words max-w-full">
        {{ error.message }}
      </h2>
      <div class="text-foreground-2 text-body-3xs">Reference #{{ reqId }}</div>
    </div>

    <div v-if="isDev && error.stack" class="max-w-xl" v-html="error.stack" />
    <FormButton :to="homeRoute" size="lg">Go Home</FormButton>
  </div>
</template>
<script setup lang="ts">
import { useRequestId } from '~/lib/core/composables/server'
import type { SimpleError } from '~/lib/core/helpers/observability'
import { homeRoute } from '~~/lib/common/helpers/route'

defineProps<{ error: SimpleError }>()

const isDev = ref(import.meta.dev)
const reqId = useRequestId({ forceFrontendValue: true })
</script>
