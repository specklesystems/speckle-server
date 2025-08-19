<template>
  <div class="relative border-b border-outline-2 flex-shrink-0">
    <input
      :id="inputId"
      v-model="searchValue"
      type="text"
      :placeholder="placeholder"
      class="text-body-2xs font-medium text-foreground bg-transparent placeholder:text-foreground-2 w-full rounded-t-md border-none h-10 pl-8"
      @input="handleInput"
    />
    <label :for="inputId" class="sr-only">{{ placeholder }}</label>
    <div
      class="absolute top-0 left-0 w-8 flex justify-center items-center h-full pointer-events-none"
    >
      <Search
        class="h-3 w-3"
        :class="hasSearchValue ? 'text-foreground' : 'text-foreground-2'"
      />
    </div>
    <div
      v-if="hasSearchValue"
      class="absolute top-0 right-0 w-8 flex justify-center items-center h-full"
    >
      <FormButton
        size="sm"
        color="subtle"
        tabindex="-1"
        hide-text
        :icon-left="X"
        @click="clearSearch"
      >
        Clear
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { FormButton } from '@speckle/ui-components'

defineProps<{
  placeholder?: string
  inputId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const searchValue = ref('')

const hasSearchValue = computed(() => searchValue.value.trim().length > 0)

const handleInput = () => {
  emit('update:modelValue', searchValue.value)
}

const clearSearch = () => {
  searchValue.value = ''
  emit('update:modelValue', '')
}
</script>
