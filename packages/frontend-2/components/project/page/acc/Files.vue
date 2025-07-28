<template>
  <div>
    <div class="flex text-body-xs text-foreground font-medium">Files</div>
    <div v-if="loading" class="text-xs italic">Loading files...</div>
    <div v-else-if="folderContents.length" class="flex flex-col space-y-0.5">
      <div v-for="item in revitContents" :key="item.id">
        <ProjectPageAccFileItem
          :folder-content="item"
          :loading="loading"
          :selected="item.id === selectedFolderContent?.id"
          :disabled="
            syncItems.find((si) => si.accFileLineageUrn === item.id) !== undefined
          "
          @download="(i) => $emit('download', i)"
          @select="(i) => $emit('select', i)"
        ></ProjectPageAccFileItem>
      </div>
    </div>
    <div v-else class="text-xs italic">No files found in this folder.</div>
  </div>
</template>

<script setup lang="ts">
import type { AccItem } from '~/lib/acc/types'
import type { ProjectAccSyncItemFragment } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  selectedFolderContent: AccItem | undefined
  folderContents: AccItem[]
  syncItems: ProjectAccSyncItemFragment[]
  loading: boolean
}>()

defineEmits<{
  (e: 'download', item: AccItem): void
  (e: 'select', item: AccItem): void
}>()

const revitContents = computed(() =>
  props.folderContents.filter((fc) =>
    (fc.attributes.name || fc.attributes.displayName).includes('.rvt')
  )
)
</script>
