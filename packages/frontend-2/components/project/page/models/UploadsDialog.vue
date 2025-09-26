<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <LayoutDialog v-model:open="open" title="Model upload history" :buttons="buttons">
    <LayoutTable
      :columns="[
        { id: 'job', header: 'Job #', classes: 'col-span-1' },
        { id: 'file', header: 'File', classes: 'col-span-4' },
        { id: 'status', header: 'Status', classes: 'col-span-2' },
        { id: 'size', header: 'Size', classes: 'col-span-2' },
        { id: 'date', header: 'Date', classes: 'col-span-2' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-1 flex items-center justify-end gap-0.5'
        }
      ]"
      :items="items"
      :loading="isVeryFirstLoading"
      empty-message="This model has no uploads"
      style="max-height: 300px"
    >
      <template #job="{ item }">
        <span class="text-foreground-2">{{ item.id }}</span>
      </template>
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
      <template #size="{ item }">
        <span class="text-foreground-2">{{ prettyFileSize(item.fileSize) }}</span>
      </template>
      <template #status="{ item }">
        <div
          v-keyboard-clickable
          :class="[
            'flex items-center gap-2',
            getStatusOptions(item).isErrorStatus ? 'group hover:cursor-pointer' : ''
          ]"
          @click="onErrorBadgeClick(item)"
        >
          <CommonBadge
            v-tippy="getStatusOptions(item).tooltip"
            :color-classes="getStatusOptions(item).colorClasses"
          >
            {{ getStatusOptions(item).label }}
          </CommonBadge>
          <CommonCopyButton
            v-if="getStatusOptions(item).isErrorStatus"
            class="group-hover:text-foreground"
          />
        </div>
      </template>
      <template #date="{ item }">
        <span
          v-tippy="formattedFullDate(item.convertedLastUpdate || item.uploadDate)"
          class="text-foreground-2"
        >
          {{ formattedRelativeDate(item.convertedLastUpdate || item.uploadDate) }}
        </span>
      </template>
      <template #actions="{ item }">
        <FormButton
          v-if="item.convertedVersionId && item.modelId"
          :icon-left="ArrowRightIcon"
          hide-text
          size="sm"
          color="outline"
          class="shrink-0"
          :to="buildUploadedVersionUrl(item)"
        />
        <FormButton
          :icon-left="ArrowDownTrayIcon"
          hide-text
          size="sm"
          color="outline"
          class="shrink-0"
          @click="onDownload(item)"
        />
      </template>
      <template #loader>
        <InfiniteLoading
          v-if="items?.length"
          :settings="{ identifier }"
          hide-when-complete
          @infinite="onInfiniteLoad"
        />
      </template>
    </LayoutTable>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { ArrowDownTrayIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import {
  FileUploadConvertedStatus,
  fileUploadConvertedStatusLabels
} from '@speckle/shared/blobs'
import { resourceBuilder } from '@speckle/shared/viewer/route'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectPageModelsUploadsDialog_FileUploadFragment } from '~/lib/common/generated/gql/graphql'
import { viewerRoute } from '~/lib/common/helpers/route'
import { useFailedFileImportJobUtils } from '~/lib/core/composables/fileImport'
import { useFileDownload } from '~/lib/core/composables/fileUpload'
import { prettyFileSize } from '~~/lib/core/helpers/file'

graphql(`
  fragment ProjectPageModelsUploadsDialog_FileUpload on FileUpload {
    id
    convertedStatus
    convertedMessage
    fileName
    fileSize
    convertedLastUpdate
    convertedVersionId
    uploadDate
    uploadComplete
    branchName
    ...UseFailedFileImportJobUtils_FileUpload
  }
`)

const getModelUploadsQuery = graphql(`
  query GetModelUploads(
    $projectId: String!
    $modelId: String!
    $input: GetModelUploadsInput!
  ) {
    project(id: $projectId) {
      id
      model(id: $modelId) {
        id
        uploads(input: $input) {
          totalCount
          cursor
          items {
            id
            ...ProjectPageModelsUploadsDialog_FileUpload
          }
        }
      }
    }
  }
`)

const props = defineProps<{
  projectId: string
  modelId: string
}>()

const open = defineModel<boolean>('open', { required: true })
const { copy } = useClipboard()
const { formattedRelativeDate, formattedFullDate } = useDateFormatters()

const { getErrorMessage, convertUploadToFailedJob } = useFailedFileImportJobUtils()
const {
  identifier,
  onInfiniteLoad,
  query: { result },
  isVeryFirstLoading
} = usePaginatedQuery({
  query: getModelUploadsQuery,
  baseVariables: computed(() => ({
    projectId: props.projectId,
    modelId: props.modelId,
    input: {
      cursor: null as string | null
    }
  })),
  options: {
    enabled: open,
    // reload query when dialog opens
    fetchPolicy: 'cache-and-network'
  },
  resolveKey: (vars) => [vars.projectId, vars.modelId],
  resolveCurrentResult: (res) => res?.project.model.uploads,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    input: {
      ...baseVars.input,
      cursor
    }
  }),
  resolveCursorFromVariables: (vars) => vars.input.cursor
})

const { download } = useFileDownload()

const items = computed(() => result.value?.project.model.uploads.items)

const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Close',
    onClick: () => {
      open.value = false
    }
  }
])

const getStatusOptions = (item: ProjectPageModelsUploadsDialog_FileUploadFragment) => {
  let colorClasses: string | undefined = undefined
  switch (item.convertedStatus) {
    case FileUploadConvertedStatus.Error:
      colorClasses = 'bg-danger text-foundation'
      break
    case FileUploadConvertedStatus.Converting:
      colorClasses = 'bg-primary text-foundation'
      break
    case FileUploadConvertedStatus.Completed:
      colorClasses = 'bg-success text-foundation'
      break
    case FileUploadConvertedStatus.Queued:
      colorClasses = 'bg-info text-foundation'
      break
  }

  return {
    label:
      fileUploadConvertedStatusLabels[
        item.convertedStatus as FileUploadConvertedStatus
      ],
    tooltip:
      item.convertedStatus === FileUploadConvertedStatus.Error
        ? {
            content:
              getErrorMessage(convertUploadToFailedJob(item)) +
              ` Error: ${item.convertedMessage}`
          }
        : undefined,
    colorClasses,
    isErrorStatus: item.convertedStatus === FileUploadConvertedStatus.Error
  }
}

const onDownload = async (item: ProjectPageModelsUploadsDialog_FileUploadFragment) => {
  await download({
    blobId: item.id,
    fileName: item.fileName,
    projectId: props.projectId
  })
}

const buildUploadedVersionUrl = (
  item: ProjectPageModelsUploadsDialog_FileUploadFragment
) => {
  if (!item.convertedVersionId || !item.modelId) return undefined
  return viewerRoute(
    props.projectId,
    resourceBuilder().addModel(item.modelId, item.convertedVersionId).toString()
  )
}

const onErrorBadgeClick = async (
  item: ProjectPageModelsUploadsDialog_FileUploadFragment
) => {
  if (getStatusOptions(item).isErrorStatus) {
    await copy(getStatusOptions(item).tooltip?.content || '', {
      successMessage: 'Error message copied'
    })
  }
}
</script>
