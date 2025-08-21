<template>
  <div class="border-b border-outline-2 flex-shrink-0 relative">
    <div class="py-1">
      <ViewerSearchInput
        v-model="searchValue"
        :placeholder="placeholder"
        auto-focus
        @input="handleInput"
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
import { X } from 'lucide-vue-next'
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
