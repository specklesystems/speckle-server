<template>
  <div>
    <slot name="activator" :toggle="toggleDialog">
      <button
        v-tippy="summary.hint"
        class="rounded-full bg-foundation"
        @click.stop="toggleDialog()"
      >
        <InformationCircleIcon
          v-if="summary.failedCount === 0 && summary.warningCount === 0"
          class="w-4 text-success"
        />
        <ExclamationCircleIcon v-else class="w-4 text-warning" />
      </button>
    </slot>
    <CommonDialog v-model:open="showReportDialog" :title="`Report`" fullscreen="none">
      <div class="text-body-2xs">
        {{ numberOfSuccess }} objects converted ok, {{ numberOfWarning }} warnings and
        {{ numberOfFailed }} errors.
      </div>
      <div class="flex mt-2 space-x-2 text-body-2xs">
        <span>Filter:</span>
        <button
          v-if="numberOfSuccess !== 0"
          class="flex items-center justify-center border-success px-1 pb-1 text-success leading-none"
          :class="successToggle ? 'border-b-2' : ''"
          @click="successToggle = !successToggle"
        >
          <CheckCircleIcon
            class="w-4 mr-1 stroke-green-500 text-green-500"
          ></CheckCircleIcon>
          {{ numberOfSuccess }}
        </button>
        <button
          v-if="numberOfWarning !== 0"
          class="flex items-center justify-center border-warning px-1 pb-1 text-warning leading-none"
          :class="warningToggle ? 'border-b-2' : ''"
          @click="warningToggle = !warningToggle"
        >
          <ExclamationTriangleIcon
            class="w-4 mr-1 stroke-warning-500 text-warning-500"
          ></ExclamationTriangleIcon>
          {{ numberOfWarning }}
        </button>
        <button
          v-if="numberOfFailed !== 0"
          class="flex items-center justify-center border-danger px-1 pb-1 text-danger leading-none"
          :class="failedToggle ? 'border-b-2' : ''"
          @click="failedToggle = !failedToggle"
        >
          <ExclamationCircleIcon
            class="w-4 mr-1 stroke-red-500 text-red-500"
          ></ExclamationCircleIcon>
          {{ numberOfFailed }}
        </button>
      </div>

      <div class="flex flex-col space-y-1 py-2">
        <ReportItem
          v-for="(item, index) in reportLimited"
          :key="index"
          :report-item="item"
        />
        <div v-if="reportLimited.length === 0" class="text-body-xs text-foreground-2">
          No items found.
        </div>
      </div>
      <div v-if="report.length > reportSlice">
        <FormButton size="sm" full-width color="outline" @click="reportSlice += 20">
          Show more
        </FormButton>
      </div>
    </CommonDialog>
  </div>
</template>
<script setup lang="ts">
import {
  InformationCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/vue/20/solid'
import type { ConversionResult } from '~~/lib/conversions/conversionResult'

const props = defineProps<{
  report: ConversionResult[]
}>()

const showReportDialog = ref(false)

const successToggle = ref(true) // Status 1
const warningToggle = ref(true) // Status 3
const failedToggle = ref(true) // Status 4

const toggleDialog = () => {
  showReportDialog.value = !showReportDialog.value
}

const reportSlice = ref(10)
// Limit so we don't display 100k items at once and burn
const reportLimited = computed(() => reportSorted.value.slice(0, reportSlice.value))
// Sort to errors first
const reportSorted = computed(() =>
  [...filteredReports.value].sort((a, b) => b.status - a.status)
)
// Filter according to toggles
const filteredReports = computed(() => {
  return props.report.filter((report) => {
    if (successToggle.value && report.status === 1) {
      return true
    }
    if (failedToggle.value && report.status === 4) {
      return true
    }
    if (warningToggle.value && report.status === 3) {
      return true
    }
    // TODO: do more later!
    return false
  })
})

const numberOfSuccess = computed(
  () => props.report.filter((r) => r.status === 1).length
)

const numberOfWarning = computed(
  () => props.report.filter((r) => r.status === 3).length
)

const numberOfFailed = computed(() => props.report.filter((r) => r.status === 4).length)

const summary = computed(() => {
  const failed = props.report.filter((item) => item.status === 4)
  const warning = props.report.filter((item) => item.status === 3)
  const ok = props.report.filter((item) => item.status === 1)

  let hint = 'All objects converted ok'
  const isSuccess = failed.length === 0 && warning.length === 0
  if (!isSuccess) {
    if (failed.length !== 0 && warning.length !== 0) {
      // both fail and warning
      hint = `${failed.length} object(s) failed to convert, ${warning.length} object(s) converted with warning`
    } else if (failed.length !== 0 && warning.length === 0) {
      // only fail
      hint = `${failed.length} object(s) failed to convert`
    } else if (warning.length !== 0 && failed.length === 0) {
      // only warning
      hint = `${warning.length} object(s) converted with warning`
    }
  }
  return {
    failedCount: failed.length,
    warningCount: warning.length,
    okCount: ok.length,
    hint
  }
})
</script>
