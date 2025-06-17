<template>
  <LayoutDialog v-model:open="open" title="Model upload history" :buttons="buttons">
    <LayoutTable
      :columns="[
        { id: 'file', header: 'File', classes: 'col-span-5' },
        { id: 'size', header: 'Size', classes: 'col-span-2' },
        { id: 'status', header: 'Status', classes: 'col-span-2' },
        { id: 'date', header: 'Date', classes: 'col-span-2' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-1 flex items-center justify-end'
        }
      ]"
      :items="items"
      :loading="isVeryFirstLoading"
      empty-message="This model has no uploads"
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
      <template #size="{ item }">
        <span class="text-foreground-2">{{ prettyFileSize(item.fileSize) }}</span>
      </template>
      <template #status="{ item }">
        <CommonBadge
          v-tippy="getStatusOptions(item).tooltip"
          :color-classes="getStatusOptions(item).colorClasses"
        >
          {{ getStatusOptions(item).label }}
        </CommonBadge>
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
          :icon-left="ArrowDownTrayIcon"
          hide-text
          size="sm"
          color="outline"
          @click="onDownload(item)"
        />
      </template>
    </LayoutTable>
    <InfiniteLoading
      v-if="items?.length"
      :settings="{ identifier }"
      @infinite="onInfiniteLoad"
    />
  </LayoutDialog>
</template>
<script setup lang="ts">
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import {
  FileUploadConvertedStatus,
  fileUploadConvertedStatusLabels
} from '@speckle/shared/blobs'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectPageModelsUploadsDialog_FileUploadFragment } from '~/lib/common/generated/gql/graphql'
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
    uploadDate
    uploadComplete
    branchName
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
    enabled: open
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
        ? item.convertedMessage
        : undefined,
    colorClasses
  }
}

const onDownload = async (item: ProjectPageModelsUploadsDialog_FileUploadFragment) => {
  await download({
    blobId: item.id,
    fileName: item.fileName,
    projectId: props.projectId
  })
}
</script>
