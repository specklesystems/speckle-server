<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="flex flex-col items-center space-y-8">
    <!-- <ErrorPageProjectInviteBanner /> -->
    <h1 class="h1 font-bold">Error {{ error.statusCode || 500 }}</h1>
    <h2 class="h3 text-foreground-2 mx-4 break-words max-w-full">
      {{ error.message }}
    </h2>
    <div v-if="isDev && error.stack" class="max-w-xl" v-html="error.stack" />
    <FormButton :to="homeRoute" size="xl">Go Home</FormButton>
  </div>
</template>
<script setup lang="ts">
import type { SimpleError } from '~/lib/core/helpers/observability'
import { homeRoute } from '~~/lib/common/helpers/route'

defineProps<{ error: SimpleError }>()

const isDev = ref(import.meta.dev)
</script>
