<template>
  <div>
    <div class="space-x-2 mb-6">
      <FormButton text size="sm" to="/onboarding/v1">Onboarding v1</FormButton>
      <FormButton text size="sm" to="/test">Tests Page</FormButton>
    </div>
    <div class="mt-2 space-y-4">
      <div v-for="project in store.projectModelGroups" :key="project.projectId">
        <CommonProjectModelGroup :project="project" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useHostAppStore } from '~~/store/hostApp'
const store = useHostAppStore()
</script>
