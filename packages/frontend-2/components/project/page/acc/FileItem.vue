<template>
  <div
    class="border py-1 px-2 rounded"
    :class="selected ? 'bg-foundation-focus' : 'bg-foundation'"
  >
    <div class="flex flex-col justify-between">
      <button
        class="flex flex-row justify-between items-center"
        @click="$emit('select', folderContent)"
      >
        <div class="text-body-xs text-foreground">
          {{ folderContent.attributes.displayName || folderContent.attributes.name }}
        </div>
        <div class="flex flex-row gap-2 items-center" :class="expanded ? 'mb-1' : ''">
          <FormButton
            size="sm"
            hide-text
            :icon-left="!expanded ? ChevronDown : ChevronUp"
            color="outline"
            @click.stop="expanded = !expanded"
          ></FormButton>
        </div>
      </button>

      <div v-if="expanded" class="space-y-1">
        <hr />
        <div class="text-xs italic">Type: {{ folderContent.type }}</div>
        <div class="text-xs text-gray-500 break-all">
          Lineage ID: {{ folderContent.id }}
        </div>
        <div
          v-if="folderContent.latestVersionId"
          class="text-xs text-blue-500 break-all"
        >
          Version ID: {{ folderContent.latestVersionId }}
        </div>
        <div v-if="folderContent.storageUrn" class="text-xs text-green-600 break-all">
          Storage URN: {{ folderContent.storageUrn }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { AccItem } from '@speckle/shared/acc'

defineProps<{
  folderContent: AccItem
  loading: boolean
  selected: boolean
}>()

defineEmits<{
  (e: 'select', item: AccItem): void
}>()

const expanded = ref(false)
</script>
