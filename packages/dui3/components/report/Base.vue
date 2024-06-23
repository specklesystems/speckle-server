<template>
  <div>
    <slot name="activator" :toggle="toggleDialog">
      <button
        v-tippy="summary.hint"
        class="rounded-full bg-foundation"
        @click.stop="toggleDialog()"
      >
        <InformationCircleIcon
          v-if="summary.failedCount === 0"
          class="w-4 text-success"
        />
        <ExclamationCircleIcon v-else class="w-4 text-warning" />
      </button>
    </slot>
    <LayoutDialog
      v-model:open="showReportDialog"
      :title="`Report`"
      chromium65-compatibility
    >
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
import { InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/20/solid'
import type { ConversionResult } from '~~/lib/conversions/conversionResult'

const props = defineProps<{
  report: ConversionResult[]
}>()

const showReportDialog = ref(false)
const toggleDialog = () => {
  showReportDialog.value = !showReportDialog.value
}

const reportSlice = ref(10)
// Limit so we don't display 100k items at once and burn
const reportLimited = computed(() => reportSorted.value.slice(0, reportSlice.value))
// Sort to errors first
const reportSorted = computed(() =>
  [...props.report].sort((a, b) => b.status - a.status)
)

const summary = computed(() => {
  const failed = props.report.filter((item) => item.status === 4)
  const ok = props.report.filter((item) => item.status === 1)
  const hint =
    failed.length !== 0
      ? `${failed.length} object(s) failed to convert`
      : 'All objects converted ok'
  return {
    failedCount: failed.length,
    okCount: ok.length,
    hint
  }
})
</script>
