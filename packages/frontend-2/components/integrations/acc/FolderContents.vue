<template>
  <div>
    <ul v-if="items?.length" class="space-y-1">
      <template v-for="item in items" :key="item.id">
        <li
          class="flex items-center space-x-1 px-2 rounded-md transition-colors w-full"
          :class="{
            'bg-foundation-focus font-semibold': selectedFileId === item.id,
            'hover:bg-primary-muted cursor-pointer': selectedFileId !== item.id
          }"
        >
          <button
            class="flex items-center space-x-1 p-1 rounded-md transition-colors w-full"
            @click="
              emit('select', item.id, removeNullOrUndefinedKeys(item.latestVersion))
            "
          >
            <span>
              {{ item.name }}
            </span>
          </button>
        </li>
        <hr />
      </template>
    </ul>
    <div v-else class="text-center text-foreground-2 py-2">
      <span>No files found.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { removeNullOrUndefinedKeys } from '@speckle/shared'
import type { AccTokens } from '@speckle/shared/acc'
import type { AccItemVersion } from '~/lib/acc/composables/useAccFiles'
import { useAccFolder } from '~/lib/acc/composables/useAccFolderData'

const props = defineProps<{
  projectId: string
  folderId: string
  tokens: AccTokens | undefined
  selectedFileId: string | undefined
}>()

const emit = defineEmits<{
  select: [fileId: string, fileVersion: AccItemVersion]
}>()

const folder = useAccFolder(props.projectId, props.folderId, props.tokens)

const items = computed(() => {
  return folder.value.contents?.items.filter(
    (item) => item.latestVersion.fileType?.toLowerCase() === 'rvt'
  )
})
</script>
