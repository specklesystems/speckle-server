<template>
  <li>
    <button
      class="flex items-center space-x-1 p-1 rounded-md transition-colors w-full"
      :class="{
        'bg-foundation-focus font-semibold': selectedFolderId === folder.id,
        'hover:bg-primary-muted cursor-pointer': selectedFolderId !== folder.id
      }"
      @click="emit('select', folderId)"
    >
      <ChevronDownIcon
        :class="`h-4 w-5 transition ${!isExpanded ? '-rotate-90' : 'rotate-0'}`"
        @click.stop="isExpanded = !isExpanded"
      />
      <span>{{ folder.name }}</span>
    </button>
    <ul
      v-if="isExpanded && folder.children && folder.children.items.length > 0"
      class="ml-4 mt-1 space-y-1"
    >
      <IntegrationsAccFolderNode
        v-for="child in folder.children.items"
        :key="child.id"
        :folder-id="child.id"
        :project-id="projectId"
        :tokens="tokens"
        :selected-folder-id="selectedFolderId"
        @select="(id) => emit('select', id)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import { useAccFolder } from '~/lib/acc/composables/useAccFolderData'
import type { AccTokens } from '@speckle/shared/acc'

graphql(`
  fragment AccIntegrationFolderNode_AccFolder on AccFolder {
    id
    name
    contents {
      items {
        id
        name
        latestVersion {
          id
          name
          versionNumber
          fileType
        }
      }
    }
    children {
      items {
        id
        name
        children {
          items {
            id
            name
          }
        }
        contents {
          items {
            id
            name
          }
        }
      }
    }
  }
`)

const props = defineProps<{
  // TODO ACC Maybe inject from shared local state within file navigation
  projectId: string
  folderId: string
  tokens?: AccTokens
  // TODO ACC Maybe inject from shared local state within file navigation
  selectedFolderId: string | undefined
}>()

const emit = defineEmits<{
  select: [folderId: string]
}>()

const folder = useAccFolder(props.projectId, props.folderId, props.tokens)

// watch(
//   folder,
//   (f) => {
//     console.log({ resultFolder: f })
//   },
//   {
//     immediate: true
//   }
// )

const isExpanded = ref(false)
</script>
