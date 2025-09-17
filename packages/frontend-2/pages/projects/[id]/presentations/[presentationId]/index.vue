<template>
  <div class="relative">
    <PresentationPage />
  </div>
</template>

<script setup lang="ts">
import { usePresentation } from '~/lib/presentations/composables/setup'

definePageMeta({
  layout: 'empty'
})

const route = useRoute()
const projectId = route.params.id as string
const presentationId = route.params.presentationId as string

usePresentation(projectId, presentationId)
</script>
