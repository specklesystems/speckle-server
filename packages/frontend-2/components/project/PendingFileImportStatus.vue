<template>
  <div class="text-foreground-2 text-sm flex flex-col items-center space-y-1">
    <template
      v-if="
        [
          FileUploadConvertedStatus.Queued,
          FileUploadConvertedStatus.Converting
        ].includes(upload.convertedStatus)
      "
    >
      <span class="text-body-xs mb-1">
        {{ isSelfImport ? 'Importing' : 'Uploading new version' }}
      </span>
      <CommonLoadingBar loading class="max-w-[100px]" />
    </template>
    <template
      v-else-if="upload.convertedStatus === FileUploadConvertedStatus.Completed"
    >
      <span class="inline-flex items-center space-x-1">
        <CheckCircleIcon class="h-4 w-4 text-success" />
        <span>
          {{ isSelfImport ? 'Import successful' : 'Version import successful' }}
        </span>
      </span>
    </template>
    <template v-else>
      <span class="inline-flex items-center space-x-1">
        <ExclamationTriangleIcon class="h-4 w-4 text-danger" />
        <span>{{ isSelfImport ? 'Import failed' : 'Version import failed' }}</span>
      </span>
      <span v-if="upload.convertedMessage" class="text-center">
        {{ upload.convertedMessage }}
      </span>
    </template>
  </div>
</template>
<script setup lang="ts">
import type { PendingFileUploadFragment } from '~~/lib/common/generated/gql/graphql'
import { FileUploadConvertedStatus } from '~~/lib/core/api/fileImport'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid'

type ImportedItemType = 'self' | 'subversion'

const props = withDefaults(
  defineProps<{
    upload: PendingFileUploadFragment
    type?: ImportedItemType
  }>(),
  {
    type: 'self'
  }
)

const isSelfImport = computed(() => props.type === 'self')
</script>
