<template>
  <div class="w-full">
    <div
      class="flex items-stretch w-full"
      :class="
        stackOptions
          ? 'flex-col space-y-3 '
          : 'flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3'
      "
    >
      <div v-for="option in options" :key="option.value" class="w-full flex flex-col">
        <button
          class="bg-foundation relative w-full h-full select-none rounded-md border shadow"
          :class="[
            selected === option.value ? 'border-outline-4' : 'border-outline-2',
            disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-outline-1'
          ]"
          :disabled="disabled"
          @click="selectItem(option.value)"
        >
          <div class="p-4 flex flex-col space-y-2 h-full">
            <div
              class="flex justify-between min-h-12"
              :class="option.icon ? 'items-start' : 'items-center'"
            >
              <div class="flex flex-col items-start text-left">
                <component
                  :is="option.icon"
                  v-if="option.icon"
                  class="text-foreground h-8 w-8 -mt-1 stroke-[1px]"
                ></component>
                <h4 class="font-medium text-foreground text-body">
                  {{ option.title }}
                </h4>
                <h5 v-if="option.subtitle" class="text-foreground-3 text-body-xs">
                  {{ option.subtitle }}
                </h5>
              </div>
              <div
                class="h-6 w-6 rounded-full flex items-center justify-center border-[1.5px] border-outline-5"
                :class="stackOptions ? 'mr-4' : ''"
              >
                <div
                  v-if="selected === option.value"
                  class="h-3 w-3 rounded-full bg-primary flex"
                ></div>
              </div>
            </div>
            <div
              v-if="option.introduction"
              class="text-body-2xs text-foreground pb-1 select-none text-left pr-20"
            >
              {{ option.introduction }}
            </div>
            <slot :name="option.value" />
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
    <div v-if="!stackOptions" class="hidden sm:flex space-x-3 w-full">
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
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import type { ConcreteComponent } from 'vue'

type OptionType = {
  value: string
  title: string
  subtitle?: string
  introduction?: string
  icon?: ConcreteComponent
  help?: string
}

defineProps<{
  options: OptionType[]
  disabled?: boolean
  stackOptions?: boolean
}>()

const selected = defineModel<string>()

const selectItem = (value: string) => {
  selected.value = value
}
</script>
