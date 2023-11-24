<template>
  <div>
    <div class="sr-only">{{ label }}</div>
    <div class="flex flex-col gap-2">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="flex items-center gap-2"
      >
        <input
          :id="`option-${index}`"
          v-model="selected"
          type="radio"
          :value="option"
          class="cursor-pointer h-[12px] w-[12px] border-foundation ring-[1.5px] ring-primary checked:ring-primary-focus focus:outline-primary-focus"
        />
        <label
          class="flex items-center gap-1 text-xs text-foreground cursor-pointer"
          :for="`option-${index}`"
        >
          <div v-if="option.icon" class="h-9 w-9">
            <Component :is="option.icon" />
          </div>
          {{ option.title }}
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ConcreteComponent, ref, watchEffect } from 'vue'

interface Option {
  title: string
  icon?: ConcreteComponent
}

const props = defineProps<{
  label: string
  options: Option[]
}>()

const emit = defineEmits(['update:selected'])

const selected = ref<Option | null>(props.options[0] || null)

watchEffect(() => {
  if (props.options.length > 0 && !selected.value) {
    selected.value = props.options[0]
  }
  emit('update:selected', selected.value)
})
</script>
