<template>
  <div class="rounded-lg p-0.5 mb-1 transition hover:bg-primary-muted">
    <div class="text-foreground-2 flex items-center relative">
      <div class="mr-2 hover:cursor-pointer" :onclick="toggleDetails">
        <div v-if="props.report.isSuccessful">
          <CheckIcon class="h-5 w-5 stroke-green-500 text-green-500"></CheckIcon>
        </div>
        <div v-else>
          <ExclamationCircleIcon class="h-5 w-5 text-danger"></ExclamationCircleIcon>
        </div>
      </div>
      <button class="text-sm transition hover:text-primary" @click="toggleDetails">
        {{ props.report.targetType }}
      </button>
      <button
        v-tippy="`Highlight object`"
        class="transition hover:text-primary ml-auto"
        @click="
          emit('onHighlight', report.targetId, report.resultId, report.isSuccessful)
        "
      >
        <EyeIcon class="h-4 w-4"></EyeIcon>
      </button>
    </div>
    <div v-if="showDetails" class="text-foreground-2 text-xs ml-7">
      {{ props.report.errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon, CheckIcon } from '@heroicons/vue/24/solid'
import { EyeIcon } from '@heroicons/vue/24/outline'
import { ConversionResult } from '~/lib/conversions/conversionResult'

const showDetails = ref<boolean>(false)

const props = defineProps<{
  report: ConversionResult
}>()

const emit = defineEmits<{
  (
    e: 'onHighlight',
    targetId: string,
    resultId: string | undefined,
    isSuccessful: boolean
  ): void
}>()

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}
</script>
