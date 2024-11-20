<template>
  <div
    class="flex flex-col gap-y-2 md:gap-y-0 md:flex-row md:justify-between md:items-center"
  >
    <h1 class="block text-heading-xl">Automations</h1>
    <div v-if="!showEmptyState" class="flex flex-col gap-2 md:flex-row md:items-center">
      <FormTextInput
        name="search"
        color="foundation"
        placeholder="Search automations..."
        wrapper-classes="shrink-0"
        show-clear
        v-bind="bind"
        v-on="on"
      />
      <div v-tippy="creationDisabledReason" class="shrink-0">
        <FormButton
          class="shrink-0"
          :disabled="!!creationDisabledReason"
          @click="$emit('new-automation')"
        >
          New automation
        </FormButton>
      </div>
      <FormButton color="outline" class="shrink-0" :to="automationFunctionsRoute">
        Explore functions
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDebouncedTextInput } from '@speckle/ui-components'
import { automationFunctionsRoute } from '~/lib/common/helpers/route'

defineEmits<{
  'new-automation': []
}>()

defineProps<{
  showEmptyState?: boolean
  creationDisabledReason?: string
}>()

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })
</script>
