<template>
  <div class="bg-foundation flex flex-col gap-1 px-2 py-4 border-b border-outline-3">
    <div class="flex items-center gap-1">
      <CubeIcon class="w-4 text-foreground-2" />
      <div class="text-body-xs font-medium text-foreground-2">Object</div>
    </div>
    <div class="text-body-xs truncate text-foreground">{{ object.objectId }}</div>
  </div>
</template>
<script setup lang="ts">
import { CubeIcon } from '@heroicons/vue/24/solid'
import type { ViewerResourceItem } from '~/lib/common/generated/gql/graphql'

defineEmits<{
  (e: 'remove', val: string): void
}>()

defineProps<{
  object: ViewerResourceItem
  showRemove: boolean
}>()
</script>
