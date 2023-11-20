<template>
  <div>
    <div class="sr-only">{{ label }}</div>
    <div class="flex flex-col gap-2">
      <button
        v-for="(option, index) in options"
        :key="index"
        class="cursor-pointer text-left rounded-lg border bg-foundation px-2 py-1.5 shadow-sm"
        :class="{
          'border-primary ring-1 ring-primary': selected.title === option.title,
          'border-outline': selected.title !== option.title
        }"
        @click="updateSelected(option)"
      >
        <div class="flex flex-col items-start">
          <div class="text-xs font-semibold">{{ option.title }}</div>
          <div class="text-xs text-foreground-2">{{ option.description }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

interface Option {
  title: string
  description: string
}

const props = defineProps<{
  label: string
  options: Option[]
}>()

const emit = defineEmits(['update:selected'])

const selected = ref(props.options[0] || null)

const updateSelected = (option: Option) => {
  selected.value = option
  emit('update:selected', option)
}

watchEffect(() => {
  if (props.options.length > 0 && !selected.value) {
    selected.value = props.options[0]
    emit('update:selected', selected.value)
  }
})
</script>
