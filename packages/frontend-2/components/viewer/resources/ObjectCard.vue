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
    <Transition>
      <div
        v-if="showRemove"
        class="group absolute inset-0 z-[21] flex h-full w-full items-center justify-end space-x-2 rounded bg-gradient-to-r from-transparent to-foundation p-4"
      >
        <FormButton
          color="danger"
          size="sm"
          class="rounded-full"
          @click="$emit('remove', props.object.objectId)"
        >
          <XMarkIcon class="h-5 w-5" />
        </FormButton>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon, CubeIcon } from '@heroicons/vue/24/solid'
import type { ViewerResourceItem } from '~/lib/common/generated/gql/graphql'

defineEmits<{
  (e: 'remove', val: string): void
}>()

const props = defineProps<{
  object: ViewerResourceItem
  showRemove: boolean
}>()
</script>
