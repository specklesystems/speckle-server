<template>
  <FormButton
    size="sm"
    color="card"
    :class="`mb-2 mr-2 border ${enableSuccessful ? 'outline border-primary' : ''}`"
    @click="toggleSuccessful"
  >
    <CheckIcon class="h-5 w-5 mr-1 -ml-1 stroke-green-500 text-success"></CheckIcon>
    {{ numberOfSuccess }}
  </FormButton>
  <FormButton
    size="sm"
    color="card"
    :class="`mb-2 mr-2 border ${enableFailed ? 'outline border-primary' : ''}`"
    @click="toggleFailed"
  >
    <ExclamationCircleIcon
      class="h-5 w-5 mr-1 -ml-1 text-danger"
    ></ExclamationCircleIcon>
    {{ numberOfFailed }}
  </FormButton>
  <FormButton
    size="sm"
    color="card"
    :class="`mb-2 mr-2 border ${enableWarning ? 'outline border-primary' : ''}`"
    @click="toggleWarning"
  >
    <ExclamationTriangleIcon
      class="h-5 w-5 mr-1 -ml-1 text-warning"
    ></ExclamationTriangleIcon>
    <!-- TBD -->
    {{ '0' }}
  </FormButton>
  <hr class="mb-2" />
  <div v-for="report in filteredReports" :key="report.resultAppId">
    <ReportItem
      :report="report"
      @on-highlight="
        emit('onHighlight', report.targetId, report.resultId, report.isSuccessful)
      "
    ></ReportItem>
  </div>
</template>

<script setup lang="ts">
import {
  CheckIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/solid'
import { ConversionResult } from '~/lib/conversions/conversionResult'

const enableSuccessful = ref<boolean>(false) // Hide by default
const enableFailed = ref<boolean>(true)
const enableWarning = ref<boolean>(true)

const props = defineProps<{
  reports?: ConversionResult[]
}>()

const emit = defineEmits<{
  (
    e: 'onHighlight',
    targetId: string,
    resultId: string | undefined,
    isSuccessful: boolean
  ): void
}>()

const toggleSuccessful = () => {
  enableSuccessful.value = !enableSuccessful.value
}

const toggleFailed = () => {
  enableFailed.value = !enableFailed.value
}

const toggleWarning = () => {
  enableWarning.value = !enableWarning.value
}

const numberOfSuccess = computed(
  () => props.reports?.filter((r) => r.isSuccessful).length
)

const numberOfFailed = computed(
  () => props.reports?.filter((r) => !r.isSuccessful).length
)

const filteredReports = computed(() => {
  if (!props.reports) return []

  return props.reports.filter((report) => {
    if (enableSuccessful.value && report.isSuccessful) return true
    if (enableFailed.value && !report.isSuccessful) return true
    return false
  })
})
</script>
