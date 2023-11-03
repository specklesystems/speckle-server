<template>
  <div>
    <div class="space-x-2 mb-6 p-1 flex">
      <FormButton
        :icon-left="CloudArrowUpIcon"
        size="sm"
        to="/onboarding/send"
        class="flex-1"
      >
        Send
      </FormButton>
      <FormButton
        :icon-left="CloudArrowDownIcon"
        size="sm"
        to="/onboarding/receive"
        class="flex-1"
      >
        Receive
      </FormButton>
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
import { CloudArrowUpIcon, CloudArrowDownIcon } from '@heroicons/vue/20/solid'
const store = useHostAppStore()
</script>
