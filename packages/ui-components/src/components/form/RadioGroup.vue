<template>
  <div>
    <div class="block label text-foreground-2 mb-2" :class="!showTitle && 'sr-only'">
      {{ radioGroupName }}
      <span v-if="required">*</span>
    </div>
    <div class="flex flex-col gap-2">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="flex items-center gap-3"
      >
        <input
          :id="`option-${option.id}`"
          v-model="selectedOption"
          type="radio"
          :value="option.id"
          :name="radioGroupName"
          class="cursor-pointer h-3 w-3 bg-foundation border-foundation ring-[1.5px] ring-primary checked:ring-primary-focus focus:ring-offset-foundation focus:outline-primary-focus"
        />
        <label
          class="flex items-center gap-1.5 text-sm text-foreground cursor-pointer"
          :for="`option-${option.id}`"
        >
          <Component :is="option.icon" v-if="option.icon" class="h-9 w-9" />
          {{ option.title }}
        </label>
      </div>
      <p v-if="helpText" class="text-xs sm:text-sm text-foreground-2">
        {{ helpText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import type { ConcreteComponent } from 'vue'

interface Option {
  id: string
  title: string
  icon?: ConcreteComponent
}

const props = defineProps<{
  options: Option[]
  radioGroupName: string
  required?: boolean
  helpText?: string
  showTitle?: boolean
}>()

const selectedOption = defineModel<string>()

watch(
  () => props.options,
  (newOptions) => {
    if (newOptions.length > 0 && !selectedOption.value) {
      selectedOption.value = newOptions[0].id
    }
  },
  { immediate: true }
)
</script>
