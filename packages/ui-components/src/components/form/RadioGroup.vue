<template>
  <div>
    <div
      class="flex flex-col sm:flex-row items-stretch space-y-3 sm:space-y-0 sm:space-x-3 w-full"
    >
      <div v-for="option in options" :key="option.value" class="w-full flex flex-col">
        <button
          class="relative w-full h-full select-none rounded-md border"
          :class="[
            selected === option.value
              ? 'bg-foundation-page border-outline-1'
              : 'bg-foundation border-outline-3',
            disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-outline-1'
          ]"
          :disabled="disabled"
          @click="selectItem(option.value)"
        >
          <div
            class="absolute top-4 right-3 h-6 w-6 rounded-full"
            :class="[selected === option.value ? '' : 'border border-outline-3']"
          >
            <div
              v-if="selected === option.value"
              class="h-full w-full rounded-full bg-primary flex items-center justify-center"
            >
              <CheckIcon class="w-4 h-4 text-white" />
            </div>
          </div>
          <div class="px-3 py-4 flex flex-col space-y-3 h-full">
            <component
              :is="option.icon"
              class="text-foreground h-8 w-8 -mt-1 stroke-[1px]"
            ></component>
            <div class="flex flex-col items-start text-left">
              <h4
                class="font-medium"
                :class="option.introduction ? 'text-body-sm' : 'text-body-xs'"
              >
                {{ option.title }}
              </h4>
              <div
                v-if="option.introduction"
                class="text-body-xs text-foreground-2 pb-1 select-none"
              >
                {{ option.introduction }}
              </div>
            </div>
          </div>
        </button>
        <div
          v-if="option.help"
          class="sm:hidden text-xs flex space-x-0.5 mt-2 text-foreground"
        >
          <InformationCircleIcon class="h-4 w-4" />
          {{ option.help }}
        </div>
      </div>
    </div>
    <div class="hidden sm:flex space-x-3 w-full">
      <div v-for="option in options" :key="option.value" class="w-full">
        <div
          v-if="option.help"
          class="text-xs flex space-x-0.5 mt-2 text-foreground select-none"
        >
          <InformationCircleIcon class="h-4 w-4" />
          {{ option.help }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import type { ConcreteComponent } from 'vue'

type OptionType = {
  value: string
  title: string
  introduction?: string
  icon: ConcreteComponent
  help?: string
}

defineProps<{
  options: OptionType[]
  disabled?: boolean
}>()

const selected = defineModel<string>()

const selectItem = (value: string) => {
  selected.value = value
}
</script>
