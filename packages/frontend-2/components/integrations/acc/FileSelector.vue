<template>
  <div class="flex flex-row h-full overflow-hidden border rounded-lg bg-foundation">
    <!-- Left Pane for tree -->
    <div class="w-1/4 p-2 overflow-y-auto border-r">
      <h3 class="font-semibold text-lg text-center">Folders</h3>
      <hr class="mb-1" />
      <div v-if="!rootFolder"></div>
      <ul
        v-else-if="rootFolder && rootFolder.children?.items.length"
        class="space-y-1 pt-1"
      >
        <IntegrationsAccFolderNode
          v-for="folder in rootFolderChildren"
          :key="folder.id"
          :project-id="projectId"
          :folder-id="folder.id"
          :tokens="tokens"
          :selected-folder-id="selectedFolderId"
          @select="onFolderClick"
        />
      </ul>
    </div>
    <!-- Right Pane for content -->
    <div class="w-3/4 p-2 overflow-y-auto">
      <h3 class="font-semibold text-lg text-center">Files</h3>
      <hr class="mb-1" />
      <IntegrationsAccFolderContents
        v-if="!!selectedFolderId"
        :key="`contents-${selectedFolderId}`"
        :project-id="projectId"
        :folder-id="selectedFolderId"
        :tokens="tokens"
        :selected-file-id="selectedFileId"
        @select="onFileSelected"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccTokens } from '@speckle/shared/acc'
import { ref, watch } from 'vue'
import { useAcc, type AccItemVersion } from '~/lib/acc/composables/useAccFiles'
import { useAccFolder } from '~/lib/acc/composables/useAccFolderData'

const props = defineProps<{
  hubId: string
  projectId: string
  tokens: AccTokens | undefined
}>()

const emit = defineEmits<{
  'file-selected': [fileId: string, fileVersion: AccItemVersion]
}>()

const { init, rootProjectFolderId } = useAcc()

const rootFolder = useAccFolder(props.projectId, rootProjectFolderId, props.tokens)
const rootFolderChildren = computed(
  () =>
    rootFolder.value?.children?.items?.filter(
      (child) => child.name === 'Project Files'
    ) ?? []
)

const selectedFolderId = ref<string | undefined>()
const selectedFileId = ref<string | undefined>()

const onFolderClick = async (folderId: string) => {
  selectedFolderId.value = folderId
  selectedFileId.value = undefined
}

const onFileSelected = (fileId: string, fileVersion: AccItemVersion) => {
  selectedFileId.value = fileId
  emit('file-selected', fileId, fileVersion)
}

// Watch for changes in projectId to re-initialize the folder tree
watch(
  () => props.projectId,
  async (newProjectId) => {
    selectedFolderId.value = undefined
    selectedFileId.value = undefined
    if (newProjectId && props.tokens) {
      await init(props.hubId, newProjectId, props.tokens.access_token)
    }
  },
  { immediate: true }
)

watch(rootFolderChildren, (newValue) => {
  selectedFolderId.value = newValue.at(0)?.id
})
</script>
