<template>
  <div>
    <div class="flex flex-col sm:flex-row items-stretch gap-3 w-full">
      <div
        v-for="option in options"
        :key="option.value"
        class="w-full flex flex-col border rounded-md"
        :class="[
          disabled ? 'opacity-40' : '',
          selected === option.value
            ? 'bg-primary-muted border-outline-1'
            : 'bg-foundation border-primary-muted'
        ]"
      >
        <button
          class="border relative w-full h-full select-none rounded-md shadow"
          :class="[
            selected === option.value ? 'border-outline-1' : 'border-foundation',
            disabled ? 'cursor-not-allowed' : ''
          ]"
          :disabled="disabled"
          @click="selectItem(option.value)"
        >
          <div class="absolute top-4 right-3 h-4 w-4 border rounded-full">
            <div
              v-if="selected === option.value"
              class="h-full w-full rounded-full bg-primary flex items-center justify-center"
            >
              <CheckIcon class="h-2 w-2 text-white" />
            </div>
          </div>
          <div class="rounded-md px-3 py-4 flex flex-col gap-3 h-full">
            <component
              :is="option.icon"
              class="text-foreground h-8 w-8 -mt-1 stroke-[1px]"
            ></component>
            <div class="flex flex-col items-start text-left">
              <h4
                class="font-bold text-base"
                :class="option.introduction ? 'text-base' : 'text-sm'"
              >
                {{ option.title }}
              </h4>
              <div
                v-if="option.introduction"
                class="text-xs text-foreground-2 py-1 select-none"
              >
                {{ option.introduction }}
              </div>
            </div>
          </div>
        </button>
        <div
          v-if="option.help"
          class="sm:hidden text-xs flex gap-0.5 mt-2 text-foreground"
        >
          <InformationCircleIcon class="h-4 w-4" />
          {{ option.help }}
        </div>
      </div>
    </div>
    <div class="hidden sm:flex flex-col sm:flex-row gap-3 w-full">
      <div v-for="option in options" :key="option.value" class="w-full">
        <div
          v-if="option.help"
          class="text-xs flex gap-0.5 mt-2 text-foreground select-none"
        >
          <InformationCircleIcon class="h-4 w-4" />
          {{ option.help }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import type { ConcreteComponent } from 'vue'

type OptionType = {
  value: string
  title: string
  introduction?: string
  icon: ConcreteComponent
  help?: string
}

const props = defineProps<{
  options: OptionType[]
  modelValue: string
  disabled?: boolean
}>()

const selected = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => {
    selected.value = newValue
  }
)

const selectItem = (value: string) => {
  selected.value = value
  emit('update:modelValue', value)
}

const emit = defineEmits(['update:modelValue'])
</script>
