<!-- eslint-disable vue/no-v-html -->
<template>
  <div id="speckle" class="bg-foundation-page text-foreground">
    <NuxtLayout name="default">
      <div class="flex flex-col items-center space-y-8">
        <ErrorPageProjectInviteBanner />
        <h1 class="h1 font-bold">{{ error.statusCode || 500 }}</h1>
        <h2 class="h3 text-foreground-2">{{ capitalize(error.message || '') }}</h2>
        <div v-if="isDev && error.stack" class="max-w-xl" v-html="error.stack" />
        <FormButton :to="homeRoute" size="xl">Go Home</FormButton>
      </div>
    </NuxtLayout>
    <SingletonManagers />
  </div>
</template>
<script setup lang="ts">
import { NuxtError } from '#app'
import { capitalize } from 'lodash-es'
import { homeRoute } from './lib/common/helpers/route'

/**
 * Any errors thrown while rendering this page will cause Nuxt to revert to the default
 * error page
 */

const props = defineProps<{
  error: NuxtError
}>()

useHead({
  title: computed(() => `${props.error.statusCode} - ${props.error.message}`),
  bodyAttrs: {
    class: 'simple-scrollbar bg-foundation-page text-foreground'
  }
})

const isDev = ref(process.dev)
</script>
