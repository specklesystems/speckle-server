<template>
  <div
    class="w-screen h-screen flex items-center justify-center z-50 fixed inset-0 bg-neutral-100/70 dark:bg-neutral-900/70"
  >
    <div class="max-w-2xl w-full flex flex-col justify-center">
      <div
        class="bg-blue-500/50 border-4 border-primary-muted text-foreground-on-primary backdrop-blur shadow-lg rounded-xl p-4 space-y-4 pointer-events-auto w-full"
      >
        <h2 class="text-center text-2xl font-bold">
          <slot name="header">Ready to send your first model?</slot>
        </h2>
        <!-- <p class="text-center">MANAGER TIME</p> -->
        <div class="w-full h-72 bg-primary rounded-xl flex items-center justify-center">
          <PlayIcon class="w-10 h-10 text-white" />
        </div>
        <div class="flex justify-center">
          <FormButton
            size="xl"
            class="shadow-md"
            :xxxicon-right="CloudArrowDownIcon"
            @click="downloadManager()"
          >
            Download Now
          </FormButton>
        </div>
      </div>
      <div v-if="allowEscape" class="pointer-events-auto pt-2 flex justify-center">
        <FormButton size="sm" color="card" @click="$emit('close')">
          Let me explore first
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { CloudArrowDownIcon, PlayIcon } from '@heroicons/vue/24/solid'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'

const emit = defineEmits(['close'])
defineProps<{ allowEscape: boolean }>()

const hasDownloadedManager = useSynchronizedCookie<boolean>(`hasDownloadedManager`)

const downloadManager = () => {
  // TODO
  hasDownloadedManager.value = true
  emit('close')
}
</script>
