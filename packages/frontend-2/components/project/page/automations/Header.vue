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
      <FormButton
        :icon-left="ArrowTopRightOnSquareIcon"
        color="outline"
        class="shrink-0"
        :to="automationFunctionsRoute"
      >
        Explore Functions
      </FormButton>
      <div v-tippy="disabledCreateBecauseOf" class="shrink-0">
        <FormButton
          :icon-left="PlusIcon"
          class="shrink-0"
          :disabled="!!disabledCreateBecauseOf"
          @click="$emit('new-automation')"
        >
          New
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/vue/20/solid'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { automationFunctionsRoute } from '~/lib/common/helpers/route'

defineEmits<{
  'new-automation': []
}>()

defineProps<{
  showEmptyState?: boolean
  disabledCreateBecauseOf?: string
}>()

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })
</script>
