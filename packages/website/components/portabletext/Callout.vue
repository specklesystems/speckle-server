<template>
  <div
    class="bg-foundation border border-outline-2 rounded-xl p-2 flex space-x-2 my-4 shadow"
  >
    <div>
      <Component :is="icon" :class="`w-4 ${classes} mt-[5px]`" />
      <!-- <InformationCircleIcon /> -->
    </div>
    <div class="prose dark:prose-invert text-foreground-2">
      <PortableText :value="value.content" />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/solid'
import { PortableText } from '@portabletext/vue'
const props = defineProps<{ value: Record<string, unknown> }>()

const classes = computed(() => {
  if (props.value.type === 'warning') return 'text-amber-500/80'
  if (props.value.type === 'tip') return 'text-emerald-500/80'
  return 'text-blue-500/80'
})

const icon = computed(() => {
  if (props.value.type === 'warning') return ExclamationCircleIcon
  if (props.value.type === 'tip') return CheckCircleIcon
  return InformationCircleIcon
})
</script>
