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
    <LayoutDialog v-model:open="showReportDialog" :title="`Report`" fullscreen="none">
      <template #header>
        <div class="flex mt-2 space-x-2 p-1">
          <button
            class="flex items-center justify-center hover:ring-2 border border-foreground-3 rounded-md p-1 text-xs text-success"
            :class="successToggle ? 'border-2 border-success' : ''"
            @click="successToggle = !successToggle"
          >
            <CheckCircleIcon
              class="w-4 mr-1 stroke-green-500 text-green-500"
            ></CheckCircleIcon>
            {{ numberOfSuccess }}
          </button>
          <button
            class="flex items-center justify-center hover:ring-2 border border-foreground-3 rounded-md p-1 text-xs text-warning"
            :class="warningToggle ? 'border-2 border-warning' : ''"
            @click="warningToggle = !warningToggle"
          >
            <ExclamationTriangleIcon
              class="w-4 mr-1 stroke-warning-500 text-warning-500"
            ></ExclamationTriangleIcon>
            {{ numberOfWarning }}
          </button>
          <button
            class="flex items-center justify-center hover:ring-2 border border-foreground-3 rounded-md p-1 text-xs text-danger"
            :class="failedToggle ? 'border-2 border-danger' : ''"
            @click="failedToggle = !failedToggle"
          >
            <ExclamationCircleIcon
              class="w-4 mr-1 stroke-red-500 text-red-500"
            ></ExclamationCircleIcon>
            {{ numberOfFailed }}
          </button>
        </div>
      </template>
      <div class="flex flex-col space-y-1">
        <ReportItem
          v-for="(item, index) in reportLimited"
          :key="index"
          :report-item="item"
        />
      </div>
      <div v-if="report.length > reportSlice">
        <FormButton size="xs" full-width color="secondary" @click="reportSlice += 20">
          Show more
        </FormButton>
      </div>
    </LayoutDialog>
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

const successToggle = ref(false) // Status 1
const warningToggle = ref(false) // Status 3
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
