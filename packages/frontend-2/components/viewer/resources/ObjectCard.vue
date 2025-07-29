<template>
  <div class="relative">
    <div
      :class="`rounded-md border-l-4 transition  hover:border-primary border-transparent `"
    >
      <div
        :class="`bg-foundation cursor-pointer top-0 z-20 flex h-10 sm:h-20 min-w-0 max-w-full items-center justify-between space-x-2 p-2 transition select-none`"
      >
        <div>
          <CubeIcon class="w-6" />
        </div>
        <div class="flex min-w-0 flex-grow flex-col">
          <div :class="`text-sm sm:text-base font-medium truncate min-w-0`">
            Object {{ object.objectId }}
          </div>
        </div>
      </div>
    </div>
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
