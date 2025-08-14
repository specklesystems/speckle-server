<template>
  <li>
    <button
      class="flex items-center space-x-1 p-1 rounded-md transition-colors w-full"
      :class="{
        'bg-foundation-focus font-semibold': selectedFolderId === folder.id,
        'hover:bg-primary-muted cursor-pointer': selectedFolderId !== folder.id
      }"
      @click="select(folder)"
    >
      <ChevronDownIcon
        :class="`h-4 w-5 transition ${!isExpanded ? '-rotate-90' : 'rotate-0'}`"
        @click.stop="isExpanded = !isExpanded"
      />
      <span>{{ folder.attributes.name }}</span>
    </button>

    <ul
      v-if="isExpanded && folder.children && folder.children.length > 0"
      class="ml-4 mt-1 space-y-1"
    >
      <ProjectPageAccFolderNode
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :on-select-folder="onSelectFolder"
        :selected-folder-id="selectedFolderId"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { AccFolder } from '~/lib/acc/composables/useAcc'

const props = defineProps<{
  folder: AccFolder
  onSelectFolder: (folder: AccFolder) => void
  selectedFolderId: string | undefined
}>()

const isExpanded = ref(false)

const select = (folder: AccFolder) => {
  props.onSelectFolder(folder)
}
</script>
