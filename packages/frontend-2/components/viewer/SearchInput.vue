<template>
  <div class="group text-body-2xs font-medium">
    <FormTextInput
      v-model="model"
      :custom-icon="Search"
      color="fully-transparent"
      :icon-classes="iconClasses"
      :input-classes="inputClasses"
      name="search-input"
      :placeholder="placeholder"
      :auto-focus="autoFocus"
      input-type="search"
    />
  </div>
</template>

<script setup lang="ts">
import { FormTextInput } from '@speckle/ui-components'
import { Search } from 'lucide-vue-next'

defineProps<{
  placeholder?: string
  autoFocus?: boolean
}>()

const model = defineModel<string>({ required: true })

const iconClasses = computed(() => {
  const baseClasses = '!h-3 !w-3'
  const colorClasses = model.value
    ? 'text-foreground-2'
    : 'text-foreground-3 group-hover:text-foreground-2'
  return `${baseClasses} ${colorClasses}`
})

const inputClasses = computed(() => {
  return '!pl-7 text-foreground-2 placeholder:!text-foreground-3 placeholder:group-hover:!text-foreground-2 focus:placeholder:text-foreground-2'
})
</script>
