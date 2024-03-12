<template>
  <div
    class="flex flex-col gap-y-2 md:gap-y-0 md:flex-row md:justify-between md:items-center"
  >
    <h1 class="block h4 font-bold">Automations</h1>
    <div v-if="hasAutomations" class="flex flex-col gap-2 md:flex-row md:items-center">
      <FormTextInput
        name="search"
        color="foundation"
        placeholder="Search Automations"
        wrapper-classes="shrink-0"
        show-clear
      />
      <FormButton
        :icon-left="ArrowTopRightOnSquareIcon"
        color="secondary"
        class="shrink-0"
      >
        Explore Functions
      </FormButton>
      <FormButton :icon-left="PlusIcon" class="shrink-0">New Automation</FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { FormTextInput } from '@speckle/ui-components'

defineProps<{
  hasAutomations?: boolean
}>()
</script>
