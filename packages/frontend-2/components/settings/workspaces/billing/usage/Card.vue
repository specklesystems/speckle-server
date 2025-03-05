<template>
  <div class="border border-outline-3 rounded-lg p-6 flex items-center justify-between">
    <div class="flex-1 flex flex-col">
      <p class="text-body-xs text-foreground font-medium pb-3 leading-none">
        {{ text }}
      </p>
      <CommonProgressBar
        class="max-w-72 w-full"
        :current-value="currentValue"
        :max-value="maxValue"
      />
    </div>
    <FormButton color="outline">{{ buttonText }}</FormButton>
  </div>
</template>

<script lang="ts" setup>
import { CommonProgressBar } from '@speckle/ui-components'

type UsageType = 'seat' | 'project' | 'model'

const props = defineProps<{
  buttonText: string
  currentValue: number
  maxValue: number
  type: UsageType
}>()

const text = computed(() => {
  return `${props.currentValue} ${props.type}${
    props.currentValue === 1 ? '' : 's'
  } used / ${props.maxValue} included`
})
</script>
