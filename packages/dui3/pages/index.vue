<template>
  <div>
    <div class="space-x-2">
      <FormButton text size="sm" to="/onboarding/v1">Onboarding v1</FormButton>
      <FormButton text size="sm" to="/test">Tests Page</FormButton>
    </div>
    <div class="mt-2 space-y-4">
      <!-- <div>{{ projectModelGroups }}</div> -->
      <div v-for="project in projectModelGroups" :key="project.projectId" class="">
        <CommonProjectModelGroup :project="project" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDocumentStateStore } from '~~/store/documentState'
const store = useDocumentStateStore()
const { projectModelGroups } = storeToRefs(store)
</script>
