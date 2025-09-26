<template>
  <LayoutDialog v-model:open="open" :title="title" :buttons="buttons">
    <p class="text-foreground-2 my-2">
      The following file upload{{ failedJobs.length > 1 ? 's' : '' }} failed. You can
      retry {{ failedJobs.length > 1 ? 'them' : 'it' }} by re-uploading the file{{
        failedJobs.length > 1 ? 's' : ''
      }}.
    </p>
    <LayoutTable
      :items="failedJobs"
      :columns="[
        { id: 'file', header: 'File', classes: 'col-span-4' },
        { id: 'error', header: 'Error', classes: 'col-span-5' },
        { id: 'date', header: 'Date', classes: 'col-span-2' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-1 flex items-center justify-end'
        }
      ]"
      class="text-foreground"
      style="max-height: 300px"
    >
      <template #file="{ item }">
        <div
          v-tippy="{
            content: item.fileName.length > 35 ? item.fileName : undefined,
            placement: 'top-start',
            delay: 300
          }"
          class="truncate text-foreground"
        >
          {{ item.fileName }}
        </div>
      </template>
      <template #error="{ item }">
        <span class="text-foreground">{{ getErrorMessage(item) + ' ' }}</span>
        <ErrorReference
          v-if="shouldShowErrorReference(item)"
          class="text-left inline"
          size="text-body-xs"
          @click="copyErrorReference(item)"
        />
      </template>
      <template #date="{ item }">
        <span v-tippy="formattedFullDate(item.date)" class="text-foreground-2">
          {{ formattedRelativeDate(item.date) }}
        </span>
      </template>
      <template #actions="{ item }">
        <FormButton
          v-tippy="'Go to project'"
          :icon-left="ArrowRight"
          hide-text
          size="sm"
          color="outline"
          @click="goToProject(item)"
        />
      </template>
    </LayoutTable>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { omit } from 'lodash-es'
import { useNavigateToProject } from '~/lib/common/helpers/route'
import { useGenerateErrorReference } from '~/lib/core/composables/error'
import {
  useGlobalFileImportManager,
  type FailedFileImportJob,
  FailedFileImportJobError,
  useFailedFileImportJobUtils
} from '~/lib/core/composables/fileImport'

const { clearFailedJobs, failedJobs } = useGlobalFileImportManager()
const { getErrorMessage } = useFailedFileImportJobUtils()

const { copyReference } = useGenerateErrorReference()
const navigateToProject = useNavigateToProject()
const { formattedRelativeDate, formattedFullDate } = useDateFormatters()

const open = computed({
  get: () => failedJobs.value.length > 0,
  set: (value) => {
    if (!value) {
      clearFailedJobs()
    }
  }
})
const title = computed(
  () => `File upload${failedJobs.value.length > 1 ? 's' : ''} failed`
)

const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Dismiss',
    onClick: () => {
      open.value = false
    }
  }
])

const shouldShowErrorReference = (job: FailedFileImportJob) => {
  return (
    job.error.type === FailedFileImportJobError.UploadFailed ||
    job.error.type === FailedFileImportJobError.ImportFailed
  )
}

const copyErrorReference = async (job: FailedFileImportJob) => {
  await copyReference({ date: job.date, extraPayload: omit(job, ['file']) })
}

const goToProject = async (job: FailedFileImportJob) => {
  void navigateToProject({ id: job.projectId })
  open.value = false
}

watch(failedJobs, (newJobs) => {
  if (newJobs.length > 0) {
    open.value = true
  }
})
</script>
