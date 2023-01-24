<template>
  <div
    :class="`fixed max-h-[calc(100vh-5.5rem)] top-[4.5rem] w-80 px-2 py-1 right-4 rounded-md shadow mb-4 transition bg-foundation overflow-y-auto simple-scrollbar ${
      objects.length !== 0
        ? 'translate-x-0 opacity-100'
        : 'translate-x-[120%] opacity-0'
    }`"
  >
    <div class="mb-2">
      <div class="flex items-center">
        <div class="font-bold text-xs flex items-center space-x-1">
          <CubeIcon class="w-3 h-3" />
          <span>{{ objects.length }}</span>
        </div>
        <FormButton size="xs" :icon-right="EyeIcon" text @click="clearSelection()">
          &nbsp;
        </FormButton>
        <FormButton size="xs" :icon-right="FunnelIcon" text @click="clearSelection()">
          &nbsp;
        </FormButton>
        <FormButton
          size="xs"
          :icon-right="ArrowTopRightOnSquareIcon"
          text
          title="open selection in new tab"
          @click="clearSelection()"
        >
          &nbsp;
        </FormButton>
        <FormButton size="xs" :icon-right="XMarkIcon" text @click="clearSelection()">
          &nbsp;
        </FormButton>
      </div>
    </div>
    <div class="w-full my-2 border-b border-outline-3"></div>

    <div>
      <div v-for="object in objects.reverse()" :key="(object.id as string)">
        <ViewerSelectionObject :object="object" :unfold="unfold" />
        <div class="w-full my-2 border-b border-outline-3"></div>
      </div>
    </div>
    <div v-if="objects.length === 1" class="text-xs text-foreground-2 mt-2">
      Hold down "shift" to select multiple objects.
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  FunnelIcon,
  CubeIcon
} from '@heroicons/vue/24/solid'
import { onKeyStroke } from '@vueuse/core'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'

const {
  selection: { objects, clearSelection }
} = useInjectedViewerInterfaceState()

const unfold = computed(() => objects.value.length === 1)

onKeyStroke('Escape', () => {
  clearSelection()
})
</script>
