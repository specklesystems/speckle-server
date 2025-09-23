<template>
  <div class="flex flex-row h-full overflow-hidden border rounded-lg bg-foundation">
    <!-- Left Pane for tree -->
    <div class="w-1/4 p-2 overflow-y-auto border-r">
      <h3 class="font-semibold text-lg text-center">Folders</h3>
      <hr class="mb-1" />
      <div v-if="loadingTree" class="text-center text-foreground-2 py-2">
        Loading folders...
        <InfiniteLoading />
      </div>
      <ul v-else-if="folderTree && folderTree.children" class="space-y-1 pt-1">
        <IntegrationsAccFolderNode
          v-for="folder in folderTree.children"
          :key="folder.id"
          :folder="folder"
          :on-select-folder="onFolderClick"
          :selected-folder-id="selectedFolder?.id"
        />
      </ul>
      <div v-else class="text-center text-foreground-2 py-4">No folders found.</div>
    </div>
    <!-- Right Pane for content -->
    <div class="w-3/4 p-2 overflow-y-auto">
      <h3 class="font-semibold text-lg text-center">Files</h3>
      <hr class="mb-1" />
      <div
        v-if="loadingItems || loadingTree"
        class="text-center text-foreground-2 py-2"
      >
        <div v-if="selectedFolder">
          <span>Loading files in</span>
          <span class="font-bold">{{ ` ${selectedFolder.attributes.name} ` }}</span>
          <span>folder.</span>
          <InfiniteLoading />
        </div>
        <div v-else>Waiting for folder selection...</div>
      </div>
      <ul v-else-if="folderItems.length > 0" class="space-y-1">
        <template v-for="item in folderItems" :key="item.id">
          <li
            class="flex items-center space-x-1 px-2 rounded-md transition-colors w-full"
            :class="{
              'bg-foundation-focus font-semibold': selectedFile?.id === item.id,
              'hover:bg-primary-muted cursor-pointer': selectedFile?.id !== item.id
            }"
          >
            <button
              class="flex items-center space-x-1 p-1 rounded-md transition-colors w-full"
              @click="onFileSelected(item)"
            >
              <span>
                {{ item.attributes.name || item.attributes.displayName }}
              </span>
            </button>
          </li>
          <hr />
        </template>
      </ul>
      <div v-else class="text-center text-foreground-2 py-2">
        <div v-if="selectedFolder">
          <span>No files found in</span>
          <span class="font-bold">{{ ` ${selectedFolder.attributes.name} ` }}</span>
          <span>folder.</span>
        </div>
        <span v-else>Select a folder to view files..</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccTokens } from '@speckle/shared/acc'
import { ref, watch } from 'vue'
import { useAcc } from '~/lib/acc/composables/useAccFiles'
import type { AccFolder, AccItem } from '~/lib/acc/composables/useAccFiles'

const props = defineProps<{
  hubId: string
  projectId: string
  tokens: AccTokens | undefined
}>()

const emit = defineEmits(['file-selected'])

const {
  loadingTree,
  loadingItems,
  folderTree,
  folderItems,
  fetchItemsForFolder,
  init
} = useAcc()

const selectedFolder = ref<AccFolder | undefined>()
const selectedFile = ref<AccItem | undefined>()

const onFolderClick = async (folder: AccFolder) => {
  selectedFolder.value = folder
  selectedFile.value = undefined
  await fetchItemsForFolder(folder.id, props.projectId, props.tokens!.access_token)
}

const onFileSelected = (item: AccItem) => {
  selectedFile.value = item
  emit('file-selected', item)
}

// Watch for changes in projectId to re-initialize the folder tree
watch(
  () => props.projectId,
  async (newProjectId) => {
    selectedFolder.value = undefined
    selectedFile.value = undefined
    if (newProjectId && props.tokens) {
      await init(props.hubId, newProjectId, props.tokens.access_token)
      // Automatically select the first folder and fetch its files
      if (
        folderTree.value &&
        folderTree.value.children &&
        folderTree.value.children.length > 0
      ) {
        await onFolderClick(folderTree.value.children[0])
      }
    }
  },
  { immediate: true }
)
</script>
